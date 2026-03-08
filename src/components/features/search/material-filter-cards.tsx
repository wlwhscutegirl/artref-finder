// ============================================
// 소재/배경 비주얼 필터 카드 (Phase 3 Step 2)
// 태그를 아이콘+이름 카드로 시각적 표시
// ============================================

'use client';

import { useMemo } from 'react';

interface MaterialFilterCardsProps {
  /** 현재 선택된 태그 목록 */
  selectedTags: string[];
  /** 태그 변경 콜백 */
  onTagsChange: (tags: string[]) => void;
}

/** 소재 태그별 아이콘 + 컬러 매핑 */
const MATERIAL_ICONS: Record<string, { icon: string; color: string }> = {
  '가죽': { icon: '🧥', color: 'from-amber-900/40 to-amber-800/20' },
  '비단': { icon: '🎀', color: 'from-pink-900/40 to-pink-800/20' },
  '데님': { icon: '👖', color: 'from-blue-900/40 to-blue-800/20' },
  '니트': { icon: '🧶', color: 'from-orange-900/40 to-orange-800/20' },
  '금속': { icon: '⚙️', color: 'from-slate-700/40 to-slate-600/20' },
  '근육': { icon: '💪', color: 'from-red-900/40 to-red-800/20' },
  '피부결': { icon: '🤲', color: 'from-rose-900/40 to-rose-800/20' },
};

/** 배경 태그별 아이콘 + 컬러 매핑 */
const BACKGROUND_ICONS: Record<string, { icon: string; color: string }> = {
  '실내': { icon: '🏠', color: 'from-yellow-900/40 to-yellow-800/20' },
  '야외': { icon: '🌤️', color: 'from-sky-900/40 to-sky-800/20' },
  '스튜디오': { icon: '📸', color: 'from-neutral-700/40 to-neutral-600/20' },
  '숲': { icon: '🌲', color: 'from-green-900/40 to-green-800/20' },
  '도시': { icon: '🏙️', color: 'from-indigo-900/40 to-indigo-800/20' },
  '해변': { icon: '🏖️', color: 'from-cyan-900/40 to-cyan-800/20' },
  '야경': { icon: '🌃', color: 'from-purple-900/40 to-purple-800/20' },
  '교실': { icon: '🏫', color: 'from-emerald-900/40 to-emerald-800/20' },
  '카페': { icon: '☕', color: 'from-amber-800/40 to-amber-700/20' },
  '골목': { icon: '🚶', color: 'from-stone-700/40 to-stone-600/20' },
  '옥상': { icon: '🌇', color: 'from-orange-900/40 to-orange-800/20' },
};

/** 퀵 필터 (인기 태그 조합) */
const QUICK_FILTERS: Array<{ label: string; tags: string[]; icon: string }> = [
  { label: '야외 자연광', tags: ['야외', '자연광'], icon: '☀️' },
  { label: '스튜디오 하드라이트', tags: ['스튜디오', '하드라이트'], icon: '💡' },
  { label: '도시 야경', tags: ['도시', '야경', '인공광'], icon: '🌃' },
  { label: '카페 소프트', tags: ['카페', '실내', '소프트라이트'], icon: '☕' },
  { label: '숲 골든아워', tags: ['숲', '야외', '골든아워'], icon: '🌅' },
  { label: '해변 역광', tags: ['해변', '야외', '역광'], icon: '🏖️' },
];

/**
 * 소재/배경 비주얼 필터 카드 컴포넌트
 * 태그를 아이콘 카드 형태로 시각적으로 표시
 */
export function MaterialFilterCards({
  selectedTags,
  onTagsChange,
}: MaterialFilterCardsProps) {
  // 태그 토글 핸들러
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  // 퀵 필터 적용 핸들러 (기존 태그에 추가)
  const applyQuickFilter = (filterTags: string[]) => {
    const newTags = [...new Set([...selectedTags, ...filterTags])];
    onTagsChange(newTags);
  };

  // 현재 선택된 소재/배경 태그 수
  const selectedMaterialCount = useMemo(
    () => selectedTags.filter((t) => t in MATERIAL_ICONS).length,
    [selectedTags]
  );
  const selectedBgCount = useMemo(
    () => selectedTags.filter((t) => t in BACKGROUND_ICONS).length,
    [selectedTags]
  );

  return (
    <div className="space-y-3">
      {/* 퀵 필터 (인기 태그 조합) */}
      <div>
        <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
          퀵 필터
        </p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_FILTERS.map((filter) => {
            // 이 퀵 필터의 태그가 모두 선택되어 있는지 확인
            const isActive = filter.tags.every((t) => selectedTags.includes(t));
            return (
              <button
                key={filter.label}
                onClick={() => applyQuickFilter(filter.tags)}
                className={`
                  inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium
                  transition-colors cursor-pointer border
                  ${isActive
                    ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                    : 'bg-neutral-800/50 border-neutral-700/50 text-neutral-400 hover:bg-neutral-700/50 hover:text-neutral-300'
                  }
                `}
              >
                <span>{filter.icon}</span>
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 소재/텍스처 카드 */}
      <div>
        <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
          소재 {selectedMaterialCount > 0 && <span className="text-violet-400">({selectedMaterialCount})</span>}
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {Object.entries(MATERIAL_ICONS).map(([tag, { icon, color }]) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`
                  flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-center
                  transition-all cursor-pointer border
                  ${isSelected
                    ? `bg-gradient-to-b ${color} border-violet-500/40 ring-1 ring-violet-500/30`
                    : 'bg-neutral-800/30 border-neutral-700/30 hover:bg-neutral-700/40'
                  }
                `}
              >
                <span className="text-base">{icon}</span>
                <span className={`text-[9px] font-medium ${isSelected ? 'text-violet-300' : 'text-neutral-400'}`}>
                  {tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 배경 카드 */}
      <div>
        <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
          배경 {selectedBgCount > 0 && <span className="text-violet-400">({selectedBgCount})</span>}
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {Object.entries(BACKGROUND_ICONS).map(([tag, { icon, color }]) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`
                  flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-center
                  transition-all cursor-pointer border
                  ${isSelected
                    ? `bg-gradient-to-b ${color} border-violet-500/40 ring-1 ring-violet-500/30`
                    : 'bg-neutral-800/30 border-neutral-700/30 hover:bg-neutral-700/40'
                  }
                `}
              >
                <span className="text-base">{icon}</span>
                <span className={`text-[9px] font-medium ${isSelected ? 'text-violet-300' : 'text-neutral-400'}`}>
                  {tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
