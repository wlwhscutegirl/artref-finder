'use client';

/** 빈 상태 유형 */
type EmptyStateType = 'no-results' | 'no-pose' | 'loading';

/** 빈 상태 안내 컴포넌트 props */
interface EmptyStateProps {
  /** 표시할 상태 유형 */
  type: EmptyStateType;
  /** 액션 버튼 클릭 핸들러 (no-results에서 "프리셋 골라보기") */
  onAction?: () => void;
}

/**
 * 빈 상태 안내 컴포넌트 — Toss 스타일
 * - no-results: 검색 결과 없음 안내 + CTA 버튼
 * - no-pose: 포즈 미설정 안내
 * - loading: 스켈레톤 카드 6개 (2열 x 3행) shimmer 애니메이션
 */
export function EmptyState({ type, onAction }: EmptyStateProps) {
  /* 로딩 상태 — 스켈레톤 그리드 */
  if (type === 'loading') {
    return (
      <div className="grid grid-cols-2 gap-3 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          /* 개별 스켈레톤 카드 — shimmer 애니메이션 */
          <div
            key={i}
            className="relative aspect-[3/4] rounded-xl bg-gray-100 overflow-hidden"
          >
            {/* shimmer 효과 — 좌→우 그라디언트 이동 */}
            <div
              className="
                absolute inset-0
                bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100
                animate-shimmer
              "
              style={{
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s ease-in-out infinite',
              }}
            />
          </div>
        ))}

        {/* shimmer 키프레임 — 글로벌 스타일로 정의 */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        ` }} />
      </div>
    );
  }

  /* no-results / no-pose 공통 레이아웃 */
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      {/* 아이콘 영역 */}
      <div className="mb-6">
        {type === 'no-results' ? (
          /* 돋보기 아이콘 — 검색 결과 없음 */
          <svg
            className="w-12 h-12 text-gray-300"
            fill="none"
            viewBox="0 0 48 48"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <circle cx="20" cy="20" r="14" />
            <line x1="30" y1="30" x2="42" y2="42" strokeLinecap="round" />
          </svg>
        ) : (
          /* 마네킹 아이콘 — 포즈 미설정 */
          <svg
            className="w-12 h-12 text-gray-300"
            fill="none"
            viewBox="0 0 48 48"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            {/* 머리 */}
            <circle cx="24" cy="10" r="6" />
            {/* 몸통 */}
            <line x1="24" y1="16" x2="24" y2="32" strokeLinecap="round" />
            {/* 팔 */}
            <line x1="14" y1="22" x2="34" y2="22" strokeLinecap="round" />
            {/* 다리 */}
            <line x1="24" y1="32" x2="16" y2="44" strokeLinecap="round" />
            <line x1="24" y1="32" x2="32" y2="44" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* 제목 */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {type === 'no-results'
          ? '찾는 포즈가 없어요'
          : '마네킹 포즈를 먼저 잡아보세요'}
      </h3>

      {/* 부가 설명 */}
      <p className="text-sm text-gray-500 mb-6 leading-relaxed">
        {type === 'no-results'
          ? '프리셋을 바꾸거나 태그를 줄여볼까요?'
          : '관절을 드래그하거나 프리셋을 골라보세요'}
      </p>

      {/* 액션 버튼 — no-results에서만 표시 */}
      {type === 'no-results' && onAction && (
        <button
          onClick={onAction}
          className="
            px-6 py-3 rounded-xl
            bg-orange-50 text-orange-700 font-medium text-sm
            hover:bg-orange-100 active:bg-orange-200
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-orange-500/50
            min-h-[48px]
          "
        >
          프리셋 골라보기
        </button>
      )}
    </div>
  );
}
