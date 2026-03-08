// ============================================
// Unsplash API 클라이언트
// 무료 플랜 rate limit: 50 req/hour
// content_filter=high로 안전한 이미지만 수집
// ============================================

/** Unsplash API 기본 URL */
const UNSPLASH_API = 'https://api.unsplash.com';

/** Unsplash Access Key (환경 변수) */
const ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '';

/** Unsplash 검색 결과 사진 항목 */
export interface UnsplashPhoto {
  id: string;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;  // 1080px
    small: string;     // 400px
    thumb: string;     // 200px
  };
  width: number;
  height: number;
  /** Unsplash 태그 */
  tags?: { title: string }[];
  /** EXIF 데이터 */
  exif?: {
    make?: string;
    model?: string;
    exposure_time?: string;
    aperture?: string;
    focal_length?: string;
    iso?: number;
  };
  /** 사진 통계 */
  likes: number;
  user: {
    name: string;
    username: string;
  };
}

/** 검색 응답 */
export interface UnsplashSearchResult {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

/** Rate limit 상태 추적 */
interface RateLimitState {
  /** 남은 요청 수 */
  remaining: number;
  /** 전체 제한 */
  limit: number;
  /** 리셋 시각 (Unix timestamp) */
  resetAt: number;
}

/** 현재 rate limit 상태 */
let rateLimitState: RateLimitState = {
  remaining: 50,
  limit: 50,
  resetAt: 0,
};

/**
 * Rate limit 상태 조회
 */
export function getRateLimitState(): RateLimitState {
  return { ...rateLimitState };
}

/**
 * Rate limit 대기 시간 계산 (ms)
 * 남은 요청이 0이면 리셋까지 대기 시간 반환
 */
export function getRateLimitWaitTime(): number {
  if (rateLimitState.remaining > 0) return 0;
  const now = Date.now() / 1000;
  const wait = Math.max(0, rateLimitState.resetAt - now);
  return Math.ceil(wait * 1000);
}

/**
 * Unsplash API 요청 공통 함수
 * rate limit 헤더를 자동 추적
 */
async function unsplashFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  if (!ACCESS_KEY) {
    throw new Error('NEXT_PUBLIC_UNSPLASH_ACCESS_KEY 환경 변수가 설정되지 않았습니다.');
  }

  // Rate limit 체크
  if (rateLimitState.remaining <= 0) {
    const waitMs = getRateLimitWaitTime();
    if (waitMs > 0) {
      throw new Error(`Rate limit 초과. ${Math.ceil(waitMs / 1000)}초 후 재시도하세요.`);
    }
  }

  const url = new URL(`${UNSPLASH_API}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Client-ID ${ACCESS_KEY}`,
    },
  });

  // Rate limit 헤더 추적
  const remaining = res.headers.get('X-Ratelimit-Remaining');
  const limit = res.headers.get('X-Ratelimit-Limit');
  if (remaining !== null) rateLimitState.remaining = parseInt(remaining, 10);
  if (limit !== null) rateLimitState.limit = parseInt(limit, 10);

  // 리셋 시간 추정 (1시간 후)
  if (rateLimitState.remaining <= 0) {
    rateLimitState.resetAt = Date.now() / 1000 + 3600;
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Unsplash API 오류 (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * Unsplash 사진 검색
 * content_filter=high로 안전한 이미지만 반환
 */
export async function searchPhotos(
  query: string,
  page = 1,
  perPage = 30
): Promise<UnsplashSearchResult> {
  return unsplashFetch<UnsplashSearchResult>('/search/photos', {
    query,
    page: String(page),
    per_page: String(perPage),
    content_filter: 'high',     // 안전 필터 (NSFW 1차 차단)
    orientation: 'portrait',     // 인물 레퍼런스는 세로가 많음
  });
}

/**
 * 사진 상세 조회 (EXIF 포함)
 */
export async function getPhoto(id: string): Promise<UnsplashPhoto> {
  return unsplashFetch<UnsplashPhoto>(`/photos/${id}`);
}

/** 추천 검색 쿼리 목록 (인물/포즈 레퍼런스용) */
export const RECOMMENDED_QUERIES = [
  'person portrait',
  'pose model',
  'dance',
  'sports action',
  'sitting person',
  'hand close up',
  'face expression',
  'fashion model',
  'yoga pose',
  'martial arts',
  'running athlete',
  'ballet dancer',
  'street photography portrait',
  'studio portrait lighting',
  'dramatic lighting portrait',
] as const;
