// ============================================
// Inverse FK: 월드 좌표 → 관절 회전값 역계산
// 추출된 17관절 3D 좌표로부터 Euler 회전값 산출
// pose-store에 적용하여 마네킹 포즈 변경
// ============================================

import type { JointId } from '@/stores/pose-store';
import { computeDefaultPoseVector, JOINT_ORDER } from '@/lib/forward-kinematics';

type Vec3 = [number, number, number];

// ============================================
// 기본 T-pose의 뼈대 방향 벡터 (캐시)
// ============================================

/** T-pose 관절 좌표 (캐시) */
let defaultPositions: Record<JointId, Vec3> | null = null;

/** 기본 T-pose 좌표 가져오기 (1회 계산 후 캐시) */
function getDefaultPositions(): Record<JointId, Vec3> {
  if (!defaultPositions) {
    const vec = computeDefaultPoseVector();
    defaultPositions = {} as Record<JointId, Vec3>;
    for (let i = 0; i < JOINT_ORDER.length; i++) {
      defaultPositions[JOINT_ORDER[i]] = [
        vec[i * 3],
        vec[i * 3 + 1],
        vec[i * 3 + 2],
      ];
    }
  }
  return defaultPositions;
}

// ============================================
// 뼈대 계층 (부모→자식)
// ============================================

/** 각 관절의 자식 관절 목록 */
const CHILDREN: Partial<Record<JointId, JointId[]>> = {
  pelvis: ['spine', 'leftHip', 'rightHip'],
  spine: ['chest'],
  chest: ['neck', 'leftShoulder', 'rightShoulder'],
  neck: ['head'],
  leftShoulder: ['leftElbow'],
  leftElbow: ['leftWrist'],
  rightShoulder: ['rightElbow'],
  rightElbow: ['rightWrist'],
  leftHip: ['leftKnee'],
  leftKnee: ['leftAnkle'],
  rightHip: ['rightKnee'],
  rightKnee: ['rightAnkle'],
};

// ============================================
// 벡터/수학 유틸리티
// ============================================

/** 벡터 뺄셈 */
function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** 벡터 크기 */
function length(v: Vec3): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

/** 벡터 정규화 */
function normalize(v: Vec3): Vec3 {
  const len = length(v);
  if (len < 1e-10) return [0, 1, 0]; // 기본값: y축 위
  return [v[0] / len, v[1] / len, v[2] / len];
}

/** 외적 */
function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/** 내적 */
function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * 두 방향 벡터 사이의 회전을 Euler XYZ로 근사 변환
 *
 * 방법: axis-angle 계산 후 Euler 분해
 * - from과 to의 외적 → 회전축
 * - from과 to의 내적 → 회전 각도
 * - 회전축 + 각도 → Euler XYZ 근사
 *
 * 제약: twist 성분은 근사 (완벽한 IK 아님)
 */
function directionToEuler(from: Vec3, to: Vec3): Vec3 {
  const f = normalize(from);
  const t = normalize(to);

  // 외적 = 회전축, 내적 = cos(각도)
  const axis = cross(f, t);
  const axisLen = length(axis);
  const cosAngle = Math.max(-1, Math.min(1, dot(f, t)));

  // 거의 같은 방향이면 회전 없음
  if (axisLen < 1e-6) return [0, 0, 0];

  const angle = Math.acos(cosAngle);
  const n = normalize(axis);

  // Axis-angle → Euler XYZ 근사
  // 단순화: 각 축 성분에 각도 배분
  const rx = n[0] * angle;
  const ry = n[1] * angle;
  const rz = n[2] * angle;

  return [rx, ry, rz];
}

// ============================================
// 공개 API
// ============================================

/**
 * 추출된 17관절 월드 좌표 → 각 관절의 Euler 회전값 역계산
 *
 * 각 관절에 대해:
 * 1. T-pose에서의 부모→자식 방향 벡터 계산
 * 2. 추출 포즈에서의 부모→자식 방향 벡터 계산
 * 3. 두 벡터 사이의 회전을 Euler로 변환
 *
 * @param jointPositions 17개 관절의 월드 좌표
 * @returns 각 관절의 Euler 회전값 [rx, ry, rz] (라디안)
 */
export function computeInverseFK(
  jointPositions: Record<JointId, Vec3>
): Record<JointId, Vec3> {
  const defaults = getDefaultPositions();
  const result = {} as Record<JointId, Vec3>;

  // 모든 관절 초기값 0
  for (const id of JOINT_ORDER) {
    result[id] = [0, 0, 0];
  }

  // 자식이 있는 관절만 회전 계산
  for (const [parentId, childIds] of Object.entries(CHILDREN)) {
    const parent = parentId as JointId;
    if (!childIds || childIds.length === 0) continue;

    // 첫 번째 자식 기준으로 회전 계산 (주요 뼈 방향)
    const child = childIds[0];
    const parentPos = jointPositions[parent];
    const childPos = jointPositions[child];

    if (!parentPos || !childPos) continue;

    const defaultParent = defaults[parent];
    const defaultChild = defaults[child];

    if (!defaultParent || !defaultChild) continue;

    // T-pose 방향 vs 추출 포즈 방향
    const defaultDir = sub(defaultChild, defaultParent);
    const extractedDir = sub(childPos, parentPos);

    // 방향 차이 → 회전값
    result[parent] = directionToEuler(defaultDir, extractedDir);
  }

  return result;
}
