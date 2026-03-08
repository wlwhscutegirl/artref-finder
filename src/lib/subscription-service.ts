// ============================================
// 구독 서비스 레이어
// bkend.ai 우선 조회, 실패 시 free 플랜 폴백
// ============================================

import { bkend } from '@/lib/bkend';
import type {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
  PlanLimits,
  FeatureKey,
} from '@/types';

/** bkend subscriptions 테이블명 */
const TABLE = 'subscriptions';

// ============================================
// 플랜별 제한 상수 (하드코딩)
// ============================================

/**
 * 각 플랜의 기능 제한 정의
 * -1 은 무제한을 의미
 */
export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    // FR-01: free 플랜 제한 완화 (plan-limits.ts 기준 동기화)
    dailySearches: 100,
    maxCollections: 5,
    maxSavedPoses: 10,
    aiSearch: false,
    teamSharing: false,
    hdDownload: false,
    priceMonthly: 0,
  },
  lite: {
    // plan-limits.ts 기준 동기화: 무제한 검색, 컬렉션 20, 포즈 50
    dailySearches: -1,
    maxCollections: 20,
    maxSavedPoses: 50,
    aiSearch: true,
    teamSharing: false,
    hdDownload: false,
    priceMonthly: 4900,
  },
  student: {
    // 학생 플랜 - Pro 동급 무제한 (plan-limits.ts 기준 동기화)
    dailySearches: -1,
    maxCollections: -1,
    maxSavedPoses: -1,
    aiSearch: true,
    teamSharing: false,
    hdDownload: false,
    priceMonthly: 2900,
  },
  pro: {
    // 프로 플랜 - 전체 무제한
    dailySearches: -1,
    maxCollections: -1,
    maxSavedPoses: -1,
    aiSearch: true,
    teamSharing: false,
    hdDownload: true,
    priceMonthly: 9900,
  },
  team: {
    // 팀 플랜 - 무제한 + 팀 공유
    dailySearches: -1,
    maxCollections: -1,
    maxSavedPoses: -1,
    aiSearch: true,
    teamSharing: true,
    hdDownload: true,
    priceMonthly: 29900,
  },
};

/**
 * 구독이 없는 유저를 위한 기본 free 구독 객체
 * bkend 연결 실패 또는 구독 미존재 시 폴백으로 사용
 */
function buildFreeSubscription(userId: string): Subscription {
  const now = new Date().toISOString();
  return {
    id: 'free-local',
    userId,
    plan: 'free',
    status: 'active',
    billingCycle: 'monthly',
    startedAt: now,
    expiresAt: null,
    canceledAt: null,
    trialEndsAt: null,
    autoRenew: false,
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================
// 구독 CRUD 함수
// ============================================

/**
 * 유저의 현재 활성 구독 조회
 * - bkend에서 userId + status=active 조건으로 조회
 * - 없으면 free 구독 객체 반환 (폴백)
 */
export async function getCurrentSubscription(userId: string): Promise<Subscription> {
  try {
    const result = await bkend.data.list<Subscription>(TABLE, {
      andFilters: JSON.stringify({
        userId: { $eq: userId },
        status: { $in: ['active', 'trial'] },
      }),
      sortBy: 'createdAt',
      sortDirection: 'desc',
      limit: '1',
    });

    // 활성 구독이 없으면 free 플랜으로 처리
    if (result.data.length === 0) {
      return buildFreeSubscription(userId);
    }

    return result.data[0];
  } catch (error) {
    // bkend 연결 실패 시 free 폴백
    console.warn('[subscription-service] 구독 조회 실패, free 플랜 폴백 사용:', error);
    return buildFreeSubscription(userId);
  }
}

/** 구독 생성 파라미터 */
export interface CreateSubscriptionData {
  userId: string;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  /** 구독 시작일 (기본: 현재 시각) */
  startedAt?: string;
  /** 구독 만료일 (기본: billingCycle에 따라 1개월/1년 후) */
  expiresAt?: string;
  /** 트라이얼 여부 (기본: false → active) */
  isTrial?: boolean;
}

/**
 * 신규 구독 생성
 * - 결제 완료 후 호출하여 bkend에 구독 레코드 저장
 * - expiresAt 미지정 시 billingCycle에 따라 자동 계산
 */
export async function createSubscription(data: CreateSubscriptionData): Promise<Subscription> {
  const now = new Date();
  const startedAt = data.startedAt ?? now.toISOString();

  // 만료일 자동 계산 (지정 없을 경우)
  let expiresAt = data.expiresAt ?? null;
  if (!expiresAt && data.plan !== 'free') {
    const expDate = new Date(startedAt);
    if (data.billingCycle === 'annual') {
      expDate.setFullYear(expDate.getFullYear() + 1);
    } else {
      expDate.setMonth(expDate.getMonth() + 1);
    }
    expiresAt = expDate.toISOString();
  }

  const status: SubscriptionStatus = data.isTrial ? 'trial' : 'active';

  const payload: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'> = {
    userId: data.userId,
    plan: data.plan,
    status,
    billingCycle: data.billingCycle,
    startedAt,
    expiresAt,
    canceledAt: null,
    trialEndsAt: data.isTrial ? expiresAt : null,
    autoRenew: true,
  };

  return bkend.data.create<Subscription>(TABLE, payload);
}

/** 구독 업데이트 파라미터 */
export type UpdateSubscriptionData = Partial<
  Pick<
    Subscription,
    | 'plan'
    | 'status'
    | 'billingCycle'
    | 'expiresAt'
    | 'canceledAt'
    | 'trialEndsAt'
    | 'autoRenew'
  >
>;

/**
 * 구독 정보 업데이트
 * - 플랜 변경, 결제 주기 변경, 만료일 갱신 등에 사용
 */
export async function updateSubscription(
  id: string,
  data: UpdateSubscriptionData
): Promise<Subscription> {
  return bkend.data.update<Subscription>(TABLE, id, data);
}

/**
 * 구독 취소
 * - status를 'canceled'로 변경하고 canceledAt 기록
 * - 즉시 해지가 아닌 만료일까지 유지 (expiresAt 유지)
 */
export async function cancelSubscription(id: string): Promise<Subscription> {
  const now = new Date().toISOString();
  return bkend.data.update<Subscription>(TABLE, id, {
    status: 'canceled',
    canceledAt: now,
    autoRenew: false,
  });
}

// ============================================
// 플랜 제한 조회 및 기능 체크
// ============================================

/**
 * 플랜별 제한 정보 조회
 * 상수에서 직접 반환 (API 호출 없음)
 */
export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return PLAN_LIMITS[plan];
}

/** checkLimit 반환 타입 */
export interface LimitCheckResult {
  /** 기능 사용 가능 여부 */
  allowed: boolean;
  /** 현재 사용량 (횟수 기반 기능의 경우) */
  current?: number;
  /** 최대 허용량 (-1이면 무제한) */
  limit: number;
  /** 불가능한 경우 안내 메시지 */
  reason?: string;
}

/**
 * 특정 기능 사용 가능 여부 확인
 * - 플랜 제한에 따라 허용/거부 결정
 * - 횟수 기반 기능(dailySearch)은 현재 사용량과 비교
 *
 * @param userId - 확인할 유저 ID
 * @param feature - 확인할 기능 키
 */
export async function checkLimit(userId: string, feature: FeatureKey): Promise<LimitCheckResult> {
  // 현재 구독 조회 (실패 시 free 폴백)
  const subscription = await getCurrentSubscription(userId);
  const limits = getPlanLimits(subscription.plan);

  switch (feature) {
    case 'dailySearch': {
      // 일일 검색 횟수 확인: bkend에서 오늘 날짜 기준 usage 조회
      const dailyLimit = limits.dailySearches;
      if (dailyLimit === -1) {
        // 무제한 플랜
        return { allowed: true, limit: -1 };
      }

      try {
        // 오늘 00:00:00 UTC 기준 검색 횟수 조회
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const usageResult = await bkend.data.list('search_logs', {
          andFilters: JSON.stringify({
            userId: { $eq: userId },
            createdAt: { $gte: todayStart.toISOString() },
          }),
          limit: '1',
          page: '1',
        });

        const current = usageResult.total;
        const allowed = current < dailyLimit;
        return {
          allowed,
          current,
          limit: dailyLimit,
          reason: allowed ? undefined : `일일 검색 한도(${dailyLimit}회)를 초과했습니다.`,
        };
      } catch {
        // usage 조회 실패 시 허용 처리 (사용자 경험 우선)
        console.warn('[subscription-service] 검색 사용량 조회 실패, 허용으로 처리');
        return { allowed: true, limit: dailyLimit };
      }
    }

    case 'createCollection': {
      // 컬렉션 개수 제한 확인
      const maxCollections = limits.maxCollections;
      if (maxCollections === -1) {
        return { allowed: true, limit: -1 };
      }

      try {
        const collectionResult = await bkend.data.list('collections', {
          andFilters: JSON.stringify({ userId: { $eq: userId } }),
          limit: '1',
          page: '1',
        });
        const current = collectionResult.total;
        const allowed = current < maxCollections;
        return {
          allowed,
          current,
          limit: maxCollections,
          reason: allowed ? undefined : `컬렉션은 최대 ${maxCollections}개까지 생성할 수 있습니다.`,
        };
      } catch {
        console.warn('[subscription-service] 컬렉션 개수 조회 실패, 허용으로 처리');
        return { allowed: true, limit: maxCollections };
      }
    }

    case 'savePose': {
      // 저장 포즈 개수 제한 확인
      const maxPoses = limits.maxSavedPoses;
      if (maxPoses === -1) {
        return { allowed: true, limit: -1 };
      }

      try {
        const poseResult = await bkend.data.list('saved_poses', {
          andFilters: JSON.stringify({ userId: { $eq: userId } }),
          limit: '1',
          page: '1',
        });
        const current = poseResult.total;
        const allowed = current < maxPoses;
        return {
          allowed,
          current,
          limit: maxPoses,
          reason: allowed ? undefined : `저장 포즈는 최대 ${maxPoses}개까지 저장할 수 있습니다.`,
        };
      } catch {
        console.warn('[subscription-service] 저장 포즈 개수 조회 실패, 허용으로 처리');
        return { allowed: true, limit: maxPoses };
      }
    }

    case 'aiSearch':
      return {
        allowed: limits.aiSearch,
        limit: limits.aiSearch ? -1 : 0,
        reason: limits.aiSearch ? undefined : 'AI 검색은 Lite 플랜 이상에서 사용할 수 있습니다.',
      };

    case 'teamSharing':
      return {
        allowed: limits.teamSharing,
        limit: limits.teamSharing ? -1 : 0,
        reason: limits.teamSharing ? undefined : '팀 공유는 Team 플랜에서 사용할 수 있습니다.',
      };

    case 'hdDownload':
      return {
        allowed: limits.hdDownload,
        limit: limits.hdDownload ? -1 : 0,
        reason: limits.hdDownload ? undefined : '고화질 다운로드는 Pro 플랜 이상에서 사용할 수 있습니다.',
      };

    default: {
      // 알 수 없는 기능 키는 허용 처리
      const _exhaustive: never = feature;
      console.warn('[subscription-service] 알 수 없는 기능 키:', _exhaustive);
      return { allowed: true, limit: -1 };
    }
  }
}
