'use client';

// ============================================
// 레이아웃 전환 드롭다운 (Phase 6)
// Grid(2/3/4열) / Masonry / Freeform 선택
// ============================================

import { useState, useRef, useEffect } from 'react';
import type { CollectionLayout } from '@/types';

interface LayoutSwitcherProps {
  /** 현재 레이아웃 */
  layout: CollectionLayout;
  /** 현재 그리드 열 수 */
  gridColumns: 2 | 3 | 4;
  /** 레이아웃 변경 콜백 */
  onLayoutChange: (layout: CollectionLayout) => void;
  /** 그리드 열 수 변경 콜백 */
  onColumnsChange: (columns: 2 | 3 | 4) => void;
  /** Freeform 비활성화 (Free 플랜) */
  freeformDisabled?: boolean;
}

/** 레이아웃 옵션 정의 */
const LAYOUT_OPTIONS: { id: CollectionLayout | string; label: string; icon: string; layout: CollectionLayout; columns?: 2 | 3 | 4 }[] = [
  { id: 'grid-2', label: 'Grid 2열', icon: '▦', layout: 'grid', columns: 2 },
  { id: 'grid-3', label: 'Grid 3열', icon: '▦', layout: 'grid', columns: 3 },
  { id: 'grid-4', label: 'Grid 4열', icon: '▦', layout: 'grid', columns: 4 },
  { id: 'masonry', label: 'Masonry', icon: '▤', layout: 'masonry' },
  { id: 'freeform', label: 'Freeform', icon: '⊞', layout: 'freeform' },
];

export function LayoutSwitcher({
  layout,
  gridColumns,
  onLayoutChange,
  onColumnsChange,
  freeformDisabled = false,
}: LayoutSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // 현재 선택된 옵션의 라벨 표시
  const currentLabel = layout === 'grid'
    ? `Grid ${gridColumns}열`
    : layout === 'masonry'
      ? 'Masonry'
      : 'Freeform';

  const handleSelect = (option: typeof LAYOUT_OPTIONS[number]) => {
    // Freeform 비활성화 체크
    if (option.layout === 'freeform' && freeformDisabled) return;

    onLayoutChange(option.layout);
    if (option.columns) {
      onColumnsChange(option.columns);
    }
    setIsOpen(false);
  };

  // 현재 선택된 ID
  const currentId = layout === 'grid' ? `grid-${gridColumns}` : layout;

  return (
    <div ref={ref} className="relative">
      {/* 트리거 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
      >
        <span>{currentLabel}</span>
        <span className="text-[10px]">▾</span>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-40 bg-gray-50 border border-gray-300 rounded-lg shadow-xl overflow-hidden z-50">
          {LAYOUT_OPTIONS.map((option) => {
            const isSelected = option.id === currentId;
            const isDisabled = option.layout === 'freeform' && freeformDisabled;

            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-orange-600/20 text-orange-300'
                    : isDisabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-600'
                }`}
              >
                <span className="text-sm">{option.icon}</span>
                <span>{option.label}</span>
                {isSelected && <span className="ml-auto text-orange-400">✓</span>}
                {isDisabled && <span className="ml-auto text-[9px] text-gray-300">PRO</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
