// ============================================
// 프로젝트 전역 상수 정의
// localStorage 키를 중앙 관리하여 오타/중복 방지
// ============================================

/**
 * localStorage 키 상수 모음
 * 프로젝트 전체에서 사용하는 localStorage 키를 한 곳에서 관리
 */
export const STORAGE_KEYS = {
  /** bkend.ai 액세스 토큰 */
  ACCESS_TOKEN: 'bkend_access_token',
  /** bkend.ai 리프레시 토큰 */
  REFRESH_TOKEN: 'bkend_refresh_token',

  /** 저장된 포즈 목록 (비로그인 시 로컬 저장) */
  SAVED_POSES: 'artref-saved-poses',
  /** 컬렉션 목록 (Zustand persist + 비로그인 폴백) */
  COLLECTIONS: 'artref-collections',

  /** 검색 히스토리 */
  SEARCH_HISTORY: 'artref-search-history',

  /** 렌더링 성능 설정 (품질 프리셋, DPR 등) */
  PERF_SETTINGS: 'artref-perf-settings',

  /** 커스텀 조명 프리셋 */
  CUSTOM_LIGHTING_PRESETS: 'artref-custom-lighting-presets',

  /** 온보딩 가이드 완료 여부 */
  ONBOARDING_SEEN: 'artref-onboarding-seen',
  /** 신규 유저 환영 온보딩 완료 여부 */
  ONBOARDING_DONE: 'artref_onboarding_done',
  /** 사용자 역할 선택 (온보딩에서 선택, 향후 개인화용) */
  USER_ROLES: 'artref_user_roles',

  /** 일일 검색 카운터 (플랜 제한용) */
  DAILY_SEARCH: 'artref-daily-search',
  /** 일일 AI 포즈 추출 카운터 (플랜 제한용) */
  DAILY_EXTRACTION: 'artref-daily-extraction',
} as const;

/** STORAGE_KEYS의 값 타입 (자동 완성용) */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
