// ============================================
// 결제 실패 페이지
// 토스페이먼츠 결제 실패 시 리다이렉트되는 페이지
// /payment/fail?code=...&message=...
// ============================================

'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// ============================================
// 에러 코드별 사용자 친화적 메시지 매핑
// ============================================

const ERROR_MESSAGES: Record<string, string> = {
  PAY_PROCESS_CANCELED: '결제가 취소되었습니다.',
  PAY_PROCESS_ABORTED: '결제 진행 중 문제가 발생했습니다.',
  REJECT_CARD_COMPANY: '카드사에서 결제를 거절했습니다. 다른 카드로 시도해주세요.',
  EXCEED_MAX_DAILY_PAYMENT_COUNT: '일일 결제 횟수를 초과했습니다. 내일 다시 시도해주세요.',
  EXCEED_MAX_PAYMENT_AMOUNT: '결제 한도를 초과했습니다.',
  INVALID_CARD_EXPIRATION: '카드 유효기간이 만료되었습니다.',
  NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT: '할부가 지원되지 않는 카드입니다.',
};

// ============================================
// 결제 실패 페이지 컴포넌트
// ============================================

// useSearchParams는 Suspense 바운더리 필요 (Next.js 16 프리렌더 요구사항)
export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="animate-pulse text-neutral-400">로딩 중...</div></div>}>
      <PaymentFailContent />
    </Suspense>
  );
}

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL 파라미터에서 에러 정보 추출
  const errorCode = searchParams.get('code') || 'UNKNOWN_ERROR';
  const errorMessage = searchParams.get('message') || '결제 처리 중 문제가 발생했습니다.';

  // 에러 코드 기반 사용자 친화적 메시지 (없으면 원본 message 사용)
  const displayMessage = ERROR_MESSAGES[errorCode] || errorMessage;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="space-y-6">
          {/* 에러 아이콘 */}
          {/* 다크 테마 경고 아이콘 */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-900/30">
            <svg
              className="h-8 w-8 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* 에러 메시지 */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-neutral-100">
              결제 실패
            </h1>
            <p className="text-neutral-400">{displayMessage}</p>
            {/* 개발 시 원본 에러 코드 표시 */}
            <p className="text-xs text-neutral-600">
              오류 코드: {errorCode}
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col gap-3">
            {/* /pricing 이동 버튼 */}
            <button
              onClick={() => router.push('/pricing')}
              className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              플랜 다시 선택하기
            </button>

            {/* 홈으로 버튼 */}
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center justify-center rounded-lg border border-neutral-700 px-6 py-3 text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
