// ============================================
// IntersectionObserver 기반 무한 스크롤 트리거 훅
// 반환된 ref를 감시할 요소(예: 목록 하단 sentinel)에 부착하면
// 해당 요소가 뷰포트에 진입할 때 콜백이 실행된다
// ============================================

import { useEffect, useRef, RefObject } from 'react';

/** useIntersectionObserver 훅 옵션 */
export interface UseIntersectionObserverOptions {
  /**
   * 교차 판정 기준 비율 (0.0 ~ 1.0)
   * 0이면 픽셀 하나라도 보이면 트리거, 1이면 전체가 보여야 트리거
   * @default 0.1
   */
  threshold?: number;
  /**
   * 루트 요소의 마진 (CSS margin 문법)
   * 양수면 판정 영역을 확장, 음수면 축소
   * @default '0px'
   */
  rootMargin?: string;
  /**
   * 관찰 비활성화 여부
   * isFetching 등의 조건으로 일시 중단할 때 사용
   * @default false
   */
  disabled?: boolean;
}

/**
 * IntersectionObserver 기반 무한 스크롤 트리거 훅
 *
 * @param onIntersect - 요소가 뷰포트에 진입할 때 실행할 콜백
 * @param options - threshold, rootMargin, disabled 옵션
 * @returns 감시 대상 요소에 부착할 ref
 *
 * 사용 예:
 * ```tsx
 * const sentinelRef = useIntersectionObserver(fetchNextPage, {
 *   threshold: 0.1,
 *   disabled: !hasNextPage || isFetchingNextPage,
 * });
 *
 * return (
 *   <div>
 *     {images.map(img => <ImageCard key={img._id} image={img} />)}
 *     {/* 목록 하단에 sentinel 요소 배치 *\/}
 *     <div ref={sentinelRef} aria-hidden="true" />
 *   </div>
 * );
 * ```
 */
export function useIntersectionObserver(
  onIntersect: () => void,
  options: UseIntersectionObserverOptions = {}
): RefObject<HTMLDivElement | null> {
  const { threshold = 0.1, rootMargin = '0px', disabled = false } = options;

  // 감시 대상 DOM 요소 ref
  const targetRef = useRef<HTMLDivElement | null>(null);

  // 최신 콜백을 ref에 보관하여 effect 재실행 없이 최신 함수를 호출
  const onIntersectRef = useRef(onIntersect);
  useEffect(() => {
    onIntersectRef.current = onIntersect;
  }, [onIntersect]);

  useEffect(() => {
    // 비활성화 상태면 옵저버 설정 건너뜀
    if (disabled) return;

    const target = targetRef.current;
    if (!target) return;

    // IntersectionObserver 미지원 환경 대비 (SSR 등)
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 첫 번째 엔트리가 뷰포트에 진입한 경우에만 콜백 실행
        const entry = entries[0];
        if (entry?.isIntersecting) {
          onIntersectRef.current();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(target);

    // 클린업: 컴포넌트 언마운트 또는 옵션 변경 시 옵저버 해제
    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, disabled]);

  return targetRef;
}
