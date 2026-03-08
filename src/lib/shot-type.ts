// ============================================
// 촬영 샷 타입 분류 유틸리티
// StudioBinder 기준 7단계 + 자동 감지
// 카메라 거리/FOV로 샷 타입 추론, 태그 매칭, 유사도 계산
// ============================================

/** 7단계 샷 타입 (StudioBinder 기준) */
export type ShotType =
  | 'extreme-close-up'  // ECU: 눈, 입 등 극단적 클로즈업
  | 'close-up'          // CU: 얼굴 전체
  | 'medium-close-up'   // MCU: 가슴 위 (바스트샷)
  | 'medium-shot'       // MS: 허리 위 (미디엄샷)
  | 'medium-full-shot'  // MFS: 무릎 위 (카우보이샷)
  | 'full-shot'         // FS: 전신 (풀샷)
  | 'wide-shot';        // WS: 전신 + 배경 (와이드샷)

/** 한글 라벨 매핑 (UI 표시용) */
export const SHOT_TYPE_LABELS: Record<ShotType, string> = {
  'extreme-close-up': '익스트림 클로즈업',
  'close-up': '클로즈업',
  'medium-close-up': '미디엄 클로즈업',
  'medium-shot': '미디엄샷',
  'medium-full-shot': '미디엄 풀샷',
  'full-shot': '풀샷',
  'wide-shot': '와이드샷',
};

/** 샷 타입 순서 인덱스 (유사도 계산용, ECU=0 ~ WS=6) */
const SHOT_TYPE_ORDER: ShotType[] = [
  'extreme-close-up',
  'close-up',
  'medium-close-up',
  'medium-shot',
  'medium-full-shot',
  'full-shot',
  'wide-shot',
];

/**
 * 기본 거리 임계값 (FOV 50도 기준)
 * FOV가 넓을수록 같은 거리에서 더 많이 보이므로 임계값을 보정
 */
const BASE_THRESHOLDS = [0.3, 0.5, 0.8, 1.2, 1.8, 2.5]; // ECU/CU/MCU/MS/MFS/FS/WS 경계

/**
 * 3D 카메라 거리/FOV에서 샷 타입 추론
 * - distance: 카메라와 마네킹 중심 사이 거리
 * - fov: 카메라 시야각 (degrees)
 * - mannequinHeight: 마네킹 높이 (기본 1.7)
 *
 * FOV 보정: 기준 FOV(50도) 대비 넓으면 거리를 줄여서 계산 (더 많이 보이므로)
 * FOV가 넓을수록 같은 거리에서도 더 넓은 범위가 보임
 */
export function detectShotType(
  distance: number,
  fov: number,
  mannequinHeight: number = 1.7,
): ShotType {
  // FOV 보정 계수: 기준 FOV 50도 대비 비율
  // FOV가 넓으면(예: 63도) → 보정 거리가 줄어듦 → 더 넓은 샷으로 판정
  const baseFov = 50;
  const fovScale = Math.tan((baseFov / 2) * (Math.PI / 180))
    / Math.tan((fov / 2) * (Math.PI / 180));

  // 마네킹 높이 보정: 기준 1.7m 대비 비율
  const heightScale = mannequinHeight / 1.7;

  // 보정된 유효 거리
  const effectiveDistance = distance * fovScale / heightScale;

  // 임계값과 비교하여 샷 타입 결정
  if (effectiveDistance < BASE_THRESHOLDS[0]) return 'extreme-close-up';
  if (effectiveDistance < BASE_THRESHOLDS[1]) return 'close-up';
  if (effectiveDistance < BASE_THRESHOLDS[2]) return 'medium-close-up';
  if (effectiveDistance < BASE_THRESHOLDS[3]) return 'medium-shot';
  if (effectiveDistance < BASE_THRESHOLDS[4]) return 'medium-full-shot';
  if (effectiveDistance < BASE_THRESHOLDS[5]) return 'full-shot';
  return 'wide-shot';
}

/**
 * 샷 타입 간 유사도 계산 (0~1)
 * 같은 타입 = 1.0, 인접 타입 = 0.7, 2단계 차이 = 0.4, 3단계 이상 = 0.1
 */
export function shotTypeSimilarity(a: ShotType, b: ShotType): number {
  const idxA = SHOT_TYPE_ORDER.indexOf(a);
  const idxB = SHOT_TYPE_ORDER.indexOf(b);
  const diff = Math.abs(idxA - idxB);

  // 단계 차이에 따른 유사도 반환
  switch (diff) {
    case 0: return 1.0;  // 동일
    case 1: return 0.7;  // 인접
    case 2: return 0.4;  // 2단계 차이
    default: return 0.1; // 3단계 이상 차이
  }
}

/**
 * 태그 문자열에서 샷 타입 추출
 * 한글/영문 태그 모두 지원
 * 매칭 안 되면 null 반환
 */
export function tagToShotType(tag: string): ShotType | null {
  // 소문자 + 공백 제거로 정규화
  const normalized = tag.toLowerCase().replace(/\s+/g, '');

  // 영문 매칭 (정확한 약어 + 풀네임)
  const englishMap: Record<string, ShotType> = {
    'ecu': 'extreme-close-up',
    'extremecloseup': 'extreme-close-up',
    'extreme-close-up': 'extreme-close-up',
    'cu': 'close-up',
    'closeup': 'close-up',
    'close-up': 'close-up',
    'mcu': 'medium-close-up',
    'mediumcloseup': 'medium-close-up',
    'medium-close-up': 'medium-close-up',
    'bustshot': 'medium-close-up',
    'ms': 'medium-shot',
    'mediumshot': 'medium-shot',
    'medium-shot': 'medium-shot',
    'mfs': 'medium-full-shot',
    'mediumfullshot': 'medium-full-shot',
    'medium-full-shot': 'medium-full-shot',
    'cowboyshot': 'medium-full-shot',
    'fs': 'full-shot',
    'fullshot': 'full-shot',
    'full-shot': 'full-shot',
    'ws': 'wide-shot',
    'wideshot': 'wide-shot',
    'wide-shot': 'wide-shot',
  };

  if (englishMap[normalized]) return englishMap[normalized];

  // 한글 매칭 (부분 매칭 지원)
  const koreanPatterns: [RegExp, ShotType][] = [
    [/익스트림\s*클로즈업|극단?\s*클로즈업/, 'extreme-close-up'],
    [/클로즈업|클로즈\s*업/, 'close-up'],
    [/미디엄\s*클로즈|바스트\s*샷/, 'medium-close-up'],
    [/미디엄\s*풀|카우보이\s*샷/, 'medium-full-shot'], // 미디엄 풀을 미디엄샷보다 먼저 체크
    [/미디엄\s*샷|미디엄샷/, 'medium-shot'],
    [/풀\s*샷|풀샷|전신/, 'full-shot'],
    [/와이드\s*샷|와이드샷|원경/, 'wide-shot'],
  ];

  for (const [pattern, shotType] of koreanPatterns) {
    if (pattern.test(tag)) return shotType;
  }

  return null;
}
