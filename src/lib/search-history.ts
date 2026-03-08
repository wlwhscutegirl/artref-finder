// ============================================
// 검색 히스토리 관리 (Phase 3 Step 4)
// localStorage 기반 검색 기록 저장/조회
// ============================================

import { STORAGE_KEYS } from '@/lib/constants';

/** 검색 히스토리 항목 */
export interface SearchHistoryEntry {
  /** 고유 ID */
  id: string;
  /** 검색에 사용된 태그 목록 */
  tags: string[];
  /** 카테고리 필터 */
  category?: string;
  /** 포즈 매칭 사용 여부 */
  poseMatchUsed: boolean;
  /** 검색 결과 수 */
  resultCount: number;
  /** 검색 시각 (Unix timestamp) */
  timestamp: number;
}

/** localStorage 키 (중앙 상수 참조) */
const HISTORY_KEY = STORAGE_KEYS.SEARCH_HISTORY;
/** 기본 최대 보관 항목 수 (pro/team 플랜) */
const DEFAULT_MAX_ENTRIES = 100;

/**
 * 검색 히스토리 저장
 * 플랜별 historyLimit에 따라 보관 개수 차등 적용 (FIFO)
 * @param entry 저장할 검색 항목
 * @param maxEntries 최대 보관 수 (plan-limits의 historyLimit 전달, 기본 100)
 */
export function saveSearch(entry: Omit<SearchHistoryEntry, 'id'>, maxEntries: number = DEFAULT_MAX_ENTRIES): void {
  if (typeof window === 'undefined') return;

  // 태그가 없으면 저장하지 않음 (빈 검색 방지)
  if (entry.tags.length === 0 && !entry.category) return;

  const history = getSearchHistory();

  // 고유 ID 생성
  const newEntry: SearchHistoryEntry = {
    ...entry,
    id: `search-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };

  // 맨 앞에 추가 (최신순)
  history.unshift(newEntry);

  // 플랜별 최대 개수 초과 시 오래된 것 제거
  const limit = maxEntries > 0 ? maxEntries : DEFAULT_MAX_ENTRIES;
  if (history.length > limit) {
    history.splice(limit);
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/**
 * 최근 검색 히스토리 가져오기
 * @param limit 가져올 최대 항목 수 (기본 20)
 */
export function getRecentSearches(limit: number = 20): SearchHistoryEntry[] {
  const history = getSearchHistory();
  return history.slice(0, limit);
}

/**
 * 전체 검색 히스토리 가져오기
 */
export function getSearchHistory(): SearchHistoryEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SearchHistoryEntry[];
  } catch {
    return [];
  }
}

/**
 * 검색 히스토리에서 인기 태그 추출 (Top N)
 * @param limit 가져올 태그 수 (기본 10)
 */
export function getPopularTags(limit: number = 10): Array<{ tag: string; count: number }> {
  const history = getSearchHistory();

  // 태그별 사용 횟수 집계
  const tagCounts: Record<string, number> = {};
  for (const entry of history) {
    for (const tag of entry.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  // 내림차순 정렬 후 상위 N개 반환
  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * 검색 통계 요약
 */
export function getSearchStats(): {
  totalSearches: number;
  todaySearches: number;
  uniqueTagsUsed: number;
  avgResultCount: number;
} {
  const history = getSearchHistory();
  const today = new Date().toISOString().split('T')[0];

  // 오늘 검색 수
  const todayEntries = history.filter((e) => {
    const entryDate = new Date(e.timestamp).toISOString().split('T')[0];
    return entryDate === today;
  });

  // 사용된 고유 태그 수
  const uniqueTags = new Set(history.flatMap((e) => e.tags));

  // 평균 결과 수
  const totalResults = history.reduce((sum, e) => sum + e.resultCount, 0);
  const avgResults = history.length > 0 ? Math.round(totalResults / history.length) : 0;

  return {
    totalSearches: history.length,
    todaySearches: todayEntries.length,
    uniqueTagsUsed: uniqueTags.size,
    avgResultCount: avgResults,
  };
}

/**
 * 검색 히스토리 초기화
 */
export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_KEY);
}
