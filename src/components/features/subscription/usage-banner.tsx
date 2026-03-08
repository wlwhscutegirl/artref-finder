'use client';

// ============================================
// 사용량 배너
// 페이지 상단에 표시되는 슬림 배너
// - Free 유저: 업그레이드 유도 문구
// - 80% 이상 사용: 프로그레스 바 + 사용량 표시
// - 한도 초과: 경고 + 업그레이드 버튼
// 세션 중 X 버튼으로 닫으면 세션 내 유지 (sessionStorage 사용)
// ============================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSubscriptionStore } from '@/stores/subscription-store';

// sessionStorage 키 — 세션 중 닫힘 상태 기억
const DISMISSED_KEY = 'artref-usage-banner-dismissed';

// ============================================
// Props 타입
// ============================================
interface UsageBannerProps {
  /** 오늘 사용한 검색 횟수 (없으면 배너 비표시) */
  dailyUsage?: number;
  /** 일일 검색 한도 (-1이면 무제한, 표시 안 함) */
  dailyLimit?: number;
}

export function UsageBanner({ dailyUsage, dailyLimit }: UsageBannerProps) {
  const { currentPlan } = useSubscriptionStore();

  // 세션 내 닫힘 상태 (초기값: sessionStorage 확인)
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(DISMISSED_KEY) === 'true';
  });

  // 무제한 플랜이면 렌더링 불필요
  const isUnlimited = dailyLimit === -1;
  if (isUnlimited) return null;

  // 닫기 핸들러 — sessionStorage에 기록하여 세션 내 유지
  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  // 이미 닫은 배너는 표시하지 않음
  if (dismissed) return null;

  // ============================================
  // 표시할 배너 종류 결정
  // ============================================

  const isFreePlan = currentPlan === 'free';
  const hasUsageData = typeof dailyUsage === 'number' && typeof dailyLimit === 'number' && dailyLimit > 0;

  // 한도 초과 여부
  const isExceeded = hasUsageData && dailyUsage >= dailyLimit;
  // 80% 이상 사용 여부
  const usageRatio = hasUsageData ? dailyUsage / dailyLimit : 0;
  const isNearLimit = hasUsageData && usageRatio >= 0.8 && !isExceeded;

  // 1. 한도 초과 배너
  if (isExceeded) {
    return (
      <div className="w-full bg-red-500/10 border-b border-red-500/20">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* 경고 아이콘 */}
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-xs text-red-300 truncate">
              일일 검색 한도에 도달했습니다. 업그레이드하세요
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/pricing"
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white transition-all"
            >
              업그레이드
            </Link>
            <button
              onClick={handleDismiss}
              aria-label="배너 닫기"
              className="text-red-400/50 hover:text-red-300 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. 80% 이상 사용 배너 (프로그레스 바 포함)
  if (isNearLimit && hasUsageData) {
    const progressPercent = Math.min(usageRatio * 100, 100);

    return (
      <div className="w-full bg-amber-500/10 border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* 경고 아이콘 */}
              <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>

              <div className="flex-1 min-w-0">
                {/* 사용량 텍스트 */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-amber-600 font-medium">
                    오늘 검색 {dailyUsage}/{dailyLimit}회 사용
                  </span>
                  <span className="text-xs text-amber-400/60 ml-2">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
                {/* 프로그레스 바 */}
                <div className="w-full h-1.5 bg-amber-500/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/pricing"
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 border border-amber-500/30 transition-colors"
              >
                업그레이드
              </Link>
              <button
                onClick={handleDismiss}
                aria-label="배너 닫기"
                className="text-amber-400/40 hover:text-amber-600 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Free 유저 기본 업그레이드 유도 배너 (80% 미만인 경우)
  if (isFreePlan) {
    return (
      <div className="w-full bg-orange-500/5 border-b border-orange-500/10">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500 truncate">
            <span className="text-orange-400 font-medium">Pro</span>로 업그레이드하면 무제한 검색!
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/pricing"
              className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
            >
              지금 업그레이드
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <button
              onClick={handleDismiss}
              aria-label="배너 닫기"
              className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 표시 조건 미충족 시 렌더링 없음
  return null;
}
