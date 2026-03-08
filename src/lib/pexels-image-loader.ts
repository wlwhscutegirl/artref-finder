// ============================================
// Pexels 실시간 이미지 로더 (클라이언트용)
// /api/pexels-search 프록시를 통해 Pexels 이미지를 가져와
// 샘플 데이터와 합쳐서 레퍼런스 풀을 확장
// 스마트 키워드 시스템으로 포즈/샷 태그 자동 매핑
// ============================================

import { extractTagsFromDescription } from '@/lib/unsplash-tag-mapper';
import { getBalancedQueries, generateSearchQuery } from '@/lib/search-keywords';
import type { SearchQuery } from '@/lib/search-keywords';
import type { ReferenceImage, ImageCategory } from '@/types';

/** Pexels 로딩 완료 여부 */
let pexelsLoaded = false;
let pexelsLoading = false;
let pexelsImages: ReferenceImage[] = [];

/** Pexels 사진 타입 (API 응답) */
interface PexelsPhotoResult {
  id: number;
  alt: string;
  src: {
    large: string;
    medium: string;
  };
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
 * Pexels 사진 → ReferenceImage 변환 (스마트 태그 병합)
 * SearchQuery 메타데이터가 있으면 샷 타입/포즈 태그를 자동 부여
 */
function pexelsToRef(
  photo: PexelsPhotoResult,
  query: string,
  searchMeta?: SearchQuery,
): ReferenceImage {
  // Unsplash 태그 매퍼로 alt 텍스트에서 한글 태그 추출
  const extractedTags = extractTagsFromDescription(photo.alt, photo.alt);
  const category = inferCategory(query, photo.alt || '');

  // SearchQuery 메타데이터가 있으면 포즈/샷 태그 병합
  let tags = extractedTags;
  if (searchMeta) {
    const mergedTags = new Set(extractedTags);

    // 샷 타입 태그 추가 (풀샷/미디엄샷/클로즈업/바스트샷)
    const SHOT_TYPES = ['풀샷', '미디엄샷', '클로즈업', '바스트샷'];
    const hasShot = extractedTags.some((t) => SHOT_TYPES.includes(t));
    if (!hasShot && searchMeta.shotType) {
      mergedTags.add(searchMeta.shotType);
    }

    // 포즈 메타 태그 추가 (기존 태그와 중복 방지)
    for (const poseTag of searchMeta.poseTags) {
      mergedTags.add(poseTag);
    }

    tags = [...mergedTags];
  }

  return {
    _id: `pexels-${photo.id}`,
    url: photo.src.large,
    thumbnailUrl: photo.src.medium,
    title: photo.alt || `Pexels ${photo.id}`,
    tags,
    category,
    source: 'unsplash' as const,
    unsplashId: `pexels-${photo.id}`,
    safetyScore: 0,
    poseExtracted: false,
    createdAt: new Date().toISOString(),
  };
}

/**
 * 아티스트 레퍼런스로 부적절한 이미지 필터링
 * 텍스트 이미지, 상품 사진, 클로즈업 부위 등 제외
 */
function isValidReference(photo: PexelsPhotoResult): boolean {
  const alt = (photo.alt || '').toLowerCase();

  // 제외 키워드: 텍스트/타이포그래피, 상품, 음식, 동물(단독), 추상
  const excludePatterns = [
    /\b(text|quote|typography|font|letter|word|sign|logo|banner|poster|flyer)\b/,
    /\b(product|shoe|sneaker|boot|sandal|heel|footwear|watch|jewelry|ring|necklace)\b/,
    /\b(food|meal|dish|coffee|tea|cake|pizza|burger|fruit|vegetable|cooking)\b/,
    /\b(cat|dog|bird|fish|pet|puppy|kitten)\b/,
    /\b(abstract|pattern|texture|wallpaper|background|gradient|geometric)\b/,
    /\b(laptop|phone|computer|screen|monitor|keyboard|desk|office supplies)\b/,
    /\b(car|vehicle|motorcycle|bicycle|bike|truck)\b/,
    /\b(flower|plant|tree|leaf|garden|nature|landscape|mountain|ocean|sunset)\b/,
  ];

  // alt가 비어있으면 통과 (판단 불가)
  if (!alt) return true;

  return !excludePatterns.some((p) => p.test(alt));
}

/**
 * /api/pexels-search 프록시를 통해 Pexels 검색
 * 브라우저에서 Pexels API 직접 호출 불가 (CORS) → Next.js 프록시 사용
 */
async function fetchFromProxy(query: string, perPage = 15): Promise<PexelsPhotoResult[]> {
  try {
    const params = new URLSearchParams({ query, page: '1', perPage: String(perPage) });
    const res = await fetch(`/api/pexels-search?${params}`);

    if (!res.ok) return [];

    const data = await res.json();
    return data.photos || [];
  } catch {
    return [];
  }
}

/**
 * Pexels에서 레퍼런스 이미지 대량 로드 (최초 1회)
 * 카테고리별 균형 잡힌 스마트 쿼리 8개 × 15장 = 최대 120장
 * 이후 캐시에서 즉시 반환
 */
export async function loadPexelsImages(): Promise<ReferenceImage[]> {
  // 이미 로드 완료
  if (pexelsLoaded) return pexelsImages;

  // 로딩 중 (중복 요청 방지)
  if (pexelsLoading) {
    while (pexelsLoading) {
      await new Promise((r) => setTimeout(r, 200));
    }
    return pexelsImages;
  }

  // 서버 사이드에서는 실행 안 함 (브라우저 전용)
  if (typeof window === 'undefined') {
    pexelsLoaded = true;
    return [];
  }

  pexelsLoading = true;

  try {
    const allImages: ReferenceImage[] = [];
    const seenIds = new Set<string>();

    // 스마트 키워드: 카테고리별 균형 잡힌 20개 쿼리 (이미지 풀 확장)
    const smartQueries = getBalancedQueries(20);

    // 20개 쿼리 병렬 실행 (SearchQuery 메타데이터 포함, 쿼리당 30장)
    const queryResults = await Promise.allSettled(
      smartQueries.map((sq) => fetchFromProxy(sq.query, 30).then((photos) => ({ photos, sq })))
    );

    for (const result of queryResults) {
      if (result.status !== 'fulfilled') continue;
      const { photos, sq: searchQuery } = result.value;

      for (const photo of photos) {
        const id = `pexels-${photo.id}`;
        if (seenIds.has(id)) continue;
        // 아티스트 레퍼런스로 부적절한 이미지 제외
        if (!isValidReference(photo)) continue;
        seenIds.add(id);

        // 스마트 태그 병합: Pexels alt에서 추출한 태그 + SearchQuery 메타 태그
        allImages.push(pexelsToRef(photo, searchQuery.query, searchQuery));
      }
    }  // queryResults loop end

    pexelsImages = allImages;
    pexelsLoaded = true;
    pexelsLoading = false;

    console.log(`[PexelsLoader] 스마트 쿼리로 ${allImages.length}장 로드 완료`);
    return allImages;
  } catch (err) {
    console.error('[PexelsLoader] 로드 실패:', err);
    pexelsLoaded = true;
    pexelsLoading = false;
    return [];
  }
}

/**
 * 특정 태그 조합에 맞는 Pexels 이미지 검색 (온디맨드)
 * usePoseSearch 등에서 태그 기반 추가 검색 시 사용 가능
 *
 * @param tags - 검색할 한글 태그 배열
 * @param perQuery - 쿼리당 가져올 이미지 수 (기본 10)
 * @returns 태그에 맞는 ReferenceImage 배열
 */
export async function searchPexelsByTags(
  tags: string[],
  perQuery = 10,
): Promise<ReferenceImage[]> {
  // 서버 사이드 차단
  if (typeof window === 'undefined') return [];

  // 태그에서 최적의 검색 쿼리 생성
  const searchQueries = generateSearchQuery(tags);
  const results: ReferenceImage[] = [];
  const seenIds = new Set<string>();

  // 생성된 쿼리로 검색 (최대 4개 쿼리)
  for (const sq of searchQueries.slice(0, 4)) {
    const photos = await fetchFromProxy(sq.query, perQuery);

    for (const photo of photos) {
      const id = `pexels-${photo.id}`;
      if (seenIds.has(id)) continue;
      if (!isValidReference(photo)) continue;
      seenIds.add(id);

      results.push(pexelsToRef(photo, sq.query, sq));
    }
  }

  return results;
}

/**
 * Pexels 로드 상태 확인
 */
export function isPexelsReady(): boolean {
  return pexelsLoaded;
}
