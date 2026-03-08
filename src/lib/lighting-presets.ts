// ============================================
// 조명 프리셋 확장 + 커스텀 저장/불러오기
// 기존 LIGHTING_PRESETS(4개) → 12개 기본 + 커스텀
// ============================================

import { STORAGE_KEYS } from '@/lib/constants';
import type { LightSource, HdriState } from '@/stores/light-store';

/** 확장 조명 프리셋 정의 (멀티 라이트 + HDRI 포함) */
export interface ExtendedLightingPreset {
  /** 고유 ID */
  id: string;
  /** 프리셋 이름 */
  label: string;
  /** 검색 매핑 태그 */
  tags: string[];
  /** 멀티 라이트 설정 (1~3개) */
  lights: LightSource[];
  /** HDRI 환경맵 설정 (선택적) */
  hdri?: Partial<HdriState>;
  /** 커스텀 프리셋 여부 */
  isCustom?: boolean;
}

// ============================================
// 기본 프리셋 12개 (기존 4개 포함)
// ============================================

export const EXTENDED_LIGHTING_PRESETS: ExtendedLightingPreset[] = [
  // --- 기존 4개 클래식 (멀티 라이트로 확장) ---
  {
    id: 'rembrandt',
    label: '렘브란트',
    tags: ['측광', '하드라이트'],
    lights: [
      { id: 'light-0', role: 'key', azimuth: 45, elevation: 35, intensity: 0.8, colorTemp: 5500, enabled: true },
      { id: 'light-1', role: 'fill', azimuth: 315, elevation: 10, intensity: 0.2, colorTemp: 5500, enabled: true },
    ],
  },
  {
    id: 'loop',
    label: '루프',
    tags: ['정면광', '소프트라이트'],
    lights: [
      { id: 'light-0', role: 'key', azimuth: 30, elevation: 25, intensity: 0.6, colorTemp: 5500, enabled: true },
    ],
  },
  {
    id: 'butterfly',
    label: '버터플라이',
    tags: ['정면광', '탑라이트'],
    lights: [
      { id: 'light-0', role: 'key', azimuth: 0, elevation: 50, intensity: 0.7, colorTemp: 5500, enabled: true },
    ],
  },
  {
    id: 'split',
    label: '스플릿',
    tags: ['측광', '하드라이트'],
    lights: [
      { id: 'light-0', role: 'key', azimuth: 90, elevation: 10, intensity: 0.8, colorTemp: 5500, enabled: true },
    ],
  },

  // --- 신규 8개 프리셋 ---
  {
    id: 'cinematic',
    label: '시네마틱',
    tags: ['측광', '하드라이트'],
    lights: [
      { id: 'light-0', role: 'key', azimuth: 60, elevation: 30, intensity: 0.9, colorTemp: 4500, enabled: true },
      { id: 'light-1', role: 'fill', azimuth: 300, elevation: 15, intensity: 0.15, colorTemp: 6500, enabled: true },
      { id: 'light-2', role: 'back', azimuth: 180, elevation: 25, intensity: 0.5, colorTemp: 5500, enabled: true },
    ],
  },
  {
    id: 'dramatic',
    label: '드라마틱',
    tags: ['측광', '하드라이트'],
    lights: [
      { id: 'light-0', role: 'key', azimuth: 80, elevation: 40, intensity: 0.95, colorTemp: 4000, enabled: true },
    ],
  },
  {
    id: 'high-key',
    label: '하이키',
    tags: ['정면광', '소프트라이트'],
    lights: [
      { id: 'light-0', role: 'key', azimuth: 0, elevation: 30, intensity: 0.6, colorTemp: 5500, enabled: true },
      { id: 'light-1', role: 'fill', azimuth: 180, elevation: 20, intensity: 0.5, colorTemp: 5500, enabled: true },
    ],
    hdri: { preset: 'studio', exposure: 1.5, enabled: true },
  },
  {
    id: 'low-key',
    label: '로키',
    tags: ['측광', '하드라이트'],
    lights: [
      { id: 'light-0', role: 'key', azimuth: 70, elevation: 30, intensity: 0.85, colorTemp: 5000, enabled: true },
    ],
    hdri: { enabled: false },
  },
  {
    id: 'split-fill',
    label: '스플릿+필',
    tags: ['측광', '소프트라이트'],
    lights: [
      { id: 'light-0', role: 'key', azimuth: 90, elevation: 15, intensity: 0.8, colorTemp: 5500, enabled: true },
      { id: 'light-1', role: 'fill', azimuth: 270, elevation: 10, intensity: 0.3, colorTemp: 5500, enabled: true },
    ],
  },
  {
    id: 'backlight-rim',
    label: '백라이트+림',
    tags: ['역광', '림라이트'],
    lights: [
      { id: 'light-0', role: 'key', azimuth: 20, elevation: 25, intensity: 0.5, colorTemp: 5500, enabled: true },
      { id: 'light-1', role: 'back', azimuth: 180, elevation: 20, intensity: 0.7, colorTemp: 5500, enabled: true },
    ],
  },
  {
    id: 'golden-hour',
    label: '골든아워',
    tags: ['자연광', '골든아워'],
    lights: [
      { id: 'light-0', role: 'key', azimuth: 70, elevation: 10, intensity: 0.75, colorTemp: 3200, enabled: true },
    ],
    hdri: { preset: 'golden-hour', exposure: 1.2, enabled: true },
  },
  {
    id: 'blue-hour',
    label: '블루아워',
    tags: ['자연광', '블루아워'],
    lights: [
      { id: 'light-0', role: 'key', azimuth: 50, elevation: 5, intensity: 0.5, colorTemp: 6500, enabled: true },
    ],
    hdri: { preset: 'blue-hour', exposure: 0.8, enabled: true },
  },
];

// ============================================
// 커스텀 프리셋 저장/불러오기 (localStorage)
// ============================================

/** localStorage 키 (중앙 상수 참조) */
const CUSTOM_PRESETS_KEY = STORAGE_KEYS.CUSTOM_LIGHTING_PRESETS;
/** 최대 커스텀 프리셋 수 */
const MAX_CUSTOM_PRESETS = 20;

/**
 * 현재 조명 상태를 커스텀 프리셋으로 저장
 * 최대 20개 제한, 초과 시 가장 오래된 것 삭제 (FIFO)
 */
export function saveCustomPreset(
  name: string,
  lights: LightSource[],
  hdri?: Partial<HdriState>
): ExtendedLightingPreset {
  const presets = loadCustomPresets();

  const newPreset: ExtendedLightingPreset = {
    id: `custom-${Date.now()}`,
    label: name,
    tags: [],
    lights: [...lights],
    hdri,
    isCustom: true,
  };

  presets.push(newPreset);

  // 최대 수 초과 시 오래된 것 삭제
  while (presets.length > MAX_CUSTOM_PRESETS) {
    presets.shift();
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
  }

  return newPreset;
}

/**
 * 저장된 커스텀 프리셋 목록 불러오기
 */
export function loadCustomPresets(): ExtendedLightingPreset[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ExtendedLightingPreset[];
  } catch {
    return [];
  }
}

/**
 * 커스텀 프리셋 삭제
 */
export function deleteCustomPreset(presetId: string): void {
  if (typeof window === 'undefined') return;

  const presets = loadCustomPresets().filter((p) => p.id !== presetId);
  localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
}

/**
 * 모든 프리셋 반환 (기본 12개 + 커스텀)
 */
export function getAllPresets(): ExtendedLightingPreset[] {
  return [...EXTENDED_LIGHTING_PRESETS, ...loadCustomPresets()];
}
