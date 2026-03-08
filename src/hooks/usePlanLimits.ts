// ============================================
// 구독 플랜 제한 훅 (Phase 3 Step 3)
// 현재 사용자 플랜 → 기능 접근 권한 + 일일 카운터
// ============================================

'use client';

import { useMemo, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { STORAGE_KEYS } from '@/lib/constants';
import { checkLimit, getFeatureAccess, PLAN_CONFIGS } from '@/lib/plan-limits';
import type { LimitCheckResult } from '@/lib/plan-limits';

/** localStorage 키 (중앙 상수 참조) */
const DAILY_SEARCH_KEY = STORAGE_KEYS.DAILY_SEARCH;
const DAILY_EXTRACTION_KEY = STORAGE_KEYS.DAILY_EXTRACTION;

/** 일일 검색 카운터 데이터 구조 */
interface DailyCounter {
  date: string;    // YYYY-MM-DD
  count: number;
}

/**
 * 오늘 날짜 문자열 (YYYY-MM-DD)
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * localStorage에서 오늘의 검색 카운터 가져오기
 * 날짜가 다르면 0으로 리셋
 */
function getDailySearchCount(): number {
  if (typeof window === 'undefined') return 0;

  try {
    const raw = localStorage.getItem(DAILY_SEARCH_KEY);
    if (!raw) return 0;

    const data: DailyCounter = JSON.parse(raw);
    // 날짜가 다르면 리셋
    if (data.date !== getTodayString()) return 0;
    return data.count;
  } catch {
    return 0;
  }
}

/**
 * 일일 검색 카운터 증가
 */
function incrementDailySearch(): number {
  if (typeof window === 'undefined') return 0;

  const today = getTodayString();
  const current = getDailySearchCount();
  const newCount = current + 1;

  localStorage.setItem(
    DAILY_SEARCH_KEY,
    JSON.stringify({ date: today, count: newCount })
  );

  return newCount;
}

/**
 * 오늘의 AI 포즈 추출 카운터 가져오기
 */
function getDailyExtractionCount(): number {
  if (typeof window === 'undefined') return 0;

  try {
    const raw = localStorage.getItem(DAILY_EXTRACTION_KEY);
    if (!raw) return 0;
    const data: DailyCounter = JSON.parse(raw);
    if (data.date !== getTodayString()) return 0;
    return data.count;
  } catch {
    return 0;
  }
}

/**
 * AI 포즈 추출 카운터 증가
 */
function incrementDailyExtraction(): number {
  if (typeof window === 'undefined') return 0;

  const today = getTodayString();
  const current = getDailyExtractionCount();
  const newCount = current + 1;

  localStorage.setItem(
    DAILY_EXTRACTION_KEY,
    JSON.stringify({ date: today, count: newCount })
  );

  return newCount;
}

/** usePlanLimits 훅 반환 타입 */
interface PlanLimitsResult {
  /** 현재 사용자 플랜 */
  plan: 'free' | 'lite' | 'student' | 'pro' | 'team';
  /** 기능별 접근 권한 맵 */
  features: Record<string, boolean>;
  /** 검색 제한 체크 (검색 실행 전 호출) */
  checkSearchLimit: () => LimitCheckResult;
  /** 검색 카운터 증가 (검색 실행 후 호출) */
  recordSearch: () => number;
  /** 오늘 검색 횟수 */
  dailySearchCount: number;
  /** 플랜별 히스토리 보관 제한 수 */
  historyLimit: number;
  /** AI 포즈 추출 제한 체크 */
  checkExtractionLimit: () => LimitCheckResult;
  /** AI 포즈 추출 카운터 증가 */
  recordExtraction: () => number;
  /** 오늘 남은 추출 횟수 (-1 = 무제한) */
  remainingExtractions: number;
}

/**
 * 플랜 기능 제한 훅
 * - 현재 사용자 플랜 기반 기능 접근 권한 반환
 * - localStorage 기반 일일 검색 카운터 관리
 */
export function usePlanLimits(): PlanLimitsResult {
  const user = useAuthStore((s) => s.user);

  // 사용자 플랜 (로그인 안 했으면 free)
  const plan = (user?.plan || 'free') as 'free' | 'lite' | 'student' | 'pro' | 'team';

  // 기능 접근 권한 계산
  const features = useMemo(() => getFeatureAccess(plan), [plan]);

  // 오늘 검색 횟수
  const dailySearchCount = useMemo(() => getDailySearchCount(), []);

  // 플랜별 히스토리 보관 제한
  const historyLimit = useMemo(() => {
    const config = PLAN_CONFIGS[plan] || PLAN_CONFIGS.free;
    return config.historyLimit;
  }, [plan]);

  // 검색 제한 체크
  const checkSearchLimit = useCallback((): LimitCheckResult => {
    const count = getDailySearchCount();
    return checkLimit(plan, 'dailySearch', count);
  }, [plan]);

  // 검색 기록 (카운터 증가)
  const recordSearch = useCallback((): number => {
    return incrementDailySearch();
  }, []);

  // AI 포즈 추출 제한 체크
  const checkExtractionLimit = useCallback((): LimitCheckResult => {
    const count = getDailyExtractionCount();
    return checkLimit(plan, 'dailyExtraction', count);
  }, [plan]);

  // 추출 카운터 증가
  const recordExtraction = useCallback((): number => {
    return incrementDailyExtraction();
  }, []);

  // 남은 추출 횟수 계산
  const remainingExtractions = useMemo(() => {
    const config = PLAN_CONFIGS[plan] || PLAN_CONFIGS.free;
    if (config.dailyExtractionLimit === -1) return -1;
    const used = getDailyExtractionCount();
    return Math.max(0, config.dailyExtractionLimit - used);
  }, [plan]);

  return {
    plan,
    features,
    checkSearchLimit,
    recordSearch,
    dailySearchCount,
    historyLimit,
    checkExtractionLimit,
    recordExtraction,
    remainingExtractions,
  };
}
