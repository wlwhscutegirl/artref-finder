// ============================================
// 검색 히스토리 훅 (Phase 3 Step 4)
// 최근 검색, 인기 태그, 사용 통계 제공
// ============================================

'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  saveSearch,
  getRecentSearches,
  getPopularTags,
  getSearchStats,
  clearSearchHistory,
} from '@/lib/search-history';
import type { SearchHistoryEntry } from '@/lib/search-history';

/** useSearchHistory 훅 반환 타입 */
interface SearchHistoryResult {
  /** 최근 검색 목록 */
  recentSearches: SearchHistoryEntry[];
  /** 인기 태그 Top 10 */
  popularTags: Array<{ tag: string; count: number }>;
  /** 검색 통계 */
  stats: {
    totalSearches: number;
    todaySearches: number;
    uniqueTagsUsed: number;
    avgResultCount: number;
  };
  /** 검색 기록 추가 (historyLimit: 플랜별 보관 제한) */
  addSearch: (entry: Omit<SearchHistoryEntry, 'id'>, historyLimit?: number) => void;
  /** 히스토리 초기화 */
  clearHistory: () => void;
  /** 데이터 새로고침 */
  refresh: () => void;
}

/**
 * 검색 히스토리 훅
 * - 최근 검색 목록
 * - 인기 태그 Top 10
 * - 사용 통계
 */
export function useSearchHistory(): SearchHistoryResult {
  // 데이터 리프레시 트리거 (상태 변경 시 리렌더링 유도)
  const [refreshKey, setRefreshKey] = useState(0);

  // 최근 검색 (20개)
  const recentSearches = useMemo(
    () => getRecentSearches(20),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey]
  );

  // 인기 태그 Top 10
  const popularTags = useMemo(
    () => getPopularTags(10),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey]
  );

  // 검색 통계
  const stats = useMemo(
    () => getSearchStats(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey]
  );

  // 검색 기록 추가 (플랜별 historyLimit 전달)
  const addSearch = useCallback((entry: Omit<SearchHistoryEntry, 'id'>, historyLimit?: number) => {
    saveSearch(entry, historyLimit);
    setRefreshKey((k) => k + 1);
  }, []);

  // 히스토리 초기화
  const clearHistoryHandler = useCallback(() => {
    clearSearchHistory();
    setRefreshKey((k) => k + 1);
  }, []);

  // 수동 리프레시
  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    recentSearches,
    popularTags,
    stats,
    addSearch,
    clearHistory: clearHistoryHandler,
    refresh,
  };
}
