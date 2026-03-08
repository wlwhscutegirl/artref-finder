// ============================================
// 멀티 라이트 + HDRI 상태 관리 (Zustand)
// 최대 3개 광원 독립 제어 + 환경맵 상태
// pose-store.ts 패턴 동일 적용
// ============================================

import { create } from 'zustand';
import type { LightDirection } from '@/types';

/** 광원 역할 타입 */
export type LightRole = 'key' | 'fill' | 'back';

/** 개별 광원 상태 */
export interface LightSource {
  /** 고유 ID (최대 3개: 'light-0', 'light-1', 'light-2') */
  id: string;
  /** 광원 역할 (시각적 라벨용) */
  role: LightRole;
  /** 수평 각도 (0~360) */
  azimuth: number;
  /** 수직 각도 (-90~90) */
  elevation: number;
  /** 강도 (0~1) */
  intensity: number;
  /** 색온도 (2700~6500 Kelvin) */
  colorTemp: number;
  /** 활성화 여부 */
  enabled: boolean;
}

/** HDRI 환경맵 프리셋 ID */
export type HdriPresetId = 'studio' | 'outdoor' | 'indoor' | 'golden-hour' | 'blue-hour';

/** HDRI 환경맵 상태 */
export interface HdriState {
  /** 선택된 프리셋 ID */
  preset: HdriPresetId;
  /** 수평 회전 (0~360) */
  rotation: number;
  /** 노출 강도 (0~2) */
  exposure: number;
  /** 활성화 여부 */
  enabled: boolean;
}

/** HDRI 프리셋 메타데이터 */
export interface HdriPresetMeta {
  id: HdriPresetId;
  label: string;
  /** HDRI 파일 경로 (public/hdri/) */
  path: string;
}

/** HDRI 프리셋 목록 */
export const HDRI_PRESETS: HdriPresetMeta[] = [
  { id: 'studio', label: '스튜디오', path: '/hdri/studio.hdr' },
  { id: 'outdoor', label: '야외', path: '/hdri/outdoor.hdr' },
  { id: 'indoor', label: '실내', path: '/hdri/indoor.hdr' },
  { id: 'golden-hour', label: '골든아워', path: '/hdri/golden-hour.hdr' },
  { id: 'blue-hour', label: '블루아워', path: '/hdri/blue-hour.hdr' },
];

/** 기본 키라이트 생성 */
function createDefaultKeyLight(): LightSource {
  return {
    id: 'light-0',
    role: 'key',
    azimuth: 45,
    elevation: 45,
    intensity: 0.8,
    colorTemp: 5500,
    enabled: true,
  };
}

/** 기본 HDRI 상태 */
function createDefaultHdri(): HdriState {
  return {
    preset: 'studio',
    rotation: 0,
    exposure: 1.0,
    enabled: false,
  };
}

/**
 * 색온도(Kelvin) → hex 색상 변환
 * 간이 변환: 2700K(웜) ~ 6500K(쿨) 범위
 */
export function colorTempToHex(kelvin: number): string {
  // 간이 색온도 변환 (Tanner Helland 알고리즘 기반 간소화)
  const temp = kelvin / 100;
  let r: number, g: number, b: number;

  // Red
  if (temp <= 66) {
    r = 255;
  } else {
    r = Math.max(0, Math.min(255, 329.698727446 * Math.pow(temp - 60, -0.1332047592)));
  }

  // Green
  if (temp <= 66) {
    g = Math.max(0, Math.min(255, 99.4708025861 * Math.log(temp) - 161.1195681661));
  } else {
    g = Math.max(0, Math.min(255, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)));
  }

  // Blue
  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = Math.max(0, Math.min(255, 138.5177312231 * Math.log(temp - 10) - 305.0447927307));
  }

  // hex 변환
  const toHex = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** 광원 역할별 한글 라벨 */
export const LIGHT_ROLE_LABELS: Record<LightRole, string> = {
  key: '키',
  fill: '필',
  back: '백',
};

interface LightStoreState {
  /** 멀티 라이트 배열 (최대 3개) */
  lights: LightSource[];
  /** HDRI 환경맵 상태 */
  hdri: HdriState;

  /** 라이트 추가 (최대 3개 제한) */
  addLight: (role: LightRole) => boolean;
  /** 라이트 제거 (키라이트 보호) */
  removeLight: (id: string) => void;
  /** 개별 라이트 속성 업데이트 */
  updateLight: (id: string, updates: Partial<Omit<LightSource, 'id'>>) => void;
  /** 개별 라이트 활성/비활성 토글 */
  toggleLight: (id: string) => void;

  /** HDRI 프리셋 변경 */
  setHdriPreset: (preset: HdriPresetId) => void;
  /** HDRI 속성 업데이트 */
  updateHdri: (updates: Partial<HdriState>) => void;
  /** HDRI 활성/비활성 토글 */
  toggleHdri: () => void;

  /** 프리셋을 일괄 적용 (멀티 라이트 + HDRI 전체 교체) */
  applyPreset: (lights: LightSource[], hdri?: Partial<HdriState>) => void;
  /** 모든 조명 초기 상태로 리셋 */
  resetLights: () => void;

  /** 키라이트의 LightDirection 추출 (검색 엔진용) */
  getKeyLightDirection: () => LightDirection;
}

export const useLightStore = create<LightStoreState>((set, get) => ({
  lights: [createDefaultKeyLight()],
  hdri: createDefaultHdri(),

  // 라이트 추가 (최대 3개)
  addLight: (role) => {
    const { lights } = get();
    if (lights.length >= 3) return false;

    const newId = `light-${lights.length}`;
    const defaultIntensity = role === 'fill' ? 0.3 : 0.4;
    const defaultAzimuth = role === 'fill' ? 315 : 180;

    set({
      lights: [
        ...lights,
        {
          id: newId,
          role,
          azimuth: defaultAzimuth,
          elevation: 15,
          intensity: defaultIntensity,
          colorTemp: 5500,
          enabled: true,
        },
      ],
    });
    return true;
  },

  // 라이트 제거 (키라이트 'light-0'은 보호)
  removeLight: (id) => {
    if (id === 'light-0') return; // 키라이트 삭제 불가
    set((state) => ({
      lights: state.lights.filter((l) => l.id !== id),
    }));
  },

  // 개별 라이트 속성 업데이트
  updateLight: (id, updates) => {
    set((state) => ({
      lights: state.lights.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    }));
  },

  // 라이트 활성/비활성 토글
  toggleLight: (id) => {
    set((state) => ({
      lights: state.lights.map((l) =>
        l.id === id ? { ...l, enabled: !l.enabled } : l
      ),
    }));
  },

  // HDRI 프리셋 변경
  setHdriPreset: (preset) => {
    set((state) => ({
      hdri: { ...state.hdri, preset },
    }));
  },

  // HDRI 속성 업데이트
  updateHdri: (updates) => {
    set((state) => ({
      hdri: { ...state.hdri, ...updates },
    }));
  },

  // HDRI 토글
  toggleHdri: () => {
    set((state) => ({
      hdri: { ...state.hdri, enabled: !state.hdri.enabled },
    }));
  },

  // 프리셋 일괄 적용
  applyPreset: (lights, hdri) => {
    set((state) => ({
      lights,
      hdri: hdri ? { ...state.hdri, ...hdri } : state.hdri,
    }));
  },

  // 초기 상태로 리셋
  resetLights: () => {
    set({
      lights: [createDefaultKeyLight()],
      hdri: createDefaultHdri(),
    });
  },

  // 키라이트 LightDirection 추출 (활성 라이트 중 가장 강한 것)
  getKeyLightDirection: () => {
    const { lights } = get();
    const enabledLights = lights.filter((l) => l.enabled);

    if (enabledLights.length === 0) {
      return { azimuth: 45, elevation: 45, intensity: 0.8 };
    }

    // intensity가 가장 높은 활성 라이트
    let key = enabledLights[0];
    for (let i = 1; i < enabledLights.length; i++) {
      if (enabledLights[i].intensity > key.intensity) {
        key = enabledLights[i];
      }
    }

    return {
      azimuth: key.azimuth,
      elevation: key.elevation,
      intensity: key.intensity,
    };
  },
}));

/**
 * 파생 셀렉터: 현재 조명이 기본 상태인지 확인
 * (키라이트 1개 + 기본값 + HDRI off)
 */
export function useIsDefaultLight(): boolean {
  const lights = useLightStore((s) => s.lights);
  const hdri = useLightStore((s) => s.hdri);

  if (hdri.enabled) return false;
  if (lights.length !== 1) return false;

  const key = lights[0];
  const def = createDefaultKeyLight();
  const threshold = 0.01;

  return (
    Math.abs(key.azimuth - def.azimuth) < threshold &&
    Math.abs(key.elevation - def.elevation) < threshold &&
    Math.abs(key.intensity - def.intensity) < threshold &&
    Math.abs(key.colorTemp - def.colorTemp) < threshold
  );
}
