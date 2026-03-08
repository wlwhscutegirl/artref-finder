// ============================================
// 토스페이먼츠 결제 트리거 훅
// 플랜 구독 시작 시 결제창을 열고 성공/실패 URL로 리다이렉트
// payment-service.ts의 유틸리티를 재사용
// ============================================

'use client';

import { useCallback, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { createPaymentRequest, getTossPayments } from '@/lib/payment-service';
import type { SubscriptionPlan, BillingCycle } from '@/types';

/** useCheckout 훅 반환 타입 */
export interface UseCheckoutReturn {
  /** 결제 진행 중 여부 */
  isLoading: boolean;
  /** 마지막 에러 메시지 */
  error: string | null;
  /**
   * 결제 플로우 시작
   * @param planId - 구독할 플랜 ID
   * @param billingCycle - 결제 주기 (monthly | annual)
   */
  startCheckout: (planId: SubscriptionPlan, billingCycle: BillingCycle) => Promise<void>;
}

/**
 * 토스페이먼츠 기반 구독 결제 훅
 *
 * 사용 예시:
 * ```tsx
 * const { startCheckout, isLoading } = useCheckout();
 * <button onClick={() => startCheckout('pro', 'monthly')}>구독하기</button>
 * ```
 */
export function useCheckout(): UseCheckoutReturn {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(
    async (planId: SubscriptionPlan, billingCycle: BillingCycle) => {
      // 로그인 여부 확인
      if (!user) {
        setError('로그인이 필요합니다.');
        return;
      }

      // free 플랜은 결제 없이 처리 (방어 코드)
      if (planId === 'free') {
        setError('무료 플랜은 별도 결제가 필요하지 않습니다.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // payment-service에서 결제 파라미터 생성
        const paymentReq = createPaymentRequest(planId, billingCycle, user.id);

        // 토스페이먼츠 SDK 로드 + 인스턴스 생성
        const tossPayments = await getTossPayments();

        // 토스페이먼츠 결제 요청 (리다이렉트 방식)
        await tossPayments.requestPayment('카드', {
          amount: paymentReq.amount,
          orderId: paymentReq.orderId,
          orderName: paymentReq.orderName,
          successUrl: paymentReq.successUrl,
          failUrl: paymentReq.failUrl,
          customerEmail: user.email,
          customerName: user.name,
        });
      } catch (err: unknown) {
        // 사용자가 직접 결제창을 닫은 경우 에러 무시
        if (
          err instanceof Error &&
          (err.message.includes('PAY_PROCESS_CANCELED') ||
            err.message.includes('결제가 취소'))
        ) {
          // 취소는 에러로 처리하지 않음
          return;
        }

        const message = err instanceof Error ? err.message : '결제 중 오류가 발생했습니다.';
        console.error('[use-checkout] 결제 오류:', err);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return { isLoading, error, startCheckout };
}
