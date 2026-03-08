// ============================================
// 조명 방향 벡터 매칭 (lighting-simulation)
// 3D 조명 설정 → azimuth/elevation/intensity 비교
// camera-matching.ts 패턴 동일 적용
// ============================================

import type { LightDirection } from '@/types';

/** 값을 min~max 범위로 제한 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * azimuth 각도 차이 계산 (원형 각도 최단 경로)
 * 0도와 350도의 차이는 10도 (360도 순환 고려)
 *
 * @param a 첫 번째 azimuth (0~360)
 * @param b 두 번째 azimuth (0~360)
 * @returns 0~180 범위의 각도 차이
 */
function azimuthDifference(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * 두 LightDirection 간 유사도 계산 (0 ~ 1)
 * azimuth, elevation 각도 차이 + intensity 차이 기반
 *
 * 가중치 배분:
 *   - azimuth (수평 각도): 45% — 조명 방향의 핵심 요소
 *   - elevation (수직 각도): 40% — 탑라이트 vs 로우라이트 구분
 *   - intensity (강도): 15% — 하드/소프트 구분 보조
 *
 * @param a 첫 번째 조명 방향 (3D 뷰어 현재 상태)
 * @param b 두 번째 조명 방향 (이미지 합성 데이터)
 * @returns 0~1 유사도 (1 = 완전 동일)
 */
export function computeLightSimilarity(
  a: LightDirection,
  b: LightDirection
): number {
  // azimuth 유사도 (원형 각도, 최대 차이 180도)
  const azDiff = azimuthDifference(a.azimuth, b.azimuth);
  const azimuthSim = clamp(1 - azDiff / 180, 0, 1);

  // elevation 유사도 (선형, 최대 차이 180도 = -90~90 범위)
  const elDiff = Math.abs(a.elevation - b.elevation);
  const elevationSim = clamp(1 - elDiff / 90, 0, 1);

  // intensity 유사도 (선형, 최대 차이 1.0)
  const intDiff = Math.abs(a.intensity - b.intensity);
  const intensitySim = clamp(1 - intDiff, 0, 1);

  // 가중 합산: azimuth 45% + elevation 40% + intensity 15%
  return azimuthSim * 0.45 + elevationSim * 0.40 + intensitySim * 0.15;
}

/**
 * 멀티 라이트 배열에서 키라이트(가장 강한 광원)를 추출
 * 유사도 비교 시 키라이트 기준으로 매칭
 *
 * @param lights 멀티 라이트 배열 (최대 3개)
 * @returns 가장 intensity가 높은 LightDirection
 */
export function extractKeyLight(
  lights: LightDirection[]
): LightDirection {
  if (lights.length === 0) {
    // 빈 배열이면 기본값 반환
    return { azimuth: 0, elevation: 45, intensity: 0.8 };
  }

  // intensity가 가장 높은 라이트 선택
  let keyLight = lights[0];
  for (let i = 1; i < lights.length; i++) {
    if (lights[i].intensity > keyLight.intensity) {
      keyLight = lights[i];
    }
  }

  return keyLight;
}
