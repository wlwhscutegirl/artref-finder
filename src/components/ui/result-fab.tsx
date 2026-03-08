'use client';

import { useEffect, useRef, useState } from 'react';

/** 결과 보기 플로팅 버튼 props */
interface ResultFabProps {
  /** 검색 결과 개수 */
  resultCount: number;
  /** 클릭 핸들러 (결과 화면으로 이동) */
  onClick: () => void;
  /** 로딩 중 여부 */
  isLoading?: boolean;
}

/**
 * 결과 보기 플로팅 버튼 (FAB)
 * - 화면 하단 고정, 좌우 mx-4
 * - 56px 높이, rounded-2xl, bg-orange-600
 * - resultCount 변경 시 숫자 scale bounce 애니메이션
 * - 로딩 중이면 "찾는 중..." 텍스트 + 스피너
 */
export function ResultFab({ resultCount, onClick, isLoading = false }: ResultFabProps) {
  /** 숫자 bounce 애니메이션 상태 */
  const [isBouncing, setIsBouncing] = useState(false);
  const prevCountRef = useRef(resultCount);

  /** resultCount 변경 감지 → bounce 트리거 */
  useEffect(() => {
    if (prevCountRef.current !== resultCount && resultCount > 0) {
      setIsBouncing(true);
      // 150ms 후 bounce 해제
      const timer = setTimeout(() => setIsBouncing(false), 150);
      prevCountRef.current = resultCount;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = resultCount;
  }, [resultCount]);

  return (
    /* 하단 고정 컨테이너 */
    <div className="fixed bottom-6 left-4 right-4 z-40">
      <button
        onClick={onClick}
        disabled={isLoading && resultCount === 0}
        className={`
          w-full h-14 rounded-2xl
          bg-orange-600 hover:bg-orange-500 active:bg-orange-700
          text-white font-medium text-base
          shadow-lg
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-orange-500/50
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-1
        `}
        aria-live="polite"
        aria-label={
          isLoading
            ? '레퍼런스 찾는 중'
            : `레퍼런스 보기 ${resultCount}개`
        }
      >
        {isLoading ? (
          <>
            {/* 로딩 스피너 */}
            <svg
              className="animate-spin h-5 w-5 text-white mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>찾는 중...</span>
          </>
        ) : (
          <>
            <span>레퍼런스 보기</span>
            <span className="mx-1 text-white/60">·</span>
            {/* 결과 수 — bounce 애니메이션 */}
            <span
              className={`
                inline-block transition-transform duration-150
                ${isBouncing ? 'scale-125' : 'scale-100'}
              `}
            >
              {resultCount}개
            </span>
          </>
        )}
      </button>
    </div>
  );
}
