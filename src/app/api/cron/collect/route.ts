// ============================================
// 자동 이미지 수집 크론 라우트
// Vercel Cron: 매시간 실행 → Pexels에서 이미지 수집 → bkend DB 저장
// Pexels 무료: 200 req/hr → 쿼리당 1페이지씩 56쿼리 = 56 req (안전 마진)
// 매시간 다른 페이지를 돌려서 점진적으로 이미지 풀 확장
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { POSE_SEARCH_QUERIES, type SearchQuery } from '@/lib/search-keywords';
import { searchPexelsPhotos } from '@/lib/pexels-client';
import { extractTagsFromDescription } from '@/lib/unsplash-tag-mapper';
import { createImage, findByUnsplashId } from '@/lib/image-service';
import type { ImageCategory } from '@/types';

/** 크론 시크릿 (Vercel 환경변수로 설정, 외부 호출 방지) */
const CRON_SECRET = process.env.CRON_SECRET || '';

/** 카테고리 자동 추론 */
function inferCategory(query: string, alt: string): ImageCategory {
  const text = `${query} ${alt}`.toLowerCase();
  if (/landscape|scenery|nature|mountain|forest|sky/.test(text)) return 'landscape';
  if (/cafe|classroom|office|interior|room|street/.test(text)) return 'environment';
  if (/object|still life|texture|material|fabric/.test(text)) return 'object';
  if (/anatomy|muscle|skeleton|fitness/.test(text)) return 'anatomy';
  return 'figure';
}

/** 전체 스마트 쿼리 목록 (56개) */
function getAllQueries(): SearchQuery[] {
  return Object.values(POSE_SEARCH_QUERIES).flat();
}

/**
 * GET /api/cron/collect
 * Vercel Cron이 매시간 호출
 * 현재 시각 기반으로 페이지 번호를 결정해서 매번 다른 결과 수집
 */
export async function GET(request: NextRequest) {
  // 크론 시크릿 검증 (설정되어 있으면 체크, 없으면 통과)
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }
  }

  const startTime = Date.now();

  // 현재 시각으로 페이지 번호 결정 (매시간 다른 페이지 수집)
  const hour = new Date().getHours();
  const day = new Date().getDate();
  const page = ((day - 1) * 24 + hour) % 10 + 1; // 1~10 순환

  const queries = getAllQueries();
  let saved = 0;
  let skipped = 0;
  let failed = 0;

  for (const sq of queries) {
    try {
      // Pexels 검색 (쿼리당 30장)
      const searchResult = await searchPexelsPhotos(sq.query, page, 30);

      for (const photo of searchResult.photos) {
        try {
          const pexelsId = `pexels-${photo.id}`;

          // 중복 체크
          const existing = await findByUnsplashId(pexelsId);
          if (existing) {
            skipped++;
            continue;
          }

          // 태그 추출 + 메타데이터 병합
          const baseTags = extractTagsFromDescription(photo.alt, photo.alt);
          const tags = [...new Set([...baseTags, ...(sq.shotType ? [sq.shotType] : []), ...sq.poseTags])];
          const category = inferCategory(sq.query, photo.alt || '');

          // DB 저장
          await createImage({
            url: photo.src.large,
            thumbnailUrl: photo.src.medium,
            title: photo.alt || `Pexels ${photo.id}`,
            tags,
            category,
            source: 'unsplash' as const,
            unsplashId: pexelsId,
            safetyScore: 0,
            poseExtracted: false,
          });

          saved++;
        } catch {
          failed++;
        }
      }

      // rate limit 방지: 요청 간 100ms 대기
      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      console.error(`[cron/collect] 쿼리 "${sq.query}" 실패:`, err);
      failed++;
    }
  }

  const duration = Date.now() - startTime;

  console.log(`[cron/collect] 완료: page=${page}, saved=${saved}, skipped=${skipped}, failed=${failed}, ${duration}ms`);

  return NextResponse.json({
    page,
    queries: queries.length,
    saved,
    skipped,
    failed,
    duration,
  });
}
