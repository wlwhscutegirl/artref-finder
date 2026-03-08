// ============================================
// 샘플 이미지용 합성 조명 방향 데이터
// 조명 태그 → LightDirection 매핑 + 이미지별 할당
// camera-vectors.ts 패턴 동일 적용
// ============================================

import type { LightDirection } from '@/types';

// ============================================
// 조명 태그 → 기준 LightDirection 매핑 테이블
// TAG_GROUPS.light의 태그와 대응
// ============================================

/** 조명 태그별 기준 광원 방향 값 */
const TAG_TO_LIGHT_DIRECTION: Record<string, LightDirection> = {
  // 정면광: 카메라 방향에서 비추는 플랫 라이트
  '정면광': { azimuth: 0, elevation: 20, intensity: 0.6 },
  // 역광: 피사체 뒤에서 비추는 백라이트
  '역광': { azimuth: 180, elevation: 30, intensity: 0.7 },
  // 측광: 옆에서 비추는 사이드 라이트 (90도)
  '측광': { azimuth: 90, elevation: 15, intensity: 0.8 },
  // 탑라이트: 위에서 아래로 비추는 오버헤드 라이트
  '탑라이트': { azimuth: 0, elevation: 75, intensity: 0.7 },
  // 림라이트: 뒤쪽 측면에서 비추어 윤곽선 강조
  '림라이트': { azimuth: 150, elevation: 25, intensity: 0.7 },
  // 하드라이트: 강한 직사광 (높은 intensity)
  '하드라이트': { azimuth: 45, elevation: 35, intensity: 0.9 },
  // 소프트라이트: 부드러운 확산광 (낮은 intensity)
  '소프트라이트': { azimuth: 30, elevation: 25, intensity: 0.4 },
  // 자연광: 야외 태양광 시뮬레이션
  '자연광': { azimuth: 60, elevation: 55, intensity: 0.7 },
  // 인공광: 실내 조명 (정면 약간 측면)
  '인공광': { azimuth: 30, elevation: 30, intensity: 0.65 },
  // 골든아워: 해 뜨거나 질 무렵의 따뜻한 황금빛
  '골든아워': { azimuth: 70, elevation: 10, intensity: 0.75 },
  // 블루아워: 해 지고 난 직후의 차가운 푸른빛
  '블루아워': { azimuth: 50, elevation: 5, intensity: 0.5 },
};

// ============================================
// 결정론적 랜덤 유틸리티 (camera-vectors.ts와 동일)
// ============================================

/**
 * 시드 기반 결정론적 난수
 * @param seed 난수 시드 값
 * @returns 0~1 범위의 결정론적 난수
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

/**
 * 문자열 → 해시 시드 값 생성
 * 이미지 ID를 숫자 시드로 변환
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // 32비트 정수 변환
  }
  return Math.abs(hash);
}

/** 값을 min~max 범위로 제한 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================
// 보조 태그 보정
// ============================================

/**
 * 보조 태그로 azimuth 보정 적용
 * 역광/림라이트 등이 함께 있으면 azimuth에 가산 보정
 */
function computeAzimuthBonus(
  tags: string[],
  primaryTag: string,
  seed: number
): number {
  let bonus = 0;

  for (const tag of tags) {
    if (tag === primaryTag) continue; // 주 태그 중복 방지

    if (tag === '역광') {
      // 역광이 보조 태그면 azimuth +120~+180 보정
      bonus += 120 + seededRandom(seed + 100) * 60;
    } else if (tag === '림라이트') {
      // 림라이트 보조 태그면 azimuth +100~+160 보정
      bonus += 100 + seededRandom(seed + 200) * 60;
    } else if (tag === '측광') {
      // 측광 보조 태그면 azimuth +60~+90 보정
      bonus += 60 + seededRandom(seed + 300) * 30;
    }
  }

  return bonus;
}

// ============================================
// 공개 API
// ============================================

/**
 * 이미지 태그로부터 합성 LightDirection 생성
 * 조명 관련 태그가 있으면 해당 기준 방향 + 약간의 노이즈
 * 태그가 없으면 undefined 반환
 *
 * @param tags 이미지 태그 목록
 * @param imageId 노이즈 시드용 이미지 ID
 * @returns LightDirection 또는 undefined
 */
export function generateLightDirectionForImage(
  tags: string[],
  imageId: string
): LightDirection | undefined {
  // 첫 번째 매칭되는 조명 태그를 주 태그로 사용
  let primaryTag: string | null = null;
  let baseDirection: LightDirection | null = null;

  for (const tag of tags) {
    if (TAG_TO_LIGHT_DIRECTION[tag]) {
      primaryTag = tag;
      baseDirection = TAG_TO_LIGHT_DIRECTION[tag];
      break;
    }
  }

  // 조명 태그 없으면 undefined
  if (!primaryTag || !baseDirection) return undefined;

  // 이미지 ID 기반 시드 생성
  const seed = hashString(imageId);

  // 노이즈 생성 (azimuth +/-15, elevation +/-10, intensity +/-0.1)
  const azNoise = (seededRandom(seed + 1) - 0.5) * 30;      // +/-15도
  const elNoise = (seededRandom(seed + 2) - 0.5) * 20;      // +/-10도
  const intNoise = (seededRandom(seed + 3) - 0.5) * 0.2;    // +/-0.1

  // 보조 태그 보정
  const azBonus = computeAzimuthBonus(tags, primaryTag, seed);

  // 최종 값 계산 + 범위 제한
  const azimuth = ((baseDirection.azimuth + azNoise + azBonus) % 360 + 360) % 360;
  const elevation = clamp(baseDirection.elevation + elNoise, -90, 90);
  const intensity = clamp(baseDirection.intensity + intNoise, 0, 1);

  return { azimuth, elevation, intensity };
}

/** 조명 태그 → 기준 LightDirection 매핑 테이블 (외부 참조용) */
export { TAG_TO_LIGHT_DIRECTION };
