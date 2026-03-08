// ============================================
// 무한 스크롤 이미지 조회 훅
// TanStack Query의 useInfiniteQuery를 활용하여
// 카테고리/태그/안전필터 조건으로 이미지를 페이지 단위로 불러온다
// ============================================

import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchImages, FetchImagesParams } from '@/lib/image-service';
import type { ReferenceImage } from '@/types';

/** useInfiniteImages 훅 파라미터 (페이지 관련 필드 제외) */
export type InfiniteImagesParams = Omit<FetchImagesParams, 'page'>;

/**
 * 무한 스크롤 이미지 조회 훅
 *
 * @param params - 카테고리, 태그, 안전필터, 페이지당 개수
 * @returns TanStack Query의 useInfiniteQuery 결과 + 평탄화된 images 배열
 *
 * 사용 예:
 * ```tsx
 * const { images, fetchNextPage, hasNextPage, isFetchingNextPage } =
 *   useInfiniteImages({ category: 'portrait', limit: 20 });
 * ```
 */
export function useInfiniteImages(params: InfiniteImagesParams = {}) {
  const { limit = 20, category, tags, safetyLevel } = params;

  const query = useInfiniteQuery({
    // 파라미터가 바뀌면 캐시 키도 변경되어 재조회
    queryKey: ['images', 'infinite', { category, tags, safetyLevel, limit }],

    // 페이지별 데이터 조회 함수
    queryFn: ({ pageParam }) =>
      fetchImages({
        page: pageParam as number,
        limit,
        category,
        tags,
        safetyLevel,
      }),

    // 첫 페이지 번호
    initialPageParam: 1,

    /**
     * 다음 페이지 파라미터 결정
     * hasNextPage가 false면 undefined를 반환해 더 이상 조회하지 않는다
     */
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasNextPage) return undefined;
      return lastPage.page + 1;
    },

    // 스테일 타임: 1분 (같은 조건으로 재조회 시 캐시 활용)
    staleTime: 1000 * 60,
  });

  /**
   * 모든 페이지의 images를 단일 배열로 평탄화
   * 컴포넌트에서 페이지 구조를 신경 쓰지 않아도 된다
   */
  const images: ReferenceImage[] = query.data?.pages.flatMap((page) => page.images) ?? [];

  return {
    ...query,
    /** 모든 페이지의 이미지를 합친 평탄화 배열 */
    images,
  };
}
