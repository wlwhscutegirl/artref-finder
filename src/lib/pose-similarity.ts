// ============================================
// 포즈 유사도 엔진
// Procrustes 정규화 + 코사인 유사도
// 스케일/위치 불변 포즈 비교
// ============================================

/** 관절별 가중치 프리셋 */
export interface JointWeights {
  /** 17개 관절에 대한 가중치 (0~1) */
  weights: number[];
}

// 기본 가중치 (모든 관절 동일)
const DEFAULT_WEIGHTS: number[] = Array(17).fill(1.0);

// 상체 강조 가중치 (어깨, 팔꿈치, 손목에 높은 가중치)
export const UPPER_BODY_WEIGHTS: number[] = [
  0.5,  // pelvis
  0.7,  // spine
  0.8,  // chest
  0.9,  // neck
  0.9,  // head
  1.0,  // leftShoulder
  1.0,  // leftElbow
  1.0,  // leftWrist
  1.0,  // rightShoulder
  1.0,  // rightElbow
  1.0,  // rightWrist
  0.3,  // leftHip
  0.3,  // leftKnee
  0.3,  // leftAnkle
  0.3,  // rightHip
  0.3,  // rightKnee
  0.3,  // rightAnkle
];

// 하체 강조 가중치
export const LOWER_BODY_WEIGHTS: number[] = [
  0.5,  // pelvis
  0.3,  // spine
  0.3,  // chest
  0.3,  // neck
  0.3,  // head
  0.3,  // leftShoulder
  0.3,  // leftElbow
  0.3,  // leftWrist
  0.3,  // rightShoulder
  0.3,  // rightElbow
  0.3,  // rightWrist
  1.0,  // leftHip
  1.0,  // leftKnee
  1.0,  // leftAnkle
  1.0,  // rightHip
  1.0,  // rightKnee
  1.0,  // rightAnkle
];

/**
 * Procrustes 정규화: 중심 이동 + 단위 스케일
 * 포즈의 위치와 크기를 표준화하여 순수 형태만 비교 가능하게 함
 * @param v 51개 원소 배열 (17관절 × 3좌표)
 * @returns 정규화된 벡터
 */
export function normalizePoseVector(v: number[]): number[] {
  const n = v.length / 3; // 관절 수
  if (n === 0) return [];

  // 1단계: 중심(centroid) 계산
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < n; i++) {
    cx += v[i * 3];
    cy += v[i * 3 + 1];
    cz += v[i * 3 + 2];
  }
  cx /= n; cy /= n; cz /= n;

  // 2단계: 중심을 원점으로 이동
  const centered: number[] = new Array(v.length);
  for (let i = 0; i < n; i++) {
    centered[i * 3]     = v[i * 3]     - cx;
    centered[i * 3 + 1] = v[i * 3 + 1] - cy;
    centered[i * 3 + 2] = v[i * 3 + 2] - cz;
  }

  // 3단계: 벡터 크기(norm)로 나누어 단위 벡터화
  let norm = 0;
  for (let i = 0; i < centered.length; i++) {
    norm += centered[i] * centered[i];
  }
  norm = Math.sqrt(norm);

  // 0벡터 방지
  if (norm < 1e-10) return centered;

  for (let i = 0; i < centered.length; i++) {
    centered[i] /= norm;
  }

  return centered;
}

/**
 * 코사인 유사도 계산
 * 두 정규화된 포즈 벡터 간의 유사도 (0~1)
 * @param a 정규화된 포즈 벡터 A
 * @param b 정규화된 포즈 벡터 B
 * @param weights 관절별 가중치 (선택)
 * @returns 0~1 범위의 유사도 (1 = 동일 포즈)
 */
export function computeSimilarity(
  a: number[],
  b: number[],
  weights?: number[]
): number {
  if (a.length !== b.length || a.length === 0) return 0;

  const jointWeights = weights || DEFAULT_WEIGHTS;
  const n = a.length / 3;

  // 가중치를 좌표 단위로 확장 (각 관절의 xyz에 동일 가중치)
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < n; i++) {
    const w = jointWeights[i] ?? 1.0;
    for (let j = 0; j < 3; j++) {
      const idx = i * 3 + j;
      const wa = a[idx] * w;
      const wb = b[idx] * w;
      dotProduct += wa * wb;
      normA += wa * wa;
      normB += wb * wb;
    }
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom < 1e-10) return 0;

  // 코사인 유사도 (원래 -1~1 범위)
  const rawSimilarity = dotProduct / denom;

  // 0~1로 클램프
  const clamped = Math.max(0, Math.min(1, rawSimilarity));

  // 시그모이드 매핑으로 점수 분포 개선
  // 기존 문제: 대부분 0.3~0.9에 몰려 랭킹 변별력이 약함
  // 시그모이드 적용: 0.6 이상 = 유사, 0.4 이하 = 다름으로 명확히 분리
  // k=8 (기울기 급격도), threshold=0.6 (중심점)
  return sigmoidMap(clamped, 8, 0.6);
}

/**
 * 시그모이드 매핑: 유사도 점수를 S-curve로 변환
 * 중심(threshold) 근처에서 급격히 변하여 유사/비유사를 명확히 분리
 * @param x 입력 유사도 (0~1)
 * @param k 기울기 급격도 (높을수록 급격한 전환)
 * @param threshold 중심점 (이 값 기준으로 점수가 갈림)
 * @returns 변환된 유사도 (0~1)
 */
function sigmoidMap(x: number, k: number = 8, threshold: number = 0.6): number {
  return 1 / (1 + Math.exp(-k * (x - threshold)));
}

/**
 * 두 원본 포즈 벡터 간의 유사도를 한 번에 계산
 * 내부적으로 정규화 → 코사인 유사도 순서 실행
 * @param rawA 원본 포즈 벡터 A (51개)
 * @param rawB 원본 포즈 벡터 B (51개)
 * @param weights 관절별 가중치 (선택)
 * @returns 0~1 유사도
 */
export function comparePoses(
  rawA: number[],
  rawB: number[],
  weights?: number[]
): number {
  const normA = normalizePoseVector(rawA);
  const normB = normalizePoseVector(rawB);
  return computeSimilarity(normA, normB, weights);
}
