'use client';

/**
 * 해부학 오버레이 범례 패널
 * - 근육 그룹 목록 표시 + 클릭으로 하이라이트 선택
 * - 다중 선택: Ctrl/Cmd + 클릭
 * - 모바일: 아코디언 (기본 접힘) + 가로 스크롤 칩
 */

import { useState } from 'react';
import { useAnatomyStore } from '@/stores/anatomy-store';
import { MUSCLE_GROUPS } from '@/lib/anatomy-data';
import type { MuscleGroupId } from '@/lib/anatomy-data';

export function AnatomyLegend() {
  const { selectedMuscles, toggleMuscle, resetSelection, hasSelection } = useAnatomyStore();
  // 모바일 아코디언 상태 (기본 접힘)
  const [expanded, setExpanded] = useState(false);

  /** 클릭 핸들러: Ctrl/Cmd 키 감지하여 다중 선택 지원 */
  const handleClick = (id: MuscleGroupId, e: React.MouseEvent) => {
    const multi = e.ctrlKey || e.metaKey;
    toggleMuscle(id, multi);
  };

  // 선택 상태 계산 헬퍼
  const isSelected = (id: MuscleGroupId) => selectedMuscles.has(id);
  const isDimmed = (id: MuscleGroupId) => selectedMuscles.size > 0 && !selectedMuscles.has(id);

  return (
    <div className="bg-white/90 border border-gray-200 rounded-lg">
      {/* ── 데스크탑/태블릿 (md+): 2열 그리드 ── */}
      <div className="hidden md:block p-2.5">
        {/* 헤더 + 리셋 버튼 */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wider">
            근육 그룹
            {selectedMuscles.size > 0 && (
              <span className="text-orange-400 ml-1">({selectedMuscles.size}개 선택)</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            {/* 다중 선택 힌트 */}
            <span className="text-xs text-gray-300">
              Ctrl+클릭 다중선택
            </span>
            {hasSelection() && (
              <button
                onClick={resetSelection}
                className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
              >
                전체 보기
              </button>
            )}
          </div>
        </div>

        {/* 근육 그룹 목록 (2열 그리드) */}
        <div className="grid grid-cols-2 gap-1">
          {MUSCLE_GROUPS.map((group) => (
            <button
              key={group.id}
              onClick={(e) => handleClick(group.id, e)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-left cursor-pointer transition-all ${
                isSelected(group.id)
                  ? 'bg-white/10 ring-1 ring-white/20'
                  : isDimmed(group.id)
                    ? 'opacity-40 hover:opacity-70'
                    : 'hover:bg-white/5'
              }`}
            >
              {/* 색상 인디케이터 */}
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: group.color }}
              />
              {/* 근육 이름 + 부위 */}
              <span className="text-xs text-gray-600 leading-tight">
                {group.label}
                <span className="text-gray-400 ml-0.5">
                  {group.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 모바일 (~md): 아코디언 + 가로 스크롤 칩 ── */}
      <div className="md:hidden">
        {/* 아코디언 헤더 (항상 표시) */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-3 py-2 cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <span className={`text-xs text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}>
              ▸
            </span>
            <span className="text-[11px] font-medium text-gray-600">
              근육 그룹
            </span>
            {selectedMuscles.size > 0 && (
              <span className="text-xs text-orange-400">
                {selectedMuscles.size}개
              </span>
            )}
          </div>
          {hasSelection() && (
            <span
              onClick={(e) => { e.stopPropagation(); resetSelection(); }}
              className="text-xs text-gray-400"
            >
              다시 시작
            </span>
          )}
        </button>

        {/* 접혀있을 때: 선택된 근육 칩만 가로 스크롤 표시 */}
        {!expanded && selectedMuscles.size > 0 && (
          <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
            {MUSCLE_GROUPS.filter((g) => selectedMuscles.has(g.id)).map((group) => (
              <span
                key={group.id}
                className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{ backgroundColor: group.color + '25', color: group.color }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
                {group.label}
              </span>
            ))}
          </div>
        )}

        {/* 펼쳐졌을 때: 가로 스크롤 칩 목록 */}
        {expanded && (
          <div className="px-3 pb-2.5 space-y-1.5">
            {/* 다중 선택 힌트 */}
            <p className="text-xs text-gray-300">
              탭: 단독 선택 · 길게 누르기: 추가 선택
            </p>
            {/* 가로 플렉스 래핑 칩 (모바일에서 작은 크기) */}
            <div className="flex flex-wrap gap-1">
              {MUSCLE_GROUPS.map((group) => (
                <button
                  key={group.id}
                  onClick={(e) => handleClick(group.id, e)}
                  onContextMenu={(e) => {
                    // 모바일 길게 누르기 → 다중 선택 (컨텍스트 메뉴 방지)
                    e.preventDefault();
                    toggleMuscle(group.id, true);
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs cursor-pointer transition-all ${
                    isSelected(group.id)
                      ? 'ring-1 ring-white/30'
                      : isDimmed(group.id)
                        ? 'opacity-40'
                        : ''
                  }`}
                  style={{
                    backgroundColor: isSelected(group.id) ? group.color + '30' : group.color + '15',
                    color: isDimmed(group.id) ? '#737373' : group.color,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
