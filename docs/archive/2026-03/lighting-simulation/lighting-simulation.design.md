# 조명 시뮬레이션 (lighting-simulation) Design

> Plan 문서: `docs/01-plan/features/lighting-simulation.plan.md`

## 1. 개요 (Plan 요약)

3D 뷰어의 조명 시스템을 **멀티 라이트(최대 3개) + HDRI 환경맵** 기반으로 고도화하고,
조명 프리셋 저장/불러오기, 이미지 조명 매칭 검색을 구현한다.

### 핵심 변경사항
- **단일 Directional Light → 최대 3개 광원**(Key/Fill/Back) + HDRI 환경맵
- **4개 클래식 프리셋 → 10~12개 기본 + 사용자 커스텀 저장** (localStorage)
- **561개 샘플 이미지에 합성 LightDirection 할당** → 조명 유사도 검색
- **하이브리드 검색 가중치 확장**: `poseSim * 0.5 + cameraSim * 0.2 + lightSim * 0.3`
- **기존 조명 필터 UI**(미구현) → 실제 필터링 로직 연결

### 현재 상태 (As-Is) → 목표 상태 (To-Be)

| 항목 | As-Is | To-Be |
|------|-------|-------|
| 3D 조명 | Ambient(0.2) + Directional(1개) | Ambient + Directional(최대 3개) + HDRI |
| 조명 컨트롤러 | 3슬라이더(azimuth, elevation, intensity) | 멀티라이트 독립 제어 + 색온도 + HDRI |
| 조명 프리셋 | 4개 클래식 | 10~12개 기본 + 커스텀 저장 |
| 이미지 조명 데이터 | 없음 | 561장 합성 LightDirection 할당 |
| 조명 필터 | UI만 존재 | 실제 필터링 로직 동작 |

## 2. 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────┐
│                    검색 페이지 (search/page.tsx)          │
│                                                         │
│  ┌──────────────────┐     ┌──────────────────────────┐  │
│  │  3D 뷰어 패널     │     │   검색 결과 패널          │  │
│  │                  │     │                          │  │
│  │  ┌────────────┐  │     │  ┌──────────────────┐    │  │
│  │  │mannequin-  │  │     │  │ search-filters   │    │  │
│  │  │viewer.tsx  │  │     │  │ (조명 필터 활성화) │    │  │
│  │  │ (멀티라이트)│  │     │  └──────────────────┘    │  │
│  │  └─────┬──────┘  │     │                          │  │
│  │        │         │     │  ┌──────────────────┐    │  │
│  │  ┌─────▼──────┐  │     │  │ 이미지 결과 그리드 │    │  │
│  │  │multi-light-│  │     │  │ (유사도 순 정렬)   │    │  │
│  │  │controller  │  │     │  └──────────────────┘    │  │
│  │  └─────┬──────┘  │     │                          │  │
│  │  ┌─────▼──────┐  │     └──────────────────────────┘  │
│  │  │hdri-       │  │                                   │
│  │  │selector    │  │                                   │
│  │  └────────────┘  │                                   │
│  └──────────────────┘                                   │
└───────────┬─────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────┐
│                   상태 관리 계층                        │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │light-store  │  │pose-store    │  │(기존 stores)  │  │
│  │(멀티라이트   │  │(기존 유지)    │  │              │  │
│  │ + HDRI 상태) │  │              │  │              │  │
│  └──────┬──────┘  └──────────────┘  └──────────────┘  │
└─────────┼─────────────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────────────────────┐
│                   검색 엔진 계층                        │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │light-vectors │  │light-matching│  │usePoseSearch│  │
│  │(합성 데이터)  │→ │(유사도 계산)  │→ │(3중 합산)    │  │
│  └──────────────┘  └──────────────┘  └─────────────┘  │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │lighting-     │  │pose-presets  │                   │
│  │presets.ts    │  │(기존 확장)    │                   │
│  │(확장+커스텀)  │  │              │                   │
│  └──────────────┘  └──────────────┘                   │
└───────────────────────────────────────────────────────┘
```

### 데이터 플로우

```
[멀티라이트 조작] → [light-store] → [키라이트 LightDirection 추출]
                                           ↓
                              [light-matching.ts]
                              (computeLightSimilarity)
                                           ↓
                              [usePoseSearch 훅]
                              poseSim*0.5 + cameraSim*0.2 + lightSim*0.3
                                           ↓
                              [유사도 순 이미지 정렬]

[이미지 태그] → [light-vectors.ts] → [합성 LightDirection]
              (generateLightDirectionForImage)
```

## 3. 새 파일 상세 설계

### 3-1. `src/lib/light-vectors.ts` -- 이미지 조명 합성 데이터

> `camera-vectors.ts` 패턴을 동일하게 따름: 태그 → 기준값 매핑 + 시드 기반 노이즈

```typescript
// ============================================
// 샘플 이미지용 합성 조명 방향 데이터
// 조명 태그 → LightDirection 매핑 + 이미지별 할당
// camera-vectors.ts 패턴 동일 적용
// ============================================

import type { LightDirection } from '@/types';

// ============================================
// 조명 태그 → 기준 LightDirection 매핑 테이블
// TAG_GROUPS.light의 태그와 1:1 대응
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
  // 언더라이트: 아래에서 위로 비추는 드라마틱 라이트
  '언더라이트': { azimuth: 0, elevation: -30, intensity: 0.6 },
  // 림라이트: 뒤쪽 측면에서 비추어 윤곽선을 강조
  '림라이트': { azimuth: 150, elevation: 25, intensity: 0.7 },
  // 하드라이트: 강한 직사광 (높은 intensity)
  '하드라이트': { azimuth: 45, elevation: 35, intensity: 0.9 },
  // 소프트라이트: 부드러운 확산광 (낮은 intensity)
  '소프트라이트': { azimuth: 30, elevation: 25, intensity: 0.4 },
  // 자연광: 야외 태양광 시뮬레이션
  '자연광': { azimuth: 60, elevation: 55, intensity: 0.7 },
  // 스튜디오: 스튜디오 조명 (정면 약간 측면)
  '스튜디오': { azimuth: 30, elevation: 30, intensity: 0.65 },
  // 실루엣: 완전 역광 + 높은 강도
  '실루엣': { azimuth: 180, elevation: 20, intensity: 0.9 },
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
): LightDirection | undefined

/**
 * 보조 태그로 azimuth 보정 적용
 * 역광/림라이트 등이 함께 있으면 azimuth에 가산 보정
 *
 * @param tags 이미지 태그 목록
 * @param primaryTag 주 태그 (중복 적용 방지)
 * @param seed 시드 값
 * @returns azimuth 보정값 (도)
 */
function computeAzimuthBonus(
  tags: string[],
  primaryTag: string,
  seed: number
): number

/** 조명 태그 → 기준 LightDirection 매핑 테이블 (외부 참조용) */
export { TAG_TO_LIGHT_DIRECTION };

/** 값을 min~max 범위로 제한 */
function clamp(value: number, min: number, max: number): number
```

**구현 핵심:**
- `camera-vectors.ts`의 `generateCameraAngleForImage()`와 동일 패턴
- 이미지 ID 기반 시드로 노이즈 범위:
  - azimuth: +/-15도
  - elevation: +/-10도
  - intensity: +/-0.1
- 보조 태그 보정: `역광`이 함께 있으면 azimuth +120~+180, `림라이트` 함께 시 azimuth +100~+160
- azimuth는 0~360 범위 정규화, elevation은 -90~90 클램프, intensity는 0~1 클램프

---

### 3-2. `src/lib/light-matching.ts` -- 조명 유사도 계산

> `camera-matching.ts` 패턴을 동일하게 따름: 두 값의 차이 기반 유사도 (0~1)

```typescript
// ============================================
// 조명 방향 벡터 매칭 (lighting-simulation Step 2)
// 3D 조명 설정 → azimuth/elevation/intensity 비교
// camera-matching.ts 패턴 동일 적용
// ============================================

import type { LightDirection } from '@/types';

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
): number

/**
 * 멀티 라이트 배열에서 키라이트(가장 강한 광원)를 추출
 * 유사도 비교 시 키라이트 기준으로 매칭
 *
 * @param lights 멀티 라이트 배열 (최대 3개)
 * @returns 가장 intensity가 높은 LightDirection
 */
export function extractKeyLight(
  lights: LightDirection[]
): LightDirection

/**
 * azimuth 각도 차이 계산 (원형 각도 최단 경로)
 * 0도와 350도의 차이는 10도
 *
 * @param a 첫 번째 azimuth (0~360)
 * @param b 두 번째 azimuth (0~360)
 * @returns 0~180 범위의 각도 차이
 */
function azimuthDifference(a: number, b: number): number

/** 값을 min~max 범위로 제한 */
function clamp(value: number, min: number, max: number): number
```

**구현 핵심:**
- `camera-matching.ts`의 `computeCameraAngleSimilarity()`와 동일 패턴
- azimuth는 원형 각도(0~360)이므로 최단 경로 계산: `diff > 180 ? 360 - diff : diff`
- azimuthSimilarity = `1 - azimuthDiff / 180` (180도 차이면 0)
- elevationSimilarity = `1 - Math.abs(a.elevation - b.elevation) / 90` (90도 차이면 0)
- intensitySimilarity = `1 - Math.abs(a.intensity - b.intensity)` (차이가 1이면 0)
- 최종: `azimuthSim * 0.45 + elevationSim * 0.40 + intensitySim * 0.15`

---

### 3-3. `src/stores/light-store.ts` -- 멀티 라이트 상태 관리

> `pose-store.ts` 패턴을 동일하게 따름: Zustand 스토어

```typescript
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

/** 색온도(K) → Three.js Color hex 변환 */
export function colorTempToHex(kelvin: number): string

interface LightStoreState {
  /** 멀티 라이트 배열 (최대 3개) */
  lights: LightSource[];
  /** HDRI 환경맵 상태 */
  hdri: HdriState;

  // --- 라이트 CRUD ---

  /**
   * 라이트 추가 (최대 3개 제한)
   * @param role 광원 역할 (fill 또는 back)
   * @returns 추가 성공 여부
   */
  addLight: (role: LightRole) => boolean;

  /**
   * 라이트 제거
   * @param id 제거할 라이트 ID
   */
  removeLight: (id: string) => void;

  /**
   * 개별 라이트 속성 업데이트
   * @param id 라이트 ID
   * @param updates 변경할 속성 (부분 업데이트)
   */
  updateLight: (id: string, updates: Partial<Omit<LightSource, 'id'>>) => void;

  /**
   * 개별 라이트 활성/비활성 토글
   * @param id 라이트 ID
   */
  toggleLight: (id: string) => void;

  // --- HDRI ---

  /**
   * HDRI 프리셋 변경
   * @param preset 프리셋 ID
   */
  setHdriPreset: (preset: HdriPresetId) => void;

  /**
   * HDRI 속성 업데이트
   * @param updates 변경할 속성 (부분 업데이트)
   */
  updateHdri: (updates: Partial<HdriState>) => void;

  /**
   * HDRI 활성/비활성 토글
   */
  toggleHdri: () => void;

  // --- 프리셋 적용 ---

  /**
   * 프리셋을 일괄 적용 (멀티 라이트 + HDRI 전체 교체)
   * @param lights 새로운 라이트 배열
   * @param hdri 새로운 HDRI 상태 (선택적)
   */
  applyPreset: (lights: LightSource[], hdri?: Partial<HdriState>) => void;

  /**
   * 모든 조명 초기 상태로 리셋
   */
  resetLights: () => void;

  // --- 파생 값 ---

  /**
   * 키라이트의 LightDirection 추출 (검색 엔진용)
   * @returns 가장 intensity가 높은 활성 라이트의 LightDirection
   */
  getKeyLightDirection: () => LightDirection;
}

export const useLightStore = create<LightStoreState>((set, get) => ({
  lights: [createDefaultKeyLight()],
  hdri: createDefaultHdri(),

  addLight: (role) => { /* 최대 3개 제한 */ },
  removeLight: (id) => { /* 키라이트(light-0)는 제거 불가 */ },
  updateLight: (id, updates) => { /* 부분 업데이트 */ },
  toggleLight: (id) => { /* enabled 토글 */ },

  setHdriPreset: (preset) => { /* preset + path 변경 */ },
  updateHdri: (updates) => { /* 부분 업데이트 */ },
  toggleHdri: () => { /* enabled 토글 */ },

  applyPreset: (lights, hdri) => { /* 전체 교체 */ },
  resetLights: () => { /* 키라이트 1개 + HDRI off */ },

  getKeyLightDirection: () => {
    // 활성 라이트 중 가장 intensity가 높은 것의 LightDirection 반환
  },
}));

/**
 * 파생 셀렉터: 현재 조명이 기본 상태인지 확인
 * (키라이트 1개 + 기본값 + HDRI off)
 */
export function useIsDefaultLight(): boolean
```

---

### 3-4. `src/lib/lighting-presets.ts` -- 확장 프리셋 + 커스텀 저장

```typescript
// ============================================
// 조명 프리셋 확장 + 커스텀 저장/불러오기
// 기존 LIGHTING_PRESETS(4개) → 12개 기본 + 커스텀
// ============================================

import type { LightSource, HdriState, HdriPresetId } from '@/stores/light-store';

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
    tags: ['자연광', '소프트라이트'],
    lights: [
      { id: 'light-0', role: 'key', azimuth: 70, elevation: 10, intensity: 0.75, colorTemp: 3200, enabled: true },
    ],
    hdri: { preset: 'golden-hour', exposure: 1.2, enabled: true },
  },
  {
    id: 'blue-hour',
    label: '블루아워',
    tags: ['자연광', '소프트라이트'],
    lights: [
      { id: 'light-0', role: 'key', azimuth: 50, elevation: 5, intensity: 0.5, colorTemp: 6500, enabled: true },
    ],
    hdri: { preset: 'blue-hour', exposure: 0.8, enabled: true },
  },
];

// ============================================
// 커스텀 프리셋 저장/불러오기 (localStorage)
// ============================================

/** localStorage 키 */
const CUSTOM_PRESETS_KEY = 'artref-custom-lighting-presets';

/**
 * 현재 조명 상태를 커스텀 프리셋으로 저장
 * 최대 20개 제한, 초과 시 가장 오래된 것 삭제
 *
 * @param name 프리셋 이름
 * @param lights 현재 멀티 라이트 배열
 * @param hdri 현재 HDRI 상태
 * @returns 저장된 프리셋
 */
export function saveCustomPreset(
  name: string,
  lights: LightSource[],
  hdri?: Partial<HdriState>
): ExtendedLightingPreset

/**
 * 저장된 커스텀 프리셋 목록 불러오기
 * @returns localStorage에 저장된 커스텀 프리셋 배열
 */
export function loadCustomPresets(): ExtendedLightingPreset[]

/**
 * 커스텀 프리셋 삭제
 * @param presetId 삭제할 프리셋 ID
 */
export function deleteCustomPreset(presetId: string): void

/**
 * 모든 프리셋 반환 (기본 12개 + 커스텀)
 * @returns 기본 프리셋 + localStorage 커스텀 프리셋 합산
 */
export function getAllPresets(): ExtendedLightingPreset[]
```

---

### 3-5. `src/components/features/mannequin/multi-light-controller.tsx` -- 멀티 라이트 UI

```typescript
// ============================================
// 멀티 라이트 컨트롤러 UI
// 기존 light-controller.tsx 대체
// 최대 3개 라이트 독립 제어 + HDRI 셀렉터
// ============================================

'use client';

import type { LightSource, LightRole } from '@/stores/light-store';

interface MultiLightControllerProps {
  /** 현재 라이트 배열 */
  lights: LightSource[];
  /** 라이트 추가 콜백 */
  onAddLight: (role: LightRole) => void;
  /** 라이트 제거 콜백 */
  onRemoveLight: (id: string) => void;
  /** 라이트 속성 변경 콜백 */
  onUpdateLight: (id: string, updates: Partial<Omit<LightSource, 'id'>>) => void;
  /** 라이트 토글 콜백 */
  onToggleLight: (id: string) => void;
  /** 접기/펼치기 상태 */
  collapsed?: boolean;
  /** 접기/펼치기 토글 콜백 */
  onCollapseToggle?: () => void;
}

/**
 * 멀티 라이트 컨트롤러 컴포넌트
 * - 각 라이트별 4개 슬라이더: azimuth, elevation, intensity, colorTemp
 * - 라이트 역할 뱃지 (Key/Fill/Back)
 * - 라이트 추가/제거 버튼
 * - 전체 On/Off 토글
 */
export function MultiLightController({
  lights,
  onAddLight,
  onRemoveLight,
  onUpdateLight,
  onToggleLight,
  collapsed,
  onCollapseToggle,
}: MultiLightControllerProps): JSX.Element
```

---

### 3-6. `src/components/features/mannequin/hdri-selector.tsx` -- HDRI 환경맵 선택

```typescript
// ============================================
// HDRI 환경맵 선택 UI
// 5개 내장 프리셋 + 회전/노출 조절
// ============================================

'use client';

import type { HdriState, HdriPresetId, HdriPresetMeta } from '@/stores/light-store';

interface HdriSelectorProps {
  /** 현재 HDRI 상태 */
  hdri: HdriState;
  /** HDRI 프리셋 변경 콜백 */
  onPresetChange: (preset: HdriPresetId) => void;
  /** HDRI 속성 변경 콜백 */
  onUpdate: (updates: Partial<HdriState>) => void;
  /** HDRI 토글 콜백 */
  onToggle: () => void;
}

/**
 * HDRI 환경맵 선택 컴포넌트
 * - 5개 프리셋 카드 (스튜디오, 야외, 실내, 골든아워, 블루아워)
 * - 회전 슬라이더 (0~360)
 * - 노출 슬라이더 (0~2)
 * - On/Off 토글
 */
export function HdriSelector({
  hdri,
  onPresetChange,
  onUpdate,
  onToggle,
}: HdriSelectorProps): JSX.Element
```

## 4. 수정 파일 상세 설계

### 4-1. `src/components/features/mannequin/mannequin-viewer.tsx` 수정

**변경 개요:** 단일 directionalLight → 멀티 라이트 렌더링 + HDRI 환경맵

```typescript
// === 변경된 Props ===

interface MannequinViewerProps {
  // 기존 필드 유지 (onLightChange, isFlipped, bodyType, cameraPosition, ...)
  // === 삭제 ===
  // onLightChange?: (light: LightDirection) => void;  // 제거: light-store로 대체
  // === 추가 ===
  /** 멀티 라이트 배열 (light-store에서 전달) */
  lights?: LightSource[];
  /** HDRI 상태 (light-store에서 전달) */
  hdri?: HdriState;
  className?: string;
}

// === Canvas 내부 변경 ===

// 기존 (삭제):
// <ambientLight intensity={0.2} />
// <directionalLight position={[...]} intensity={...} castShadow ... />

// 신규 (추가):
// <ambientLight intensity={0.15} />
// {lights.filter(l => l.enabled).map(light => (
//   <directionalLight
//     key={light.id}
//     position={[
//       Math.cos((light.azimuth * Math.PI) / 180) * 3,
//       Math.sin((light.elevation * Math.PI) / 180) * 3 + 2,
//       Math.sin((light.azimuth * Math.PI) / 180) * 3,
//     ]}
//     intensity={light.intensity}
//     color={colorTempToHex(light.colorTemp)}
//     castShadow={light.role === 'key'}  // 키라이트만 그림자
//     shadow-mapSize={[1024, 1024]}
//   />
// ))}

// HDRI 환경맵 (기존 <Environment preset="studio" /> 교체):
// {hdri.enabled ? (
//   <Environment files={HDRI_PRESETS.find(p => p.id === hdri.preset)?.path}
//     background={false} />
// ) : (
//   <Environment preset="studio" />
// )}

// === 오버레이 변경 ===
// 기존 <LightController .../> → <MultiLightController .../> + <HdriSelector .../>
```

---

### 4-2. `src/hooks/usePoseSearch.ts` 수정

**변경 개요:** 조명 유사도 가중치 추가 (3중 합산)

```typescript
import { computeLightSimilarity } from '@/lib/light-matching';
import type { LightDirection } from '@/types';

// === ScoredImage 인터페이스 확장 ===
export interface ScoredImage extends ReferenceImage {
  similarityScore?: number;
  poseSimilarity?: number;
  cameraSimilarity?: number;
  /** 조명 유사도 점수 (신규) */
  lightSimilarity?: number;
}

// === 훅 시그니처 확장 ===
export function usePoseSearch(
  filteredImages: ReferenceImage[],
  poseMatchEnabled?: boolean,
  currentCameraAngle?: CameraAngle | null,
  externalPoseVector?: number[] | null,
  externalWeights?: number[] | null,
  // === 신규 파라미터 ===
  currentLightDirection?: LightDirection | null  // 현재 3D 뷰어 키라이트 방향
): PoseSearchResult

// === PoseSearchResult 확장 ===
interface PoseSearchResult {
  images: ScoredImage[];
  isPoseActive: boolean;
  currentPoseVector: number[] | null;
  isCameraActive: boolean;
  /** 조명 매칭 활성 여부 (신규) */
  isLightActive: boolean;
}

// === 복합 점수 계산 변경 ===

// 기존: poseSim * 0.7 + cameraSim * 0.3
// 신규 (3중 모두 활성):
//   combinedScore = poseSim * 0.5 + cameraSim * 0.2 + lightSim * 0.3
//
// 부분 활성 시 가중치 재분배:
//   포즈+카메라만:   poseSim * 0.7  + cameraSim * 0.3
//   포즈+조명만:     poseSim * 0.6  + lightSim * 0.4
//   카메라+조명만:   cameraSim * 0.4 + lightSim * 0.6
//   포즈만:          poseSim * 1.0
//   카메라만:        cameraSim * 1.0
//   조명만:          lightSim * 1.0
```

**변경 로직:**
1. `currentLightDirection`이 있고 이미지에 `lightDirection`이 있으면 `computeLightSimilarity()` 호출
2. 활성화된 유사도 종류에 따라 가중치를 동적으로 재분배
3. `ScoredImage`에 `lightSimilarity` 필드 추가

---

### 4-3. `src/lib/pose-presets.ts` 수정

**변경 개요:** `LightingPreset` 타입에 멀티 라이트 지원 필드 추가 (하위 호환)

```typescript
/** 조명 패턴 프리셋 정의 (확장) */
export interface LightingPreset {
  id: string;
  label: string;
  tags: string[];
  azimuth: number;
  elevation: number;
  intensity: number;
  // === 신규 필드 (선택적, 하위 호환) ===
  /** 색온도 (Kelvin, 기본 5500) */
  colorTemp?: number;
  /** 멀티 라이트 설정 ID 참조 (lighting-presets.ts의 ExtendedLightingPreset) */
  extendedPresetId?: string;
}

// 기존 LIGHTING_PRESETS 4개는 변경 없이 유지
// (하위 호환: 기존 코드에서 참조 시 문제 없음)
```

---

### 4-4. `src/components/features/search/search-filters.tsx` 수정

**변경 개요:** 조명 필터 UI에 실제 조명 유사도 매칭 상태 표시

```typescript
// === SearchFiltersProps 확장 ===
interface SearchFiltersProps {
  selectedTags: string[];
  selectedCategory: ImageCategory | null;
  onTagsChange: (tags: string[]) => void;
  onCategoryChange: (category: ImageCategory | null) => void;
  lightDirection?: { azimuth: number; elevation: number } | null;
  lightFilterActive?: boolean;
  onLightFilterToggle?: () => void;
  // === 신규 ===
  /** 조명 매칭된 이미지 수 (활성 시 표시) */
  lightMatchCount?: number;
  /** 조명 유사도 임계값 (0~1, 이 이상만 표시) */
  lightThreshold?: number;
  /** 조명 유사도 임계값 변경 콜백 */
  onLightThresholdChange?: (threshold: number) => void;
}
```

**UI 변경:**
- 조명 필터 ON일 때 매칭 이미지 수 표시: `"필터 ON (42장 매칭)"`
- 유사도 임계값 슬라이더 추가 (기본 0.3, 범위 0~1)

---

### 4-5. `src/app/(main)/search/page.tsx` 수정

**변경 개요:** 조명 매칭 통합

```typescript
// === 신규 import ===
import { useLightStore } from '@/stores/light-store';
import { generateLightDirectionForImage } from '@/lib/light-vectors';

// === 상태 추가 ===
// light-store에서 키라이트 방향 구독
const keyLightDirection = useLightStore((s) => s.getKeyLightDirection());

// === usePoseSearch 호출 변경 ===
const { images, isPoseActive, isCameraActive, isLightActive } = usePoseSearch(
  filteredImages,
  poseMatchEnabled,
  effectiveCameraAngle,
  extractedPoseVector,
  extractedWeights,
  keyLightDirection  // 신규: 조명 방향 전달
);

// === 이미지 데이터 보강 (한 번만) ===
// 샘플 이미지에 lightDirection이 없는 경우 합성 데이터 생성
const enrichedImages = useMemo(() =>
  sampleImages.map(img => ({
    ...img,
    lightDirection: img.lightDirection ?? generateLightDirectionForImage(img.tags, img._id),
  })),
  [sampleImages]
);
```

---

### 4-6. `src/types/index.ts` 수정

**변경 개요:** 신규 타입 없음 (기존 `LightDirection` 타입 그대로 사용)

기존 `LightDirection` 인터페이스는 수정 불요. 멀티 라이트 고유 타입은 `light-store.ts`에서 정의.

## 5. 타입/인터페이스 정의 총정리

```typescript
// === src/types/index.ts (기존, 변경 없음) ===
export interface LightDirection {
  azimuth: number;   // 수평 각도 (0-360)
  elevation: number; // 수직 각도 (-90 ~ 90)
  intensity: number; // 강도 (0-1)
}

// === src/stores/light-store.ts (신규) ===
export type LightRole = 'key' | 'fill' | 'back';
export type HdriPresetId = 'studio' | 'outdoor' | 'indoor' | 'golden-hour' | 'blue-hour';

export interface LightSource {
  id: string;
  role: LightRole;
  azimuth: number;
  elevation: number;
  intensity: number;
  colorTemp: number;     // 2700~6500 Kelvin
  enabled: boolean;
}

export interface HdriState {
  preset: HdriPresetId;
  rotation: number;      // 0~360
  exposure: number;      // 0~2
  enabled: boolean;
}

export interface HdriPresetMeta {
  id: HdriPresetId;
  label: string;
  path: string;
}

// === src/lib/lighting-presets.ts (신규) ===
export interface ExtendedLightingPreset {
  id: string;
  label: string;
  tags: string[];
  lights: LightSource[];
  hdri?: Partial<HdriState>;
  isCustom?: boolean;
}

// === src/hooks/usePoseSearch.ts (확장) ===
export interface ScoredImage extends ReferenceImage {
  similarityScore?: number;
  poseSimilarity?: number;
  cameraSimilarity?: number;
  lightSimilarity?: number;  // 신규
}
```

## 6. UI 와이어프레임

### 6-1. 멀티 라이트 컨트롤러 (multi-light-controller.tsx)

```
┌──────────────────────────────────┐
│  조명 조절           [접기 ▲]    │
│──────────────────────────────────│
│  ┌────────────────────────────┐  │
│  │ ● Key   [azimuth ====○  ] │  │  ← 키라이트 (삭제 불가)
│  │         [elevation ==○   ] │  │
│  │         [intensity ===○  ] │  │
│  │         [색온도  ====○   ] │  │     2700K ← ○ → 6500K
│  │         [ON/OFF ●]         │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ ○ Fill  [azimuth ====○  ] │  │  ← 필라이트
│  │         [elevation ==○   ] │  │
│  │         [intensity =○    ] │  │
│  │         [색온도  ====○   ] │  │
│  │         [ON/OFF ○] [✕ 삭제]│  │
│  └────────────────────────────┘  │
│                                  │
│  [+ 라이트 추가]  (최대 3개)      │
│──────────────────────────────────│
│  HDRI 환경맵              [OFF]  │
│  ┌──────────────────────────┐    │
│  │ [스튜디오][야외][실내]    │    │
│  │ [골든아워][블루아워]      │    │
│  │ 회전: [======○          ]│    │
│  │ 노출: [===○             ]│    │
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

### 6-2. 조명 프리셋 패널 (검색 페이지 내)

```
┌──────────────────────────────────────┐
│  조명 프리셋                          │
│                                      │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│  │  ☀  │ │  ☀  │ │  ☀  │ │  ☀  │    │
│  │렘브란│ │ 루프 │ │버터플│ │스플릿│    │
│  │  트  │ │     │ │라이  │ │     │    │
│  └─────┘ └─────┘ └─────┘ └─────┘    │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│  │  ☀  │ │  ☀  │ │  ☀  │ │  ☀  │    │
│  │시네마│ │드라마│ │하이키│ │ 로키 │    │
│  │  틱  │ │  틱  │ │     │ │     │    │
│  └─────┘ └─────┘ └─────┘ └─────┘    │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│  │  ☀  │ │  ☀  │ │  ☀  │ │  ☀  │    │
│  │스플릿│ │백라이│ │골든아│ │블루아│    │
│  │ +필  │ │트+림 │ │  워  │ │  워  │    │
│  └─────┘ └─────┘ └─────┘ └─────┘    │
│                                      │
│  [현재 조명 저장]                     │
│                                      │
│  내 프리셋:                           │
│  ┌─────┐ ┌─────┐                     │
│  │커스텀│ │커스텀│  ...                │
│  │  1  │ │  2  │                     │
│  │  [✕]│ │  [✕]│                     │
│  └─────┘ └─────┘                     │
└──────────────────────────────────────┘
```

### 6-3. 조명 필터 영역 (search-filters.tsx 내)

```
┌──────────────────────────────────┐
│  조명 방향             [필터 ON] │
│  ┌────────────────────────────┐  │
│  │  ┌───┐                    │  │
│  │  │ ● │ 방위각: 45°        │  │  ← 조명 방향 시각화 원
│  │  └───┘ 고도: 35°          │  │
│  │                            │  │
│  │  유사도 임계값: [===○     ]│  │  ← 0.3 기본
│  │  매칭 이미지: 42장         │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

## 7. 구현 순서

| Step | 파일 | 작업 내용 | 의존성 |
|:----:|------|----------|--------|
| 1 | `src/lib/light-vectors.ts` | 이미지 조명 합성 데이터 생성 함수 | 없음 (순수 로직) |
| 2 | `src/lib/light-matching.ts` | 조명 유사도 계산 함수 | `@/types` (LightDirection) |
| 3 | `src/hooks/usePoseSearch.ts` (수정) | 조명 유사도 파라미터 추가 + 3중 가중 합산 | Step 2 |
| 4 | `src/stores/light-store.ts` | 멀티 라이트 + HDRI Zustand 스토어 | `@/types` |
| 5 | `src/lib/lighting-presets.ts` | 확장 프리셋 12개 + 커스텀 저장 | Step 4 |
| 6 | `src/components/features/mannequin/multi-light-controller.tsx` | 멀티 라이트 슬라이더 UI | Step 4 |
| 7 | `src/components/features/mannequin/hdri-selector.tsx` | HDRI 프리셋 선택 UI | Step 4 |
| 8 | `src/components/features/mannequin/mannequin-viewer.tsx` (수정) | 멀티 라이트 렌더링 + HDRI 환경맵 | Step 4, 6, 7 |
| 9 | `src/lib/pose-presets.ts` (수정) | LightingPreset 타입 확장 (하위 호환) | 없음 |
| 10 | `src/components/features/search/search-filters.tsx` (수정) | 조명 필터 활성화 + 임계값 슬라이더 | Step 3 |
| 11 | `src/app/(main)/search/page.tsx` (수정) | 전체 통합: light-store 연동 + 이미지 데이터 보강 | Step 1~10 전부 |

## 8. 테스트 시나리오

### 8-1. light-vectors.ts 단위 테스트

| # | 시나리오 | 입력 | 기대 결과 |
|:-:|---------|------|----------|
| 1 | 조명 태그 있는 이미지 | `tags: ['정면광'], imageId: '001'` | `LightDirection` 반환, azimuth ~0 (+/-15) |
| 2 | 조명 태그 없는 이미지 | `tags: ['서있기'], imageId: '002'` | `undefined` 반환 |
| 3 | 복수 조명 태그 | `tags: ['측광', '역광'], imageId: '003'` | 첫 매칭 태그('측광') 기준 + 역광 보정 |
| 4 | 동일 태그 + 다른 ID | `tags: ['측광'], id: 'a'` vs `id: 'b'` | 다른 노이즈 값 (결정론적) |
| 5 | 결정론적 재현성 | 같은 입력 2번 호출 | 동일한 결과 |

### 8-2. light-matching.ts 단위 테스트

| # | 시나리오 | 입력 | 기대 결과 |
|:-:|---------|------|----------|
| 1 | 동일 조명 | `a = b = {az:45, el:35, int:0.8}` | 유사도 = 1.0 |
| 2 | 반대 방향 | `a: {az:0,...}`, `b: {az:180,...}` | 유사도 < 0.3 |
| 3 | azimuth 원형 계산 | `a: {az:350,...}`, `b: {az:10,...}` | azimuthDiff = 20 (340이 아님) |
| 4 | 강도만 다름 | `a: {int:0.2,...}`, `b: {int:0.9,...}` | 유사도 > 0.7 (가중치 15%) |
| 5 | extractKeyLight | `[{int:0.3}, {int:0.9}, {int:0.5}]` | 두 번째 라이트 반환 |

### 8-3. light-store.ts 통합 테스트

| # | 시나리오 | 액션 | 기대 결과 |
|:-:|---------|------|----------|
| 1 | 기본 상태 | 초기화 | 키라이트 1개, HDRI off |
| 2 | 라이트 추가 | `addLight('fill')` | lights.length = 2 |
| 3 | 3개 초과 추가 | `addLight` 4번 | 4번째에서 false 반환, lights.length = 3 |
| 4 | 키라이트 삭제 시도 | `removeLight('light-0')` | 무시 (키라이트 보호) |
| 5 | HDRI 토글 | `toggleHdri()` | enabled: false → true |
| 6 | 프리셋 적용 | `applyPreset(cinematic)` | 라이트 3개 + HDRI 변경 |
| 7 | 리셋 | `resetLights()` | 키라이트 1개 기본값 |

### 8-4. usePoseSearch 통합 테스트

| # | 시나리오 | 조건 | 기대 결과 |
|:-:|---------|------|----------|
| 1 | 3중 모두 활성 | 포즈+카메라+조명 | 가중치 50:20:30 |
| 2 | 조명만 활성 | 기본 포즈, 카메라 null, 조명 있음 | lightSim 100% |
| 3 | 포즈+조명 | 포즈 변경, 카메라 null, 조명 있음 | 가중치 60:40 |
| 4 | 이미지에 lightDirection 없음 | 조명 활성 | lightSimilarity = undefined, 점수 하위 |

### 8-5. UI 통합 테스트

| # | 시나리오 | 조작 | 기대 결과 |
|:-:|---------|------|----------|
| 1 | 멀티 라이트 추가 | "+ 라이트 추가" 클릭 | 필라이트 슬라이더 그룹 추가 |
| 2 | 조명 슬라이더 조작 | azimuth 드래그 | 3D 뷰어 조명 실시간 변경 |
| 3 | HDRI 프리셋 선택 | "골든아워" 클릭 | 3D 뷰어 환경맵 변경 + 색감 변화 |
| 4 | 프리셋 적용 | "렘브란트" 카드 클릭 | 라이트 2개 설정 일괄 적용 |
| 5 | 커스텀 저장 | "현재 조명 저장" 클릭 → 이름 입력 | localStorage에 저장 + 카드 추가 |
| 6 | 조명 필터 토글 | "필터 ON" 클릭 | 이미지 유사도 순 재정렬 |
| 7 | 모바일 성능 | 라이트 3개 + HDRI | 60fps 유지 (모바일: 라이트 2개 제한) |

### 8-6. 빌드 검증 체크리스트

- [ ] `npx tsc --noEmit` 에러 0건
- [ ] `npm run build` 성공
- [ ] 멀티 라이트 3개 동시 렌더링 정상
- [ ] HDRI 환경맵 로드 < 2초
- [ ] 조명 유사도 검색 결과 상위 이미지가 유사한 조명 방향
- [ ] 커스텀 프리셋 저장/불러오기/삭제 동작
- [ ] 조명 필터 ON/OFF 토글 동작
- [ ] 기존 포즈+카메라 검색 정상 동작 (회귀 테스트)

## 9. 에러 핸들링

| 상황 | 처리 |
|------|------|
| HDRI 파일 로드 실패 | fallback으로 `<Environment preset="studio" />` 유지 |
| localStorage 용량 초과 | 커스텀 프리셋 저장 실패 토스트 + 오래된 프리셋 삭제 유도 |
| 이미지에 lightDirection 없음 | 유사도 undefined → 정렬 시 하위 배치 |
| WebGL2 미지원 브라우저 | 멀티 라이트/HDRI 비활성 + 안내 메시지 |
| 커스텀 프리셋 20개 초과 | 저장 시 가장 오래된 것 자동 삭제 (FIFO) |

## 10. 성능 최적화

| 전략 | 상세 |
|------|------|
| HDRI Lazy Loading | HDRI 파일을 프리셋 선택 시 dynamic import로 로드 |
| HDRI 압축 | 각 파일 < 500KB (저해상도 HDR 포맷) |
| 그림자 제한 | 키라이트만 castShadow (필/백 라이트는 그림자 없음) |
| 조명 변경 디바운스 | 슬라이더 변경 → 유사도 재계산은 300ms debounce |
| 모바일 제한 | `navigator.maxTouchPoints > 0`이면 최대 라이트 2개 |
| 합성 데이터 캐싱 | `generateLightDirectionForImage` 결과를 useMemo로 캐싱 |
