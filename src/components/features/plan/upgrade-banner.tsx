// ============================================
// 업그레이드 배너
// 무료/Lite 플랜 제한 도달 시 상위 플랜 업그레이드 유도
// 다단계 분기: Free→Lite/Pro, Lite→Pro
// ============================================

'use client';

import Link from 'next/link';

interface UpgradeBannerProps {
  /** 남은 검색 횟수 */
  remaining?: number;
  /** 일일 검색 제한 */
  limit?: number;
  /** 배너 닫기 콜백 */
  onDismiss?: () => void;
  /** 제한 완전 도달 여부 (true면 검색 차단) */
  isBlocked?: boolean;
  /** 현재 사용자 플랜 */
  currentPlan?: 'free' | 'lite' | 'student' | 'pro' | 'team';
}

/**
 * 업그레이드 배너 컴포넌트
 * - 제한 근접 시: 경고 메시지 (노란색)
 * - 제한 도달 시: 차단 메시지 (빨간색)
 * - Free → Lite(₩4,900) + Pro 추천
 * - Lite → Pro 추천
 */
export function UpgradeBanner({
  remaining = 0,
  limit = 100,
  onDismiss,
  isBlocked = false,
  currentPlan = 'free',
}: UpgradeBannerProps) {
  // 유료 플랜(student/pro/team)은 검색 무제한이므로 배너 불필요
  if (currentPlan === 'student' || currentPlan === 'pro' || currentPlan === 'team') {
    return null;
  }

  // Free 플랜 추천 메시지
  const isFreePlan = currentPlan === 'free';
  const upgradeLabel = isFreePlan ? 'Lite 플랜 (₩4,900/월)' : 'Pro 플랜 (₩9,900/월)';
  const upgradeDescription = isFreePlan
    ? '무제한 검색 + 고급 필터가 ₩4,900/월!'
    : '무제한 컬렉션 + 자동 추출 무제한!';

  // 제한 도달 (차단 상태)
  if (isBlocked) {
    return (
      <div className="mx-4 mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-300">
              오늘 무료 검색 한도에 도달했습니다
            </p>
            <p className="text-xs text-red-400/80 mt-0.5">
              {upgradeDescription}
            </p>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-400/60 hover:text-red-300 cursor-pointer ml-2"
            >
              &times;
            </button>
          )}
        </div>

        {/* CTA 버튼 */}
        <div className="mt-2 flex items-center gap-2">
          <Link
            href="/pricing"
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold
              bg-gradient-to-r from-orange-600 to-amber-600 text-white
              hover:from-orange-500 hover:to-amber-500 transition-all"
          >
            {upgradeLabel}
          </Link>
          {/* Free 플랜이면 Pro도 함께 노출 */}
          {isFreePlan && (
            <Link
              href="/pricing"
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold
                bg-orange-50 text-gray-600 hover:bg-orange-100 transition-all"
            >
              Pro 플랜 보기
            </Link>
          )}
          <span className="text-[10px] text-red-400/60">
            오늘 사용: {limit}/{limit}회
          </span>
        </div>
      </div>
    );
  }

  // 제한 근접 경고 (남은 횟수가 15 이하일 때만 표시)
  if (remaining > 15) return null;

  return (
    <div className="mx-4 mt-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-amber-600">
            오늘 검색 {remaining}회 남았습니다
          </p>
          <p className="text-[10px] text-amber-400/70 mt-0.5">
            {upgradeDescription}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="px-2 py-1 rounded text-[10px] font-semibold
              bg-amber-600/80 text-white hover:bg-amber-500 transition-colors"
          >
            {isFreePlan ? 'Lite 보기' : 'Pro 보기'}
          </Link>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-amber-400/40 hover:text-amber-600 cursor-pointer text-sm"
            >
              &times;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
