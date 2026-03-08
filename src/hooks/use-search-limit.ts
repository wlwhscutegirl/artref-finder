'use client';

// ============================================
// useSearchLimit 훅
// 검색 실행 전 일일 한도를 확인하고
// 한도 초과 시 업그레이드 모달을 표시하는 훅
// ============================================

import { useState, useCallback } from 'react';
import { checkLimit } from '@/lib/subscription-service';
import { bkend } from '@/lib/bkend';
import { useAuthStore } from '@/stores/auth-store';
import { useSubscriptionStore } from '@/stores/subscription-store';

// ============================================
// 훅 반환 타입
// ============================================
export interface UseSearchLimitReturn {
  /** 검색 가능 여부 (마지막 체크 결과 기반) */
  canSearch: boolean;
  /**
   * 검색 실행 전 한도 체크 + 실행 헬퍼
   * - 한도 내이면 onSearch 콜백 실행 후 검색 로그 기록
   * - 한도 초과이면 업그레이드 모달 표시
   * @param onSearch 실제 검색을 실행하는 비동기 함수
   */
  checkAndSearch: (onSearch: () => Promise<void>) => Promise<void>;
  /** 업그레이드 모달 표시 여부 (upgrade-modal.tsx에 전달) */
  showUpgradeModal: boolean;
  /** 모달 닫기 핸들러 */
  closeUpgradeModal: () => void;
  /** 오늘 사용한 검색 횟수 (UsageBanner에 전달) */
  dailyUsage: number;
  /** 일일 검색 한도 (UsageBanner에 전달) */
  dailyLimit: number;
  /** 한도 체크 중 로딩 여부 */
  isChecking: boolean;
}

/**
 * 검색 한도 체크 훅
 *
 * 사용 예시:
 * ```tsx
 * const { checkAndSearch, showUpgradeModal, closeUpgradeModal, dailyUsage, dailyLimit } = useSearchLimit();
 *
 * // 검색 버튼 클릭 시
 * await checkAndSearch(async () => {
 *   const results = await performSearch(query);
 *   setResults(results);
 * });
 *
 * // 모달 표시
 * {showUpgradeModal && (
 *   <UpgradeModal
 *     feature="dailySearch"
 *     current={dailyUsage}
 *     limit={dailyLimit}
 *     onClose={closeUpgradeModal}
 *   />
 * )}
 * ```
 */
export function useSearchLimit(): UseSearchLimitReturn {
  const { user, isAuthenticated } = useAuthStore();
  const { currentPlan } = useSubscriptionStore();

  // 업그레이드 모달 표시 여부
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  // 오늘 검색 사용량
  const [dailyUsage, setDailyUsage] = useState<number>(0);
  // 일일 한도 (초기값: free 플랜 기준 10)
  const [dailyLimit, setDailyLimit] = useState<number>(10);
  // 검색 가능 여부 (마지막 체크 결과)
  const [canSearch, setCanSearch] = useState<boolean>(true);
  // 한도 체크 중 로딩 여부
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // 모달 닫기
  const closeUpgradeModal = useCallback(() => {
    setShowUpgradeModal(false);
  }, []);

  /**
   * 검색 실행 전 한도 체크 후 실행
   * 1. 비로그인 유저: 한도 체크 없이 실행 (로컬 처리)
   * 2. 로그인 유저: checkLimit으로 서버 사용량 확인
   *    - 허용: onSearch 실행 → search_logs에 기록
   *    - 초과: 업그레이드 모달 표시
   */
  const checkAndSearch = useCallback(async (onSearch: () => Promise<void>) => {
    // 비로그인 유저는 한도 체크 없이 통과
    // (비로그인 상태에서도 검색 UX 유지, 서버에서 추가 제어 가능)
    if (!isAuthenticated || !user) {
      await onSearch();
      return;
    }

    setIsChecking(true);
    try {
      // 서버에서 오늘 사용량 및 한도 확인
      const result = await checkLimit(user.id, 'dailySearch');

      // 사용량 상태 업데이트
      const usage = result.current ?? 0;
      const limit = result.limit;
      setDailyUsage(usage);
      setDailyLimit(limit === -1 ? -1 : limit);
      setCanSearch(result.allowed);

      if (!result.allowed) {
        // 한도 초과 — 업그레이드 모달 표시
        setShowUpgradeModal(true);
        return;
      }

      // 한도 내 — 검색 실행
      await onSearch();

      // 검색 성공 후 search_logs에 기록
      try {
        await bkend.data.create('search_logs', {
          userId: user.id,
          plan: currentPlan,
          // 검색 성공 시각 자동 기록 (bkend createdAt 활용)
        });
        // 로컬 사용량 카운터 즉시 증가 (다음 체크 전 UI 반영)
        setDailyUsage((prev) => prev + 1);
      } catch (logError) {
        // 로그 기록 실패는 검색 결과에 영향을 주지 않음
        console.warn('[use-search-limit] 검색 로그 기록 실패:', logError);
      }
    } catch (error) {
      // checkLimit 실패 시 검색 허용 (사용자 경험 우선)
      console.warn('[use-search-limit] 한도 체크 실패, 검색 허용으로 처리:', error);
      setCanSearch(true);
      await onSearch();
    } finally {
      setIsChecking(false);
    }
  }, [isAuthenticated, user, currentPlan]);

  return {
    canSearch,
    checkAndSearch,
    showUpgradeModal,
    closeUpgradeModal,
    dailyUsage,
    dailyLimit,
    isChecking,
  };
}
