// ============================================
// 마네킹 포즈 상태 관리 (Zustand)
// 17개 관절 회전값 + 선택 관절 관리
// ============================================

import { create } from 'zustand';

/** 17개 관절 ID */
export const JOINT_IDS = [
  'pelvis', 'spine', 'chest', 'neck', 'head',
  'leftShoulder', 'leftElbow', 'leftWrist',
  'rightShoulder', 'rightElbow', 'rightWrist',
  'leftHip', 'leftKnee', 'leftAnkle',
  'rightHip', 'rightKnee', 'rightAnkle',
] as const;

export type JointId = (typeof JOINT_IDS)[number];

/** 관절 한글 이름 매핑 */
export const JOINT_LABELS: Record<JointId, string> = {
  pelvis: '골반',
  spine: '척추',
  chest: '흉부',
  neck: '목',
  head: '머리',
  leftShoulder: '왼쪽 어깨',
  leftElbow: '왼쪽 팔꿈치',
  leftWrist: '왼쪽 손목',
  rightShoulder: '오른쪽 어깨',
  rightElbow: '오른쪽 팔꿈치',
  rightWrist: '오른쪽 손목',
  leftHip: '왼쪽 엉덩이',
  leftKnee: '왼쪽 무릎',
  leftAnkle: '왼쪽 발목',
  rightHip: '오른쪽 엉덩이',
  rightKnee: '오른쪽 무릎',
  rightAnkle: '오른쪽 발목',
};

/** 모든 관절의 기본 회전값 (라디안 [x, y, z]) */
function createDefaultRotations(): Record<JointId, [number, number, number]> {
  const rotations = {} as Record<JointId, [number, number, number]>;
  for (const id of JOINT_IDS) {
    rotations[id] = [0, 0, 0];
  }
  return rotations;
}

interface PoseState {
  /** 모든 관절의 회전값 (라디안) */
  joints: Record<JointId, [number, number, number]>;
  /** 현재 선택된 관절 ID (null이면 미선택) */
  selectedJoint: JointId | null;
  /** 기즈모 드래그 중 여부 */
  isDragging: boolean;

  /** 관절 회전값 설정 */
  setJointRotation: (id: JointId, rotation: [number, number, number]) => void;
  /** 관절 선택/해제 */
  selectJoint: (id: JointId | null) => void;
  /** 드래그 상태 변경 */
  setDragging: (dragging: boolean) => void;
  /** 모든 관절 초기화 */
  resetPose: () => void;
  /** 외부 포즈 (Inverse FK 결과)를 모든 관절에 일괄 적용 */
  applyExternalPose: (rotations: Record<JointId, [number, number, number]>) => void;
}

export const usePoseStore = create<PoseState>((set) => ({
  joints: createDefaultRotations(),
  selectedJoint: null,
  isDragging: false,

  setJointRotation: (id, rotation) =>
    set((state) => ({
      joints: { ...state.joints, [id]: rotation },
    })),

  selectJoint: (id) => set({ selectedJoint: id }),

  setDragging: (dragging) => set({ isDragging: dragging }),

  resetPose: () =>
    set({
      joints: createDefaultRotations(),
      selectedJoint: null,
      isDragging: false,
    }),

  applyExternalPose: (rotations) =>
    set({
      joints: { ...createDefaultRotations(), ...rotations },
      selectedJoint: null,
      isDragging: false,
    }),
}));

/**
 * 파생 셀렉터: 모든 관절이 기본 포즈(0)인지 확인
 * 포즈 매칭 활성화 조건 판별에 사용
 */
export function useIsDefaultPose(): boolean {
  const joints = usePoseStore((s) => s.joints);
  const threshold = 0.01; // 약 0.57도
  for (const rotation of Object.values(joints)) {
    if (
      Math.abs(rotation[0]) > threshold ||
      Math.abs(rotation[1]) > threshold ||
      Math.abs(rotation[2]) > threshold
    ) {
      return false;
    }
  }
  return true;
}
