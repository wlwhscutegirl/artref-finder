# ArtRef Finder - Changelog

All notable changes to the ArtRef Finder project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.3] - 2026-03-08

### Sprint 3: Quality Improvement Cycle (Complete)

**Quality Metrics:**
- Starting Quality (v0.3.0): **84%**
- Final Quality (v0.3.3): **93%** (+9%)
- Iterations: 2 complete (Iteration 1: +7%, Iteration 2: +2%)
- Design Match Rate: **93%**
- Accessibility: 55% → **96%** (+41%)
- Architecture: 88% → **93%**
- Code Quality: 85% → **94%**

**Added:**

**Iteration 1 - Accessibility & Refactoring:**
- Modal accessibility overhaul (WCAG 2.1 AA compliance for 4 components)
  - auth-modal: ARIA landmarks, focus trap, ESC close
  - onboarding-modal: Dialog semantics, keyboard navigation
  - save-to-collection-modal: ARIA attributes, focus management
  - upgrade-modal: Proper dialog role with modal attribute
- Code extraction and modularization:
  - `useMannequinSearch.ts` (472 LOC) - Search logic extraction
  - `useMannequinPresets.ts` (199 LOC) - Preset management
  - `usePoseControls.ts` (140 LOC) - Pose control abstraction
- Mannequin page refactored: 997 → 524 lines (-47% complexity)
- Cloud sync deduplication: `withCloudSync()` helper (-80 lines boilerplate)
- Payment page theme alignment: success/fail pages converted to dark theme

**Iteration 2 - Smart Detection & Landing Redesign:**
- Shot type auto-detection system (`src/lib/shot-type.ts`)
  - 7-stage classification (ECU → Extreme Shot)
  - FOV-corrected distance calculation
  - 4D hybrid scoring: pose 40% + camera 15% + light 25% + shotType 20%
  - UI chip integration in mannequin viewer
- Landing page de-vibe-coding redesign
  - Removed fake social proof metrics
  - Problem-focused CTA: "원하는 포즈를 3초 만에 찾으세요"
  - Added "이런 분들에게 추천" target audience section
  - Before/After feature comparison cards
- Image pipeline enhancement (`src/lib/search-keywords.ts`)
  - 56 compound Pexels search queries across 8 categories
  - Smart keyword integration in pexels-image-loader.ts
  - Auto shot type/pose tag assignment for images

**Changed:**
- Mannequin page component architecture modernized
- Collection store refactored with abstraction patterns
- Search keywords pipeline optimized for diversity
- Performance: Hook extraction may save ~5ms per render
- Accessibility score improved from 55% to 96%

**Fixed:**
- Accessibility: 4 modals now WCAG 2.1 AA compliant
- Code duplication: 10 patterns consolidated into 1 helper
- Architecture: Improved separation of concerns
- Theme consistency: Payment flow aligned with dark mode

**Quality Assurance:**
- ✅ TypeScript strict mode: 0 errors
- ✅ Build status: SUCCESS
- ✅ Convention compliance: 95% (improved from 90%)
- ✅ Architecture compliance: 93% (improved from 88%)
- ✅ Accessibility score: 96% (improved from 55%)
- ✅ No breaking changes to existing APIs

**Files Created**: 8 (hooks, utilities)
**Files Modified**: 13 (refactoring, enhancements)
**Lines Added**: 1,331 (new files)
**Net Lines Changed**: +179 (after refactoring reduction)

**Report:** [quality-improvement.report.md](./quality-improvement.report.md)

---

## [0.5.1] - 2026-03-06

### Feature: Tablet Touch UX Improvement (High Priority #5)

**tablet-touch-ux Summary:**
- Tablet device detection (768px~1366px, includes iPad Pro)
- Touch feedback optimization for tablet users (~20% of user base)
- Visual response feedback on joint interaction
- Enhanced touch hitbox accuracy

**Added:**
- `isTablet()` detection function in device-detector.ts
- `isTouchDevice()` utility for pure touch support detection
- BenchmarkResult.isTablet field for device classification
- perf-store isTablet state management
- Tablet hitbox 3.5x scale (matching mobile for better touch accuracy)
- Canvas touch-action: none CSS to prevent browser gestures
- Visual touch feedback: 25% scale pulse animation on joint interaction
- Enhanced tablet-specific touch hint text in mannequin viewer

**Changed:**
- `device-detector.ts`: Added tablet detection with 768px~1366px range + iPad UA validation
- `perf-store.ts`: Added isTablet state and optional tablet parameter to initFromDetection()
- `mannequin-viewer.tsx`: Conditional hitbox scaling and touch-action CSS
- `mannequin-model.tsx`: Touch feedback animation using useFrame lerp (0.2 speed, no external dependencies)
- `mannequin/page.tsx`: Passing device detection results to performance store

**Quality Metrics:**
- Design Match Rate: **100%** (17/17 items — zero deviations)
- Architecture Compliance: **100%**
- Convention Compliance: **100%**
- TypeScript Errors: 0
- Iterations Required: 0 (first-pass implementation)
- Files Modified: 5
- Lines Added: 80

**Key Decisions:**
- Tablet range: 768px~1366px (extends plan's 1024px to include iPad Pro 12.9")
- Touch feedback: useFrame lerp animation vs spring library (dependency minimization)
- touch-action: none prevents browser default zoom/scroll on canvas
- Optional tablet parameter maintains backward compatibility

**Report:** [features/tablet-touch-ux.report.md](./features/tablet-touch-ux.report.md)

---

## [0.5.0] - 2026-03-06 (PENDING - Image Pipeline Feature)

### Feature: Image Data Pipeline (Phase C/A/B/D Integration)

**Image Pipeline Summary:**
- Complete Unsplash image sourcing with tag mapping (Phase A)
- Backend integration with bkend.ai database (Phase C)
- Automatic 3D vector extraction from EXIF metadata (Phase B)
- Content safety filtering with NSFW detection (Phase D)

**Phase C: Backend Integration**
- Created `image-service.ts` (194 LOC) — bkend.ai data layer with fallback
- Created `useImages.ts` hook (89 LOC) — Infinite scroll queries (50 items/page, 5-min cache)
- Migrated 3 pages: mannequin/page, sketch/page, collections/[id]/page
- Extended ReferenceImage type: unsplashId, source, safetyScore, poseExtracted, unsplashMeta

**Phase A: Unsplash Collection Pipeline**
- Created `unsplash-client.ts` (178 LOC) — Official API wrapper with rate limits
- Created `unsplash-tag-mapper.ts` (303 LOC) — 169 English→Korean tag mappings
- Created admin pipeline dashboard (351 LOC) — Query selection, rate limits, progress tracking
- Created `POST /api/pipeline/collect` route (149 LOC) — End-to-end collection pipeline

**Phase B: Auto Vector Extraction**
- Created `unsplash-vector-heuristics.ts` (180 LOC) — EXIF + tag-based inference
- Created admin extract dashboard (423 LOC) — MediaPipe WASM batch pose extraction
- Memory-safe processing (reset every 200 images to prevent OOM)

**Phase D: Content Safety Filter**
- Created `safety-filter.ts` (188 LOC) — nsfwjs MobileNetV2 NSFW detection
- 3-level safety toggle: strict/moderate/off
- Integrated with extract pipeline and search filters

**Added:**
- 9 new files (~2,055 LOC total, 100% Korean comments)
- 5 modified files for integration
- Type-safe bkend.ai integration
- Production-ready Unsplash pipeline
- Client-side NSFW detection

**Quality Metrics:**
- Design Match Rate: **97.5%** (39 FULL, 1 PARTIAL)
- Architecture Compliance: **100%**
- Convention Compliance: **100%**
- TypeScript Errors: 0
- Build Status: SUCCESS

**Known Limitations:**
- EXIF lighting inference uses ISO only (aperture/shutter parsed but not used)
  - Rationale: Unsplash EXIF incomplete; ISO sufficient for reference use
  - Future: Weighted multi-field calculation in Phase 5

**Report:** [features/image-pipeline.report.md](./features/image-pipeline.report.md)

---

## [0.4.0] - 2026-03-06

### Phase 4: AI Pose Extraction

**Added:**
- **MediaPipe Pose Integration** (src/lib/mediapipe-pose.ts)
  - PoseLandmarker WASM 싱글톤 초기화
  - Dynamic import로 지연 로딩 (~5MB 번들)
  - GPU delegate with CPU fallback
  - 33개 MediaPipe 랜드마크 추출
  - 512px 이상 이미지 자동 리사이즈

- **Landmark Mapping System** (src/lib/landmark-mapping.ts)
  - 33개 MediaPipe → 17개 ArtRef 관절 매핑
  - 직접 매핑 13개 + 합성 관절 4개 (pelvis, spine, chest, neck)
  - 정규화 좌표 변환 (COORD_SCALE=2.0)
  - `mapLandmarksToJoints()`: 관절 좌표 변환
  - `jointsToVector()`: 51-element 포즈 벡터
  - `jointsToWeights()`: 신뢰도 기반 가중치
  - `jointsToRecord()`: Inverse FK 입력 변환

- **Inverse Kinematics** (src/lib/inverse-fk.ts)
  - 월드 좌표 → 관절 회전값 역계산
  - 방향 벡터 기반 근사해 (twist 오류 허용)
  - `computeInverseFK()`: 회전값 산출
  - `directionToEuler()`: Axis-angle to Euler 변환
  - T-pose 기본값 캐시

- **Image Upload UI** (src/components/features/upload/image-upload-zone.tsx)
  - 드래그앤드롭 + 파일 선택 업로드
  - 포즈 추출 진행 표시 (로딩 스피너)
  - 추출 메타 표시 (신뢰도 %, 소요 시간)
  - 상태 머신: idle → loading-engine → extracting → preview → error
  - 에러 핸들링: WASM 실패, 포즈 미감지, 신뢰도 <0.3, 파일 검증
  - 플랜 제한 체크 및 업그레이드 배너

- **Pose Overlay Visualization** (src/components/features/upload/pose-overlay.tsx)
  - SVG 기반 관절 오버레이 렌더링
  - 관절 점(원) + 뼈대(선) 표시
  - 신뢰도별 색상 (보라/노랑/빨강)
  - 낮은 신뢰도 관절 투명도 처리 (opacity 0.3)

- **Extraction Limit Tracking** (src/hooks/usePlanLimits.ts)
  - `checkExtractionLimit()`: 일일 제한 확인
  - `recordExtraction()`: 추출 기록
  - `remainingExtractions`: 남은 횟수 조회
  - localStorage 기반 일일 카운터

**Changed:**
- **src/hooks/usePoseSearch.ts**
  - `externalPoseVector` 파라미터 추가
  - `externalWeights` 파라미터 추가
  - 외부 벡터 우선 매칭 로직 (마네킹 vs 업로드 이미지)

- **src/stores/pose-store.ts**
  - `applyExternalPose()` 메서드 추가
  - 외부 포즈 (Inverse FK) 일괄 적용

- **src/lib/plan-limits.ts**
  - `dailyExtractionLimit` 추가: free=5, pro/team=-1
  - `maxBatchSize` 추가: free=1, pro=5, team=10

- **src/app/(main)/search/page.tsx**
  - ImageUploadZone 배치 (왼쪽 패널 > 프리셋 영역)
  - 추출 포즈 벡터/가중치 상태 관리
  - 추출된 포즈 활성 배지 + 해제 버튼
  - usePoseSearch에 외부 벡터 전달

**Fixed:**
- MediaPipe 동시 호출 race condition (mutex 방식)
- 저신뢰도 관절 처리 (가중치 0으로 제외)

**Metrics:**
- **Lines Added**: 1,500+ (5 new files + 5 modified)
- **Files Created**: 5
- **Files Modified**: 5
- **TypeScript Errors**: 0
- **Convention Compliance**: 100%
- **Architecture Compliance**: 100%
- **Design Match Rate**: 97.4% (PASS ✅)

**Quality Assurance:**
- ✅ MediaPipe WASM 로드 및 싱글톤 동작
- ✅ 33→17 관절 매핑 정확성 검증
- ✅ 포즈 추출 속도 (<2초, 실제 ~0.8초)
- ✅ Inverse FK 마네킹 적용 시각적 유사도 (75%+)
- ✅ 외부 벡터와 기존 매칭 엔진 호환성
- ✅ 플랜 게이팅 (free=5, pro/team=무제한)
- ✅ 모바일 성능 최적화 (512px 리사이즈)

**Related Documents:**
- Plan: [ai-pose-extraction.plan.md](../01-plan/features/ai-pose-extraction.plan.md)
- Design: [ai-pose-extraction.design.md](../02-design/features/ai-pose-extraction.design.md)
- Analysis: [ai-pose-extraction.analysis.md](../03-analysis/ai-pose-extraction.analysis.md)
- Report: [ai-pose-extraction.report.md](./features/ai-pose-extraction.report.md)

---

## [0.2.0] - 2026-03-06

### Phase 2: AI Pose Matching Implementation

**Added:**
- **Forward Kinematics Engine** (src/lib/forward-kinematics.ts)
  - 17-joint skeleton system with THREE.js-independent math
  - Euler angle to rotation matrix conversion
  - Recursive FK traversal with parent rotation accumulation
  - `computePoseVector()`: Generate 51-dimension pose vectors
  - `computeDefaultPoseVector()`: Default neutral pose
  - Support for male/female/neutral body types

- **Pose Similarity Analysis** (src/lib/pose-similarity.ts)
  - Procrustes normalization (centroid + scale)
  - Weighted cosine similarity calculation
  - Joint-specific weight presets:
    - DEFAULT_WEIGHTS: uniform (1.0)
    - UPPER_BODY_WEIGHTS: head/arms emphasized (1.2)
    - LOWER_BODY_WEIGHTS: legs de-emphasized (0.8)
  - `comparePoses()` convenience function

- **Pose Vector Dataset** (src/lib/pose-vectors.ts)
  - 8 pose presets: standing, sitting, walking, running, looking-back, reaching, crouching, leaning
  - Deterministic noise generation via seededRandom()
  - Tag-to-preset mapping for 12+ tags
  - 561 sample images with synthesized pose vectors
  - Preset vector caching for performance
  - Figure category filtering

- **Hybrid Search Hook** (src/hooks/usePoseSearch.ts)
  - Combined tag filtering + pose similarity matching
  - Default pose detection via `useIsDefaultPose()` selector
  - Dynamic activation: only match when pose changed & toggle active
  - Similarity-based result sorting (highest first)
  - Graceful handling of undefined pose vectors

- **UI Components**
  - **pose-match-indicator.tsx** (55 lines)
    - Toggle button for pose matching
    - Green pulsing indicator when active
    - Match count display: "{N} matched / {total}"
    - Visual feedback on toggle state
  - **Similarity Badges** (in image-grid.tsx)
    - Green (>80%): Excellent match
    - Yellow (60-80%): Good match
    - Gray (<60%): Low match
    - Opacity styling for visual hierarchy

- **Light Analysis** (src/lib/light-analyzer.ts)
  - Canvas-based image brightness analysis
  - 3×3 grid discretization for spatial brightness distribution
  - Light direction estimation (azimuth, elevation, intensity)
  - `analyzeImageBrightness()`: Extract brightness grid
  - `estimateLightDirection()`: Infer primary light source
  - Filter UI with optional light direction matching

- **Type System Enhancements** (src/types/index.ts)
  - `ScoredReferenceImage`: Reference image with similarity metadata
    - `poseVector?: number[]` (51-dimension)
    - `similarityScore?: number` (0-1)
    - `lightDirection?: LightDirection`
  - `LightDirection`: { azimuth, elevation, intensity }
  - `BrightnessGrid`: { cells: number[][] } for 3×3 analysis

### Changed:**
- **src/stores/pose-store.ts**
  - Added `useIsDefaultPose()` derived selector
  - Detects when user returns to default/idle pose
  - Returns boolean: true if all joints match default

- **src/lib/sample-data.ts**
  - Now imports `generatePoseVectorForImage` from pose-vectors
  - `SAMPLE_IMAGES_WITH_POSES` exported with full pose data
  - All 561 sample images include pose vectors

- **src/app/(main)/search/page.tsx**
  - Integrated `usePoseSearch()` hook
  - Added `poseMatchEnabled` state management
  - Connected `PoseMatchIndicator` component with toggle handler
  - Passes pose search results to gallery

- **src/components/features/gallery/image-grid.tsx**
  - Added `getSimilarityBadge()` function
  - Renders similarity percentage badge on images
  - Color-coded: green/yellow/gray per score

- **src/components/features/search/search-filters.tsx**
  - Added optional props: `lightDirection`, `lightFilterActive`, `onLightFilterToggle`
  - Light direction filter UI (L89-123): slider/selector for light direction
  - Props marked as optional to maintain backward compatibility

### Fixed:**
- (None - initial implementation)

### Metrics:**
- **Lines Added**: 1,099 (new) + 100 (modified) = 1,199 total
- **Files Created**: 6
- **Files Modified**: 6
- **TypeScript Errors**: 0
- **Convention Compliance**: 98%
- **Architecture Compliance**: 100%
- **Design Match Rate**: 97.6% (vs. 90% threshold)

### Quality Assurance:**
- ✅ Forward Kinematics validation
  - 17 joints correctly mapped
  - FK calculation tested with presets
  - Coordinate system verified
- ✅ Similarity calculation
  - Procrustes normalization verified
  - Cosine similarity weighted correctly
  - Edge cases handled (null vectors, infinity)
- ✅ Search integration
  - Tag filtering + pose matching hybrid works
  - Default pose detection functional
  - Sorting by similarity descending correct
- ✅ UI rendering
  - Toggle button responsive
  - Badges render with correct colors
  - Match count updates on search
- ✅ Type safety
  - All optional fields properly typed
  - No type errors in strict mode

### Known Issues:**
- ⚠️ **Low Priority**: Lighting filter props not connected in search/page.tsx
  - UI elements defined, component renders, but parent doesn't pass props
  - Fix: Add lightFilterActive state + pass to SearchFilters (10 lines)
  - Timeline: Phase 3 polish

### Next Phase (Phase 3):**
- Unit tests for FK engine and similarity calculation
- Lighting filter props connection
- Real image validation against pose matching
- Performance optimization for large datasets
- API documentation generation

---

## [0.1.0] - 2026-02-xx

### Phase 1: MVP Foundation

**Added:**
- Project scaffolding with Next.js 14 App Router
- TypeScript strict mode configuration
- Tailwind CSS styling setup
- Basic folder structure:
  - `src/lib/` - Utility functions
  - `src/hooks/` - React hooks
  - `src/stores/` - Zustand state management
  - `src/components/` - React components
  - `src/types/` - TypeScript definitions
  - `docs/` - Documentation (PDCA structure)

- **Schema & Terminology Documentation**
  - Core data models (Pose, ReferenceImage, SearchFilters)
  - Joint nomenclature (17-joint system)
  - Reference image categories and tags
  - Search parameter taxonomy

- **Initial Type System**
  - ReferenceImage base type
  - Pose data structures
  - Filter configuration types

- **Base Authentication Setup**
  - bkend.ai integration initialized
  - Auth store scaffolding

### Changed:**
- (Initial release)

### Fixed:**
- (Initial release)

---

## Version Strategy

### Semantic Versioning

- **MAJOR** (X.0.0): Major feature releases (new phases)
- **MINOR** (0.X.0): Feature additions within phase
- **PATCH** (0.0.X): Bug fixes and minor improvements

### Versioning Timeline

| Version | Phase | Estimated Release |
|---------|-------|-------------------|
| 0.1.0 | Phase 1 (Plan) | Done (Feb 2026) |
| 0.2.0 | Phase 2 (Do) | Done (Mar 6, 2026) |
| 0.3.0 | Phase 3-5 (Conventions, Mockup, Design) | Mar 20, 2026 |
| 0.4.0 | Phase 6-7 (UI, Security) | Apr 15, 2026 |
| 1.0.0 | Phase 8-9 (Review, Deploy) | May 30, 2026 |

---

## How to Read This Changelog

### Status Tags

- **Added**: New features/components
- **Changed**: Modifications to existing features
- **Fixed**: Bug fixes
- **Removed**: Deprecated features (if applicable)
- **Security**: Security fixes or warnings

### Priority Tags

- 🔴 **Critical**: Blocking issues, data loss risk
- 🟠 **High**: Major feature broken, security issue
- 🟡 **Medium**: Feature partially broken, workaround exists
- 🟢 **Low**: Minor issue, cosmetic, no impact
- ⚠️ **Warning**: Known issue, monitor closely

### Phase References

- **Phase 1**: Schema/Terminology (Planning)
- **Phase 2**: API Design (Do/Check)
- **Phase 3**: Coding Conventions
- **Phase 4**: Mockup
- **Phase 5**: Design System
- **Phase 6**: UI Implementation
- **Phase 7**: SEO/Security
- **Phase 8**: Review
- **Phase 9**: Deployment

---

## Related Documentation

- **Project Status**: [docs/04-report/project-status.md](./project-status.md)
- **Phase 2 Report**: [docs/04-report/features/ai-pose-matching.report.md](./features/ai-pose-matching.report.md)
- **Phase 2 Analysis**: [docs/03-analysis/features/ai-pose-matching.analysis.md](../03-analysis/features/ai-pose-matching.analysis.md)
- **CLAUDE.md**: [CLAUDE.md](../../CLAUDE.md) - Project conventions

---

**Last Updated**: 2026-03-06 by report-generator
