// ============================================
// 구독 플랜 기능 제한 정의
// free / lite / student / pro / team 플랜별 제한 및 체크 로직
// ============================================

/** 플랜별 기능 제한 정의 */
interface PlanConfig {
  /** 일일 검색 횟수 제한 (-1 = 무제한) */
  dailySearchLimit: number;
  /** 최대 컬렉션 수 (-1 = 무제한) */
  maxCollections: number;
  /** 최대 저장 포즈 수 (-1 = 무제한) */
  maxSavedPoses: number;
  /** 고급 필터 사용 가능 여부 (카메라 벡터 매칭 등) */
  advancedFilters: boolean;
  /** 팀 공유 컬렉션 사용 가능 여부 */
  teamSharing: boolean;
  /** 검색 히스토리 보관 수 */
  historyLimit: number;
  /** 일일 자동 포즈 추출 횟수 제한 (-1 = 무제한) */
  dailyExtractionLimit: number;
  /** 한 번에 처리 가능한 최대 이미지 수 (배치) */
  maxBatchSize: number;
}

/** 플랜별 월간 가격 (원) — 0이면 무료 */
interface PlanPricing {
  /** 월간 가격 */
  monthly: number;
  /** 연간 가격 (월 환산, 20% 할인) */
  annual: number;
}

/** 플랜별 가격 테이블 */
const PLAN_PRICING: Record<string, PlanPricing> = {
  free: { monthly: 0, annual: 0 },
  lite: { monthly: 4900, annual: 3920 },       // 연간 ₩47,040
  student: { monthly: 2900, annual: 2320 },     // 연간 ₩27,840
  pro: { monthly: 9900, annual: 7920 },         // 연간 ₩95,040
  team: { monthly: 29900, annual: 23920 },      // 연간 ₩287,040
};

/** 플랜별 제한값 테이블 */
const PLAN_CONFIGS: Record<string, PlanConfig> = {
  free: {
    dailySearchLimit: 100,       // FR-01: 50→100 완화
    maxCollections: 5,           // FR-01: 3→5 완화
    maxSavedPoses: 10,           // FR-01: 5→10 완화
    advancedFilters: false,
    teamSharing: false,
    historyLimit: 30,            // FR-01: 20→30 완화
    dailyExtractionLimit: 5,     // 무료: 하루 5회
    maxBatchSize: 1,              // 무료: 단일 이미지만
  },
  lite: {
    dailySearchLimit: -1,        // 무제한
    maxCollections: 20,
    maxSavedPoses: 50,
    advancedFilters: true,       // 카메라 벡터 매칭 포함
    teamSharing: false,
    historyLimit: 50,
    dailyExtractionLimit: 15,    // 하루 15회
    maxBatchSize: 3,              // 최대 3장 배치
  },
  student: {
    dailySearchLimit: -1,        // 무제한 (Pro 동급)
    maxCollections: -1,          // 무제한
    maxSavedPoses: -1,           // 무제한
    advancedFilters: true,
    teamSharing: false,          // 팀 공유 X
    historyLimit: 100,
    dailyExtractionLimit: -1,    // 무제한
    maxBatchSize: 3,              // 배치 3장 제한
  },
  pro: {
    dailySearchLimit: -1,        // 무제한
    maxCollections: -1,          // 무제한
    maxSavedPoses: -1,           // 무제한
    advancedFilters: true,
    teamSharing: false,
    historyLimit: 100,
    dailyExtractionLimit: -1,    // 무제한
    maxBatchSize: 5,              // 최대 5장 배치
  },
  team: {
    dailySearchLimit: -1,        // 무제한
    maxCollections: -1,          // 무제한
    maxSavedPoses: -1,           // 무제한
    advancedFilters: true,
    teamSharing: true,
    historyLimit: 100,
    dailyExtractionLimit: -1,    // 무제한
    maxBatchSize: 10,             // 최대 10장 배치
  },
};

/** 기능 제한 체크 결과 */
interface LimitCheckResult {
  /** 기능 사용 가능 여부 */
  allowed: boolean;
  /** 남은 횟수 (-1이면 무제한) */
  remaining?: number;
  /** 현재 사용량 */
  current?: number;
  /** 최대 제한 */
  limit?: number;
}

/**
 * 플랜 기능 제한 체크
 * @param plan 사용자 플랜 ('free' | 'lite' | 'student' | 'pro' | 'team')
 * @param feature 체크할 기능 이름
 * @param currentCount 현재 사용량 (검색 횟수, 컬렉션 수 등)
 */
export function checkLimit(
  plan: string,
  feature: 'dailySearch' | 'collections' | 'savedPoses' | 'dailyExtraction',
  currentCount: number = 0
): LimitCheckResult {
  const config = PLAN_CONFIGS[plan] || PLAN_CONFIGS.free;

  let limit: number;
  switch (feature) {
    case 'dailySearch':
      limit = config.dailySearchLimit;
      break;
    case 'collections':
      limit = config.maxCollections;
      break;
    case 'savedPoses':
      limit = config.maxSavedPoses;
      break;
    case 'dailyExtraction':
      limit = config.dailyExtractionLimit;
      break;
    default:
      return { allowed: true };
  }

  // 무제한인 경우
  if (limit === -1) {
    return { allowed: true, remaining: -1, current: currentCount, limit: -1 };
  }

  const remaining = Math.max(0, limit - currentCount);
  return {
    allowed: currentCount < limit,
    remaining,
    current: currentCount,
    limit,
  };
}

/**
 * 플랜별 전체 기능 접근 권한 반환
 * @param plan 사용자 플랜
 */
export function getFeatureAccess(plan: string): Record<string, boolean> {
  const config = PLAN_CONFIGS[plan] || PLAN_CONFIGS.free;

  return {
    unlimitedSearch: config.dailySearchLimit === -1,
    unlimitedCollections: config.maxCollections === -1,
    unlimitedPoses: config.maxSavedPoses === -1,
    advancedFilters: config.advancedFilters,
    teamSharing: config.teamSharing,
    extendedHistory: config.historyLimit >= 100,
  };
}

/**
 * 플랜 가격 정보 반환
 * @param plan 플랜 ID
 * @param cycle 결제 주기 ('monthly' | 'annual')
 */
export function getPlanPrice(plan: string, cycle: 'monthly' | 'annual' = 'monthly'): number {
  const pricing = PLAN_PRICING[plan] || PLAN_PRICING.free;
  return pricing[cycle];
}

/** 플랜 설정 테이블 (외부 참조용) */
export { PLAN_CONFIGS, PLAN_PRICING };
export type { PlanConfig, LimitCheckResult, PlanPricing };
