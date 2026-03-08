// ============================================
// 샘플 이미지용 합성 포즈 벡터 생성
// 8개 포즈 프리셋의 FK 좌표 기반으로
// 각 이미지에 랜덤 변형된 포즈 벡터 할당
// ============================================

import { computePoseVector } from '@/lib/forward-kinematics';
import { normalizePoseVector } from '@/lib/pose-similarity';
import type { JointId } from '@/stores/pose-store';

// ============================================
// 8개 포즈 프리셋의 관절 회전값 (라디안)
// pose-presets.ts의 프리셋 ID와 매칭
// ============================================

type JointRotations = Record<JointId, [number, number, number]>;

/** 모든 관절 0으로 초기화 */
function defaultJoints(): JointRotations {
  return {
    pelvis: [0, 0, 0], spine: [0, 0, 0], chest: [0, 0, 0],
    neck: [0, 0, 0], head: [0, 0, 0],
    leftShoulder: [0, 0, 0], leftElbow: [0, 0, 0], leftWrist: [0, 0, 0],
    rightShoulder: [0, 0, 0], rightElbow: [0, 0, 0], rightWrist: [0, 0, 0],
    leftHip: [0, 0, 0], leftKnee: [0, 0, 0], leftAnkle: [0, 0, 0],
    rightHip: [0, 0, 0], rightKnee: [0, 0, 0], rightAnkle: [0, 0, 0],
  };
}

/** 도 → 라디안 변환 헬퍼 */
const deg = (d: number) => (d * Math.PI) / 180;

/** 각 포즈 프리셋별 관절 회전 정의 */
const POSE_ROTATIONS: Record<string, JointRotations> = {
  // 서기: 기본 직립 자세 (거의 0)
  standing: {
    ...defaultJoints(),
  },

  // 앉기: 엉덩이/무릎 굴곡
  sitting: {
    ...defaultJoints(),
    leftHip: [deg(-90), 0, 0],
    rightHip: [deg(-90), 0, 0],
    leftKnee: [deg(90), 0, 0],
    rightKnee: [deg(90), 0, 0],
    spine: [deg(-10), 0, 0],
  },

  // 걷기: 팔다리 교차 (왼발 앞, 오른팔 앞)
  walking: {
    ...defaultJoints(),
    leftHip: [deg(-30), 0, 0],
    rightHip: [deg(15), 0, 0],
    leftKnee: [deg(10), 0, 0],
    rightKnee: [deg(30), 0, 0],
    rightShoulder: [deg(-20), 0, 0],
    leftShoulder: [deg(10), 0, 0],
    rightElbow: [deg(-15), 0, 0],
  },

  // 달리기: 걷기보다 과장된 동작
  running: {
    ...defaultJoints(),
    leftHip: [deg(-50), 0, 0],
    rightHip: [deg(30), 0, 0],
    leftKnee: [deg(40), 0, 0],
    rightKnee: [deg(60), 0, 0],
    rightShoulder: [deg(-40), 0, 0],
    leftShoulder: [deg(30), 0, 0],
    rightElbow: [deg(-40), 0, 0],
    leftElbow: [deg(-30), 0, 0],
    spine: [deg(-15), 0, 0],
  },

  // 뒤돌아보기: 골반-목 반대 회전
  'looking-back': {
    ...defaultJoints(),
    pelvis: [0, deg(30), 0],
    neck: [0, deg(-45), 0],
    head: [0, deg(-15), 0],
    spine: [0, deg(-15), 0],
  },

  // 팔 뻗기: 한쪽 팔을 앞으로 뻗음
  reaching: {
    ...defaultJoints(),
    rightShoulder: [deg(-90), 0, 0],
    rightElbow: [deg(-10), 0, 0],
    spine: [deg(-5), 0, 0],
  },

  // 웅크리기: 깊은 스쿼트 자세
  crouching: {
    ...defaultJoints(),
    leftHip: [deg(-100), 0, 0],
    rightHip: [deg(-100), 0, 0],
    leftKnee: [deg(120), 0, 0],
    rightKnee: [deg(120), 0, 0],
    spine: [deg(-20), 0, 0],
    chest: [deg(-10), 0, 0],
    leftShoulder: [deg(-20), 0, 0],
    rightShoulder: [deg(-20), 0, 0],
  },

  // 기대기: 척추 측면 기울임
  leaning: {
    ...defaultJoints(),
    spine: [0, 0, deg(20)],
    chest: [0, 0, deg(10)],
    leftShoulder: [0, 0, deg(-15)],
    rightShoulder: [deg(-20), 0, 0],
    leftHip: [0, 0, deg(-10)],
  },

  // ---- 액션/격투 포즈 프리셋 (Phase 3 추가) ----

  // 발차기: 한쪽 다리를 높이 차올림, 상체는 약간 뒤로
  kick: {
    ...defaultJoints(),
    rightHip: [deg(-110), 0, 0],   // 오른다리 높이 차올림
    rightKnee: [deg(30), 0, 0],    // 무릎 약간 구부림
    leftHip: [deg(10), 0, 0],      // 축 다리 약간 뒤로
    leftKnee: [deg(15), 0, 0],     // 축 무릎 살짝 구부림
    spine: [deg(10), 0, 0],        // 상체 약간 뒤로 젖힘
    leftShoulder: [deg(-30), 0, deg(-20)],  // 왼팔 균형잡기
    rightShoulder: [deg(-20), 0, deg(15)],  // 오른팔 균형잡기
  },

  // 펀치: 오른팔을 앞으로 강하게 뻗음, 왼팔 방어
  punch: {
    ...defaultJoints(),
    rightShoulder: [deg(-90), deg(20), 0],  // 오른팔 앞으로 뻗기
    rightElbow: [deg(-5), 0, 0],            // 팔꿈치 거의 폄
    leftShoulder: [deg(-70), deg(-30), 0],  // 왼팔 방어 위치
    leftElbow: [deg(-90), 0, 0],            // 왼팔꿈치 크게 구부림
    pelvis: [0, deg(-20), 0],               // 골반 회전 (펀치 파워)
    spine: [0, deg(-10), 0],                // 척추 약간 회전
    leftHip: [deg(-10), 0, 0],              // 앞발
    rightHip: [deg(10), 0, 0],              // 뒷발
  },

  // 방어: 두 팔을 얼굴 앞으로 올려 가드 자세
  guard: {
    ...defaultJoints(),
    leftShoulder: [deg(-80), deg(-20), 0],  // 왼팔 올리기
    leftElbow: [deg(-110), 0, 0],           // 왼팔꿈치 깊게 구부림
    rightShoulder: [deg(-80), deg(20), 0],  // 오른팔 올리기
    rightElbow: [deg(-110), 0, 0],          // 오른팔꿈치 깊게 구부림
    leftHip: [deg(-15), 0, 0],              // 다리 약간 벌림
    rightHip: [deg(-15), 0, 0],
    leftKnee: [deg(20), 0, 0],              // 무릎 살짝 구부림
    rightKnee: [deg(20), 0, 0],
    spine: [deg(-5), 0, 0],                 // 약간 숙임
  },

  // 칼 휘두르기: 양손으로 칼을 대각선으로 내려침
  'sword-swing': {
    ...defaultJoints(),
    rightShoulder: [deg(-140), deg(30), 0],  // 오른팔 높이 올림
    rightElbow: [deg(-30), 0, 0],            // 팔꿈치 약간 구부림
    leftShoulder: [deg(-120), deg(-10), 0],  // 왼팔도 올림 (양손검)
    leftElbow: [deg(-40), 0, 0],
    pelvis: [0, deg(-30), 0],                // 골반 크게 회전
    spine: [0, deg(-15), deg(-10)],          // 척추 비틀기
    chest: [0, deg(-10), 0],
    leftHip: [deg(-20), 0, 0],               // 전진 자세
    rightHip: [deg(15), 0, 0],
  },

  // 무릎꿇기: 한쪽 또는 양쪽 무릎을 바닥에 대는 자세
  kneeling: {
    ...defaultJoints(),
    leftHip: [deg(-90), 0, 0],    // 왼다리 앞으로 구부림
    leftKnee: [deg(90), 0, 0],    // 왼무릎 직각
    rightHip: [deg(-120), 0, 0],  // 오른다리 깊게 구부림
    rightKnee: [deg(140), 0, 0],  // 오른무릎 바닥 닿기
    spine: [deg(-10), 0, 0],      // 약간 숙임
  },

  // 누워있기: 바닥에 누운 자세
  lying: {
    ...defaultJoints(),
    pelvis: [deg(-90), 0, 0],     // 골반을 눕힘 (전체 몸 수평)
    leftShoulder: [deg(-30), 0, deg(-40)],  // 팔 옆으로
    rightShoulder: [deg(-30), 0, deg(40)],
    leftHip: [deg(5), 0, 0],      // 다리 약간 벌림
    rightHip: [deg(5), 0, 0],
  },

  // 점프: 공중에서 팔다리를 벌린 자세
  jumping: {
    ...defaultJoints(),
    leftHip: [deg(-40), 0, deg(-15)],  // 다리 벌려 뛰기
    rightHip: [deg(-40), 0, deg(15)],
    leftKnee: [deg(50), 0, 0],         // 무릎 구부림
    rightKnee: [deg(50), 0, 0],
    leftShoulder: [deg(-150), 0, 0],   // 팔 위로 높이
    rightShoulder: [deg(-150), 0, 0],
    spine: [deg(-10), 0, 0],           // 약간 뒤로 젖힘
  },

  // 포옹: 두 팔을 앞으로 감싸는 자세
  hugging: {
    ...defaultJoints(),
    leftShoulder: [deg(-70), deg(40), 0],   // 왼팔 앞으로 감싸기
    leftElbow: [deg(-90), 0, 0],
    rightShoulder: [deg(-70), deg(-40), 0], // 오른팔 앞으로 감싸기
    rightElbow: [deg(-90), 0, 0],
    spine: [deg(-10), 0, 0],                // 약간 숙임
  },
};

// ============================================
// 프리셋 기준 포즈 벡터 캐시 (정규화 후)
// ============================================

/** 각 프리셋의 정규화된 기준 포즈 벡터 */
const presetVectorCache: Record<string, number[]> = {};

/** 프리셋 ID로 기준 포즈 벡터 가져오기 (캐시) */
function getPresetVector(presetId: string): number[] {
  if (!presetVectorCache[presetId]) {
    const rotations = POSE_ROTATIONS[presetId];
    if (!rotations) return [];
    const rawVector = computePoseVector(rotations);
    presetVectorCache[presetId] = normalizePoseVector(rawVector);
  }
  return presetVectorCache[presetId];
}

// ============================================
// 태그 → 프리셋 매핑
// ============================================

/** 포즈 태그 → 프리셋 ID 매핑 (정확한 FK 회전 기반) */
const TAG_TO_PRESET: Record<string, string> = {
  '서있기': 'standing',
  '앉기': 'sitting',
  '걷기': 'walking',
  '달리기': 'running',
  '뒤돌아보기': 'looking-back',
  '웅크리기': 'crouching',
  '기대기': 'leaning',
  '무릎꿇기': 'kneeling',    // 전용 프리셋 사용
  '점프': 'jumping',          // 전용 점프 프리셋
  '격투': 'guard',            // 격투 → 기본 방어 자세 (가장 범용적)
  '누워있기': 'lying',        // 전용 누운 자세 프리셋
  '포옹': 'hugging',          // 전용 포옹 프리셋
  '발차기': 'kick',           // 발차기 전용
  '펀치': 'punch',            // 펀치 전용
  '칼휘두르기': 'sword-swing', // 칼 전용
};

// ============================================
// 결정론적 랜덤 유틸리티
// ============================================

/** 시드 기반 결정론적 난수 (sample-data.ts와 동일한 알고리즘) */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

/**
 * 포즈 프리셋별 노이즈 스케일 정의
 * 정적 자세(standing)는 작게, 동적 자세(격투)는 크게
 * → 같은 태그의 이미지라도 자연스러운 변형 생성
 */
// 노이즈 스케일 2~3배 확대 → 같은 태그여도 벡터 변별력 향상
const NOISE_SCALE_BY_PRESET: Record<string, number> = {
  standing: 0.10,         // 서기: 미세한 체중이동/팔 위치 변형
  sitting: 0.12,          // 앉기: 등 기울기/다리 각도 변형
  walking: 0.16,          // 걷기: 걸음 폭/팔 스윙 차이
  running: 0.22,          // 달리기: 팔다리 각도 큰 변형
  'looking-back': 0.14,   // 뒤돌아보기: 고개/몸통 회전 차이
  reaching: 0.14,         // 팔 뻗기: 방향/높이 차이
  crouching: 0.12,        // 웅크리기: 깊이/팔 위치 차이
  leaning: 0.14,          // 기대기: 기울기/지지 방향 차이
  kick: 0.25,             // 발차기: 다리 높이/방향 변형 큼
  punch: 0.22,            // 펀치: 팔 방향/체중 이동 변형
  guard: 0.12,            // 방어: 가드 높이/폭 차이
  'sword-swing': 0.25,    // 칼 휘두르기: 궤적/스윙 각도 변형 큼
  kneeling: 0.12,         // 무릎꿇기: 상체 기울기 변형
  lying: 0.10,            // 누워있기: 팔/다리 벌림 변형
  jumping: 0.25,          // 점프: 공중 자세 변형 큼
  hugging: 0.14,          // 포옹: 팔 감싸기 각도 차이
};

/**
 * 두 벡터를 선형 보간(lerp)하여 중간 포즈 생성
 * @param a 벡터 A
 * @param b 벡터 B
 * @param t 보간 비율 (0=A, 1=B)
 * @returns 보간된 벡터
 */
function lerpVectors(a: number[], b: number[], t: number): number[] {
  return a.map((v, i) => v * (1 - t) + (b[i] ?? 0) * t);
}

/**
 * 관절별 독립 노이즈 추가 (상체/하체 분리)
 * 같은 프리셋에서도 자연스럽게 다른 포즈를 생성
 * 상체(관절 0~10)와 하체(관절 11~16)에 다른 크기의 노이즈 적용
 * @param vector 기준 벡터 (정규화됨)
 * @param seed 노이즈 시드
 * @param noiseScale 기본 노이즈 크기
 * @returns 노이즈가 추가된 벡터
 */
function addNoise(vector: number[], seed: number, noiseScale: number = 0.08): number[] {
  // 시드 기반으로 상체/하체 노이즈 비율 결정 (0.7~1.3 범위)
  const upperMultiplier = 0.7 + seededRandom(seed + 9999) * 0.6;
  const lowerMultiplier = 0.7 + seededRandom(seed + 8888) * 0.6;

  return vector.map((v, i) => {
    const jointIdx = Math.floor(i / 3); // 관절 인덱스 (0~16)
    // 상체 관절(0~10)과 하체 관절(11~16)에 다른 노이즈 배율 적용
    const multiplier = jointIdx <= 10 ? upperMultiplier : lowerMultiplier;
    const noise = (seededRandom(seed + i * 7) - 0.5) * 2 * noiseScale * multiplier;
    return v + noise;
  });
}

// ============================================
// 공개 API
// ============================================

/** 포즈 벡터를 생성할 수 있는 카테고리 목록 */
const POSE_VECTOR_CATEGORIES = ['figure', 'anatomy'];

/**
 * 이미지 ID와 태그로부터 합성 포즈 벡터 생성
 * figure + anatomy 카테고리 이미지에 포즈 벡터 부여
 * (anatomy = 인체 해부학 참고 이미지로, 포즈 매칭이 유의미함)
 *
 * @param imageId 이미지 고유 ID
 * @param tags 이미지 태그 목록
 * @param category 이미지 카테고리
 * @returns 정규화된 포즈 벡터 (51개) 또는 undefined
 */
export function generatePoseVectorForImage(
  imageId: string,
  tags: string[],
  category: string
): number[] | undefined {
  // figure / anatomy 카테고리만 포즈 벡터 생성
  if (!POSE_VECTOR_CATEGORIES.includes(category)) return undefined;

  // 태그에서 매칭되는 프리셋 찾기 (우선순위: 구체적 태그 > 일반 태그)
  let presetId = 'standing'; // 기본값
  for (const tag of tags) {
    if (TAG_TO_PRESET[tag]) {
      presetId = TAG_TO_PRESET[tag];
      break;
    }
  }

  // 기준 포즈 벡터 가져오기
  const baseVector = getPresetVector(presetId);
  if (baseVector.length === 0) return undefined;

  // 이미지 ID 기반 시드
  const seed = parseInt(imageId, 10) || imageId.charCodeAt(0);

  // --- 프리셋 보간: 30% 확률로 두 프리셋을 혼합하여 하이브리드 포즈 생성 ---
  // 같은 태그여도 다양한 중간 포즈가 생성되어 매칭 변별력 향상
  let finalBase = baseVector;
  if (seededRandom(seed + 7777) < 0.3) {
    // 모든 프리셋 ID 목록에서 시드 기반으로 보간 대상 선택
    const presetIds = Object.keys(POSE_ROTATIONS);
    const blendIdx = Math.floor(seededRandom(seed + 6666) * presetIds.length);
    const blendPresetId = presetIds[blendIdx];
    const blendVector = getPresetVector(blendPresetId);
    if (blendVector.length === baseVector.length) {
      // 보간 비율 0.2~0.8 (원본 포즈를 유지하면서 약간 혼합)
      const t = 0.2 + seededRandom(seed + 5555) * 0.6;
      finalBase = lerpVectors(baseVector, blendVector, t);
    }
  }

  // 프리셋별 차등 노이즈 스케일 적용
  const noiseScale = NOISE_SCALE_BY_PRESET[presetId] ?? 0.15;

  // anatomy 카테고리는 약간 더 큰 노이즈 (해부학적 변형 반영)
  const categoryMultiplier = category === 'anatomy' ? 1.3 : 1.0;

  return addNoise(finalBase, seed, noiseScale * categoryMultiplier);
}

/**
 * 전체 이미지 목록에 대해 포즈 벡터를 일괄 생성
 * sample-data.ts에서 병합할 때 사용
 */
export function generateAllPoseVectors(
  images: Array<{ _id: string; tags: string[]; category: string }>
): Map<string, number[]> {
  const result = new Map<string, number[]>();

  for (const img of images) {
    const vector = generatePoseVectorForImage(img._id, img.tags, img.category);
    if (vector) {
      result.set(img._id, vector);
    }
  }

  return result;
}

/** 모든 프리셋의 기준 벡터를 미리 계산 (워밍업) */
export function warmupPresetVectors(): void {
  for (const id of Object.keys(POSE_ROTATIONS)) {
    getPresetVector(id);
  }
}

export { POSE_ROTATIONS, getPresetVector };
