/**
 * 해부학 오버레이 상태 관리 (Zustand)
 * - 해부학 모드 활성/비활성
 * - 다중 근육 그룹 선택 (하이라이트용)
 */

import { create } from 'zustand';
import type { MuscleGroupId } from '@/lib/anatomy-data';

interface AnatomyState {
  /** 해부학 오버레이 활성 여부 */
  isAnatomyMode: boolean;
  /** 선택된 근육 그룹 Set (비어있으면 전체 표시) */
  selectedMuscles: Set<MuscleGroupId>;

  /** 해부학 모드 토글 */
  toggleAnatomyMode: () => void;
  /** 해부학 모드 직접 설정 */
  setAnatomyMode: (active: boolean) => void;
  /**
   * 근육 그룹 토글 (다중 선택 지원)
   * - 일반 클릭: 해당 근육만 단독 선택 (다른 선택 해제)
   * - Ctrl/Cmd 클릭: 다중 선택 토글
   * - 이미 단독 선택된 근육 다시 클릭: 선택 해제 (전체 보기)
   */
  toggleMuscle: (id: MuscleGroupId, multi?: boolean) => void;
  /** 전체 보기 리셋 (선택 해제) */
  resetSelection: () => void;
  /** 특정 근육이 선택되었는지 확인 */
  isMuscleSelected: (id: MuscleGroupId) => boolean;
  /** 선택된 근육이 있는지 (하나라도) */
  hasSelection: () => boolean;
  /** 특정 근육이 dimmed 상태인지 (선택 있고, 이 근육은 미선택) */
  isMuscledDimmed: (id: MuscleGroupId) => boolean;
}

export const useAnatomyStore = create<AnatomyState>((set, get) => ({
  isAnatomyMode: false,
  selectedMuscles: new Set<MuscleGroupId>(),

  toggleAnatomyMode: () => {
    const current = get().isAnatomyMode;
    set({
      isAnatomyMode: !current,
      // 모드 끌 때 선택도 리셋
      selectedMuscles: !current ? get().selectedMuscles : new Set(),
    });
  },

  setAnatomyMode: (active) => {
    set({
      isAnatomyMode: active,
      selectedMuscles: active ? get().selectedMuscles : new Set(),
    });
  },

  toggleMuscle: (id, multi = false) => {
    const current = get().selectedMuscles;

    if (multi) {
      // Ctrl/Cmd 클릭: 다중 선택 토글
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      set({ selectedMuscles: next });
    } else {
      // 일반 클릭: 단독 선택 토글
      if (current.size === 1 && current.has(id)) {
        // 이미 단독 선택된 근육 다시 클릭 → 전체 보기
        set({ selectedMuscles: new Set() });
      } else {
        // 해당 근육만 선택
        set({ selectedMuscles: new Set([id]) });
      }
    }
  },

  resetSelection: () => {
    set({ selectedMuscles: new Set() });
  },

  isMuscleSelected: (id) => {
    return get().selectedMuscles.has(id);
  },

  hasSelection: () => {
    return get().selectedMuscles.size > 0;
  },

  isMuscledDimmed: (id) => {
    const { selectedMuscles } = get();
    return selectedMuscles.size > 0 && !selectedMuscles.has(id);
  },
}));
