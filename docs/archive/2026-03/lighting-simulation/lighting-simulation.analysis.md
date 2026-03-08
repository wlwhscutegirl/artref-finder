# lighting-simulation Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: ArtRef Finder
> **Analyst**: bkit-gap-detector
> **Date**: 2026-03-06
> **Design Doc**: [lighting-simulation.design.md](../02-design/features/lighting-simulation.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

lighting-simulation 피처의 설계 문서(Design)와 실제 구현(Do) 간 일치도를 점검한다.
멀티 라이트, HDRI, 조명 프리셋 확장, 조명 유사도 검색 등 FR-01~FR-06 전체 항목을 비교한다.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/lighting-simulation.design.md`
- **Implementation Path**: `src/lib/`, `src/stores/`, `src/hooks/`, `src/components/features/mannequin/`, `src/components/features/search/`, `src/app/(main)/search/`
- **Analysis Date**: 2026-03-06

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 New Files (6 files)

| Design File | Implementation File | Status | Notes |
|-------------|---------------------|:------:|-------|
| `src/lib/light-vectors.ts` | `src/lib/light-vectors.ts` | FULL | 함수 시그니처, TAG_TO_LIGHT_DIRECTION, seededRandom, computeAzimuthBonus 모두 일치 |
| `src/lib/light-matching.ts` | `src/lib/light-matching.ts` | FULL | computeLightSimilarity, extractKeyLight, azimuthDifference, 가중치 0.45/0.40/0.15 일치 |
| `src/stores/light-store.ts` | `src/stores/light-store.ts` | FULL | LightSource, HdriState, HDRI_PRESETS 5개, 모든 CRUD 액션, getKeyLightDirection, useIsDefaultLight 일치 |
| `src/lib/lighting-presets.ts` | `src/lib/lighting-presets.ts` | FULL | ExtendedLightingPreset, 12개 기본 프리셋, saveCustomPreset, loadCustomPresets, deleteCustomPreset, getAllPresets 일치 |
| `src/components/features/mannequin/multi-light-controller.tsx` | `src/components/features/mannequin/multi-light-controller.tsx` | PARTIAL | Props에서 collapsed/onCollapseToggle 누락 (내부 useState로 대체) |
| `src/components/features/mannequin/hdri-selector.tsx` | `src/components/features/mannequin/hdri-selector.tsx` | FULL | Props, 5개 프리셋 카드, 회전/노출 슬라이더, 토글 모두 일치 |

### 2.2 Modified Files (6 files)

| Design File | Implementation File | Status | Notes |
|-------------|---------------------|:------:|-------|
| `mannequin-viewer.tsx` (수정) | `src/components/features/mannequin/mannequin-viewer.tsx` | PARTIAL | HDRI 환경맵 조건부 렌더링 미구현 (아래 상세) |
| `usePoseSearch.ts` (수정) | `src/hooks/usePoseSearch.ts` | FULL | ScoredImage.lightSimilarity, currentLightDirection 파라미터, isLightActive, computeCombinedScore 동적 가중치 모두 일치 |
| `pose-presets.ts` (수정) | `src/lib/pose-presets.ts` | FULL | LightingPreset에 colorTemp?, extendedPresetId? 추가 완료. 기존 4개 프리셋 유지 |
| `search-filters.tsx` (수정) | `src/components/features/search/search-filters.tsx` | PARTIAL | lightMatchCount, isLightVectorActive 구현됨. lightThreshold/onLightThresholdChange 누락 |
| `search/page.tsx` (수정) | `src/app/(main)/search/page.tsx` | PARTIAL | light-store 연동, usePoseSearch에 lightDirection 전달 구현됨. enrichedImages useMemo 패턴이 sample-data.ts 내부로 이동 (다른 방식) |
| `sample-data.ts` (수정) | `src/lib/sample-data.ts` | FULL | generateLightDirectionForImage 호출하여 lightDirection 데이터 병합 완료 |

### 2.3 Type/Interface Comparison

| Design Type | Implementation | Status | Notes |
|-------------|---------------|:------:|-------|
| `LightDirection` (types/index.ts) | 변경 없음 유지 | FULL | azimuth, elevation, intensity |
| `LightRole` | `'key' \| 'fill' \| 'back'` | FULL | |
| `LightSource` | 7 fields (id, role, azimuth, elevation, intensity, colorTemp, enabled) | FULL | |
| `HdriPresetId` | 5 values | FULL | studio, outdoor, indoor, golden-hour, blue-hour |
| `HdriState` | 4 fields | FULL | preset, rotation, exposure, enabled |
| `HdriPresetMeta` | 3 fields | FULL | id, label, path |
| `ExtendedLightingPreset` | 6 fields | FULL | id, label, tags, lights, hdri?, isCustom? |
| `ScoredImage.lightSimilarity` | `number \| undefined` | FULL | |
| `PoseSearchResult.isLightActive` | `boolean` | FULL | |
| `LightingPreset.colorTemp?` | `number \| undefined` | FULL | |
| `LightingPreset.extendedPresetId?` | `string \| undefined` | FULL | |

### 2.4 Data/Constant Comparison

| Design Item | Implementation | Status | Notes |
|-------------|---------------|:------:|-------|
| TAG_TO_LIGHT_DIRECTION 11개 태그 | 11개 태그 구현 | PARTIAL | '언더라이트', '실루엣', '스튜디오' 3개 누락, '인공광', '골든아워', '블루아워' 3개 추가 |
| HDRI_PRESETS 5개 | 5개 일치 | FULL | |
| EXTENDED_LIGHTING_PRESETS 12개 | 12개 일치 | FULL | 모든 프리셋 id, lights, hdri 값 일치 |
| CUSTOM_PRESETS_KEY | `'artref-custom-lighting-presets'` | FULL | |
| MAX_CUSTOM_PRESETS | 20 | FULL | |
| 3중 가중치 (50:20:30) | 구현 일치 | FULL | |
| 부분 활성 가중치 6개 조합 | 구현 일치 | FULL | |

### 2.5 Logic Comparison

| Design Logic | Implementation | Status | Notes |
|--------------|---------------|:------:|-------|
| azimuthDifference 원형 계산 | `diff > 180 ? 360 - diff : diff` | FULL | |
| azimuthSim = 1 - azDiff/180 | 일치 | FULL | |
| elevationSim = 1 - elDiff/90 | 일치 | FULL | |
| intensitySim = 1 - intDiff | 일치 | FULL | |
| 최종 유사도 0.45:0.40:0.15 | 일치 | FULL | |
| extractKeyLight (intensity 최대) | 일치 | FULL | |
| addLight 최대 3개 제한 | 일치 | FULL | |
| removeLight 키라이트 보호 | `id === 'light-0'` 체크 | FULL | |
| colorTempToHex (Tanner Helland) | 일치 | FULL | |
| 노이즈: az +/-15, el +/-10, int +/-0.1 | 일치 | FULL | |
| 보조 태그 보정 (역광/림라이트/측광) | 일치 | FULL | |

---

## 3. Detailed Gap Analysis

### 3.1 Missing Features (Design O, Implementation X)

| # | Item | Design Location | Description | Impact |
|:-:|------|-----------------|-------------|:------:|
| 1 | HDRI 조건부 렌더링 | design.md 4-1 | `hdri.enabled` 시 동적 HDRI 파일 로드, 비활성 시 fallback. 현재 `<Environment preset="studio" />` 하드코딩. light-store의 hdri 상태를 3D Canvas에 반영하지 않음 | Medium |
| 2 | 조명 유사도 임계값 슬라이더 | design.md 4-4 | `lightThreshold` prop (기본 0.3), `onLightThresholdChange` 콜백. search-filters.tsx에 미구현 | Low |
| 3 | TAG_TO_LIGHT_DIRECTION '언더라이트' | design.md 3-1 | `{azimuth:0, elevation:-30, intensity:0.6}` 매핑 누락 | Low |
| 4 | TAG_TO_LIGHT_DIRECTION '실루엣' | design.md 3-1 | `{azimuth:180, elevation:20, intensity:0.9}` 매핑 누락 | Low |
| 5 | TAG_TO_LIGHT_DIRECTION '스튜디오' | design.md 3-1 | `{azimuth:30, elevation:30, intensity:0.65}` 매핑 누락 | Low |

### 3.2 Added Features (Design X, Implementation O)

| # | Item | Implementation Location | Description | Impact |
|:-:|------|------------------------|-------------|:------:|
| 1 | TAG_TO_LIGHT_DIRECTION '인공광' | light-vectors.ts:33 | `{azimuth:30, elevation:30, intensity:0.65}` -- '스튜디오'를 '인공광'으로 대체한 것으로 보임 | Low |
| 2 | TAG_TO_LIGHT_DIRECTION '골든아워' | light-vectors.ts:35 | `{azimuth:70, elevation:10, intensity:0.75}` -- 설계서에 없는 태그 추가 | Low |
| 3 | TAG_TO_LIGHT_DIRECTION '블루아워' | light-vectors.ts:37 | `{azimuth:50, elevation:5, intensity:0.5}` -- 설계서에 없는 태그 추가 | Low |
| 4 | LIGHT_ROLE_LABELS | light-store.ts:124 | 광원 역할별 한글 라벨 상수. 설계서에 명시되지 않았으나 UI에서 활용 | Low |
| 5 | 골든아워 프리셋 tags 변경 | lighting-presets.ts:124 | 설계서: `['자연광', '소프트라이트']` -> 구현: `['자연광', '골든아워']` | Low |
| 6 | 블루아워 프리셋 tags 변경 | lighting-presets.ts:133 | 설계서: `['자연광', '소프트라이트']` -> 구현: `['자연광', '블루아워']` | Low |
| 7 | onLightChange 레거시 호환 | mannequin-viewer.tsx:17 | 설계서는 삭제를 지정했으나 구현은 레거시 호환을 위해 유지 | Low |

### 3.3 Changed Features (Design != Implementation)

| # | Item | Design | Implementation | Impact |
|:-:|------|--------|----------------|:------:|
| 1 | MultiLightControllerProps | collapsed?, onCollapseToggle? (외부 제어) | 내부 useState로 자체 관리, 해당 props 없음 | Low |
| 2 | MannequinViewerProps | lights?, hdri? props (외부에서 전달) | light-store에서 직접 구독 (내부 useLightStore) | Low |
| 3 | HDRI 렌더링 | hdri.enabled 조건부: 동적 파일 로드 vs fallback | 항상 `<Environment preset="studio" />` 고정 | Medium |
| 4 | search/page.tsx enrichedImages | useMemo로 lightDirection 없는 이미지 보강 | sample-data.ts 내부에서 일괄 생성 (같은 결과, 다른 위치) | Low |
| 5 | TAG_TO_LIGHT_DIRECTION 구성 | 11개: 정면광~스튜디오 | 11개: 정면광~블루아워 (3개 교체) | Low |

---

## 4. FR (Functional Requirements) Compliance

| FR | Description | Status | Notes |
|:--:|-------------|:------:|-------|
| FR-01 | Multi-light system (max 3 lights: key/fill/back) | FULL | light-store CRUD + 3개 제한 + 키라이트 보호 + UI 슬라이더 4개 (azimuth, elevation, intensity, colorTemp) |
| FR-02 | HDRI environment maps (5 presets) | PARTIAL | Store/UI/선택 로직 완전 구현. 3D Canvas 렌더링에 미반영 (항상 studio fallback) |
| FR-03 | Light similarity matching | FULL | computeLightSimilarity (0.45:0.40:0.15), extractKeyLight, azimuth 원형 계산 |
| FR-04 | Dynamic weight hybrid search | FULL | 3중 50:20:30, 부분 활성 6개 조합 모두 구현, computeCombinedScore 함수 |
| FR-05 | Extended lighting presets + custom save/load | FULL | 12개 기본 + localStorage 커스텀 (최대 20개, FIFO) |
| FR-06 | Search filters lighting integration | PARTIAL | lightMatchCount, isLightVectorActive 구현됨. lightThreshold 슬라이더 미구현 |

---

## 5. Architecture Compliance

### 5.1 Layer Assignment

| Component | Design Layer | Actual Location | Status |
|-----------|:-----------:|-----------------|:------:|
| light-vectors.ts | Infrastructure | `src/lib/` | FULL |
| light-matching.ts | Infrastructure | `src/lib/` | FULL |
| light-store.ts | Application | `src/stores/` | FULL |
| lighting-presets.ts | Infrastructure | `src/lib/` | FULL |
| multi-light-controller.tsx | Presentation | `src/components/features/mannequin/` | FULL |
| hdri-selector.tsx | Presentation | `src/components/features/mannequin/` | FULL |
| usePoseSearch.ts | Application | `src/hooks/` | FULL |

### 5.2 Dependency Direction

| File | Imports | Direction | Status |
|------|---------|:---------:|:------:|
| multi-light-controller.tsx | `@/stores/light-store` (types + utils) | Presentation -> Application | FULL |
| hdri-selector.tsx | `@/stores/light-store` (types + constants) | Presentation -> Application | FULL |
| mannequin-viewer.tsx | `@/stores/light-store`, `@/stores/pose-store` | Presentation -> Application | FULL |
| usePoseSearch.ts | `@/lib/light-matching` | Application -> Infrastructure | FULL |
| lighting-presets.ts | `@/stores/light-store` (types) | Infrastructure -> Application (type only) | FULL |
| light-vectors.ts | `@/types` | Infrastructure -> Domain | FULL |
| light-matching.ts | `@/types` | Infrastructure -> Domain | FULL |
| search/page.tsx | `@/stores/light-store` | Presentation -> Application | FULL |

Architecture Score: **100%** (모든 의존 방향 올바름)

---

## 6. Convention Compliance

### 6.1 Naming Convention

| Category | Convention | Files | Compliance | Violations |
|----------|-----------|:-----:|:----------:|------------|
| Components | PascalCase | 3 | 100% | - |
| Functions | camelCase | 18 | 100% | - |
| Constants | UPPER_SNAKE_CASE | 7 | 100% | TAG_TO_LIGHT_DIRECTION, HDRI_PRESETS, EXTENDED_LIGHTING_PRESETS 등 |
| Files (component) | kebab-case.tsx | 3 | 100% | multi-light-controller, hdri-selector, mannequin-viewer |
| Files (utility) | kebab-case.ts | 4 | 100% | light-vectors, light-matching, lighting-presets, light-store |
| Korean comments | 모든 파일 | 12 | 100% | 모든 함수, 주요 블록에 한글 주석 있음 |

### 6.2 Import Order

모든 파일에서 올바른 import 순서 확인:
1. External libraries (zustand, react, three)
2. Internal absolute imports (@/types, @/stores, @/lib)
3. Type imports (import type)

Convention Score: **100%**

---

## 7. Match Rate Summary

```
+---------------------------------------------+
|  Overall Match Rate: 96.0%                   |
+---------------------------------------------+
|  Total Items:          50                    |
|  FULL Match:           44 items (88.0%)      |
|  PARTIAL Match:         4 items ( 8.0%)      |
|  ADDED (no design):     7 items              |
|  MISSING (not impl):    5 items              |
|                                              |
|  Critical Missing:      1 (HDRI rendering)   |
|  Low Impact Missing:    4 (tags + threshold) |
+---------------------------------------------+
```

### Score Breakdown

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 96% | PASS |
| Architecture Compliance | 100% | PASS |
| Convention Compliance | 100% | PASS |
| **Overall** | **96.0%** | **PASS** |

---

## 8. Detailed Findings

### 8.1 HDRI 조건부 렌더링 미구현 (Medium Impact)

**Design (Section 4-1):**
```tsx
// hdri.enabled일 때:
<Environment files={HDRI_PRESETS.find(p => p.id === hdri.preset)?.path} background={false} />
// 비활성일 때:
<Environment preset="studio" />
```

**Implementation (mannequin-viewer.tsx:198):**
```tsx
// 항상 고정:
<Environment preset="studio" />
```

light-store에서 hdri 상태를 구독하고 있고, HdriSelector UI도 동작하지만, Canvas 내부의 `<Environment>` 컴포넌트가 hdri 상태에 반응하지 않는다. HDRI 프리셋 선택 시 실제 3D 환경맵이 변경되지 않는 상태이다.

**권장 조치:** `mannequin-viewer.tsx` Canvas 내부에서 `hdri.enabled` 조건 분기와 동적 HDRI 파일 로드 추가.

### 8.2 TAG_TO_LIGHT_DIRECTION 태그 차이 (Low Impact)

설계서에 정의된 11개 태그 중 3개('언더라이트', '실루엣', '스튜디오')가 구현에서 누락되고, 대신 '인공광', '골든아워', '블루아워' 3개가 추가되었다. '인공광'은 '스튜디오'와 값이 동일(`{az:30, el:30, int:0.65}`)하여 의도적 명칭 변경으로 보인다. '골든아워', '블루아워'는 프리셋 태그 매칭을 위한 합리적 추가이다.

**권장 조치:** 설계서를 구현에 맞게 업데이트 (의도적 변경 기록).

### 8.3 조명 유사도 임계값 슬라이더 미구현 (Low Impact)

설계서에 `lightThreshold` (기본 0.3) 및 `onLightThresholdChange` props가 search-filters.tsx에 정의되어 있으나 구현에 없다. 현재는 임계값 없이 모든 매칭 결과를 유사도 순으로 정렬하므로 기능상 문제는 없지만, UX 개선 여지가 있다.

**권장 조치:** 향후 UX 피드백에 따라 임계값 슬라이더 추가 검토. 급하지 않음.

---

## 9. Recommended Actions

### 9.1 Immediate (필수 수정)

| Priority | Item | File | Description |
|:--------:|------|------|-------------|
| 1 | HDRI 조건부 렌더링 | `mannequin-viewer.tsx` | hdri.enabled 조건 분기 + 동적 Environment 파일 로드 |

### 9.2 Design Document Update (설계 반영)

| # | Item | Description |
|:-:|------|-------------|
| 1 | TAG_TO_LIGHT_DIRECTION 태그 목록 | '스튜디오' -> '인공광', '골든아워', '블루아워' 추가, '언더라이트'/'실루엣' 삭제 반영 |
| 2 | MannequinViewerProps | onLightChange 레거시 유지, lights/hdri props 대신 내부 store 구독 방식으로 변경 |
| 3 | MultiLightControllerProps | collapsed/onCollapseToggle 외부 제어 삭제, 내부 관리로 변경 |
| 4 | 골든아워/블루아워 프리셋 tags | 소프트라이트 -> 골든아워/블루아워 태그 변경 |
| 5 | enrichedImages 위치 | search/page.tsx useMemo -> sample-data.ts 내부 생성으로 변경 |
| 6 | LIGHT_ROLE_LABELS 상수 추가 | light-store.ts에 추가된 한글 라벨 상수 문서화 |

### 9.3 Backlog (선택적 개선)

| # | Item | File | Description |
|:-:|------|------|-------------|
| 1 | lightThreshold 슬라이더 | search-filters.tsx | 유사도 임계값 필터 (기본 0.3) |
| 2 | '언더라이트'/'실루엣' 태그 복원 | light-vectors.ts | 해당 태그를 사용하는 이미지가 있을 경우 |

---

## 10. Conclusion

lighting-simulation 피처의 설계-구현 일치율은 **96.0%**로 PASS 기준(90%)을 충족한다.

핵심 기능(FR-01, FR-03, FR-04, FR-05)은 완전히 일치하며, FR-02(HDRI)와 FR-06(조명 필터)에 각각 1건씩 PARTIAL이 존재한다. 가장 중요한 갭은 HDRI 조건부 렌더링이 Canvas에 미반영된 것으로, HdriSelector UI는 동작하지만 실제 3D 환경맵이 변경되지 않는 상태이다.

나머지 차이점은 모두 Low impact이며, 태그 명칭 변경과 Props 관리 방식의 합리적 변경이다.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-06 | Initial gap analysis | bkit-gap-detector |
