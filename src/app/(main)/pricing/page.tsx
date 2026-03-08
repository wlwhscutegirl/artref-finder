// ============================================
// 플랜 비교 페이지
// Free / Lite / Student / Pro / Team 5열 비교 테이블
// 월간/연간 토글 + 모바일 수평 스크롤 대응
// 실제 토스페이먼츠 결제 연동
// ============================================

'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { useSubscriptionStore } from '@/stores/subscription-store';
import { useCheckout } from '@/hooks/use-checkout';
import { AuthModal } from '@/components/features/auth/auth-modal';
import { cancelSubscription } from '@/lib/subscription-service';
import type { SubscriptionPlan } from '@/types';

/** 결제 주기 타입 */
type BillingCycle = 'monthly' | 'annual';

/** 플랜 정보 */
interface PlanInfo {
  id: SubscriptionPlan;
  name: string;
  /** 월간 가격 (원) */
  monthlyPrice: number;
  /** 연간 가격 (월 환산, 원) */
  annualPrice: number;
  priceNote: string;
  description: string;
  /** 그라디언트 색상 */
  color: string;
  /** 테두리 색상 */
  borderColor: string;
  /** 추천 뱃지 표시 여부 */
  highlighted?: boolean;
  /** 학생 인증 필요 여부 */
  requiresVerification?: boolean;
  /** 기능별 표시값 */
  features: Record<string, string | boolean>;
}

/** 5개 플랜 정의 */
const PLANS: PlanInfo[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    priceNote: '영원히',
    description: '취미 작가를 위한 기본 플랜',
    color: 'from-neutral-600 to-neutral-700',
    borderColor: 'border-neutral-700',
    features: {
      '일일 검색': '100회',
      '컬렉션': '5개',
      '저장 포즈': '10개',
      'AI 포즈 추출': '5회/일',
      '태그 기반 검색': true,
      '포즈 벡터 매칭': true,
      '카메라 앵글 벡터 매칭': false,
      '고급 소재/배경 필터': false,
      '검색 히스토리': '30개',
      '팀 공유 컬렉션': false,
      '우선 지원': false,
    },
  },
  {
    id: 'lite',
    name: 'Lite',
    monthlyPrice: 4900,
    annualPrice: 3920,
    priceNote: '/월',
    description: '본격 작업을 시작하는 작가',
    color: 'from-emerald-600 to-teal-600',
    borderColor: 'border-emerald-600',
    features: {
      '일일 검색': '무제한',
      '컬렉션': '20개',
      '저장 포즈': '50개',
      'AI 포즈 추출': '15회/일',
      '태그 기반 검색': true,
      '포즈 벡터 매칭': true,
      '카메라 앵글 벡터 매칭': true,
      '고급 소재/배경 필터': true,
      '검색 히스토리': '50개',
      '팀 공유 컬렉션': false,
      '우선 지원': false,
    },
  },
  {
    id: 'student',
    name: 'Student',
    monthlyPrice: 2900,
    annualPrice: 2320,
    priceNote: '/월',
    description: '학생 인증 시 Pro급 혜택',
    color: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-500',
    requiresVerification: true,
    features: {
      '일일 검색': '무제한',
      '컬렉션': '무제한',
      '저장 포즈': '무제한',
      'AI 포즈 추출': '무제한',
      '태그 기반 검색': true,
      '포즈 벡터 매칭': true,
      '카메라 앵글 벡터 매칭': true,
      '고급 소재/배경 필터': true,
      '검색 히스토리': '100개',
      '팀 공유 컬렉션': false,
      '우선 지원': true,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 9900,
    annualPrice: 7920,
    priceNote: '/월',
    description: '프로 작가를 위한 무제한 플랜',
    color: 'from-orange-600 to-amber-600',
    borderColor: 'border-orange-500',
    highlighted: true,
    features: {
      '일일 검색': '무제한',
      '컬렉션': '무제한',
      '저장 포즈': '무제한',
      'AI 포즈 추출': '무제한',
      '태그 기반 검색': true,
      '포즈 벡터 매칭': true,
      '카메라 앵글 벡터 매칭': true,
      '고급 소재/배경 필터': true,
      '검색 히스토리': '100개',
      '팀 공유 컬렉션': false,
      '우선 지원': true,
    },
  },
  {
    id: 'team',
    name: 'Team',
    monthlyPrice: 29900,
    annualPrice: 23920,
    priceNote: '/월 (5인)',
    description: '스튜디오/팀을 위한 협업 플랜',
    color: 'from-cyan-600 to-blue-600',
    borderColor: 'border-cyan-500',
    features: {
      '일일 검색': '무제한',
      '컬렉션': '무제한',
      '저장 포즈': '무제한',
      'AI 포즈 추출': '무제한',
      '태그 기반 검색': true,
      '포즈 벡터 매칭': true,
      '카메라 앵글 벡터 매칭': true,
      '고급 소재/배경 필터': true,
      '검색 히스토리': '100개',
      '팀 공유 컬렉션': true,
      '우선 지원': true,
    },
  },
];

/** 기능 목록 (표 행 순서) */
const FEATURE_KEYS = [
  '일일 검색',
  '컬렉션',
  '저장 포즈',
  'AI 포즈 추출',
  '태그 기반 검색',
  '포즈 벡터 매칭',
  '카메라 앵글 벡터 매칭',
  '고급 소재/배경 필터',
  '검색 히스토리',
  '팀 공유 컬렉션',
  '우선 지원',
];

/**
 * 가격 포맷팅 (₩1,000 형식)
 */
function formatPrice(price: number): string {
  if (price === 0) return '무료';
  return `₩${price.toLocaleString('ko-KR')}`;
}

/**
 * 날짜 포맷팅 (YYYY. MM. DD 형식)
 */
function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 플랜 순서 (다운그레이드 판별용)
 * 숫자가 낮을수록 낮은 등급
 */
const PLAN_ORDER: Record<SubscriptionPlan, number> = {
  free: 0,
  lite: 1,
  student: 2,
  pro: 3,
  team: 4,
};

export default function PricingPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { currentPlan, subscription } = useSubscriptionStore();

  // 월간/연간 토글 상태
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  // AuthModal 표시 여부 (비로그인 상태로 구독 버튼 클릭 시)
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 구독 취소 처리 상태
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // 결제 훅
  const { startCheckout, isLoading: isCheckoutLoading, error: checkoutError } = useCheckout();

  /**
   * 플랜 CTA 버튼 클릭 핸들러
   * - 비로그인: AuthModal 표시
   * - free 플랜: 회원가입(AuthModal 표시) 또는 현재 플랜 표시
   * - 유료 플랜: 결제 플로우 시작
   */
  const handlePlanClick = useCallback(
    async (plan: PlanInfo) => {
      // free 플랜은 회원가입으로 연결
      if (plan.id === 'free') {
        if (!isAuthenticated) {
          setShowAuthModal(true);
        }
        return;
      }

      // 비로그인 상태에서 유료 플랜 클릭 → AuthModal
      if (!isAuthenticated) {
        setShowAuthModal(true);
        return;
      }

      // 결제 플로우 시작
      await startCheckout(plan.id, billingCycle);
    },
    [isAuthenticated, billingCycle, startCheckout]
  );

  /**
   * 구독 취소 핸들러
   * - 현재 활성 구독 ID로 cancelSubscription 호출
   */
  const handleCancelSubscription = useCallback(async () => {
    if (!subscription || subscription.id === 'free-local') return;

    // 취소 확인 (되돌리기 어려운 작업)
    const confirmed = window.confirm(
      '정말 구독을 취소하시겠습니까?\n현재 결제 주기가 끝날 때까지는 계속 사용할 수 있습니다.'
    );
    if (!confirmed) return;

    setIsCanceling(true);
    setCancelError(null);

    try {
      await cancelSubscription(subscription.id);
      // 구독 스토어 갱신 (user가 있을 때만)
      if (user) {
        const { fetchSubscription } = useSubscriptionStore.getState();
        await fetchSubscription(user.id);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '구독 취소 중 오류가 발생했습니다.';
      setCancelError(message);
    } finally {
      setIsCanceling(false);
    }
  }, [subscription, user]);

  /**
   * 플랜 버튼 레이블 결정
   * - 현재 플랜: "현재 플랜"
   * - 더 낮은 플랜: "다운그레이드" (비활성)
   * - free 플랜 (비로그인): "무료로 시작하기"
   * - 유료 플랜: "구독하기"
   */
  function getPlanButtonLabel(plan: PlanInfo): string {
    if (currentPlan === plan.id) return '현재 플랜';
    if (PLAN_ORDER[plan.id] < PLAN_ORDER[currentPlan]) return '다운그레이드';
    if (plan.id === 'free') {
      return isAuthenticated ? '현재 플랜' : '무료로 시작하기';
    }
    return '구독하기';
  }

  /**
   * 플랜 버튼 비활성화 여부
   * - 현재 플랜이거나 다운그레이드인 경우 비활성화
   */
  function isPlanButtonDisabled(plan: PlanInfo): boolean {
    if (currentPlan === plan.id) return true;
    if (PLAN_ORDER[plan.id] < PLAN_ORDER[currentPlan]) return true;
    // free 플랜이고 로그인 상태이면 이미 free 사용 중 → 비활성
    if (plan.id === 'free' && isAuthenticated) return true;
    return false;
  }

  // 유료 유저 여부 (구독 관리 섹션 표시 조건)
  const isPaidUser = isAuthenticated && currentPlan !== 'free';
  // 구독이 취소 요청된 상태인지 확인
  const isCanceled = subscription?.status === 'canceled';

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* 헤더 */}
      <header className="border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/search" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-[10px] font-bold">
              A
            </div>
            <span className="text-sm font-semibold">ArtRef</span>
          </Link>
          <Link
            href="/search"
            className="text-xs text-neutral-400 hover:text-neutral-300 transition-colors"
          >
            검색으로 돌아가기
          </Link>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* 제목 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3">
            나에게 맞는 플랜을 선택하세요
          </h1>
          <p className="text-neutral-400 text-sm">
            모든 플랜에서 3D 포즈 매칭과 태그 검색을 사용할 수 있습니다
          </p>
        </div>

        {/* 월간/연간 토글 */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span
            className={`text-sm ${billingCycle === 'monthly' ? 'text-white font-semibold' : 'text-neutral-500'}`}
          >
            월간
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className={`
              relative w-12 h-6 rounded-full transition-colors cursor-pointer
              ${billingCycle === 'annual' ? 'bg-orange-600' : 'bg-neutral-700'}
            `}
            aria-label="결제 주기 전환"
          >
            {/* 토글 원형 인디케이터 */}
            <span
              className={`
                absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform
                ${billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0.5'}
              `}
            />
          </button>
          <span
            className={`text-sm ${billingCycle === 'annual' ? 'text-white font-semibold' : 'text-neutral-500'}`}
          >
            연간
            <span className="ml-1 text-xs text-orange-400 font-semibold">20% 할인</span>
          </span>
        </div>

        {/* 결제 에러 메시지 (전역) */}
        {checkoutError && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
            <p className="text-xs text-red-400">{checkoutError}</p>
          </div>
        )}

        {/* 플랜 카드 5열 (모바일: 수평 스크롤) */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="grid grid-cols-5 gap-4 min-w-[900px]">
            {PLANS.map((plan) => {
              const isCurrent = currentPlan === plan.id;
              const isDisabled = isPlanButtonDisabled(plan);
              const buttonLabel = getPlanButtonLabel(plan);
              const displayPrice = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
              // 현재 처리 중인 플랜인지 확인 (결제 로딩)
              const isThisLoading = isCheckoutLoading;

              return (
                <div
                  key={plan.id}
                  className={`
                    relative rounded-2xl border p-5 flex flex-col
                    ${plan.highlighted
                      ? `${plan.borderColor} bg-neutral-900/80 ring-1 ring-orange-500/20`
                      : `${plan.borderColor} bg-neutral-900/40`
                    }
                  `}
                >
                  {/* 추천 뱃지 */}
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-orange-600 to-amber-600 text-white">
                      추천
                    </div>
                  )}

                  {/* 학생 인증 뱃지 */}
                  {plan.requiresVerification && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                      학생 인증
                    </div>
                  )}

                  {/* 플랜 이름 + 가격 */}
                  <div className="mb-4">
                    <h2 className={`text-lg font-bold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                      {plan.name}
                    </h2>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{formatPrice(displayPrice)}</span>
                      {plan.monthlyPrice > 0 && (
                        <span className="text-xs text-neutral-500">{plan.priceNote}</span>
                      )}
                    </div>
                    {/* 연간 결제 시 원래 가격 취소선 표시 */}
                    {billingCycle === 'annual' && plan.monthlyPrice > 0 && (
                      <p className="text-[10px] text-neutral-600 line-through mt-0.5">
                        {formatPrice(plan.monthlyPrice)}/월
                      </p>
                    )}
                    <p className="text-xs text-neutral-400 mt-1">{plan.description}</p>
                  </div>

                  {/* 기능 목록 */}
                  <ul className="space-y-1.5 flex-1 mb-5">
                    {FEATURE_KEYS.map((featureKey) => {
                      const value = plan.features[featureKey];
                      const isEnabled = value !== false;
                      return (
                        <li key={featureKey} className="flex items-center gap-1.5 text-[11px]">
                          <span className={isEnabled ? 'text-green-400' : 'text-neutral-600'}>
                            {isEnabled ? '✓' : '—'}
                          </span>
                          <span className={isEnabled ? 'text-neutral-300' : 'text-neutral-600'}>
                            {featureKey}
                            {typeof value === 'string' && (
                              <span className="ml-1 text-neutral-500">({value})</span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* CTA 버튼 */}
                  <button
                    disabled={isDisabled || isThisLoading}
                    onClick={() => handlePlanClick(plan)}
                    className={`
                      w-full py-2 rounded-xl text-xs font-semibold transition-all
                      ${isDisabled
                        ? 'bg-neutral-800 text-neutral-500 cursor-default'
                        : plan.highlighted
                          ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-500 hover:to-amber-500 cursor-pointer'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 cursor-pointer'
                      }
                      ${isThisLoading && !isDisabled ? 'opacity-70 cursor-wait' : ''}
                    `}
                  >
                    {/* 현재 결제 진행 중인 경우 로딩 표시 */}
                    {isThisLoading && !isDisabled && !isCurrent
                      ? '처리 중...'
                      : buttonLabel
                    }
                  </button>

                  {/* 다운그레이드 안내 */}
                  {PLAN_ORDER[plan.id] < PLAN_ORDER[currentPlan] && isAuthenticated && (
                    <p className="text-[10px] text-neutral-600 text-center mt-1.5">
                      고객센터를 통해 요청하세요
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================ */}
        {/* 구독 관리 섹션 (로그인한 유료 유저에게만 표시) */}
        {/* ============================================ */}
        {isPaidUser && subscription && (
          <div className="mt-12 p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40">
            <h2 className="text-sm font-semibold text-neutral-200 mb-4">내 구독 관리</h2>

            {/* 구독 상세 정보 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* 현재 플랜 */}
              <div className="p-3 rounded-xl bg-neutral-800/50">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">현재 플랜</p>
                <p className="text-sm font-semibold text-white capitalize">
                  {subscription.plan}
                  {subscription.billingCycle === 'annual' && (
                    <span className="ml-1.5 text-[10px] text-orange-400 font-normal">연간</span>
                  )}
                </p>
              </div>

              {/* 구독 상태 */}
              <div className="p-3 rounded-xl bg-neutral-800/50">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">구독 상태</p>
                <p className={`text-sm font-semibold ${isCanceled ? 'text-amber-400' : 'text-green-400'}`}>
                  {isCanceled ? '취소 예약됨' : '활성'}
                </p>
              </div>

              {/* 다음 결제일 / 만료일 */}
              <div className="p-3 rounded-xl bg-neutral-800/50">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">
                  {isCanceled ? '서비스 종료일' : '다음 결제일'}
                </p>
                <p className="text-sm font-semibold text-white">
                  {subscription.expiresAt
                    ? formatDate(subscription.expiresAt)
                    : '—'
                  }
                </p>
              </div>
            </div>

            {/* 취소 에러 메시지 */}
            {cancelError && (
              <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-[11px] text-red-400">{cancelError}</p>
              </div>
            )}

            {/* 구독 취소 버튼 (이미 취소된 경우 숨김) */}
            {!isCanceled && (
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-neutral-500">
                  구독을 취소해도 현재 결제 주기가 끝날 때까지 서비스를 이용할 수 있습니다.
                </p>
                <button
                  onClick={handleCancelSubscription}
                  disabled={isCanceling}
                  className="
                    ml-4 shrink-0 px-4 py-1.5 rounded-lg text-xs font-medium
                    border border-neutral-700 text-neutral-400
                    hover:border-red-500/50 hover:text-red-400
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors cursor-pointer
                  "
                >
                  {isCanceling ? '처리 중...' : '구독 취소'}
                </button>
              </div>
            )}

            {/* 취소 예약 안내 */}
            {isCanceled && (
              <p className="text-[11px] text-amber-400/70">
                구독 취소가 예약되었습니다. 위의 서비스 종료일 이후 Free 플랜으로 전환됩니다.
              </p>
            )}
          </div>
        )}

        {/* FAQ / 안내 */}
        <div className="text-center text-xs text-neutral-500 mt-8">
          <p>
            학생 인증은 대학교 이메일(.ac.kr, .edu) 또는 학생증 사본으로 가능합니다
          </p>
          <p className="mt-1">
            문의: <span className="text-orange-400">support@artref.app</span>
          </p>
        </div>
      </main>

      {/* AuthModal (비로그인 상태에서 버튼 클릭 시 표시) */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}
