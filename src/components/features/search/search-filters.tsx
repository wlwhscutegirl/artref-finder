'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { TAG_GROUPS, SAMPLE_CATEGORIES, getTagTooltip } from '@/lib/sample-data';
import { MaterialFilterCards } from './material-filter-cards';
import type { ImageCategory } from '@/types';
import type { SafetyLevel } from '@/lib/safety-filter';

/**
 * 터치/클릭 기반 툴팁 팝오버 컴포넌트
 * hover가 안 되는 모바일/태블릿에서도 태그 설명을 볼 수 있도록 지원
 */
function TagTooltipPopover({ text, children }: { text?: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [isOpen]);

  // 3초 후 자동 닫기
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => setIsOpen(false), 3000);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!text) return <>{children}</>;

  return (
    <div ref={ref} className="relative inline-flex">
      <div
        onContextMenu={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
        onTouchStart={(e) => {
          // 길게 누르면 tooltip 표시 (짧은 탭은 toggle)
          const timer = setTimeout(() => setIsOpen(true), 300);
          const cancel = () => { clearTimeout(timer); };
          e.currentTarget.addEventListener('touchend', cancel, { once: true });
          e.currentTarget.addEventListener('touchmove', cancel, { once: true });
        }}
      >
        {children}
      </div>
      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-gray-100 border border-gray-300 rounded-lg text-[10px] text-gray-600 whitespace-nowrap z-50 shadow-lg">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-neutral-700" />
        </div>
      )}
    </div>
  );
}

interface SearchFiltersProps {
  selectedTags: string[];
  selectedCategory: ImageCategory | null;
  onTagsChange: (tags: string[]) => void;
  onCategoryChange: (category: ImageCategory | null) => void;
  /** 현재 3D 뷰어의 조명 방향 (선택적) */
  lightDirection?: { azimuth: number; elevation: number } | null;
  /** 조명 방향 필터 활성 여부 */
  lightFilterActive?: boolean;
  /** 조명 필터 토글 콜백 */
  onLightFilterToggle?: () => void;
  /** 조명 매칭된 이미지 수 (Phase 5) */
  lightMatchCount?: number;
  /** 조명 유사도 매칭이 활성 중인지 (벡터 매칭 모드) */
  isLightVectorActive?: boolean;
  /** 현재 안전 필터 레벨 */
  safetyLevel?: SafetyLevel;
  /** 안전 필터 레벨 변경 콜백 */
  onSafetyLevelChange?: (level: SafetyLevel) => void;
}

export function SearchFilters({
  selectedTags,
  selectedCategory,
  onTagsChange,
  onCategoryChange,
  lightDirection,
  lightFilterActive,
  onLightFilterToggle,
  lightMatchCount,
  isLightVectorActive,
  safetyLevel = 'off',
  onSafetyLevelChange,
}: SearchFiltersProps) {
  // 여러 그룹을 동시에 펼칠 수 있도록 Set으로 관리
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['pose']));

  // 태그 선택/해제 토글
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  // 그룹 펼침/접기 토글 (다중 펼침 가능)
  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // 특정 그룹의 선택된 태그만 해제
  const clearGroupTags = (groupKey: string) => {
    const groupTagNames: string[] = TAG_GROUPS[groupKey as keyof typeof TAG_GROUPS].tags.map((t) => t.name);
    onTagsChange(selectedTags.filter((t) => !groupTagNames.includes(t)));
  };

  return (
    <div className="space-y-4">
      {/* 카테고리 필터 */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">카테고리</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onCategoryChange(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              !selectedCategory
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {SAMPLE_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value as ImageCategory)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === cat.value
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 조명 방향 필터 (3D 뷰어 동기화) */}
      {onLightFilterToggle && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">조명 방향</p>
            <button
              onClick={onLightFilterToggle}
              className={`text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors ${
                lightFilterActive
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              {lightFilterActive ? '필터 ON' : '필터 OFF'}
            </button>
          </div>
          {lightDirection && (
            <div className="flex items-center gap-3 text-[11px] text-gray-500 bg-gray-100/50 rounded-lg p-2">
              {/* 조명 방향 시각화 (간단한 화살표) */}
              <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center relative">
                <div
                  className="w-1.5 h-1.5 bg-amber-400 rounded-full absolute"
                  style={{
                    transform: `translate(${Math.sin(lightDirection.azimuth * Math.PI / 180) * 10}px, ${-Math.cos(lightDirection.azimuth * Math.PI / 180) * 10}px)`,
                  }}
                />
              </div>
              <div>
                <div>방위각: {Math.round(lightDirection.azimuth)}°</div>
                <div>고도: {Math.round(lightDirection.elevation)}°</div>
              </div>
            </div>
          )}
          {/* Phase 5: 조명 벡터 매칭 활성 표시 */}
          {isLightVectorActive && lightMatchCount !== undefined && (
            <div className="text-[10px] text-amber-400 bg-amber-500/10 rounded px-2 py-1">
              조명 유사도 매칭 활성 — 매칭 {lightMatchCount}건
            </div>
          )}
        </div>
      )}

      {/* 소재/배경 비주얼 필터 카드 (Phase 3) */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">소재 / 배경</p>
        <MaterialFilterCards
          selectedTags={selectedTags}
          onTagsChange={onTagsChange}
        />
      </div>

      {/* 태그 그룹 (다중 펼침 + 툴팁) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">태그 필터</p>
          <span className="text-[10px] text-gray-300">같은 종류끼리는 하나만 맞으면 OK, 다른 종류는 모두 맞아야 검색돼요</span>
        </div>
        <div className="space-y-1">
          {Object.entries(TAG_GROUPS).map(([key, group]) => {
            const groupTagNames: string[] = group.tags.map((t) => t.name);
            const selectedInGroup = selectedTags.filter((t) => groupTagNames.includes(t));
            const isExpanded = expandedGroups.has(key);

            return (
              <div key={key}>
                {/* 그룹 헤더 */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleGroup(key)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 py-1 cursor-pointer"
                  >
                    <span className={`text-xs transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                    {group.label}
                    {selectedInGroup.length > 0 && (
                      <span className="text-xs text-orange-400">({selectedInGroup.length})</span>
                    )}
                  </button>
                  {/* 그룹 단위 해제 버튼 */}
                  {selectedInGroup.length > 0 && (
                    <button
                      onClick={() => clearGroupTags(key)}
                      className="text-[10px] text-gray-400 hover:text-red-400 cursor-pointer"
                    >
                      해제
                    </button>
                  )}
                </div>

                {/* 태그 목록 (툴팁 포함) */}
                {isExpanded && (
                  <div className="flex flex-wrap gap-1.5 mt-1 ml-4 mb-2">
                    {group.tags.map((tag) => (
                      <TagTooltipPopover key={tag.name} text={tag.tooltip}>
                        <span
                          onClick={() => toggleTag(tag.name)}
                          title={tag.tooltip}
                          className={`
                            inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                            transition-colors duration-150 cursor-pointer
                            ${
                              selectedTags.includes(tag.name)
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }
                          `}
                        >
                          #{tag.name}
                        </span>
                      </TagTooltipPopover>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 콘텐츠 안전 필터 (교육 모드) */}
      {onSafetyLevelChange && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">콘텐츠 안전 필터</p>
          </div>
          <div className="flex gap-2">
            {([
              { value: 'off' as SafetyLevel, label: '전체', color: 'bg-gray-100 text-gray-500' },
              { value: 'moderate' as SafetyLevel, label: '일반', color: 'bg-blue-600 text-white' },
              { value: 'strict' as SafetyLevel, label: '교육 모드', color: 'bg-emerald-600 text-white' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSafetyLevelChange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  safetyLevel === opt.value
                    ? opt.color
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-300 mt-1.5">
            {safetyLevel === 'strict' && '교육 모드: NSFW 점수 0.3 이하만 표시'}
            {safetyLevel === 'moderate' && '일반 모드: NSFW 점수 0.6 이하만 표시'}
            {safetyLevel === 'off' && '전체 이미지 표시 (필터 없음)'}
          </p>
        </div>
      )}

      {/* 선택된 태그 요약 */}
      {selectedTags.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              선택된 태그 ({selectedTags.length})
            </p>
            <button
              onClick={() => onTagsChange([])}
              className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
            >
              전체 해제
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-600 text-white"
              >
                #{tag}
                <button
                  onClick={() => toggleTag(tag)}
                  className="ml-0.5 hover:text-orange-200 cursor-pointer"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
