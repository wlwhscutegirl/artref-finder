// ============================================
// 토스페이먼츠 결제 승인 API Route
// POST /api/payment/confirm
// 서버 사이드에서 결제 승인 후 구독 생성
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createSubscription } from '@/lib/subscription-service';
import { savePaymentRecord } from '@/lib/payment-service';
import type { SubscriptionPlan, BillingCycle } from '@/types';

// ============================================
// 토스페이먼츠 승인 API 엔드포인트
// ============================================

const TOSS_CONFIRM_URL = 'https://api.tosspayments.com/v1/payments/confirm';

// bkend.ai API로 유저 인증 검증
const BKEND_API_BASE = process.env.NEXT_PUBLIC_BKEND_API_URL || 'https://api-client.bkend.ai/v1';
const BKEND_API_KEY = process.env.NEXT_PUBLIC_BKEND_API_KEY || '';

// ============================================
// 요청 바디 타입
// ============================================

interface ConfirmRequestBody {
  /** 토스페이먼츠에서 발급한 결제 키 */
  paymentKey: string;
  /** 주문 ID (artref_{plan}_{timestamp}_{random} 포맷) */
  orderId: string;
  /** 결제 금액 (원 단위) */
  amount: number;
}

/**
 * Authorization 헤더에서 Bearer 토큰을 추출하고
 * bkend.ai /auth/me 호출로 유저 ID를 검증
 * @returns 인증된 userId 또는 null
 */
async function verifyUser(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  try {
    const res = await fetch(`${BKEND_API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': BKEND_API_KEY,
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    // bkend 응답: { success, data: { id, email, ... } }
    return json.data?.id || json.id || null;
  } catch {
    return null;
  }
}

// ============================================
// orderId에서 플랜 정보 추출
// ============================================

/**
 * orderId에서 구독 플랜 추출
 * orderId 포맷: artref_{plan}_{timestamp}_{random}
 */
function extractPlanFromOrderId(orderId: string): SubscriptionPlan | null {
  const parts = orderId.split('_');
  // artref_{plan}_{timestamp}_{random} → parts[1]이 plan
  if (parts.length < 4 || parts[0] !== 'artref') {
    return null;
  }

  const plan = parts[1] as SubscriptionPlan;
  const validPlans: SubscriptionPlan[] = ['lite', 'student', 'pro', 'team'];

  if (!validPlans.includes(plan)) {
    return null;
  }

  return plan;
}

// ============================================
// POST 핸들러 — 결제 승인
// ============================================

/**
 * 토스페이먼츠 결제 승인 처리
 *
 * 1. 클라이언트에서 paymentKey, orderId, amount 수신
 * 2. 토스페이먼츠 승인 API 호출 (서버 사이드, SECRET_KEY 사용)
 * 3. 승인 성공 시 subscription-service로 구독 생성
 * 4. 결과 반환
 */
export async function POST(request: NextRequest) {
  try {
    // 요청 바디 파싱
    const body: ConfirmRequestBody = await request.json();
    const { paymentKey, orderId, amount } = body;

    // 필수 파라미터 검증
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // SECRET_KEY 확인
    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      console.error('[payment/confirm] TOSS_SECRET_KEY 환경변수 미설정');
      return NextResponse.json(
        { success: false, error: '서버 설정 오류입니다.' },
        { status: 500 }
      );
    }

    // ============================================
    // 토스페이먼츠 승인 API 호출
    // Authorization: Basic {base64(secretKey + ":")}
    // ============================================

    const authHeader = Buffer.from(`${secretKey}:`).toString('base64');

    const tossResponse = await fetch(TOSS_CONFIRM_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    // 토스 승인 실패 시 에러 반환
    if (!tossResponse.ok) {
      const tossError = await tossResponse.json();
      console.error('[payment/confirm] 토스 승인 실패:', tossError);
      return NextResponse.json(
        {
          success: false,
          error: tossError.message || '결제 승인에 실패했습니다.',
          code: tossError.code,
        },
        { status: tossResponse.status }
      );
    }

    // 토스 승인 성공 응답
    const tossPayment = await tossResponse.json();

    // ============================================
    // orderId에서 플랜 정보 추출 후 구독 생성
    // ============================================

    const plan = extractPlanFromOrderId(orderId);
    if (!plan) {
      console.error('[payment/confirm] orderId에서 플랜 추출 실패:', orderId);
      return NextResponse.json(
        { success: false, error: '주문 정보가 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    // 인증된 유저 검증 (Bearer 토큰 → bkend /auth/me)
    const userId = await verifyUser(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 결제 주기 판단: 연간 금액인지 월간 금액인지 비교
    // PLAN_LIMITS에서 월간 가격과 비교하여 결제 주기 추론
    const { PLAN_LIMITS } = await import('@/lib/subscription-service');
    const monthlyPrice = PLAN_LIMITS[plan].priceMonthly;
    const billingCycle: BillingCycle = amount > monthlyPrice ? 'annual' : 'monthly';

    // 구독 생성
    const subscription = await createSubscription({
      userId,
      plan,
      billingCycle,
    });

    // 결제 내역 기록 (실패해도 구독 생성은 유지)
    try {
      await savePaymentRecord({
        userId,
        subscriptionId: subscription.id,
        orderId: tossPayment.orderId,
        paymentKey: tossPayment.paymentKey,
        amount,
        plan,
        billingCycle,
        approvedAt: tossPayment.approvedAt || null,
      });
    } catch (recordError) {
      // 결제 기록 실패는 로그만 남기고 진행 (구독은 이미 생성됨)
      console.error('[payment/confirm] 결제 내역 기록 실패:', recordError);
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      subscription,
      payment: {
        paymentKey: tossPayment.paymentKey,
        orderId: tossPayment.orderId,
        status: tossPayment.status,
        approvedAt: tossPayment.approvedAt,
      },
    });
  } catch (error) {
    // 예기치 않은 에러
    console.error('[payment/confirm] 처리 중 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '결제 처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
