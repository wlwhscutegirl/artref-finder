// ============================================
// 카메라 앵글 벡터 매칭 (Phase 3 Step 1)
// 3D 카메라 위치 → pitch/yaw/fov 추출 + 유사도 계산
// ============================================

import type { CameraAngle } from '@/types';

/** 3D 벡터 타입 */
type Vec3 = [number, number, number];

/**
 * 3D 카메라 위치와 타겟으로부터 CameraAngle 추출
 * pitch: 상하 각도 (-90 ~ 90), yaw: 좌우 각도 (-180 ~ 180)
 * @param position 카메라 위치 [x, y, z]
 * @param target 카메라가 바라보는 대상 좌표 [x, y, z]
 * @param fov 화각 (기본 50)
 */
export function extractCameraAngle(
  position: Vec3,
  target: Vec3,
  fov: number = 50
): CameraAngle {
  // 카메라에서 타겟으로의 방향 벡터
  const dx = target[0] - position[0];
  const dy = target[1] - position[1];
  const dz = target[2] - position[2];

  // 수평 거리 (xz 평면)
  const horizontalDist = Math.sqrt(dx * dx + dz * dz);

  // pitch: 상하 각도 (양수 = 위를 봄, 음수 = 아래를 봄)
  // atan2(dy, horizontalDist) → 카메라가 타겟을 올려다보면 양수
  const pitchRad = Math.atan2(dy, horizontalDist);
  const pitch = clamp(pitchRad * (180 / Math.PI), -90, 90);

  // yaw: 좌우 각도 (atan2로 수평 회전 계산)
  const yawRad = Math.atan2(dx, dz);
  let yaw = yawRad * (180 / Math.PI);
  // -180 ~ 180 범위로 정규화
  if (yaw > 180) yaw -= 360;
  if (yaw < -180) yaw += 360;

  // 앵글 타입 자동 분류
  const type = classifyCameraType(pitch);

  return { pitch, yaw, fov, type };
}

/**
 * 두 CameraAngle 간 유사도 계산 (0 ~ 1)
 * pitch와 yaw 각도 차이 기반, fov 차이도 약간 반영
 */
export function computeCameraAngleSimilarity(
  a: CameraAngle,
  b: CameraAngle
): number {
  // pitch 차이 (최대 180도 범위)
  const pitchDiff = Math.abs(a.pitch - b.pitch);
  const pitchSimilarity = 1 - pitchDiff / 90; // 90도 차이면 0

  // yaw 차이 (원형 각도이므로 최단 경로 계산)
  let yawDiff = Math.abs(a.yaw - b.yaw);
  if (yawDiff > 180) yawDiff = 360 - yawDiff;
  const yawSimilarity = 1 - yawDiff / 180; // 180도 차이면 0

  // fov 차이 (보조 요소, 가중치 낮음)
  const fovDiff = Math.abs(a.fov - b.fov);
  const fovSimilarity = 1 - Math.min(fovDiff / 60, 1); // 60도 차이면 0

  // 가중 합산: pitch 45%, yaw 45%, fov 10%
  const similarity = pitchSimilarity * 0.45 + yawSimilarity * 0.45 + fovSimilarity * 0.1;

  return clamp(similarity, 0, 1);
}

/**
 * pitch 값으로 카메라 앵글 타입 분류
 * 실제 촬영 관행 기준으로 각도 구간 설정
 */
function classifyCameraType(pitch: number): CameraAngle['type'] {
  if (pitch >= 60) return 'bird';     // 조감도 (거의 수직 하향)
  if (pitch >= 15) return 'high';     // 하이앵글 (위에서 내려다봄)
  if (pitch >= -15) return 'eye';     // 아이레벨 (눈높이)
  if (pitch >= -60) return 'low';     // 로우앵글 (아래에서 올려다봄)
  return 'worm';                       // 벌레 시점 (거의 수직 상향)
}

/** 값을 min~max 범위로 제한 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================
// 렌즈 초점거리(mm) ↔ FOV(degree) 매핑
// 풀프레임(36mm 센서) 기준 수평 FOV
// ============================================

/** 렌즈 초점거리(mm) → FOV(degree) 변환 테이블 (풀프레임 기준) */
export const LENS_MM_TO_FOV: Record<number, number> = {
  35: 63,
  50: 47,
  85: 29,
  135: 18,
};

/**
 * FOV(degree) → 가장 가까운 렌즈 초점거리(mm) 반환
 * LENS_MM_TO_FOV 테이블에서 FOV 차이가 가장 작은 렌즈를 선택
 */
export function fovToLensMM(fov: number): number {
  const entries = Object.entries(LENS_MM_TO_FOV);
  let closestMM = Number(entries[0][0]);
  let minDiff = Math.abs(entries[0][1] - fov);

  // 모든 렌즈의 FOV와 비교하여 가장 가까운 것을 찾음
  for (const [mm, lensFov] of entries) {
    const diff = Math.abs(lensFov - fov);
    if (diff < minDiff) {
      minDiff = diff;
      closestMM = Number(mm);
    }
  }

  return closestMM;
}
