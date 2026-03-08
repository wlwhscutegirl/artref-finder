// ============================================
// 신규 유저 온보딩 트리거 훅
//
// 사용처: 회원가입 완료 후 렌더링되는 최상위 컴포넌트
// 트리거 조건:
//   1. 인증된 유저 (isAuthenticated === true)
//   2. localStorage에 artref_onboarding_done 키가 없음
//
// 완료 처리: markOnboardingDone() 호출 시
//   → localStorage에 artref_onboarding_done 저장
//   → 모달 닫힘 / 이후 재표시 안 함
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';

/** localStorage 키 (중앙 상수 참조) */
const STORAGE_KEY = STORAGE_KEYS.ONBOARDING_DONE;

interface UseOnboardingWelcomeReturn {
  /** 온보딩 모달 표시 여부 */
  showOnboarding: boolean;
  /** 온보딩 완료 처리 (모달 닫기 + 재표시 방지) */
  markOnboardingDone: () => void;
}

/**
 * 신규 유저 온보딩 표시 여부를 관리하는 훅
 *
 * @param isAuthenticated - 현재 유저의 인증 상태 (useAuthStore에서 전달)
 *
 * @example
 * ```tsx
 * const { isAuthenticated } = useAuthStore();
 * const { showOnboarding, markOnboardingDone } = useOnboardingWelcome(isAuthenticated);
 *
 * return showOnboarding ? (
 *   <OnboardingWelcomeModal onClose={markOnboardingDone} />
 * ) : null;
 * ```
 */
export function useOnboardingWelcome(
  isAuthenticated: boolean
): UseOnboardingWelcomeReturn {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // SSR 환경에서는 localStorage 접근 불가
    if (typeof window === 'undefined') return;

    // 인증되지 않은 유저에게는 표시하지 않음
    if (!isAuthenticated) {
      setShowOnboarding(false);
      return;
    }

    // 이미 온보딩을 완료한 유저는 표시하지 않음
    const isDone = localStorage.getItem(STORAGE_KEY);
    if (isDone) {
      setShowOnboarding(false);
      return;
    }

    // 첫 로그인/회원가입 유저 → 온보딩 표시
    setShowOnboarding(true);
  }, [isAuthenticated]);

  /** 온보딩 완료 처리 */
  const markOnboardingDone = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setShowOnboarding(false);
  }, []);

  return { showOnboarding, markOnboardingDone };
}
