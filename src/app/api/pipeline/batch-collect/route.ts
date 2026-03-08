// ============================================
// 자동 배치 수집 API
// 추천 검색 쿼리 × 여러 페이지를 자동 순회
// Unsplash + Pexels 병행 수집
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { POSE_SEARCH_QUERIES, type SearchQuery } from '@/lib/search-keywords';

/** 배치 수집 요청 바디 */
interface BatchCollectRequest {
  /** 수집 소스: unsplash, pexels, 또는 both (기본: pexels) */
  source?: 'unsplash' | 'pexels' | 'both';
  /** 쿼리당 페이지 수 (기본: 3) */
  pagesPerQuery?: number;
  /** 커스텀 쿼리 목록 (지정 안 하면 스마트 쿼리 사용) */
  queries?: string[];
  /** 카테고리 강제 지정 (자동 추론 안 쓸 때) */
  category?: string;
  /** 수집 카테고리 필터 (standing, sitting 등 — 전체: 생략) */
  poseCategory?: string;
}

/** 배치 수집 결과 */
interface BatchResult {
  /** 총 수집 요청 수 */
  totalRequests: number;
  /** Unsplash 결과 */
  unsplash: { saved: number; skipped: number; failed: number };
  /** Pexels 결과 */
  pexels: { saved: number; skipped: number; failed: number };
  /** 총 새로 저장된 이미지 수 */
  totalSaved: number;
  /** 처리 시간 (ms) */
  duration: number;
}

/**
 * search-keywords.ts의 56개 스마트 쿼리에서 검색어 목록 생성
 * 각 쿼리에 샷타입/포즈태그 메타데이터가 포함되어 있어 자동 태깅에 활용
 */
function getSmartQueries(poseCategory?: string): SearchQuery[] {
  if (poseCategory && poseCategory in POSE_SEARCH_QUERIES) {
    // 특정 카테고리만 수집
    return POSE_SEARCH_QUERIES[poseCategory];
  }
  // 전체 카테고리의 모든 쿼리 (56개)
  return Object.values(POSE_SEARCH_QUERIES).flat();
}

/**
 * POST /api/pipeline/batch-collect
 * 여러 쿼리 × 여러 페이지를 자동 순회하며 대량 수집
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = (await request.json()) as BatchCollectRequest;
    const {
      source = 'pexels',
      pagesPerQuery = 3,
      queries: customQueries,
      category,
      poseCategory,
    } = body;

    // 스마트 쿼리 또는 커스텀 쿼리 사용
    const smartQueries = customQueries
      ? customQueries.map((q) => ({ query: q, shotType: '', poseTags: [] as string[] }))
      : getSmartQueries(poseCategory);

    const result: BatchResult = {
      totalRequests: 0,
      unsplash: { saved: 0, skipped: 0, failed: 0 },
      pexels: { saved: 0, skipped: 0, failed: 0 },
      totalSaved: 0,
      duration: 0,
    };

    const baseUrl = request.nextUrl.origin;

    // 각 스마트 쿼리 × 각 페이지를 순차 처리 (rate limit 고려)
    for (const sq of smartQueries) {
      for (let page = 1; page <= pagesPerQuery; page++) {
        // Unsplash 수집
        if (source === 'unsplash' || source === 'both') {
          try {
            const res = await fetch(`${baseUrl}/api/pipeline/collect`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: sq.query,
                page,
                perPage: 30,
                ...(category && { category }),
              }),
            });

            if (res.ok) {
              const data = await res.json();
              result.unsplash.saved += data.saved || 0;
              result.unsplash.skipped += data.skipped || 0;
              result.unsplash.failed += data.failed || 0;
            } else {
              result.unsplash.failed++;
            }
            result.totalRequests++;
          } catch {
            result.unsplash.failed++;
            result.totalRequests++;
          }
        }

        // Pexels 수집 (스마트 쿼리 메타데이터 전달 — 샷타입/포즈태그 자동 부여)
        if (source === 'pexels' || source === 'both') {
          try {
            const res = await fetch(`${baseUrl}/api/pipeline/collect-pexels`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: sq.query,
                page,
                perPage: 30,
                ...(category && { category }),
                // 스마트 쿼리 메타데이터: collect-pexels에서 태그에 병합
                extraTags: [...(sq.shotType ? [sq.shotType] : []), ...sq.poseTags],
              }),
            });

            if (res.ok) {
              const data = await res.json();
              result.pexels.saved += data.saved || 0;
              result.pexels.skipped += data.skipped || 0;
              result.pexels.failed += data.failed || 0;
            } else {
              result.pexels.failed++;
            }
            result.totalRequests++;
          } catch {
            result.pexels.failed++;
            result.totalRequests++;
          }
        }

        // API rate limit 방지: 요청 간 200ms 대기
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    result.totalSaved = result.unsplash.saved + result.pexels.saved;
    result.duration = Date.now() - startTime;

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
