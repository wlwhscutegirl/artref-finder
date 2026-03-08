// ============================================
// Unsplash 이미지 수집 파이프라인 API 라우트
// POST: 검색 쿼리로 Unsplash에서 이미지 수집 → bkend 저장
// 중복 확인 + 태그 자동 변환 + 카테고리 자동 분류
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { searchPhotos, type UnsplashPhoto } from '@/lib/unsplash-client';
import { extractAllTags } from '@/lib/unsplash-tag-mapper';
import { createImage, findByUnsplashId } from '@/lib/image-service';
import type { ImageCategory, ReferenceImage } from '@/types';

/** 수집 요청 바디 */
interface CollectRequest {
  /** Unsplash 검색 쿼리 */
  query: string;
  /** 검색 페이지 (기본: 1) */
  page?: number;
  /** 페이지당 결과 수 (기본: 30, 최대 30) */
  perPage?: number;
  /** 이미지 카테고리 (지정하지 않으면 자동 추론) */
  category?: ImageCategory;
}

/** 수집 결과 */
interface CollectResult {
  /** 총 검색 결과 수 */
  totalFound: number;
  /** 새로 저장된 이미지 수 */
  saved: number;
  /** 중복으로 건너뛴 수 */
  skipped: number;
  /** 실패한 수 */
  failed: number;
  /** 저장된 이미지 ID 목록 */
  savedIds: string[];
}

/**
 * 검색 쿼리에서 카테고리 자동 추론
 * 기본값: 'figure' (인물 레퍼런스 위주)
 */
function inferCategory(query: string, tags: string[]): ImageCategory {
  const q = query.toLowerCase();

  // 풍경/환경 키워드
  if (/landscape|scenery|nature|mountain|forest|sky/.test(q)) return 'landscape';
  if (/cafe|classroom|office|interior|room|street/.test(q)) return 'environment';

  // 오브제/소재
  if (/object|still life|texture|material|fabric/.test(q)) return 'object';
  if (tags.includes('가죽') || tags.includes('데님') || tags.includes('실크')) return 'fabric';

  // 해부학
  if (/anatomy|muscle|skeleton/.test(q)) return 'anatomy';

  // 크리처
  if (/creature|monster|animal/.test(q)) return 'creature';

  // 기본: 인물
  return 'figure';
}

/**
 * Unsplash 사진을 ReferenceImage 포맷으로 변환
 */
function photoToReferenceImage(
  photo: UnsplashPhoto,
  tags: string[],
  category: ImageCategory
): Omit<ReferenceImage, '_id' | 'createdAt'> {
  return {
    url: photo.urls.regular,
    thumbnailUrl: photo.urls.small,
    title: photo.alt_description || photo.description || `Unsplash ${photo.id}`,
    tags,
    category,
    source: 'unsplash',
    unsplashId: photo.id,
    safetyScore: 0,        // Unsplash content_filter=high 통과 → 기본 안전
    poseExtracted: false,   // 포즈 추출 미완료
    unsplashMeta: {
      description: photo.description ?? undefined,
      altDescription: photo.alt_description ?? undefined,
      exif: photo.exif as Record<string, string | number> | undefined,
      unsplashTags: photo.tags?.map((t) => t.title),
    },
  };
}

/**
 * POST /api/pipeline/collect
 * Unsplash 검색 → 태그 변환 → 중복 확인 → bkend 저장
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CollectRequest;
    const { query, page = 1, perPage = 30, category: forcedCategory } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: '검색 쿼리가 비어있습니다.' }, { status: 400 });
    }

    // 1. Unsplash 검색
    const searchResult = await searchPhotos(query, page, Math.min(perPage, 30));

    const result: CollectResult = {
      totalFound: searchResult.total,
      saved: 0,
      skipped: 0,
      failed: 0,
      savedIds: [],
    };

    // 2. 각 사진을 순차 처리 (rate limit 고려)
    for (const photo of searchResult.results) {
      try {
        // 중복 확인
        const existing = await findByUnsplashId(photo.id);
        if (existing) {
          result.skipped++;
          continue;
        }

        // 태그 변환
        const tags = extractAllTags(photo);

        // 카테고리 결정
        const category = forcedCategory || inferCategory(query, tags);

        // bkend에 저장
        const imageData = photoToReferenceImage(photo, tags, category);
        const saved = await createImage(imageData);

        result.saved++;
        result.savedIds.push(saved._id);
      } catch (err) {
        console.error(`[collect] 사진 ${photo.id} 저장 실패:`, err);
        result.failed++;
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
