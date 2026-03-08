// ============================================
// 구독 상태 관리 스토어 (Zustand)
// 로그인 시 구독 정보를 로드하고 기능 접근 제어 제공
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getCurrentSubscription,
  getPlanLimits,
  checkLimit,
} from '@/lib/subscription-service';
import type { Subscription, SubscriptionPlan, PlanLimits, FeatureKey } from '@/types';

// ============================================
// 스토어 인터페이스
// ============================================

interface SubscriptionState {
  /** 현재 구독 정보 (null이면 미로드 상태) */
  subscription: Subscription | null;
  /** 현재 플랜 (구독 미로드 시 기본값 'free') */
  currentPlan: SubscriptionPlan;
  /** 현재 플랜의 기능 제한 */
  planLimits: PlanLimits;
  /** 구독 정보 로딩 중 여부 */
  isLoading: boolean;
  /** 마지막 에러 메시지 */
  error: string | null;

  // --- 액션 ---

  /**
   * 유저의 구독 정보 로드
   * 로그인 직후 또는 구독 변경 후 호출
   */
  fetchSubscription: (userId: string) => Promise<void>;

  /**
   * 구독 정보 초기화 (로그아웃 시 호출)
   */
  clearSubscription: () => void;

  /**
   * 특정 기능 사용 가능 여부 확인
   * - 스토어에 캐시된 플랜 제한으로 빠르게 판단
   * - 횟수 기반 제한(dailySearch 등)은 서버 조회가 필요하므로 별도 checkLimit 함수 사용 권장
   */
  isFeatureAvailable: (feature: FeatureKey) => boolean;

  /**
   * 구독 정보 직접 설정 (결제 완료 후 즉시 반영)
   */
  setSubscription: (subscription: Subscription) => void;
}

// ============================================
// 기본 free 플랜 제한 (스토어 초기값)
// ============================================

import { PLAN_LIMITS } from '@/lib/subscription-service';

// ============================================
// 스토어 생성
// ============================================

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      subscription: null,
      currentPlan: 'free',
      planLimits: PLAN_LIMITS['free'],
      isLoading: false,
      error: null,

      // --- 구독 정보 로드 ---
      fetchSubscription: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          // bkend에서 현재 활성 구독 조회 (실패 시 free 폴백 반환)
          const subscription = await getCurrentSubscription(userId);
          const currentPlan = subscription.plan;
          const planLimits = getPlanLimits(currentPlan);

          set({
            subscription,
            currentPlan,
            planLimits,
            isLoading: false,
          });
        } catch (error) {
          // 예외 발생 시 free 플랜으로 안전하게 처리
          console.error('[subscription-store] 구독 로드 실패:', error);
          set({
            subscription: null,
            currentPlan: 'free',
            planLimits: PLAN_LIMITS['free'],
            isLoading: false,
            error: error instanceof Error ? error.message : '구독 정보를 불러오지 못했습니다.',
          });
        }
      },

      // --- 구독 초기화 ---
      clearSubscription: () => {
        set({
          subscription: null,
          currentPlan: 'free',
          planLimits: PLAN_LIMITS['free'],
          isLoading: false,
          error: null,
        });
      },

      // --- 기능 사용 가능 여부 (캐시 기반, 빠른 판단) ---
      isFeatureAvailable: (feature: FeatureKey): boolean => {
        const { planLimits, currentPlan } = get();

        switch (feature) {
          case 'dailySearch':
            // 횟수 제한은 -1(무제한) 여부만 빠르게 판단
            // 정확한 사용량 확인은 checkLimit 함수를 별도로 호출할 것
            return planLimits.dailySearches !== 0;

          case 'createCollection':
            // 컬렉션 1개 이상 허용하면 사용 가능 (free는 1개)
            return planLimits.maxCollections !== 0;

          case 'savePose':
            // 저장 포즈 1개 이상 허용하면 사용 가능 (free는 3개)
            return planLimits.maxSavedPoses !== 0;

          case 'aiSearch':
            return planLimits.aiSearch;

          case 'teamSharing':
            return planLimits.teamSharing;

          case 'hdDownload':
            return planLimits.hdDownload;

          default: {
            // 알 수 없는 기능 키는 미사용 처리
            const _exhaustive: never = feature;
            console.warn('[subscription-store] 알 수 없는 기능 키:', _exhaustive, '플랜:', currentPlan);
            return false;
          }
        }
      },

      // --- 구독 직접 설정 (결제 완료 후 즉시 반영) ---
      setSubscription: (subscription: Subscription) => {
        const currentPlan = subscription.plan;
        const planLimits = getPlanLimits(currentPlan);
        set({ subscription, currentPlan, planLimits });
      },
    }),
    {
      name: 'artref-subscription',
      // 구독 정보는 민감하지 않아 로컬 스토리지에 캐시
      // isLoading, error는 세션 간 유지 불필요
      partialize: (state) => ({
        subscription: state.subscription,
        currentPlan: state.currentPlan,
        planLimits: state.planLimits,
      }),
    }
  )
);

// ============================================
// 편의 셀렉터 (컴포넌트에서 간편하게 사용)
// ============================================

/**
 * 현재 플랜만 선택
 * @example const plan = useCurrentPlan(); // 'free' | 'lite' | ...
 */
export const useCurrentPlan = () =>
  useSubscriptionStore((state) => state.currentPlan);

/**
 * 플랜 제한 정보만 선택
 * @example const { dailySearches, maxCollections } = usePlanLimits();
 */
export const usePlanLimits = () =>
  useSubscriptionStore((state) => state.planLimits);

/**
 * 특정 기능 사용 가능 여부 선택자 (캐시 기반)
 * 횟수 기반 한도 확인이 필요하면 checkLimit을 직접 호출할 것
 *
 * @example
 * const canUseAI = useFeatureAvailable('aiSearch');
 */
export const useFeatureAvailable = (feature: FeatureKey): boolean =>
  useSubscriptionStore((state) => state.isFeatureAvailable(feature));

/**
 * 서버 기반 정확한 기능 제한 확인 (checkLimit 래퍼)
 * - 일일 검색 횟수처럼 사용량이 중요한 기능에 사용
 */
export { checkLimit };
