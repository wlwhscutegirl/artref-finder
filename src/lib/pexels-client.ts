// ============================================
// Pexels API 클라이언트
// 무료 플랜: 200 req/hour, 월 20,000 req
// 인물/포즈 레퍼런스 수집용 두 번째 소스
// ============================================

/** Pexels API 기본 URL */
const PEXELS_API = 'https://api.pexels.com/v1';

/** Pexels API 키 (환경 변수) */
const API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY || '';

/** Pexels 검색 결과 사진 항목 */
export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  alt: string;
  src: {
    original: string;
    large2x: string;  // ~1880px
    large: string;     // ~940px
    medium: string;    // ~350px
    small: string;     // ~130px
    portrait: string;  // 800x1200
    landscape: string; // 1200x627
    tiny: string;      // 280x200
  };
  avg_color: string;
}

/** 검색 응답 */
export interface PexelsSearchResult {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

/** Rate limit 상태 추적 */
interface RateLimitState {
  remaining: number;
  limit: number;
  resetAt: number;
}

let rateLimitState: RateLimitState = {
  remaining: 200,
  limit: 200,
  resetAt: 0,
};

/** Rate limit 상태 조회 */
export function getPexelsRateLimitState(): RateLimitState {
  return { ...rateLimitState };
}

/**
 * Pexels API 요청 공통 함수
 * rate limit 헤더 자동 추적
 */
async function pexelsFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  if (!API_KEY) {
    throw new Error('NEXT_PUBLIC_PEXELS_API_KEY 환경 변수가 설정되지 않았습니다.');
  }

  // Rate limit 체크
  if (rateLimitState.remaining <= 0) {
    const now = Date.now() / 1000;
    const wait = Math.max(0, rateLimitState.resetAt - now);
    if (wait > 0) {
      throw new Error(`Pexels Rate limit 초과. ${Math.ceil(wait)}초 후 재시도하세요.`);
    }
  }

  const url = new URL(`${PEXELS_API}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: API_KEY,
    },
  });

  // Rate limit 헤더 추적
  const remaining = res.headers.get('X-Ratelimit-Remaining');
  const limit = res.headers.get('X-Ratelimit-Limit');
  if (remaining !== null) rateLimitState.remaining = parseInt(remaining, 10);
  if (limit !== null) rateLimitState.limit = parseInt(limit, 10);
  if (rateLimitState.remaining <= 0) {
    rateLimitState.resetAt = Date.now() / 1000 + 3600;
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Pexels API 오류 (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * Pexels 사진 검색
 * orientation=portrait로 인물 레퍼런스에 적합한 세로 사진 검색
 */
export async function searchPexelsPhotos(
  query: string,
  page = 1,
  perPage = 30
): Promise<PexelsSearchResult> {
  return pexelsFetch<PexelsSearchResult>('/search', {
    query,
    page: String(page),
    per_page: String(Math.min(perPage, 80)),
    orientation: 'portrait',
  });
}

/**
 * Pexels 사진 → ReferenceImage 변환용 데이터 추출
 * Pexels는 태그 API가 없으므로 alt 텍스트에서 태그 추출
 */
export function extractPexelsTags(photo: PexelsPhoto): string[] {
  // alt 텍스트에서 단어 분리
  const words = (photo.alt || '').toLowerCase().split(/\s+/);
  return words;
}

/** 추천 검색 쿼리 (Pexels용, 인물/포즈 중심) */
export const PEXELS_RECOMMENDED_QUERIES = [
  'person portrait studio',
  'model pose fashion',
  'dancer ballet',
  'athlete action sport',
  'sitting person casual',
  'hand gesture close up',
  'face expression emotion',
  'yoga stretching',
  'martial arts fighter',
  'running jogging',
  'couple embrace',
  'dramatic lighting portrait',
  'full body standing',
  'muscle anatomy fitness',
  'street photography people',
] as const;
