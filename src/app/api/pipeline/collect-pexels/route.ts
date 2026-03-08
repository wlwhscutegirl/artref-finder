// ============================================
// Pexels 이미지 수집 파이프라인 API 라우트
// POST: 검색 쿼리로 Pexels에서 이미지 수집 → bkend 저장
// Unsplash 파이프라인과 동일 구조, 소스만 다름
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { searchPexelsPhotos, type PexelsPhoto } from '@/lib/pexels-client';
import { extractTagsFromDescription } from '@/lib/unsplash-tag-mapper';
import { createImage, findByUnsplashId } from '@/lib/image-service';
import type { ImageCategory, ReferenceImage } from '@/types';

/** 수집 요청 바디 */
interface CollectRequest {
  query: string;
  page?: number;
  perPage?: number;
  category?: ImageCategory;
  /** 스마트 쿼리에서 전달하는 추가 태그 (샷타입, 포즈태그 등) */
  extraTags?: string[];
}

/** 수집 결과 */
interface CollectResult {
  totalFound: number;
  saved: number;
  skipped: number;
  failed: number;
  savedIds: string[];
}

/**
 * 검색 쿼리 + alt 텍스트에서 카테고리 자동 추론
 */
function inferCategory(query: string, alt: string): ImageCategory {
  const text = `${query} ${alt}`.toLowerCase();

  if (/landscape|scenery|nature|mountain|forest|sky/.test(text)) return 'landscape';
  if (/cafe|classroom|office|interior|room|street/.test(text)) return 'environment';
  if (/object|still life|texture|material|fabric/.test(text)) return 'object';
  if (/leather|silk|denim|knit/.test(text)) return 'fabric';
  if (/anatomy|muscle|skeleton|fitness/.test(text)) return 'anatomy';
  if (/creature|monster|animal/.test(text)) return 'creature';

  return 'figure';
}

/**
 * Pexels 사진을 ReferenceImage 포맷으로 변환
 */
function pexelsPhotoToReferenceImage(
  photo: PexelsPhoto,
  tags: string[],
  category: ImageCategory
): Omit<ReferenceImage, '_id' | 'createdAt'> {
  return {
    // portrait 사이즈 (800x1200) 사용 — 인물 레퍼런스에 최적
    url: photo.src.large,
    thumbnailUrl: photo.src.medium,
    title: photo.alt || `Pexels ${photo.id}`,
    tags,
    category,
    source: 'unsplash' as const, // 타입 호환 (source 필드 확장 필요 시 추후 수정)
    unsplashId: `pexels-${photo.id}`, // Pexels 전용 prefix로 중복 방지
    safetyScore: 0,
    poseExtracted: false,
  };
}

/**
 * POST /api/pipeline/collect-pexels
 * Pexels 검색 → 태그 변환 → bkend 저장
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CollectRequest;
    const { query, page = 1, perPage = 30, category: forcedCategory, extraTags = [] } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: '검색 쿼리가 비어있습니다.' }, { status: 400 });
    }

    // 1. Pexels 검색
    const searchResult = await searchPexelsPhotos(query, page, Math.min(perPage, 80));

    const result: CollectResult = {
      totalFound: searchResult.total_results,
      saved: 0,
      skipped: 0,
      failed: 0,
      savedIds: [],
    };

    // 2. 각 사진 순차 처리 (중복 체크 포함)
    for (const photo of searchResult.photos) {
      try {
        const pexelsId = `pexels-${photo.id}`;

        // 중복 체크: 이미 DB에 있으면 스킵
        const existing = await findByUnsplashId(pexelsId);
        if (existing) {
          result.skipped++;
          continue;
        }

        // 태그 추출 (alt 텍스트에서) + 스마트 쿼리 메타데이터 병합
        const baseTags = extractTagsFromDescription(photo.alt, photo.alt);
        // extraTags에서 중복 제거 후 병합 (샷타입, 포즈태그 자동 부여)
        const tags = [...new Set([...baseTags, ...extraTags])];

        // 카테고리 결정
        const category = forcedCategory || inferCategory(query, photo.alt || '');

        // bkend에 저장
        const imageData = pexelsPhotoToReferenceImage(photo, tags, category);
        const saved = await createImage(imageData);

        result.saved++;
        result.savedIds.push(saved._id);
      } catch (err) {
        console.error(`[collect-pexels] 사진 ${photo.id} 저장 실패:`, err);
        result.failed++;
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
