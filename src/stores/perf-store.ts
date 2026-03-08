// ============================================
// 렌더링 성능 상태 관리 (Zustand)
// 품질 프리셋 (High/Medium/Low) + 개별 설정
// localStorage 영속화 (이전 선택 기억)
// ============================================

import { create } from 'zustand';
import { STORAGE_KEYS } from '@/lib/constants';
import type { DeviceGrade } from '@/lib/device-detector';

/** 렌더링 모드 */
export type RenderMode = '3d' | '2d';

/** 그림자 맵 해상도 */
export type ShadowMapSize = 256 | 512 | 1024;

/** 성능 프리셋 설정값 */
interface QualityPreset {
  shadows: boolean;
  hdri: boolean;
  dpr: number;
  shadowMapSize: ShadowMapSize;
  /** 관절 스피어 세그먼트 수 */
  sphereSegments: number;
  /** 캡슐 세그먼트 수 */
  capsuleSegments: number;
}

/** 프리셋별 기본 설정 */
const QUALITY_PRESETS: Record<DeviceGrade, QualityPreset> = {
  high: {
    shadows: true,
    hdri: true,
    dpr: 2,
    shadowMapSize: 1024,
    sphereSegments: 16,
    capsuleSegments: 16,
  },
  medium: {
    shadows: true,
    hdri: true,
    dpr: 1.5,
    shadowMapSize: 512,
    sphereSegments: 8,
    capsuleSegments: 8,
  },
  low: {
    shadows: false,
    hdri: false,
    dpr: 1,
    shadowMapSize: 256,
    sphereSegments: 4,
    capsuleSegments: 4,
  },
};

interface PerfState {
  /** 현재 품질 등급 */
  qualityLevel: DeviceGrade;
  /** 렌더링 모드 (3D or 2D 폴백) */
  renderMode: RenderMode;
  /** 그림자 활성화 */
  shadows: boolean;
  /** HDRI 환경맵 활성화 */
  hdri: boolean;
  /** 디바이스 픽셀 비율 */
  dpr: number;
  /** 그림자 맵 해상도 */
  shadowMapSize: ShadowMapSize;
  /** 관절 스피어 세그먼트 수 */
  sphereSegments: number;
  /** 캡슐 세그먼트 수 */
  capsuleSegments: number;
  /** FPS 기반 자동 다운그레이드 활성 */
  autoDowngrade: boolean;
  /** 감지된 디바이스 등급 (최초 감지 결과) */
  detectedGrade: DeviceGrade | null;
  /** 모바일 여부 */
  isMobile: boolean;
  /** 태블릿 여부 (터치 + 768px~1366px) */
  isTablet: boolean;
  /** 초기화 완료 여부 */
  initialized: boolean;

  /** 품질 등급 변경 (프리셋 적용) */
  setQuality: (level: DeviceGrade) => void;
  /** 렌더링 모드 변경 */
  setRenderMode: (mode: RenderMode) => void;
  /** 개별 설정 토글 */
  toggleShadows: () => void;
  toggleHdri: () => void;
  setDpr: (dpr: number) => void;
  /** 자동 다운그레이드 토글 */
  toggleAutoDowngrade: () => void;
  /** 디바이스 감지 결과로 초기화 */
  initFromDetection: (grade: DeviceGrade, mobile: boolean, recommendedDpr: number, tablet?: boolean) => void;
  /** 자동 다운그레이드 실행 (FPS 모니터에서 호출) */
  downgradeOneStep: () => void;
}

/** localStorage 키 (중앙 상수 참조) */
const STORAGE_KEY = STORAGE_KEYS.PERF_SETTINGS;

/** localStorage에서 이전 설정 복원 */
function loadFromStorage(): Partial<PerfState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

/** localStorage에 설정 저장 */
function saveToStorage(state: PerfState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        qualityLevel: state.qualityLevel,
        renderMode: state.renderMode,
        shadows: state.shadows,
        hdri: state.hdri,
        dpr: state.dpr,
        shadowMapSize: state.shadowMapSize,
        autoDowngrade: state.autoDowngrade,
      })
    );
  } catch {
    /* localStorage 가용 불가 시 무시 */
  }
}

export const usePerfStore = create<PerfState>((set, get) => ({
  qualityLevel: 'high',
  renderMode: '3d',
  shadows: true,
  hdri: true,
  dpr: 2,
  shadowMapSize: 1024,
  sphereSegments: 16,
  capsuleSegments: 16,
  autoDowngrade: true,
  detectedGrade: null,
  isMobile: false,
  isTablet: false,
  initialized: false,

  setQuality: (level) => {
    const preset = QUALITY_PRESETS[level];
    const newState = {
      qualityLevel: level,
      ...preset,
      // Low이면 자동으로 2D 모드 전환 (수동 오버라이드 가능)
      renderMode: level === 'low' ? ('2d' as RenderMode) : ('3d' as RenderMode),
    };
    set(newState);
    saveToStorage({ ...get(), ...newState });
  },

  setRenderMode: (mode) => {
    set({ renderMode: mode });
    saveToStorage({ ...get(), renderMode: mode });
  },

  toggleShadows: () => {
    const next = !get().shadows;
    set({ shadows: next });
    saveToStorage({ ...get(), shadows: next });
  },

  toggleHdri: () => {
    const next = !get().hdri;
    set({ hdri: next });
    saveToStorage({ ...get(), hdri: next });
  },

  setDpr: (dpr) => {
    set({ dpr });
    saveToStorage({ ...get(), dpr });
  },

  toggleAutoDowngrade: () => {
    const next = !get().autoDowngrade;
    set({ autoDowngrade: next });
    saveToStorage({ ...get(), autoDowngrade: next });
  },

  initFromDetection: (grade, mobile, recommendedDpr, tablet = false) => {
    const saved = loadFromStorage();

    if (saved && saved.qualityLevel) {
      // 이전 설정이 있으면 복원 (수동 선택 존중)
      set({
        ...saved,
        detectedGrade: grade,
        isMobile: mobile,
        isTablet: tablet,
        initialized: true,
        // 저장되지 않은 세그먼트 값은 프리셋에서 가져옴
        sphereSegments: QUALITY_PRESETS[saved.qualityLevel as DeviceGrade].sphereSegments,
        capsuleSegments: QUALITY_PRESETS[saved.qualityLevel as DeviceGrade].capsuleSegments,
      } as Partial<PerfState>);
    } else {
      // 첫 방문: 감지 결과 기반 초기화
      const preset = QUALITY_PRESETS[grade];
      set({
        qualityLevel: grade,
        renderMode: grade === 'low' ? '2d' : '3d',
        ...preset,
        dpr: recommendedDpr,
        detectedGrade: grade,
        isMobile: mobile,
        isTablet: tablet,
        initialized: true,
      });
    }
  },

  downgradeOneStep: () => {
    const { qualityLevel, autoDowngrade } = get();
    if (!autoDowngrade) return;

    if (qualityLevel === 'high') {
      get().setQuality('medium');
    } else if (qualityLevel === 'medium') {
      get().setQuality('low');
    }
    // low에서는 더 이상 다운그레이드 불가
  },
}));

export { QUALITY_PRESETS };
