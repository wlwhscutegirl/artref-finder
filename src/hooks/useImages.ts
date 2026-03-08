// ============================================
// TanStack Query 기반 이미지 조회 훅
// useInfiniteQuery로 50개씩 페이지네이션
// bkend 실패 시 sample-data 자동 폴백
// ============================================

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { fetchImages, fetchImageById, type FetchImagesParams } from '@/lib/image-service';
import type { ReferenceImage } from '@/types';

/** useImages 훅 파라미터 */
export interface UseImagesParams {
  category?: string;
  tags?: string[];
  safetyLevel?: 'strict' | 'moderate' | 'off';
  /** 페이지당 이미지 수 (기본: 50) */
  limit?: number;
  /** 쿼리 활성화 여부 (기본: true) */
  enabled?: boolean;
}

/**
 * 이미지 무한 스크롤 훅
 * useInfiniteQuery 기반, 50개씩 자동 페이지네이션
 * staleTime 5분으로 불필요한 재요청 방지
 */
export function useImages(params: UseImagesParams = {}) {
  const { category, tags, safetyLevel = 'off', limit = 50, enabled = true } = params;

  const query = useInfiniteQuery({
    queryKey: ['images', { category, tags, safetyLevel, limit }],
    queryFn: async ({ pageParam = 1 }) => {
      const fetchParams: FetchImagesParams = {
        page: pageParam,
        limit,
        category,
        tags,
        safetyLevel,
      };
      return fetchImages(fetchParams);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // 다음 페이지가 있으면 페이지 번호 반환, 없으면 undefined
      return lastPage.hasNextPage ? lastPage.page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5분
    enabled,
  });

  // 전체 이미지 목록 (모든 페이지 합산)
  const allImages: ReferenceImage[] = query.data?.pages.flatMap((page) => page.images) ?? [];

  // 전체 이미지 수
  const total = query.data?.pages[0]?.total ?? 0;

  return {
    /** 현재까지 로드된 전체 이미지 목록 */
    images: allImages,
    /** 전체 이미지 수 */
    total,
    /** 초기 로딩 중 */
    isLoading: query.isLoading,
    /** 추가 페이지 로딩 중 */
    isFetchingNextPage: query.isFetchingNextPage,
    /** 다음 페이지 존재 여부 */
    hasNextPage: query.hasNextPage ?? false,
    /** 다음 페이지 로드 */
    fetchNextPage: query.fetchNextPage,
    /** 에러 */
    error: query.error,
    /** 새로고침 */
    refetch: query.refetch,
  };
}

/**
 * 단일 이미지 조회 훅
 * 컬렉션 상세 등에서 이미지 ID로 개별 조회할 때 사용
 */
export function useImageById(id: string | null) {
  return useQuery({
    queryKey: ['image', id],
    queryFn: () => fetchImageById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
