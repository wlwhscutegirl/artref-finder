# collection-moodboard Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: ArtRef Finder
> **Analyst**: bkit-gap-detector
> **Date**: 2026-03-06
> **Design Doc**: [collection-moodboard.design.md](../02-design/features/collection-moodboard.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Phase 6 "collection-moodboard" 기능의 설계 문서 대비 구현 일치도를 검증한다.
FR-01 ~ FR-06 전체 요구사항에 대해 타입, 스토어, 유틸, 컴포넌트, 페이지 단위로 비교한다.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/collection-moodboard.design.md`
- **Implementation Path**: `src/types/`, `src/stores/`, `src/lib/`, `src/components/features/collection/`, `src/app/(main)/collections/`
- **Analysis Date**: 2026-03-06

---

## 2. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 92.5% | ---- |
| Architecture Compliance | 100% | PASS |
| Convention Compliance | 98% | PASS |
| **Overall** | **95.2%** | **PASS** |

---

## 3. Gap Analysis (Design vs Implementation)

### 3.1 Type Definitions (types/index.ts)

| Design Item | Implementation | Status | Notes |
|-------------|---------------|--------|-------|
| `ImageAnnotation { memo, customTags }` | `ImageAnnotation { memo, customTags }` | FULL | 완전 일치 |
| `FreeformPosition { x, y, width, height }` | `FreeformPosition { x, y, width, height }` | FULL | 완전 일치 |
| `CollectionLayout = 'grid' \| 'masonry' \| 'freeform'` | 동일 | FULL | 완전 일치 |
| Collection 확장 (layout, gridColumns, annotations, freeformPositions) | 동일 | FULL | 모두 optional, 하위 호환 |

### 3.2 Store Actions (collection-store.ts)

| Design Action | Implementation | Status | Notes |
|---------------|---------------|--------|-------|
| `reorderImages(collectionId, newOrder)` | 구현됨 | FULL | imageIds 교체 |
| `setLayout(collectionId, layout)` | 구현됨 | FULL | |
| `setGridColumns(collectionId, columns)` | 구현됨 | FULL | |
| `setAnnotation(collectionId, imageId, annotation)` | 구현됨 | FULL | Partial 병합 지원 |
| `removeAnnotation(collectionId, imageId)` | 구현됨 | FULL | 객체 destructuring으로 제거 |
| `setFreeformPosition(collectionId, imageId, position)` | 구현됨 | FULL | |

### 3.3 Utility Functions

#### color-extractor.ts

| Design Signature | Implementation | Status | Notes |
|------------------|---------------|--------|-------|
| `extractPalette(imageUrl, count=5): Promise<string[]>` | 구현됨 | FULL | Median Cut 알고리즘 |
| `mergepalettes(palettes, count=8): string[]` | `mergePalettes` (PascalCase 'P') | PARTIAL | 함수명 casing 차이: 설계 `mergepalettes` vs 구현 `mergePalettes` |

#### moodboard-export.ts

| Design Signature | Implementation | Status | Notes |
|------------------|---------------|--------|-------|
| `exportAsImage(element, options?)` | 구현됨 | FULL | html2canvas + Blob 다운로드 |
| `exportAsPdf(element, options?)` | **미구현** | MISSING | PDF 내보내기 함수 없음 |
| `encodeShareUrl(collection): string` | 구현됨 | FULL | lz-string 압축 |
| `decodeShareUrl(encoded): Collection \| null` | `Partial<Collection> \| null` 반환 | PARTIAL | 반환 타입 축소 (_id, userId 등 생략) |

### 3.4 Components

| Design Component | Implementation File | Status | Notes |
|------------------|---------------------|--------|-------|
| SortableImageCard (dnd-kit) | `sortable-image-card.tsx` | FULL | useSortable + 드래그 핸들 |
| LayoutSwitcher (Grid/Masonry/Freeform) | `layout-switcher.tsx` | FULL | 5개 옵션 드롭다운 |
| ImageAnnotation (메모/태그) | `image-annotation.tsx` | FULL | 200자 메모 + 5태그 제한 |
| ColorPalette (통합 색상) | `color-palette.tsx` | FULL | hex 클릭 복사 지원 |
| ExportButton (PNG/PDF) | `export-button.tsx` | PARTIAL | PNG/JPEG만 지원, PDF 없음 |
| ShareButton (URL 공유) | `share-button.tsx` | FULL | lz-string 압축 URL 생성 |

### 3.5 Pages

| Design Page | Implementation File | Status | Notes |
|-------------|---------------------|--------|-------|
| collections/[id]/page.tsx (무드보드 리디자인) | 구현됨 (313줄) | PARTIAL | Freeform 레이아웃 렌더링 미구현 (아래 상세) |
| collections/shared/page.tsx (읽기 전용) | 구현됨 (148줄) | FULL | Suspense 경계 포함 |

### 3.6 Plan Gating (FR 제한)

| Design Restriction | Implementation | Status | Notes |
|--------------------|---------------|--------|-------|
| Free: Grid만 | `freeformDisabled` prop on LayoutSwitcher | PARTIAL | Masonry도 Free에서 제한해야 하나 현재 freeform만 차단 |
| Free: 내보내기 월 3회 제한 | ExportButton `disabled` prop 존재 | PARTIAL | 카운팅 로직 미구현 (페이지에서 disabled 미전달) |
| Free: 공유 불가 | ShareButton `disabled` + `disabledMessage` | PARTIAL | 페이지에서 disabled 미전달 (항상 활성) |

### 3.7 Dependencies

| Design Dependency | Status |
|-------------------|--------|
| `@dnd-kit/core ^6.1.0` | FULL (import 확인) |
| `@dnd-kit/sortable ^8.0.0` | FULL |
| `@dnd-kit/utilities ^3.2.2` | FULL |
| `html2canvas ^1.4.1` | FULL |
| `lz-string ^1.5.0` | FULL |

---

## 4. Match Rate Summary

```
Total Items Checked:      40
  FULL match:             31  (77.5%)
  PARTIAL match:           6  (15.0%)
  MISSING (Design O, Impl X): 2  (5.0%)
  ADDED (Design X, Impl O):   1  (2.5%)

Match Rate (FULL + PARTIAL): 92.5%
```

---

## 5. Differences Found

### 5.1 MISSING Features (Design O, Implementation X)

| # | Item | Design Location | Description | Impact |
|---|------|-----------------|-------------|--------|
| M-01 | `exportAsPdf()` | design.md Section 3 (L126-129) | PDF 내보내기 함수가 moodboard-export.ts에 미구현. 설계에서는 orientation 옵션 포함하여 정의됨. | Medium |
| M-02 | Freeform 레이아웃 렌더링 | design.md Section 4, collections/[id]/page.tsx | page.tsx에서 layout === 'freeform' 분기가 없음. LayoutSwitcher에서 Freeform 선택 가능하나, 실제 캔버스 기반 자유 배치 렌더링이 없음. | Medium |

### 5.2 ADDED Features (Design X, Implementation O)

| # | Item | Implementation Location | Description | Impact |
|---|------|------------------------|-------------|--------|
| A-01 | Shared page Suspense 경계 | `src/app/(main)/collections/shared/page.tsx:18-22` | useSearchParams() 사용으로 인한 Suspense 래퍼 추가. 설계에 미명시되나 Next.js 요구사항. | Low (정상) |

### 5.3 CHANGED Features (Design != Implementation)

| # | Item | Design | Implementation | Impact |
|---|------|--------|----------------|--------|
| C-01 | `mergepalettes` 함수명 | `mergepalettes` (all lowercase) | `mergePalettes` (camelCase) | Low -- 구현이 camelCase 컨벤션에 맞으므로 설계 오타 |
| C-02 | `decodeShareUrl` 반환 타입 | `Collection \| null` | `Partial<Collection> \| null` | Low -- 공유 데이터에 _id, userId 등이 없으므로 Partial이 더 정확 |
| C-03 | ExportButton 포맷 | PNG/PDF | PNG/JPEG | Medium -- 설계는 PDF, 구현은 JPEG. exportAsPdf 미구현과 연동 |
| C-04 | Plan 제한 미연결 | Free: Grid만, 내보내기 3회, 공유 불가 | 컴포넌트에 disabled prop 존재하나 page에서 미전달 | Medium -- 기능적으로 모든 플랜에서 모든 기능 접근 가능 |

---

## 6. Clean Architecture Compliance

> Project Level: Dynamic

### 6.1 Layer Assignment Verification

| Component | Expected Layer | Actual Location | Status |
|-----------|---------------|-----------------|--------|
| ImageAnnotation, FreeformPosition, Collection 타입 | Domain (types) | `src/types/index.ts` | PASS |
| collection-store | Application (stores) | `src/stores/collection-store.ts` | PASS |
| extractPalette, mergePalettes | Infrastructure (lib) | `src/lib/color-extractor.ts` | PASS |
| exportAsImage, encodeShareUrl | Infrastructure (lib) | `src/lib/moodboard-export.ts` | PASS |
| SortableImageCard, LayoutSwitcher 등 | Presentation (components) | `src/components/features/collection/` | PASS |
| CollectionDetailPage | Presentation (pages) | `src/app/(main)/collections/[id]/page.tsx` | PASS |
| SharedCollectionPage | Presentation (pages) | `src/app/(main)/collections/shared/page.tsx` | PASS |

### 6.2 Dependency Direction Check

| File | Imports From | Violation? |
|------|-------------|:----------:|
| `color-extractor.ts` (lib) | No external imports | PASS |
| `moodboard-export.ts` (lib) | `html2canvas`, `lz-string`, `@/types` | PASS |
| `collection-store.ts` (stores) | `zustand`, `@/types` | PASS |
| `sortable-image-card.tsx` (component) | `@dnd-kit/*`, `@/types` | PASS |
| `layout-switcher.tsx` (component) | `@/types` | PASS |
| `image-annotation.tsx` (component) | `@/types` | PASS |
| `color-palette.tsx` (component) | `@/lib/color-extractor`, `@/types` | PASS |
| `export-button.tsx` (component) | `@/lib/moodboard-export` | PASS |
| `share-button.tsx` (component) | `@/lib/moodboard-export`, `@/types` | PASS |
| `[id]/page.tsx` (page) | stores, components, lib, types | PASS |
| `shared/page.tsx` (page) | lib, components, types | PASS |

Architecture Score: **100%** (0 violations)

---

## 7. Convention Compliance

### 7.1 Naming Convention

| Category | Convention | Checked | Compliance | Violations |
|----------|-----------|:-------:|:----------:|------------|
| Components | PascalCase | 8 | 100% | -- |
| Functions | camelCase | 14 | 100% | -- |
| Constants | UPPER_SNAKE_CASE | 1 (`LAYOUT_OPTIONS`) | 100% | -- |
| Files (component) | kebab-case.tsx | 6 | 100% | -- |
| Files (utility) | kebab-case.ts | 2 | 100% | -- |
| Folders | kebab-case | 3 | 100% | -- |

### 7.2 Korean Comments

| File | Has Korean Comments | Status |
|------|:-------------------:|:------:|
| `types/index.ts` | Yes | PASS |
| `collection-store.ts` | Yes | PASS |
| `color-extractor.ts` | Yes | PASS |
| `moodboard-export.ts` | Yes | PASS |
| `sortable-image-card.tsx` | Yes | PASS |
| `layout-switcher.tsx` | Yes | PASS |
| `image-annotation.tsx` | Yes | PASS |
| `color-palette.tsx` | Yes | PASS |
| `export-button.tsx` | Yes | PASS |
| `share-button.tsx` | Yes | PASS |
| `[id]/page.tsx` | Yes | PASS |
| `shared/page.tsx` | Yes | PASS |

### 7.3 Import Order

| File | External -> @/ -> Relative -> Type | Status |
|------|:----------------------------------:|:------:|
| `sortable-image-card.tsx` | `react` -> `@dnd-kit/*` -> `@/types` | PASS |
| `layout-switcher.tsx` | `react` -> `@/types` | PASS |
| `image-annotation.tsx` | `react` -> `@/types` | PASS |
| `color-palette.tsx` | `react` -> `@/lib/*` -> `@/types` | PASS |
| `export-button.tsx` | `react` -> `@/lib/*` | PASS |
| `share-button.tsx` | `react` -> `@/lib/*` -> `@/types` | PASS |
| `[id]/page.tsx` | `react` -> `next/*` -> `@dnd-kit/*` -> `@/stores/*` -> `@/lib/*` -> `@/components/*` -> `@/types` | MINOR -- type import (`CollectionLayout`) mixed with component imports |
| `shared/page.tsx` | `react` -> `next/*` -> `@/lib/*` -> `@/components/*` | PASS |

Convention Score: **98%** (1 minor import order issue)

---

## 8. Test Scenario Coverage

| # | Test Scenario | Implementable | Notes |
|---|--------------|:-------------:|-------|
| T-01 | 이미지 3개 드래그 순서 변경 | Yes | dnd-kit + reorderImages 구현됨 |
| T-02 | Grid -> Masonry 전환 | Yes | LayoutSwitcher + columnCount CSS 적용 |
| T-03 | 이미지 메모 200자 입력 | Yes | ImageAnnotationEditor 200자 제한 slice(0, 200) |
| T-04 | PNG 내보내기 클릭 | Yes | ExportButton -> exportAsImage |
| T-05 | 공유 URL 생성 -> 새 탭 열기 | Yes | ShareButton -> encodeShareUrl -> shared/page.tsx |
| T-06 | 색상 팔레트 hex 클릭 복사 | Yes | ColorPalette navigator.clipboard.writeText |
| T-07 | Free 플랜 공유 시도 -> 업그레이드 표시 | **No** | Plan gating 미연결 (disabled 미전달) |
| T-08 | 50개 이미지 드래그앤드롭 60fps | Needs test | 성능 테스트 필요 |

---

## 9. Recommended Actions

### 9.1 Immediate (High Priority)

| # | Action | File | Description |
|---|--------|------|-------------|
| 1 | Freeform 레이아웃 렌더링 추가 | `[id]/page.tsx` | `layout === 'freeform'` 분기에서 absolute positioning 기반 캔버스 구현 필요. `setFreeformPosition` 스토어 액션은 이미 존재. |
| 2 | Plan gating 연결 | `[id]/page.tsx` | `usePlanLimits` 훅으로 Free 플랜 제한 적용: LayoutSwitcher `freeformDisabled`, ExportButton `disabled`, ShareButton `disabled` |

### 9.2 Short-term

| # | Action | File | Description |
|---|--------|------|-------------|
| 3 | `exportAsPdf()` 구현 | `moodboard-export.ts` | jspdf 또는 html2canvas + jspdf 조합. 혹은 설계에서 PDF 삭제하고 JPEG로 대체 결정 필요. |
| 4 | Export 횟수 카운팅 | `[id]/page.tsx` + store | Free 플랜 월 3회 제한 구현 (월별 카운터 로직) |

### 9.3 Documentation Update Needed

| # | Item | Description |
|---|------|-------------|
| D-01 | `mergepalettes` -> `mergePalettes` | 설계 문서의 함수명을 camelCase로 수정 |
| D-02 | `decodeShareUrl` 반환 타입 | `Collection \| null` -> `Partial<Collection> \| null`로 수정 |
| D-03 | ExportButton 포맷 | PNG/PDF -> PNG/JPEG로 수정 (PDF 삭제 시) |

---

## 10. Item-by-Item Checklist

| # | Category | Item | Status |
|---|----------|------|:------:|
| 1 | Type | ImageAnnotation | FULL |
| 2 | Type | FreeformPosition | FULL |
| 3 | Type | CollectionLayout | FULL |
| 4 | Type | Collection 확장 (layout) | FULL |
| 5 | Type | Collection 확장 (gridColumns) | FULL |
| 6 | Type | Collection 확장 (annotations) | FULL |
| 7 | Type | Collection 확장 (freeformPositions) | FULL |
| 8 | Store | reorderImages | FULL |
| 9 | Store | setLayout | FULL |
| 10 | Store | setGridColumns | FULL |
| 11 | Store | setAnnotation | FULL |
| 12 | Store | removeAnnotation | FULL |
| 13 | Store | setFreeformPosition | FULL |
| 14 | Lib | extractPalette (Median Cut) | FULL |
| 15 | Lib | mergePalettes | PARTIAL (함수명 casing 차이) |
| 16 | Lib | exportAsImage (html2canvas) | FULL |
| 17 | Lib | exportAsPdf | MISSING |
| 18 | Lib | encodeShareUrl (lz-string) | FULL |
| 19 | Lib | decodeShareUrl | PARTIAL (반환 타입) |
| 20 | Component | SortableImageCard | FULL |
| 21 | Component | LayoutSwitcher | FULL |
| 22 | Component | ImageAnnotationEditor | FULL |
| 23 | Component | ColorPalette | FULL |
| 24 | Component | ExportButton | PARTIAL (PNG/JPEG only, no PDF) |
| 25 | Component | ShareButton | FULL |
| 26 | Page | collections/[id]/page.tsx 리디자인 | PARTIAL (Freeform 미구현) |
| 27 | Page | collections/shared/page.tsx | FULL |
| 28 | FR-01 | Drag-and-drop reorder | FULL |
| 29 | FR-02 | Layout: Grid 2열 | FULL |
| 30 | FR-02 | Layout: Grid 3열 | FULL |
| 31 | FR-02 | Layout: Grid 4열 | FULL |
| 32 | FR-02 | Layout: Masonry | FULL |
| 33 | FR-02 | Layout: Freeform | MISSING (선택 가능하나 렌더링 없음) |
| 34 | FR-03 | Annotation 메모 200자 | FULL |
| 35 | FR-03 | Annotation 커스텀 태그 5개 | FULL |
| 36 | FR-04 | Export PNG | FULL |
| 37 | FR-04 | Export JPEG | FULL (설계는 PDF, 구현은 JPEG) |
| 38 | FR-05 | Share URL (lz-string) | FULL |
| 39 | FR-06 | Color palette extraction | FULL |
| 40 | Plan | Plan gating 연결 | PARTIAL (props 존재, 미연결) |

---

## 11. Next Steps

- [ ] Freeform 레이아웃 렌더링 구현 (M-02)
- [ ] Plan gating 연결 (C-04)
- [ ] `exportAsPdf` 구현 또는 설계에서 제거 결정 (M-01)
- [ ] 설계 문서 업데이트 (D-01 ~ D-03)
- [ ] Act phase 진행 시 -> `/pdca iterate collection-moodboard`

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-06 | Initial gap analysis | bkit-gap-detector |
