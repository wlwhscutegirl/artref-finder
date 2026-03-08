// ============================================
// MediaPipe 33 랜드마크 → ArtRef 17 관절 매핑
// 좌표계 변환 + 포즈 벡터 생성
// ============================================

import { normalizePoseVector } from '@/lib/pose-similarity';
import type { JointId } from '@/stores/pose-store';

/** MediaPipe 랜드마크 (33개 중 하나) */
export interface MediaPipeLandmark {
  x: number;       // 0~1 정규화 좌표 (왼→오른)
  y: number;       // 0~1 정규화 좌표 (위→아래)
  z: number;       // 깊이 (카메라 기준)
  visibility: number; // 0~1 신뢰도
}

/** ArtRef 관절 좌표 (월드 스케일) */
export interface ArtRefJointPosition {
  jointId: JointId;
  x: number;
  y: number;
  z: number;
  confidence: number; // 원본 visibility 기반
}

// ============================================
// 매핑 테이블
// ============================================

/** MediaPipe 인덱스 → ArtRef JointId 직접 매핑 (13개) */
const DIRECT_MAPPING: Record<number, JointId> = {
  0: 'head',           // nose
  11: 'leftShoulder',
  12: 'rightShoulder',
  13: 'leftElbow',
  14: 'rightElbow',
  15: 'leftWrist',
  16: 'rightWrist',
  23: 'leftHip',
  24: 'rightHip',
  25: 'leftKnee',
  26: 'rightKnee',
  27: 'leftAnkle',
  28: 'rightAnkle',
};

/** 관절 순서 (pose-vectors.ts의 JOINT_ORDER와 동일) */
const JOINT_ORDER: JointId[] = [
  'pelvis', 'spine', 'chest', 'neck', 'head',
  'leftShoulder', 'leftElbow', 'leftWrist',
  'rightShoulder', 'rightElbow', 'rightWrist',
  'leftHip', 'leftKnee', 'leftAnkle',
  'rightHip', 'rightKnee', 'rightAnkle',
];

/**
 * MediaPipe → ArtRef 좌표계 변환
 * MediaPipe: x=오른쪽, y=아래, z=카메라 방향 (0~1 정규화)
 * ArtRef FK: x=오른쪽, y=위, z=앞쪽 (미터 단위)
 */
const COORD_SCALE = 2.0;

/** 랜드마크 하나를 ArtRef 좌표로 변환 */
function convertCoord(lm: MediaPipeLandmark): { x: number; y: number; z: number } {
  return {
    x: (lm.x - 0.5) * COORD_SCALE,      // 중심 기준 좌우
    y: (1 - lm.y) * COORD_SCALE,          // y 반전 (아래→위)
    z: -lm.z * COORD_SCALE,               // z 반전 (카메라→앞쪽)
  };
}

/** 두 랜드마크의 중점 계산 */
function midpoint(a: MediaPipeLandmark, b: MediaPipeLandmark): MediaPipeLandmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: Math.min(a.visibility, b.visibility),
  };
}

// ============================================
// 공개 API
// ============================================

/**
 * 33개 MediaPipe 랜드마크 → 17개 ArtRef 관절 좌표로 변환
 * @param landmarks MediaPipe 추출 결과 (33개)
 * @returns 17개 관절 좌표 배열 (JOINT_ORDER 순서)
 */
export function mapLandmarksToJoints(
  landmarks: MediaPipeLandmark[]
): ArtRefJointPosition[] {
  if (landmarks.length < 33) return [];

  const joints: Map<JointId, ArtRefJointPosition> = new Map();

  // 1단계: 직접 매핑 (13개)
  for (const [mpIdx, jointId] of Object.entries(DIRECT_MAPPING)) {
    const lm = landmarks[Number(mpIdx)];
    const coord = convertCoord(lm);
    joints.set(jointId, {
      jointId,
      ...coord,
      confidence: lm.visibility,
    });
  }

  // 2단계: 합성 관절 (4개)

  // pelvis = 양 엉덩이 중점
  const pelvisLm = midpoint(landmarks[23], landmarks[24]);
  const pelvisCoord = convertCoord(pelvisLm);
  joints.set('pelvis', {
    jointId: 'pelvis',
    ...pelvisCoord,
    confidence: pelvisLm.visibility,
  });

  // neck = 양 어깨 중점
  const neckLm = midpoint(landmarks[11], landmarks[12]);
  const neckCoord = convertCoord(neckLm);
  joints.set('neck', {
    jointId: 'neck',
    ...neckCoord,
    confidence: neckLm.visibility,
  });

  // chest = 양 어깨 중점에서 약간 아래 (pelvis 방향으로 20%)
  const chestLm = midpoint(landmarks[11], landmarks[12]);
  const chestCoord = convertCoord(chestLm);
  // pelvis 방향으로 20% 이동
  chestCoord.y = chestCoord.y * 0.8 + pelvisCoord.y * 0.2;
  joints.set('chest', {
    jointId: 'chest',
    ...chestCoord,
    confidence: chestLm.visibility,
  });

  // spine = pelvis와 chest의 중점
  const spineX = (pelvisCoord.x + chestCoord.x) / 2;
  const spineY = (pelvisCoord.y + chestCoord.y) / 2;
  const spineZ = (pelvisCoord.z + chestCoord.z) / 2;
  joints.set('spine', {
    jointId: 'spine',
    x: spineX,
    y: spineY,
    z: spineZ,
    confidence: Math.min(pelvisLm.visibility, chestLm.visibility),
  });

  // JOINT_ORDER 순서로 정렬하여 반환
  return JOINT_ORDER.map((id) => joints.get(id)!).filter(Boolean);
}

/**
 * 17개 관절 좌표 → 51-element 정규화 포즈 벡터
 * comparePoses()에 바로 사용 가능
 */
export function jointsToVector(joints: ArtRefJointPosition[]): number[] {
  if (joints.length !== 17) return [];

  // 플랫 배열로 변환 [x0, y0, z0, x1, y1, z1, ...]
  const raw: number[] = [];
  for (const joint of joints) {
    raw.push(joint.x, joint.y, joint.z);
  }

  // Procrustes 정규화 적용
  return normalizePoseVector(raw);
}

/**
 * 신뢰도 기반 관절 가중치 생성
 * visibility가 낮은 관절은 유사도 비교 시 가중치 감소
 */
export function jointsToWeights(joints: ArtRefJointPosition[]): number[] {
  return joints.map((j) => {
    // 신뢰도 0.5 미만이면 가중치 0 (매칭에서 무시)
    if (j.confidence < 0.5) return 0;
    // 0.5~1.0을 0~1로 스케일
    return (j.confidence - 0.5) * 2;
  });
}

/**
 * 관절 좌표를 Record 형태로 변환 (Inverse FK 입력용)
 */
export function jointsToRecord(
  joints: ArtRefJointPosition[]
): Record<JointId, [number, number, number]> {
  const result = {} as Record<JointId, [number, number, number]>;
  for (const j of joints) {
    result[j.jointId] = [j.x, j.y, j.z];
  }
  return result;
}

/** 뼈대 연결 정의 (오버레이 렌더링용) */
export const BONE_CONNECTIONS: [JointId, JointId][] = [
  ['pelvis', 'spine'], ['spine', 'chest'],
  ['chest', 'neck'], ['neck', 'head'],
  ['chest', 'leftShoulder'], ['leftShoulder', 'leftElbow'], ['leftElbow', 'leftWrist'],
  ['chest', 'rightShoulder'], ['rightShoulder', 'rightElbow'], ['rightElbow', 'rightWrist'],
  ['pelvis', 'leftHip'], ['leftHip', 'leftKnee'], ['leftKnee', 'leftAnkle'],
  ['pelvis', 'rightHip'], ['rightHip', 'rightKnee'], ['rightKnee', 'rightAnkle'],
];
