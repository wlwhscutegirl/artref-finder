// ============================================
// 토스페이먼츠 결제 서비스
// 결제 요청 파라미터 생성 및 금액 계산
// ============================================

import { PLAN_LIMITS } from '@/lib/subscription-service';
import { bkend } from '@/lib/bkend';
import type { SubscriptionPlan, BillingCycle, PaymentRecord } from '@/types';

/** bkend payments 테이블명 */
const PAYMENTS_TABLE = 'payments';

// ============================================
// 결제 요청 파라미터 인터페이스
// ============================================

/** 토스페이먼츠 결제 요청에 필요한 파라미터 */
export interface PaymentRequest {
  /** 주문 고유 ID (artref_{plan}_{timestamp}_{random}) */
  orderId: string;
  /** 결제 금액 (원 단위) */
  amount: number;
  /** 주문명 (사용자에게 표시) */
  orderName: string;
  /** 성공 리다이렉트 URL */
  successUrl: string;
  /** 실패 리다이렉트 URL */
  failUrl: string;
  /** 구독 플랜 */
  plan: SubscriptionPlan;
  /** 결제 주기 */
  billingCycle: BillingCycle;
}

// ============================================
// 플랜명 한글 매핑
// ============================================

/** 플랜별 한글 이름 */
const PLAN_DISPLAY_NAME: Record<SubscriptionPlan, string> = {
  free: 'Free',
  lite: 'Lite',
  student: 'Student',
  pro: 'Pro',
  team: 'Team',
};

// ============================================
// 결제 금액 계산
// ============================================

/**
 * 결제 금액 계산
 * - monthly: PLAN_LIMITS의 priceMonthly 그대로 사용
 * - annual: priceMonthly * 12 * 0.8 (20% 할인)
 *
 * @param plan - 구독 플랜
 * @param billingCycle - 결제 주기 (monthly / annual)
 * @returns 결제 금액 (원 단위, 정수)
 */
export function calculateAmount(plan: SubscriptionPlan, billingCycle: BillingCycle): number {
  const monthlyPrice = PLAN_LIMITS[plan].priceMonthly;

  if (billingCycle === 'annual') {
    // 연간 결제: 12개월 * 월 가격 * 0.8 (20% 할인)
    return Math.round(monthlyPrice * 12 * 0.8);
  }

  // 월간 결제: 월 가격 그대로
  return monthlyPrice;
}

// ============================================
// 주문 ID 생성
// ============================================

/**
 * 고유 주문 ID 생성
 * 포맷: artref_{plan}_{timestamp}_{random}
 * 토스페이먼츠 orderId 규격에 맞게 영숫자 + 하이픈/언더스코어만 사용
 */
function generateOrderId(plan: SubscriptionPlan): string {
  const timestamp = Date.now();
  // 6자리 랜덤 문자열 생성
  const random = Math.random().toString(36).substring(2, 8);
  return `artref_${plan}_${timestamp}_${random}`;
}

// ============================================
// 결제 요청 파라미터 생성 (핵심 함수)
// ============================================

/**
 * 토스페이먼츠 결제 요청 파라미터 생성
 * - orderId, amount, orderName 등 결제에 필요한 모든 파라미터 반환
 * - 클라이언트에서 loadTossPayments().requestPayment()에 전달
 *
 * @param plan - 선택한 구독 플랜
 * @param billingCycle - 결제 주기
 * @param userId - 결제하는 유저 ID (orderId에 포함하지 않음, 서버 검증용)
 * @returns PaymentRequest 객체
 */
export function createPaymentRequest(
  plan: SubscriptionPlan,
  billingCycle: BillingCycle,
  userId: string
): PaymentRequest {
  // free 플랜은 결제 불필요
  if (plan === 'free') {
    throw new Error('Free 플랜은 결제가 필요하지 않습니다.');
  }

  const amount = calculateAmount(plan, billingCycle);
  const planName = PLAN_DISPLAY_NAME[plan];
  const cycleLabel = billingCycle === 'annual' ? '연간' : '월간';

  // 현재 호스트 기반 리다이렉트 URL 생성
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:3000';

  return {
    orderId: generateOrderId(plan),
    amount,
    orderName: `ArtRef ${planName} 플랜 (${cycleLabel})`,
    successUrl: `${baseUrl}/payment/success`,
    failUrl: `${baseUrl}/payment/fail`,
    plan,
    billingCycle,
  };
}

// ============================================
// 토스페이먼츠 SDK 로드 유틸리티
// ============================================

/** 토스페이먼츠 인스턴스 타입 */
export interface TossPaymentsInstance {
  requestPayment: (
    method: string,
    params: {
      amount: number;
      orderId: string;
      orderName: string;
      successUrl: string;
      failUrl: string;
      customerName?: string;
      customerEmail?: string;
    }
  ) => Promise<void>;
}

/**
 * window.TossPayments 접근 헬퍼
 * declare global 중복 선언 충돌 방지를 위해 type assertion 사용
 */
function getWindowTossPayments(): ((clientKey: string) => TossPaymentsInstance) | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).TossPayments;
}

/**
 * 토스페이먼츠 SDK 스크립트 로드
 * - CDN에서 script 태그로 로드
 * - 이미 로드된 경우 즉시 반환
 * - Promise로 로드 완료 시점 보장
 */
export function loadTossPaymentsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우 즉시 반환
    if (typeof window !== 'undefined' && getWindowTossPayments()) {
      resolve();
      return;
    }

    // script 태그가 이미 존재하는지 확인
    const existing = document.querySelector('script[src*="tosspayments"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('토스페이먼츠 SDK 로드 실패')));
      return;
    }

    // 새 script 태그 생성
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('토스페이먼츠 SDK 로드 실패'));
    document.head.appendChild(script);
  });
}

/**
 * 토스페이먼츠 인스턴스 생성
 * - SDK 로드 후 clientKey로 인스턴스 생성
 * - 환경변수 NEXT_PUBLIC_TOSS_CLIENT_KEY 사용
 */
export async function getTossPayments(): Promise<TossPaymentsInstance> {
  await loadTossPaymentsScript();

  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  if (!clientKey) {
    throw new Error('NEXT_PUBLIC_TOSS_CLIENT_KEY 환경변수가 설정되지 않았습니다.');
  }

  const tossPayments = getWindowTossPayments();
  if (!tossPayments) {
    throw new Error('토스페이먼츠 SDK가 로드되지 않았습니다.');
  }

  return tossPayments(clientKey);
}

// ============================================
// 결제 내역 저장/조회
// ============================================

/** 결제 내역 저장 파라미터 */
export interface SavePaymentData {
  userId: string;
  subscriptionId: string;
  orderId: string;
  paymentKey: string;
  amount: number;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  approvedAt: string | null;
}

/**
 * 결제 내역을 bkend payments 테이블에 저장
 * 결제 승인 성공 후 호출
 */
export async function savePaymentRecord(data: SavePaymentData): Promise<PaymentRecord> {
  return bkend.data.create<PaymentRecord>(PAYMENTS_TABLE, {
    ...data,
    status: 'completed',
  });
}

/**
 * 유저의 결제 내역 조회 (최신순)
 * @param userId 유저 ID
 * @param limit 조회 개수 (기본 10)
 */
export async function getPaymentHistory(userId: string, limit = 10): Promise<PaymentRecord[]> {
  try {
    const result = await bkend.data.list<PaymentRecord>(PAYMENTS_TABLE, {
      andFilters: JSON.stringify({ userId: { $eq: userId } }),
      sortBy: 'createdAt',
      sortDirection: 'desc',
      limit: String(limit),
    });
    return result.data;
  } catch (error) {
    console.warn('[payment-service] 결제 내역 조회 실패:', error);
    return [];
  }
}
