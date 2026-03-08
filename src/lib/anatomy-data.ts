/**
 * 해부학 오버레이 데이터
 * 10개 근육 그룹 정의 + 관절-근육 매핑
 */

import type { JointId } from '@/stores/pose-store';

// ============================================
// 근육 그룹 ID 타입
// ============================================
export type MuscleGroupId =
  | 'deltoid'
  | 'pectoralis'
  | 'latissimus'
  | 'abdominals'
  | 'bicepsTriceps'
  | 'forearm'
  | 'gluteus'
  | 'quadriceps'
  | 'hamstrings'
  | 'gastrocnemius';

// ============================================
// 근육 그룹 정의 (10개)
// ============================================
export interface MuscleGroup {
  /** 근육 그룹 ID */
  id: MuscleGroupId;
  /** 한글명 */
  label: string;
  /** 대표 색상 (hex) */
  color: string;
  /** 관련 부위 설명 */
  description: string;
}

/** 10개 근육 그룹 목록 */
export const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: 'deltoid', label: '삼각근', color: '#f97316', description: '어깨~상완' },
  { id: 'pectoralis', label: '대흉근', color: '#ef4444', description: '흉부 전면' },
  { id: 'latissimus', label: '광배근', color: '#b91c1c', description: '등/척추' },
  { id: 'abdominals', label: '복직근', color: '#eab308', description: '복부' },
  { id: 'bicepsTriceps', label: '이두/삼두근', color: '#06b6d4', description: '상완~팔꿈치' },
  { id: 'forearm', label: '전완근', color: '#3b82f6', description: '팔꿈치~손목' },
  { id: 'gluteus', label: '대둔근', color: '#a855f7', description: '골반~엉덩이' },
  { id: 'quadriceps', label: '대퇴사두근', color: '#22c55e', description: '허벅지 전면' },
  { id: 'hamstrings', label: '햄스트링', color: '#84cc16', description: '허벅지 후면' },
  { id: 'gastrocnemius', label: '비복근', color: '#14b8a6', description: '종아리' },
];

// ============================================
// 뼈(Bone) → 근육 그룹 매핑
// 각 Bone 위치를 식별하기 위한 키 사용
// ============================================

/**
 * Bone 식별 키
 * mannequin-model.tsx의 각 Bone 위치에 대응하는 고유 키
 */
export type BoneKey =
  | 'pelvis'          // 골반
  | 'spine'           // 척추
  | 'chest'           // 흉부
  | 'neck'            // 목
  | 'leftUpperArm'    // 왼쪽 상완
  | 'leftForearm'     // 왼쪽 전완
  | 'rightUpperArm'   // 오른쪽 상완
  | 'rightForearm'    // 오른쪽 전완
  | 'leftThigh'       // 왼쪽 허벅지
  | 'leftCalf'        // 왼쪽 종아리
  | 'leftFoot'        // 왼쪽 발
  | 'rightThigh'      // 오른쪽 허벅지
  | 'rightCalf'       // 오른쪽 종아리
  | 'rightFoot'       // 오른쪽 발;

/**
 * 뼈(Bone) → 근육 그룹 매핑 테이블
 * 하나의 Bone이 여러 근육 그룹에 관련될 수 있으나,
 * 시각적 단순화를 위해 대표 근육 1개만 매핑
 */
export const BONE_MUSCLE_MAP: Record<BoneKey, MuscleGroupId> = {
  pelvis: 'gluteus',           // 골반 → 대둔근
  spine: 'latissimus',         // 척추 → 광배근
  chest: 'pectoralis',         // 흉부 → 대흉근
  neck: 'latissimus',          // 목 → 광배근 (승모근 대리)
  leftUpperArm: 'bicepsTriceps',   // 왼쪽 상완 → 이두/삼두
  leftForearm: 'forearm',         // 왼쪽 전완 → 전완근
  rightUpperArm: 'bicepsTriceps',  // 오른쪽 상완 → 이두/삼두
  rightForearm: 'forearm',        // 오른쪽 전완 → 전완근
  leftThigh: 'quadriceps',        // 왼쪽 허벅지 → 대퇴사두근
  leftCalf: 'gastrocnemius',      // 왼쪽 종아리 → 비복근
  leftFoot: 'gastrocnemius',      // 왼쪽 발 → 비복근
  rightThigh: 'quadriceps',       // 오른쪽 허벅지 → 대퇴사두근
  rightCalf: 'gastrocnemius',     // 오른쪽 종아리 → 비복근
  rightFoot: 'gastrocnemius',     // 오른쪽 발 → 비복근
};

/**
 * 관절(Joint) → 근육 그룹 매핑
 * 관절 구(sphere)의 색상도 근육 그룹에 따라 변경
 */
export const JOINT_MUSCLE_MAP: Record<JointId, MuscleGroupId> = {
  pelvis: 'gluteus',
  spine: 'abdominals',
  chest: 'pectoralis',
  neck: 'latissimus',
  head: 'latissimus',
  leftShoulder: 'deltoid',
  leftElbow: 'bicepsTriceps',
  leftWrist: 'forearm',
  rightShoulder: 'deltoid',
  rightElbow: 'bicepsTriceps',
  rightWrist: 'forearm',
  leftHip: 'gluteus',
  leftKnee: 'quadriceps',
  leftAnkle: 'gastrocnemius',
  rightHip: 'gluteus',
  rightKnee: 'quadriceps',
  rightAnkle: 'gastrocnemius',
};

/**
 * 근육 그룹 ID → 색상 빠른 조회 맵
 */
export const MUSCLE_COLOR_MAP: Record<MuscleGroupId, string> = Object.fromEntries(
  MUSCLE_GROUPS.map((g) => [g.id, g.color])
) as Record<MuscleGroupId, string>;

/**
 * Bone 키로 해당 근육 그룹 색상을 반환
 * @param boneKey 뼈 식별 키
 * @returns 근육 그룹 색상 (hex)
 */
export function getBoneAnatomyColor(boneKey: BoneKey): string {
  const muscleId = BONE_MUSCLE_MAP[boneKey];
  return MUSCLE_COLOR_MAP[muscleId];
}

/**
 * Joint ID로 해당 근육 그룹 색상을 반환
 * @param jointId 관절 ID
 * @returns 근육 그룹 색상 (hex)
 */
export function getJointAnatomyColor(jointId: JointId): string {
  const muscleId = JOINT_MUSCLE_MAP[jointId];
  return MUSCLE_COLOR_MAP[muscleId];
}
