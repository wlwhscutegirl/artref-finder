// ============================================
// 정운동학(Forward Kinematics) 엔진
// 관절 회전값(Euler) → 월드 좌표 변환
// 17개 관절의 3D 좌표를 계산하여 포즈 벡터 생성
// ============================================

import type { JointId } from '@/stores/pose-store';

// --- 3x3 회전 행렬 타입 ---
type Mat3 = [number, number, number, number, number, number, number, number, number];

// --- 3D 벡터 타입 ---
type Vec3 = [number, number, number];

// ============================================
// 체형별 뼈대 오프셋 파라미터
// mannequin-model.tsx의 BODY_PARAMS와 동일
// ============================================
const BODY_PARAMS = {
  male: {
    scale: 1.0,
    shoulderWidth: 0.26,   // 0.24→0.26 mannequin-model 동기화
    hipSpread: 0.095,      // 0.10→0.095 mannequin-model 동기화
    armDeltaX: -0.06,
  },
  female: {
    scale: 0.943,
    shoulderWidth: 0.19,   // 0.20→0.19 mannequin-model 동기화
    hipSpread: 0.125,      // 0.12→0.125 mannequin-model 동기화
    armDeltaX: -0.035,     // -0.06→-0.035 mannequin-model 동기화 (female 전용 값)
  },
  neutral: {
    scale: 1.0,
    shoulderWidth: 0.22,
    hipSpread: 0.10,
    armDeltaX: -0.06,
  },
} as const;

type BodyType = 'male' | 'female' | 'neutral';

// ============================================
// 뼈대 계층 구조 정의
// 각 관절의 부모 및 부모로부터의 로컬 오프셋
// ============================================
interface BoneNode {
  id: JointId;
  /** 부모 관절로부터의 로컬 오프셋 [x, y, z] */
  offset: Vec3;
  /** 자식 관절 목록 */
  children: BoneNode[];
}

/** 체형에 따른 뼈대 계층 트리 생성 */
function createSkeleton(bodyType: BodyType): BoneNode {
  const p = BODY_PARAMS[bodyType];

  return {
    id: 'pelvis',
    offset: [0, 0.9, 0], // 루트 위치
    children: [
      {
        id: 'spine',
        offset: [0, 0.15, 0],
        children: [
          {
            id: 'chest',
            offset: [0, 0.3, 0],
            children: [
              // 목 → 머리 체인
              {
                id: 'neck',
                offset: [0, 0.25, 0],
                children: [
                  { id: 'head', offset: [0, 0.15, 0], children: [] },
                ],
              },
              // 왼쪽 팔 체인
              {
                id: 'leftShoulder',
                offset: [-p.shoulderWidth, 0.13, 0],
                children: [
                  {
                    id: 'leftElbow',
                    offset: [p.armDeltaX, -0.36, 0],
                    children: [
                      { id: 'leftWrist', offset: [0, -0.32, 0], children: [] },
                    ],
                  },
                ],
              },
              // 오른쪽 팔 체인
              {
                id: 'rightShoulder',
                offset: [p.shoulderWidth, 0.13, 0],
                children: [
                  {
                    id: 'rightElbow',
                    offset: [-p.armDeltaX, -0.36, 0],
                    children: [
                      { id: 'rightWrist', offset: [0, -0.32, 0], children: [] },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      // 왼쪽 다리 체인
      {
        id: 'leftHip',
        offset: [-p.hipSpread, -0.05, 0],
        children: [
          {
            id: 'leftKnee',
            offset: [0, -0.43, 0],
            children: [
              { id: 'leftAnkle', offset: [0, -0.39, 0], children: [] },
            ],
          },
        ],
      },
      // 오른쪽 다리 체인
      {
        id: 'rightHip',
        offset: [p.hipSpread, -0.05, 0],
        children: [
          {
            id: 'rightKnee',
            offset: [0, -0.43, 0],
            children: [
              { id: 'rightAnkle', offset: [0, -0.39, 0], children: [] },
            ],
          },
        ],
      },
    ],
  };
}

// ============================================
// 순수 수학 유틸리티 (THREE.js 의존성 없음)
// ============================================

/** 단위 행렬 생성 */
function identity(): Mat3 {
  return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}

/** Euler XYZ 순서 → 회전 행렬 변환 */
function eulerToMatrix(x: number, y: number, z: number): Mat3 {
  const cx = Math.cos(x), sx = Math.sin(x);
  const cy = Math.cos(y), sy = Math.sin(y);
  const cz = Math.cos(z), sz = Math.sin(z);

  // THREE.js 기본 Euler 순서 XYZ와 동일
  return [
    cy * cz,                    cy * sz,                     -sy,
    sx * sy * cz - cx * sz,     sx * sy * sz + cx * cz,      sx * cy,
    cx * sy * cz + sx * sz,     cx * sy * sz - sx * cz,      cx * cy,
  ];
}

/** 3x3 행렬 × 3x3 행렬 곱셈 */
function mulMat(a: Mat3, b: Mat3): Mat3 {
  return [
    a[0]*b[0] + a[1]*b[3] + a[2]*b[6],
    a[0]*b[1] + a[1]*b[4] + a[2]*b[7],
    a[0]*b[2] + a[1]*b[5] + a[2]*b[8],
    a[3]*b[0] + a[4]*b[3] + a[5]*b[6],
    a[3]*b[1] + a[4]*b[4] + a[5]*b[7],
    a[3]*b[2] + a[4]*b[5] + a[5]*b[8],
    a[6]*b[0] + a[7]*b[3] + a[8]*b[6],
    a[6]*b[1] + a[7]*b[4] + a[8]*b[7],
    a[6]*b[2] + a[7]*b[5] + a[8]*b[8],
  ];
}

/** 3x3 행렬 × 벡터3 곱셈 */
function mulVec(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0]*v[0] + m[1]*v[1] + m[2]*v[2],
    m[3]*v[0] + m[4]*v[1] + m[5]*v[2],
    m[6]*v[0] + m[7]*v[1] + m[8]*v[2],
  ];
}

/** 벡터 덧셈 */
function addVec(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

// ============================================
// 정운동학 재귀 순회
// ============================================

/** 관절별 월드 좌표 결과 */
type JointPositions = Record<JointId, Vec3>;

/**
 * 뼈대 트리를 재귀 순회하며 각 관절의 월드 좌표 계산
 * @param node 현재 뼈 노드
 * @param parentWorldPos 부모 관절의 월드 좌표
 * @param parentWorldRot 부모까지 누적된 월드 회전 행렬
 * @param jointRotations 각 관절의 로컬 회전값 (라디안)
 * @param result 결과 맵 (누적)
 */
function traverseSkeleton(
  node: BoneNode,
  parentWorldPos: Vec3,
  parentWorldRot: Mat3,
  jointRotations: Record<JointId, Vec3>,
  result: JointPositions
): void {
  // 1. 부모 회전 행렬로 로컬 오프셋을 월드 공간으로 변환
  const worldOffset = mulVec(parentWorldRot, node.offset);
  // 2. 부모 월드 좌표 + 회전된 오프셋 = 현재 관절의 월드 좌표
  const worldPos = addVec(parentWorldPos, worldOffset);
  result[node.id] = worldPos;

  // 3. 현재 관절의 로컬 회전 → 회전 행렬
  const rot = jointRotations[node.id] || [0, 0, 0];
  const localRot = eulerToMatrix(rot[0], rot[1], rot[2]);
  // 4. 누적 월드 회전 = 부모 회전 × 로컬 회전
  const worldRot = mulMat(parentWorldRot, localRot);

  // 5. 자식 관절 재귀 처리
  for (const child of node.children) {
    traverseSkeleton(child, worldPos, worldRot, jointRotations, result);
  }
}

// ============================================
// 공개 API
// ============================================

/** 관절 순서 (포즈 벡터에서의 인덱스 순서) */
const JOINT_ORDER: JointId[] = [
  'pelvis', 'spine', 'chest', 'neck', 'head',
  'leftShoulder', 'leftElbow', 'leftWrist',
  'rightShoulder', 'rightElbow', 'rightWrist',
  'leftHip', 'leftKnee', 'leftAnkle',
  'rightHip', 'rightKnee', 'rightAnkle',
];

/**
 * 관절 회전값으로부터 17개 관절의 월드 좌표를 계산
 * @param joints 각 관절의 Euler 회전값 (라디안 [x, y, z])
 * @param bodyType 체형 타입 (기본: neutral)
 * @returns 17관절 × 3좌표 = 51개 숫자 배열
 */
export function computePoseVector(
  joints: Record<JointId, [number, number, number]>,
  bodyType: BodyType = 'neutral'
): number[] {
  const skeleton = createSkeleton(bodyType);
  const result = {} as JointPositions;

  // 루트(골반)는 부모가 없으므로 원점에서 시작
  traverseSkeleton(
    skeleton,
    [0, 0, 0],  // 루트의 부모 위치 = 원점 (오프셋이 이미 [0, 0.9, 0])
    identity(),
    joints as Record<JointId, Vec3>,
    result
  );

  // 정렬된 순서로 좌표를 플랫 배열로 변환
  const vector: number[] = [];
  for (const id of JOINT_ORDER) {
    const pos = result[id];
    vector.push(pos[0], pos[1], pos[2]);
  }

  return vector;
}

/**
 * 모든 관절이 0인 기본 T-pose의 월드 좌표 계산
 * 검증 및 기본값 생성용
 */
export function computeDefaultPoseVector(bodyType: BodyType = 'neutral'): number[] {
  const defaultJoints = {} as Record<JointId, [number, number, number]>;
  for (const id of JOINT_ORDER) {
    defaultJoints[id] = [0, 0, 0];
  }
  return computePoseVector(defaultJoints, bodyType);
}

export { JOINT_ORDER };
export type { Vec3, BodyType, JointPositions };
