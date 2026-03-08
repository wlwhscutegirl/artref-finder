// ============================================
// 결제 성공 페이지
// 토스페이먼츠 리다이렉트 후 서버 승인 처리
// /payment/success?paymentKey=...&orderId=...&amount=...
// ============================================

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSubscriptionStore } from '@/stores/subscription-store';
import { STORAGE_KEYS } from '@/lib/constants';

// ============================================
// 상태 타입
// ============================================

type PaymentStatus = 'loading' | 'success' | 'error';

interface PaymentResult {
  status: PaymentStatus;
  message: string;
  errorCode?: string;
}

// ============================================
// 결제 성공 페이지 컴포넌트
// ============================================

// useSearchParams는 Suspense 바운더리 필요 (Next.js 16 프리렌더 요구사항)
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-orange-500" /></div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setSubscription = useSubscriptionStore((state) => state.setSubscription);

  const [result, setResult] = useState<PaymentResult>({
    status: 'loading',
    message: '결제를 확인하고 있습니다...',
  });

  // ============================================
  // 결제 승인 API 호출
  // ============================================

  useEffect(() => {
    /** 서버에 결제 승인 요청 */
    async function confirmPayment() {
      // URL 파라미터 추출
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');

      // 필수 파라미터 검증
      if (!paymentKey || !orderId || !amount) {
        setResult({
          status: 'error',
          message: '결제 정보가 올바르지 않습니다. 필수 파라미터가 누락되었습니다.',
          errorCode: 'MISSING_PARAMS',
        });
        return;
      }

      try {
        // /api/payment/confirm 호출 (인증 토큰 포함)
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const response = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
          }),
        });

        const data = await response.json();

        if (data.success) {
          // 승인 성공: 스토어에 구독 정보 즉시 반영
          if (data.subscription) {
            setSubscription(data.subscription);
          }

          setResult({
            status: 'success',
            message: '결제가 완료되었습니다!',
          });
        } else {
          // 승인 실패
          setResult({
            status: 'error',
            message: data.error || '결제 승인에 실패했습니다.',
            errorCode: data.code,
          });
        }
      } catch (error) {
        // 네트워크 오류 등
        console.error('[payment/success] 승인 요청 실패:', error);
        setResult({
          status: 'error',
          message: '결제 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
          errorCode: 'NETWORK_ERROR',
        });
      }
    }

    confirmPayment();
  }, [searchParams, setSubscription]);

  // ============================================
  // 렌더링
  // ============================================

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* 로딩 상태 */}
        {result.status === 'loading' && (
          <div className="space-y-4">
            {/* 로딩 스피너 */}
            {/* 다크 테마 로딩 스피너 */}
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-orange-500" />
            <h1 className="text-xl font-semibold text-gray-900">
              {result.message}
            </h1>
            <p className="text-sm text-gray-400">
              잠시만 기다려주세요. 결제를 확인하고 있습니다.
            </p>
          </div>
        )}

        {/* 성공 상태 */}
        {result.status === 'success' && (
          <div className="space-y-6">
            {/* 체크 아이콘 */}
            {/* 다크 테마 성공 아이콘 */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-900/30">
              <svg
                className="h-8 w-8 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                결제 완료
              </h1>
              <p className="text-gray-500">
                구독이 활성화되었습니다. 이제 모든 기능을 이용할 수 있습니다.
              </p>
            </div>

            {/* 마네킹 페이지 이동 버튼 */}
            <button
              onClick={() => router.push('/mannequin')}
              className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              마네킹 시작하기
            </button>
          </div>
        )}

        {/* 실패 상태 */}
        {result.status === 'error' && (
          <div className="space-y-6">
            {/* 에러 아이콘 */}
            {/* 다크 테마 에러 아이콘 */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-900/30">
              <svg
                className="h-8 w-8 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                결제 승인 실패
              </h1>
              <p className="text-gray-500">{result.message}</p>
              {result.errorCode && (
                <p className="text-xs text-gray-300">
                  오류 코드: {result.errorCode}
                </p>
              )}
            </div>

            {/* 다시 시도 버튼 */}
            <button
              onClick={() => router.push('/pricing')}
              className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-6 py-3 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              다시 시도하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
