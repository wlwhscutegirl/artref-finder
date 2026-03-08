'use client';

/** 개별 필터 항목 */
interface FilterItem {
  /** 고유 식별자 */
  id: string;
  /** 표시할 텍스트 */
  label: string;
}

/** 활성 필터 칩 바 props */
interface ActiveFilterChipsProps {
  /** 현재 활성화된 필터 목록 */
  filters: FilterItem[];
  /** 개별 필터 제거 핸들러 */
  onRemove: (id: string) => void;
  /** 전체 필터 초기화 핸들러 */
  onClearAll: () => void;
}

/**
 * 활성 필터 칩 바 — 수평 스크롤
 * - 현재 적용된 필터를 칩으로 표시
 * - 각 칩에 × 닫기 버튼 (터치 타겟 확보)
 * - 필터 존재 시 우측 끝에 "다시 시작" 버튼
 * - scrollbar-hide로 스크롤바 숨김
 */
export function ActiveFilterChips({ filters, onRemove, onClearAll }: ActiveFilterChipsProps) {
  /* 필터가 없으면 렌더링하지 않음 */
  if (filters.length === 0) return null;

  return (
    <div
      className="
        flex items-center gap-1.5 px-4 py-2
        overflow-x-auto
        scrollbar-hide
      "
      role="list"
      aria-label="활성 필터 목록"
      /* 스크롤바 숨김 — 웹킷/파이어폭스 대응 */
      style={{
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}
    >
      {/* 필터 칩 목록 */}
      {filters.map((filter) => (
        <div
          key={filter.id}
          role="listitem"
          className="
            flex items-center gap-1 shrink-0
            h-7 px-3 rounded-full
            bg-orange-100 text-orange-700
            text-xs font-medium
          "
        >
          {/* 필터 라벨 */}
          <span>{filter.label}</span>

          {/* 닫기(제거) 버튼 — 터치 타겟 24px 패딩 확보 */}
          <button
            onClick={() => onRemove(filter.id)}
            className="
              ml-0.5 p-1
              text-orange-400 hover:text-orange-600
              transition-colors duration-150
              focus:outline-none focus:ring-1 focus:ring-orange-500/50 rounded
            "
            aria-label={`${filter.label} 필터 제거`}
          >
            {/* × 아이콘 */}
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 12 12"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <line x1="2" y1="2" x2="10" y2="10" />
              <line x1="10" y1="2" x2="2" y2="10" />
            </svg>
          </button>
        </div>
      ))}

      {/* "다시 시작" 버튼 — 전체 초기화 */}
      <button
        onClick={onClearAll}
        className="
          shrink-0 h-7 px-3 rounded-full
          bg-gray-100 text-gray-500
          text-xs font-medium
          hover:bg-gray-200 active:bg-gray-300
          transition-colors duration-150
          focus:outline-none focus:ring-1 focus:ring-gray-400/50
        "
        aria-label="모든 필터 초기화"
      >
        다시 시작
      </button>
    </div>
  );
}
