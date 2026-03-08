'use client';

// ============================================
// 업그레이드 유도 모달
// 한도 초과 시 현재 플랜 vs 추천 플랜 비교 표시
// 사용자를 /pricing 페이지로 유도
// ============================================

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscriptionStore } from '@/stores/subscription-store';
import { PLAN_LIMITS } from '@/lib/subscription-service';
import type { FeatureKey, SubscriptionPlan } from '@/types';

// ============================================
// 기능 키 → 한국어 레이블 매핑
// ============================================
const FEATURE_LABELS: Record<FeatureKey, string> = {
  dailySearch: '일일 검색',
  createCollection: '컬렉션 생성',
  savePose: '포즈 저장',
  autoSearch: '자동 매칭',
  teamSharing: '팀 공유',
  hdDownload: '고화질 다운로드',
};

// ============================================
// 현재 플랜에서 추천할 업그레이드 플랜 결정
// ============================================
function getRecommendedPlan(currentPlan: SubscriptionPlan): SubscriptionPlan {
  switch (currentPlan) {
    case 'free':
      return 'lite';
    case 'lite':
    case 'student':
      return 'pro';
    case 'pro':
      return 'team';
    default:
      return 'pro';
  }
}

// ============================================
// 플랜 표시 이름
// ============================================
const PLAN_DISPLAY_NAMES: Record<SubscriptionPlan, string> = {
  free: 'Free',
  lite: 'Lite',
  student: 'Student',
  pro: 'Pro',
  team: 'Team',
};

// ============================================
// 플랜 주요 특징 설명 (추천 플랜용)
// ============================================
const PLAN_HIGHLIGHTS: Record<SubscriptionPlan, string[]> = {
  free: ['일일 검색 10회', '컬렉션 1개', '포즈 저장 3개'],
  lite: ['일일 검색 50회', '컬렉션 5개', '자동 매칭 지원', '₩4,900/월'],
  student: ['일일 검색 50회', '컬렉션 5개', '자동 매칭 지원', '₩4,900/월'],
  pro: ['검색 무제한', '컬렉션 무제한', '고화질 다운로드', '₩9,900/월'],
  team: ['검색 무제한', '팀 공유 기능', '고화질 다운로드', '₩29,900/월'],
};

// ============================================
// Props 타입
// ============================================
interface UpgradeModalProps {
  /** 한도 초과된 기능 키 */
  feature: FeatureKey;
  /** 현재 사용량 */
  current: number;
  /** 현재 플랜의 한도 */
  limit: number;
  /** 모달 닫기 콜백 */
  onClose: () => void;
}

export function UpgradeModal({ feature, current, limit, onClose }: UpgradeModalProps) {
  const router = useRouter();
  const { currentPlan } = useSubscriptionStore();

  // 추천 플랜 계산
  const recommendedPlan = getRecommendedPlan(currentPlan);
  const recommendedLimits = PLAN_LIMITS[recommendedPlan];

  // 업그레이드 버튼 클릭: /pricing으로 이동 후 모달 닫기
  const handleUpgrade = () => {
    onClose();
    router.push('/pricing');
  };

  // 모달 컨테이너 ref (포커스 트랩용)
  const modalRef = useRef<HTMLDivElement>(null);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 포커스 트랩: 모달 내부에 포커스를 가둠
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = modal.querySelectorAll<HTMLElement>(focusableSelector);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleTabTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = modal.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // Shift+Tab: 첫 요소에서 마지막으로 이동
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
      // Tab: 마지막 요소에서 첫 요소로 이동
      else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleTabTrap);
    return () => document.removeEventListener('keydown', handleTabTrap);
  }, []);

  // 배경 클릭 시 모달 닫기
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 기능명 레이블
  const featureLabel = FEATURE_LABELS[feature];

  // 현재 플랜 제한 설명 문자열
  const currentLimitText = limit === -1 ? '무제한' : `${limit}회`;
  const recommendedLimitText = (() => {
    if (feature === 'dailySearch') {
      return recommendedLimits.dailySearches === -1 ? '무제한' : `${recommendedLimits.dailySearches}회`;
    }
    if (feature === 'createCollection') {
      return recommendedLimits.maxCollections === -1 ? '무제한' : `${recommendedLimits.maxCollections}개`;
    }
    if (feature === 'savePose') {
      return recommendedLimits.maxSavedPoses === -1 ? '무제한' : `${recommendedLimits.maxSavedPoses}개`;
    }
    return '사용 가능';
  })();

  return (
    // 배경 오버레이 — auth-modal.tsx 패턴 참조
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* 반투명 블러 배경 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* 모달 컨테이너 — role/aria 속성으로 접근성 보장 */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
        className="relative w-[90%] max-w-md bg-gray-50 border border-gray-300 rounded-2xl shadow-2xl overflow-hidden"
      >

        {/* 상단 브랜드 그라디언트 바 */}
        <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-500" />

        <div className="p-6">
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label="모달 닫기"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 아이콘 + 제목 */}
          <div className="text-center mb-5">
            {/* 잠금 아이콘 (그라디언트 배경) */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 id="upgrade-modal-title" className="text-lg font-bold text-gray-900">한도에 도달했습니다</h2>
            <p className="text-xs text-gray-500 mt-1">
              {featureLabel} {currentLimitText}를 모두 사용했습니다 ({current}/{limit === -1 ? '∞' : limit})
            </p>
          </div>

          {/* 플랜 비교 카드 */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* 현재 플랜 */}
            <div className="p-3.5 rounded-xl bg-orange-50 border border-gray-300">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">현재</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-700 text-gray-600">
                  {PLAN_DISPLAY_NAMES[currentPlan]}
                </span>
              </div>
              <ul className="space-y-1">
                {PLAN_HIGHLIGHTS[currentPlan].map((item) => (
                  <li key={item} className="text-[11px] text-gray-500 flex items-center gap-1">
                    <span className="text-gray-300">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* 추천 플랜 — 강조 스타일 */}
            <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 relative overflow-hidden">
              {/* 추천 뱃지 */}
              <div className="absolute top-2 right-2">
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-gradient-to-r from-orange-600 to-amber-600 text-white">
                  추천
                </span>
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs font-medium text-orange-400 uppercase tracking-wider">업그레이드</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/20 text-orange-300">
                  {PLAN_DISPLAY_NAMES[recommendedPlan]}
                </span>
              </div>
              <ul className="space-y-1">
                {PLAN_HIGHLIGHTS[recommendedPlan].map((item) => (
                  <li key={item} className="text-[11px] text-orange-300 flex items-center gap-1">
                    <svg className="w-2.5 h-2.5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 기능 차이 강조 문구 */}
          <p className="text-xs text-center text-gray-500 mb-4">
            {PLAN_DISPLAY_NAMES[recommendedPlan]} 플랜으로 업그레이드하면{' '}
            <span className="text-orange-400 font-medium">{featureLabel} {recommendedLimitText}</span>
            {feature === 'dailySearch' ? ' 이용 가능' : '으로 확장'}합니다
          </p>

          {/* 버튼 그룹 */}
          <div className="flex gap-2">
            {/* 나중에 버튼 */}
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-500 bg-orange-50 hover:bg-orange-100 border border-gray-300 hover:text-gray-700 transition-colors cursor-pointer"
            >
              나중에
            </button>
            {/* 업그레이드 버튼 — 그라디언트 CTA */}
            <button
              onClick={handleUpgrade}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 transition-all cursor-pointer"
            >
              업그레이드
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
