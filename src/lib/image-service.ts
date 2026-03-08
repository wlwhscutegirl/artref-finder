// ============================================
// 이미지 데이터 서비스 계층
// bkend.ai 우선 조회, 실패 시 sample-data 폴백
// _id(sample-data) ↔ id(bkend) 양방향 호환 처리 포함
// ============================================

import { bkend } from '@/lib/bkend';
import { SAMPLE_IMAGES_WITH_POSES } from '@/lib/sample-data';
import { loadPexelsImages } from '@/lib/pexels-image-loader';
import type { ReferenceImage } from '@/types';

/**
 * bkend 응답 레코드를 ReferenceImage 형식으로 정규화
 * bkend는 `id` 필드를 사용하고, 앱 전체는 `_id`를 사용하므로 변환이 필요
 * - bkend 레코드: { id: "...", sourceId: "sample-001", ... }
 * - 정규화 결과: { _id: "...", ... } (bkend id를 _id로 매핑)
 */
function normalizeBkendRecord(record: ReferenceImage & { id?: string; sourceId?: string }): ReferenceImage {
  return {
    ...record,
    // bkend의 id를 _id로 매핑 (없으면 기존 _id 유지)
    _id: record._id || record.id || '',
  };
}

/** bkend 테이블명 */
const TABLE = 'images';

/** 이미지 목록 조회 파라미터 */
export interface FetchImagesParams {
  page?: number;
  limit?: number;
  category?: string;
  tags?: string[];
  /** 안전 필터 레벨: 'strict'=0.3 이하만, 'moderate'=0.6 이하만, 'off'=전체 */
  safetyLevel?: 'strict' | 'moderate' | 'off';
}

/** 이미지 목록 조회 응답 */
export interface FetchImagesResult {
  images: ReferenceImage[];
  total: number;
  page: number;
  hasNextPage: boolean;
}

/**
 * 이미지 목록 조회 (bkend 우선, 실패 시 sample-data 폴백)
 * 페이지네이션 지원 (기본 50개씩)
 */
export async function fetchImages(params: FetchImagesParams = {}): Promise<FetchImagesResult> {
  const { page = 1, limit = 50, category, tags, safetyLevel = 'off' } = params;

  try {
    // bkend REST API 호출 (공식 쿼리 파라미터 스펙)
    const queryParams: Record<string, string> = {
      page: String(page),
      limit: String(limit),
      sortBy: 'createdAt',
      sortDirection: 'desc',
    };

    // 카테고리 필터 (AND 필터)
    if (category) {
      queryParams.andFilters = JSON.stringify({ category: { $eq: category } });
    }

    // 안전 필터 (safetyScore 기준)
    if (safetyLevel === 'strict') {
      queryParams.andFilters = JSON.stringify({ ...(category ? { category: { $eq: category } } : {}), safetyScore: { $lte: 0.3 } });
    } else if (safetyLevel === 'moderate') {
      queryParams.andFilters = JSON.stringify({ ...(category ? { category: { $eq: category } } : {}), safetyScore: { $lte: 0.6 } });
    }

    const result = await bkend.data.list<ReferenceImage & { id?: string; sourceId?: string }>(TABLE, queryParams);

    // bkend 응답 레코드를 _id 기반 ReferenceImage로 정규화
    const normalized = result.data.map(normalizeBkendRecord);

    // bkend 데이터가 부족하면 sample-data 폴백으로 전환
    // (필수 필드 tags가 있는 유효한 이미지만 카운트)
    const validImages = normalized.filter((img) => img.tags && img.tags.length > 0);
    if (validImages.length === 0) {
      console.warn('[image-service] bkend에 유효한 이미지 없음, sample-data 폴백 사용');
      return await fallbackFetch(params);
    }

    // 태그 필터 (클라이언트 사이드 - bkend가 배열 필터 미지원 시)
    let filtered = validImages;
    if (tags && tags.length > 0) {
      filtered = filtered.filter((img) =>
        tags.some((tag) => img.tags?.includes(tag))
      );
    }

    return {
      images: filtered,
      total: result.total,
      page,
      hasNextPage: page * limit < result.total,
    };
  } catch {
    // bkend 실패 시 sample-data + Pexels 폴백
    console.warn('[image-service] bkend 조회 실패, sample-data + Pexels 폴백 사용');
    return await fallbackFetch(params);
  }
}

/**
 * sample-data + Pexels 실시간 폴백 조회
 * bkend 연결 불가 시 로컬 샘플 + Pexels API에서 이미지 합산 반환
 */
async function fallbackFetch(params: FetchImagesParams): Promise<FetchImagesResult> {
  const { page = 1, limit = 50, category, tags, safetyLevel = 'off' } = params;

  // 샘플 데이터 + Pexels 실시간 이미지 합산
  let images = [...SAMPLE_IMAGES_WITH_POSES];

  // Pexels에서 추가 이미지 로드 (최초 1회, 이후 캐시)
  try {
    const pexelsImages = await loadPexelsImages();
    // 중복 ID 제거하면서 합산
    const existingIds = new Set(images.map((img) => img._id));
    const newPexels = pexelsImages.filter((img) => !existingIds.has(img._id));
    images = [...images, ...newPexels];
  } catch {
    // Pexels 로드 실패 시 샘플 데이터만 사용
    console.warn('[image-service] Pexels 로드 실패, 샘플 데이터만 사용');
  }

  // 카테고리 필터
  if (category) {
    images = images.filter((img) => img.category === category);
  }

  // 태그 필터
  if (tags && tags.length > 0) {
    images = images.filter((img) =>
      tags.some((tag) => img.tags?.includes(tag))
    );
  }

  // 안전 필터 (샘플 데이터는 모두 안전하므로 점수 없으면 통과)
  if (safetyLevel !== 'off') {
    const threshold = safetyLevel === 'strict' ? 0.3 : 0.6;
    images = images.filter((img) => (img.safetyScore ?? 0) <= threshold);
  }

  // 페이지네이션
  const start = (page - 1) * limit;
  const paged = images.slice(start, start + limit);

  return {
    images: paged,
    total: images.length,
    page,
    hasNextPage: start + limit < images.length,
  };
}

/**
 * 단일 이미지 조회 (bkend 우선, 실패 시 sample-data 폴백)
 */
export async function fetchImageById(id: string): Promise<ReferenceImage | null> {
  try {
    const image = await bkend.data.get<ReferenceImage & { id?: string; sourceId?: string }>(TABLE, id);
    // bkend id → _id 정규화
    return normalizeBkendRecord(image);
  } catch {
    // 폴백: sample-data에서 _id로 찾기
    return SAMPLE_IMAGES_WITH_POSES.find((img) => img._id === id) ?? null;
  }
}

/**
 * 이미지 생성 (파이프라인 수집용)
 * bkend에 새 이미지 레코드 저장
 */
export async function createImage(data: Omit<ReferenceImage, '_id' | 'createdAt'>): Promise<ReferenceImage> {
  return bkend.data.create<ReferenceImage>(TABLE, data);
}

/**
 * 이미지 업데이트 (포즈 추출/안전 점수 업데이트용)
 */
export async function updateImage(id: string, data: Partial<ReferenceImage>): Promise<ReferenceImage> {
  return bkend.data.update<ReferenceImage>(TABLE, id, data);
}

/**
 * Unsplash ID로 이미지 조회 (중복 수집 방지)
 * 존재하면 해당 이미지 반환, 없으면 null
 */
export async function findByUnsplashId(unsplashId: string): Promise<ReferenceImage | null> {
  try {
    const result = await bkend.data.list<ReferenceImage>(TABLE, {
      andFilters: JSON.stringify({ unsplashId: { $eq: unsplashId } }),
      limit: '1',
    });
    return result.data.length > 0 ? result.data[0] : null;
  } catch {
    return null;
  }
}

/**
 * 포즈 미추출 이미지 목록 조회 (일괄 추출용)
 * poseExtracted=false인 이미지를 페이지네이션으로 조회
 */
export async function fetchUnextractedImages(page = 1, limit = 50): Promise<FetchImagesResult> {
  try {
    const result = await bkend.data.list<ReferenceImage>(TABLE, {
      andFilters: JSON.stringify({ poseExtracted: { $eq: false } }),
      page: String(page),
      limit: String(limit),
    });
    return {
      images: result.data,
      total: result.total,
      page,
      hasNextPage: page * limit < result.total,
    };
  } catch {
    // 폴백: sample-data에서 poseExtracted가 false인 항목
    const unextracted = SAMPLE_IMAGES_WITH_POSES.filter((img) => !img.poseExtracted);
    const start = (page - 1) * limit;
    return {
      images: unextracted.slice(start, start + limit),
      total: unextracted.length,
      page,
      hasNextPage: start + limit < unextracted.length,
    };
  }
}
