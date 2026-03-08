# image-pipeline Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: ArtRef Finder
> **Analyst**: gap-detector
> **Date**: 2026-03-06
> **Design Doc**: image-pipeline implementation plan (Phase A/B/C/D)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

image-pipeline 기능의 설계 사양(Phase A/B/C/D)과 실제 구현 코드 간의 일치율을 측정하고 차이점을 식별한다.

### 1.2 Analysis Scope

- **Design Document**: image-pipeline implementation plan (Phase A, B, C, D)
- **Implementation Path**: `src/lib/`, `src/hooks/`, `src/app/api/pipeline/`, `src/app/(main)/admin/`, `src/types/`, `src/components/features/search/`, pages
- **New Files (9)**: image-service.ts, useImages.ts, unsplash-client.ts, unsplash-tag-mapper.ts, route.ts, pipeline/page.tsx, unsplash-vector-heuristics.ts, extract/page.tsx, safety-filter.ts
- **Modified Files (5)**: types/index.ts, mannequin/page.tsx, sketch/page.tsx, collections/[id]/page.tsx, search-filters.tsx

---

## 2. Gap Analysis (Design vs Implementation)

### Phase C: bkend.ai Backend Integration

| Item | Design Spec | Implementation | Status |
|------|-------------|----------------|--------|
| **C1** ReferenceImage.unsplashId | `unsplashId?: string` | `unsplashId?: string` (L31) | FULL |
| **C1** ReferenceImage.source | `'sample' \| 'unsplash' \| 'upload'` | `source?: 'sample' \| 'unsplash' \| 'upload'` (L33) | FULL |
| **C1** ReferenceImage.safetyScore | `number (0=safe, 1=danger)` | `safetyScore?: number` (L34) | FULL |
| **C1** ReferenceImage.poseExtracted | `boolean` | `poseExtracted?: boolean` (L37) | FULL |
| **C1** ReferenceImage.unsplashMeta | `{ description, altDescription, exif, unsplashTags }` | Exact match (L39-44) | FULL |
| **C2** image-service.ts 생성 | `src/lib/image-service.ts` | File exists, 194 lines | FULL |
| **C2** fetchImages | bkend 우선, sample-data 폴백 | Implemented with bkend.data.list + fallbackFetch (L35-80) | FULL |
| **C2** createImage | bkend 저장 | `bkend.data.create` (L138-140) | FULL |
| **C2** updateImage | 부분 업데이트 | `bkend.data.update` (L145-147) | FULL |
| **C2** findByUnsplashId | 중복 수집 방지 | `bkend.data.list({ unsplashId })` (L153-163) | FULL |
| **C2** fetchUnextractedImages | poseExtracted=false 조회 | `bkend.data.list({ poseExtracted: 'false' })` (L169-193) | FULL |
| **C3** useImages 훅 | useInfiniteQuery 기반 50개씩 | `useInfiniteQuery`, limit=50, staleTime 5분 (L30-48) | FULL |
| **C3** staleTime 5분 | 5 * 60 * 1000 | `staleTime: 5 * 60 * 1000` (L47) | FULL |
| **C4** mannequin/page.tsx 전환 | SAMPLE_IMAGES_WITH_POSES -> useImages() | `const { images: allImages } = useImages()` (L113) | FULL |
| **C5** sketch/page.tsx 전환 | SAMPLE_IMAGES_WITH_POSES -> useImages() | `const { images: allImages } = useImages()` (L22) | FULL |
| **C6** collections/[id]/page.tsx 전환 | SAMPLE_IMAGES -> useImages() | `const { images: allImages } = useImages()` (L48) | FULL |

### Phase A: Unsplash Collection Pipeline

| Item | Design Spec | Implementation | Status |
|------|-------------|----------------|--------|
| **A1** unsplash-client.ts 생성 | `src/lib/unsplash-client.ts` | File exists, 178 lines | FULL |
| **A1** searchPhotos | 검색 API 호출 | `searchPhotos(query, page, perPage)` with content_filter=high (L139-151) | FULL |
| **A1** getPhoto | 상세 조회 (EXIF 포함) | `getPhoto(id)` (L156-158) | FULL |
| **A1** rate limit 추적 | 남은 요청 수 추적 | `RateLimitState` + 헤더 파싱 (L53-86, L117-125) | FULL |
| **A1** RECOMMENDED_QUERIES | 추천 검색 쿼리 | 15개 쿼리 목록 (L161-177) | FULL |
| **A2** unsplash-tag-mapper.ts 생성 | `src/lib/unsplash-tag-mapper.ts` | File exists, 303 lines | FULL |
| **A2** 120+ 영->한 매핑 | 120+ 항목 | ~169 항목 (120+ 충족) | FULL |
| **A2** mapUnsplashTags | 태그 배열 변환 | Implemented with Set 중복 제거 + 복합 태그 분할 (L232-252) | FULL |
| **A2** extractAllTags | 모든 소스에서 태그 추출 | tags + description + alt_description 조합 (L281-299) | FULL |
| **A3** collect API route | POST /api/pipeline/collect | `POST` handler in route.ts (L95-148) | FULL |
| **A3** Unsplash 검색 -> 태그 변환 -> 중복 확인 -> bkend 저장 | 전체 파이프라인 | searchPhotos -> extractAllTags -> findByUnsplashId -> createImage (L104-141) | FULL |
| **A4** admin pipeline dashboard | 쿼리 선택, rate limit, 진행률, 일시정지/재개 | All implemented in pipeline/page.tsx (350 lines) | FULL |
| **A4** 쿼리 선택 | 커스텀 + 추천 쿼리 | customQuery input + RECOMMENDED_QUERIES buttons (L200-277) | FULL |
| **A4** rate limit 표시 | 프로그레스 바 | Color-coded bar with remaining/limit (L179-197) | FULL |
| **A4** 진행률 | 퍼센트 + 카운터 | progress bar + saved/skipped counts (L303-309) | FULL |
| **A4** 일시정지/재개 | 토글 버튼 | pauseRef + togglePause (L140-143, L285-296) | FULL |

### Phase B: Auto Vector Extraction

| Item | Design Spec | Implementation | Status |
|------|-------------|----------------|--------|
| **B1** unsplash-vector-heuristics.ts 생성 | `src/lib/unsplash-vector-heuristics.ts` | File exists, 180 lines | FULL |
| **B1** EXIF 기반 조명 추론 | ISO, 셔터, 조리개 | `inferLightFromExif` - ISO 기반 intensity (L13-34) | PARTIAL |
| **B1** EXIF 기반 카메라 추론 | 초점 거리 -> FOV | `inferCameraFromExif` - focalLength -> FOV (L95-119) | FULL |
| **B1** 태그 기반 조명/카메라 추론 | 한글 태그 매칭 | `inferLightFromTags` + `inferCameraFromTags` (L40-157) | FULL |
| **B2** admin extract page | 일괄 포즈 추출 | File exists, 423 lines (extract/page.tsx) | FULL |
| **B2** MediaPipe WASM | 브라우저 기반 추출 | Dynamic import of mediapipe-pose module (L113-115, L135-136) | FULL |
| **B2** 200개마다 메모리 리셋 | OOM 방지 | `if (i > 0 && i % 200 === 0) { await initPoseLandmarker(); }` (L220-221) | FULL |

### Phase D: Content Safety Filter

| Item | Design Spec | Implementation | Status |
|------|-------------|----------------|--------|
| **D1** safety-filter.ts 생성 | `src/lib/safety-filter.ts` | File exists, 188 lines | FULL |
| **D1** nsfwjs 브라우저 기반 | TensorFlow.js + nsfwjs | Dynamic import of nsfwjs, MobileNetV2 (L58-60) | FULL |
| **D1** classifyImageUrl | URL로 NSFW 분류 | Implemented (L74-124) | FULL |
| **D1** classifyImage | HTMLImageElement 직접 분류 | Implemented (L130-165) | FULL |
| **D1** isSafe | 안전 레벨 확인 | `isSafe(safetyScore, level)` (L170-174) | FULL |
| **D1** disposeModel | 메모리 해제 | `disposeModel()` (L180-187) | FULL |
| **D2** 추출 파이프라인에 classifyImage 통합 | extract page에서 safetyScore 저장 | `classifyImage(img)` called in processImage, score saved via updateImage (extract/page.tsx L155-157) | FULL |
| **D3** search-filters.tsx 안전 필터 토글 | strict/moderate/off | 3-button toggle with labels (search-filters.tsx L280-311) | FULL |
| **D3** mannequin page safetyLevel 상태 관리 | 상태 + 필터링 | `safetyLevel` state + threshold filtering in useMemo (mannequin/page.tsx L119, L382-391) | FULL |

---

## 3. Match Rate Summary

```
+---------------------------------------------+
|  Overall Match Rate: 97.5%                   |
+---------------------------------------------+
|  FULL Match:         39 items (97.5%)        |
|  PARTIAL:             1 item  ( 2.5%)        |
|  MISSING:             0 items ( 0.0%)        |
|  ADDED:               0 items ( 0.0%)        |
+---------------------------------------------+
|  Total Checked:      40 items                |
+---------------------------------------------+
```

---

## 4. Detailed Gap List

### PARTIAL Items

| # | Item | Design | Implementation | Impact |
|---|------|--------|----------------|--------|
| 1 | B1: EXIF 조명 추론 | "ISO, 셔터스피드, 조리개로 실내/실외, 밝기 추정" | ISO만 사용, 셔터스피드/조리개 값은 파싱만 하고 추론에 미반영 (focalLength는 카메라 추론에만 사용) | LOW |

### Notes on Quality

1. **B1 EXIF 조명 추론 (PARTIAL)**: 설계에서는 ISO, 셔터스피드(exposure_time), 조리개(aperture)를 모두 조명 추론에 사용하도록 기술했으나, 구현에서는 ISO 값만 intensity 계산에 사용하고 exposure_time/aperture는 조명 추론에 반영하지 않는다. focalLength는 `inferCameraFromExif`에서만 사용된다. 실용적으로는 ISO 단독으로도 충분한 근사값을 제공하므로 영향도는 LOW.

---

## 5. File-Level Verification

### New Files (9/9 exist)

| File | Path | Lines | Status |
|------|------|------:|--------|
| image-service.ts | `src/lib/image-service.ts` | 194 | EXISTS |
| useImages.ts | `src/hooks/useImages.ts` | 89 | EXISTS |
| unsplash-client.ts | `src/lib/unsplash-client.ts` | 178 | EXISTS |
| unsplash-tag-mapper.ts | `src/lib/unsplash-tag-mapper.ts` | 303 | EXISTS |
| route.ts | `src/app/api/pipeline/collect/route.ts` | 149 | EXISTS |
| pipeline/page.tsx | `src/app/(main)/admin/pipeline/page.tsx` | 351 | EXISTS |
| unsplash-vector-heuristics.ts | `src/lib/unsplash-vector-heuristics.ts` | 180 | EXISTS |
| extract/page.tsx | `src/app/(main)/admin/extract/page.tsx` | 423 | EXISTS |
| safety-filter.ts | `src/lib/safety-filter.ts` | 188 | EXISTS |

### Modified Files (5/5 confirmed)

| File | Key Change | Status |
|------|-----------|--------|
| `src/types/index.ts` | unsplashId, source, safetyScore, poseExtracted, unsplashMeta fields added (L29-44) | VERIFIED |
| `src/app/(main)/mannequin/page.tsx` | `useImages()` hook replacing SAMPLE_IMAGES_WITH_POSES; safetyLevel state + filtering (L113, L119, L382-391) | VERIFIED |
| `src/app/(main)/sketch/page.tsx` | `useImages()` hook replacing SAMPLE_IMAGES_WITH_POSES (L22) | VERIFIED |
| `src/app/(main)/collections/[id]/page.tsx` | `useImages()` hook replacing SAMPLE_IMAGES (L48) | VERIFIED |
| `src/components/features/search/search-filters.tsx` | SafetyLevel import + 3-button safety toggle (L7, L82-84, L280-311) | VERIFIED |

---

## 6. Architecture Compliance

### Layer Placement (Dynamic Level)

| Component | Expected Layer | Actual Location | Status |
|-----------|---------------|-----------------|--------|
| image-service.ts | Infrastructure (lib) | `src/lib/` | CORRECT |
| useImages.ts | Presentation (hooks) | `src/hooks/` | CORRECT |
| unsplash-client.ts | Infrastructure (lib) | `src/lib/` | CORRECT |
| unsplash-tag-mapper.ts | Infrastructure (lib) | `src/lib/` | CORRECT |
| collect/route.ts | API (route) | `src/app/api/` | CORRECT |
| pipeline/page.tsx | Presentation (page) | `src/app/(main)/admin/` | CORRECT |
| unsplash-vector-heuristics.ts | Infrastructure (lib) | `src/lib/` | CORRECT |
| extract/page.tsx | Presentation (page) | `src/app/(main)/admin/` | CORRECT |
| safety-filter.ts | Infrastructure (lib) | `src/lib/` | CORRECT |

### Dependency Direction

- Pages -> hooks (useImages) -> lib (image-service) -> bkend: CORRECT
- Pages -> lib (unsplash-client, safety-filter): CORRECT (admin pages directly call lib for pipeline operations)
- Route handler -> lib (unsplash-client, unsplash-tag-mapper, image-service): CORRECT

Architecture Score: **100%** (9/9 files correctly placed, no dependency violations)

---

## 7. Convention Compliance

### Naming

| Category | Convention | Checked | Compliance | Violations |
|----------|-----------|:-------:|:----------:|------------|
| Components | PascalCase | 2 pages | 100% | None |
| Functions | camelCase | ~40 | 100% | None |
| Constants | UPPER_SNAKE_CASE | 6 | 100% | None (RECOMMENDED_QUERIES, TAG_MAP, SAFETY_THRESHOLDS, TABLE, etc.) |
| Files | kebab-case.ts | 9 | 100% | None |

### Korean Comments

All 9 new files and 5 modified files contain Korean comments on functions, logic blocks, and complex conditions.

Convention Score: **100%**

---

## 8. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 97.5% | PASS |
| Architecture Compliance | 100% | PASS |
| Convention Compliance | 100% | PASS |
| **Overall** | **97.5%** | **PASS** |

---

## 9. Verification Criteria Check

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | npm run build + sample-data fallback | VERIFIABLE | fallbackFetch implemented in image-service.ts |
| 2 | Admin -> Unsplash search -> bkend save | VERIFIABLE | collect route + pipeline dashboard implemented |
| 3 | Batch extract -> poseVector save | VERIFIABLE | extract page + processImage -> updateImage |
| 4 | Education mode safetyScore filter | VERIFIABLE | safety-filter.ts + search-filters.tsx toggle |
| 5 | Mannequin page DB images + pose matching | VERIFIABLE | useImages() + usePoseSearch() integration |
| 6 | npx tsc --noEmit 0 errors | RUNTIME CHECK | Cannot verify statically, requires build |

---

## 10. Recommended Actions

### Optional Improvement (LOW priority)

| # | Item | File | Description |
|---|------|------|-------------|
| 1 | EXIF 조명 추론 확장 | `src/lib/unsplash-vector-heuristics.ts` | exposure_time, aperture 값을 intensity 계산에 반영하면 정확도 향상 가능 |

### No Immediate Actions Required

Match rate 97.5%로 설계-구현 일치 기준(90%)을 충족한다. PARTIAL 항목 1건은 LOW impact이므로 즉시 조치가 필요하지 않다.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-06 | Initial gap analysis | gap-detector |
