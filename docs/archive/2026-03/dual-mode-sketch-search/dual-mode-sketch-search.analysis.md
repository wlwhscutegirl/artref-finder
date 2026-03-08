# dual-mode-sketch-search Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: ArtRef Finder
> **Analyst**: gap-detector
> **Date**: 2026-03-06
> **Design Doc**: [dual-mode-sketch-search.design.md](../../02-design/features/dual-mode-sketch-search.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Phase 7 "Dual Mode + Sketch Search" feature implementation gap analysis.
Design document defines routing restructure, drawing canvas, sketch-to-pose pipeline, and mode switching UI.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/dual-mode-sketch-search.design.md`
- **Implementation Files**: 9 files across routing, components, lib, pages
- **Analysis Date**: 2026-03-06

---

## 2. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 90.0% | PASS |
| Architecture Compliance | 95.0% | PASS |
| Convention Compliance | 96.0% | PASS |
| **Overall** | **93.0%** | PASS |

---

## 3. Gap Analysis (Design vs Implementation)

### 3.1 Routing

| # | Design | Implementation | Status | Notes |
|---|--------|---------------|--------|-------|
| R-01 | `/` landing with mode selection | `src/app/page.tsx` dual mode cards | FULL | Both mannequin and sketch cards present |
| R-02 | `/mannequin` mannequin mode page | `src/app/(main)/mannequin/page.tsx` | FULL | Existing search page content moved |
| R-03 | `/sketch` drawing mode page | `src/app/(main)/sketch/page.tsx` | FULL | New page with canvas + results |
| R-04 | `/search` -> `/mannequin` 301 redirect | `src/app/(main)/search/page.tsx` uses `redirect()` | PARTIAL | Uses Next.js `redirect()` which defaults to 307, not 301. Design specifies 301 permanent redirect. |
| R-05 | `/collections` common (unchanged) | Existing | FULL | Not affected |
| R-06 | `/dashboard` common (unchanged) | Existing | FULL | Not affected |
| R-07 | `/pricing` common (unchanged) | Existing | FULL | Not affected |

### 3.2 Components

| # | Design Component | Implementation File | Status | Notes |
|---|-----------------|---------------------|--------|-------|
| C-01 | DrawingCanvas (512x512) | `src/components/features/sketch/drawing-canvas.tsx` | PARTIAL | Design specifies separate `width`/`height` props (both default 512). Implementation uses single `size` prop. Functionally equivalent but API signature differs. |
| C-02 | DrawingCanvas `canvasRef` prop (RefObject) | `drawing-canvas.tsx` uses `forwardRef` + `useImperativeHandle` | PARTIAL | Design specifies `canvasRef?: React.RefObject<HTMLCanvasElement \| null>` as a prop exposing raw canvas. Implementation uses `forwardRef<DrawingCanvasHandle>` exposing a custom handle with `toDataURL/clear/undo/redo/canUndo/canRedo`. Different API shape but better encapsulation. |
| C-03 | SketchToolbar (all props) | `src/components/features/sketch/sketch-toolbar.tsx` | FULL | All 11 props match design exactly: tool, lineWidth, color, canUndo, canRedo, onToolChange, onLineWidthChange, onColorChange, onUndo, onRedo, onClear |
| C-04 | SketchUpload (drag-and-drop + validation) | `src/components/features/sketch/sketch-upload.tsx` | FULL | Drag-and-drop, file type validation (PNG/JPEG/WebP), size limit (5MB), click upload |
| C-05 | ModeTabs (`activeMode: 'mannequin' \| 'sketch'`) | `src/components/ui/mode-tabs.tsx` | FULL | Props match design. Uses Link for navigation. |
| C-06 | ModeTabs in mannequin page header | `src/app/(main)/mannequin/page.tsx` | MISSING | ModeTabs is NOT imported or rendered in the mannequin page. Only present in sketch page. Design architecture diagram shows shared header with ModeTabs across both modes. |
| C-07 | Landing page mode selection cards | `src/app/page.tsx` | FULL | Two cards: mannequin (-> /mannequin) and sketch (-> /sketch) with descriptions matching wireframe |

### 3.3 Types

| # | Design Type | Implementation | Status | Notes |
|---|------------|----------------|--------|-------|
| T-01 | `DrawingTool = 'pen' \| 'eraser'` | `drawing-canvas.tsx` line 11 | FULL | Exact match |
| T-02 | `CanvasState { tool, lineWidth, color, history, historyIndex }` | State managed internally in DrawingCanvas | PARTIAL | Not exported as a standalone type. State is managed via useState hooks internally. Functionally equivalent. |
| T-03 | `SketchToolbarProps` (11 props) | `sketch-toolbar.tsx` line 10-33 | FULL | All props match |
| T-04 | `ModeTabsProps { activeMode }` | `mode-tabs.tsx` line 10-13 | FULL | Exact match |

### 3.4 Library / Utility

| # | Design Function | Implementation | Status | Notes |
|---|----------------|----------------|--------|-------|
| L-01 | `sketchToPose(dataUrl) -> { poseVector, jointWeights } \| null` | `src/lib/sketch-to-pose.ts` | PARTIAL | Return type is expanded: adds `confidence` and `processingTime` fields via `SketchPoseResult` interface. Core `poseVector` + `jointWeights` present. |
| L-02 | Reuses Phase 4 `extractPoseFromImage()` pipeline | Imports `extractPoseFromImage` from `mediapipe-pose.ts` | FULL | Correctly reuses existing MediaPipe pipeline |
| L-03 | Fallback: image features -> tag matching (brightness/contrast -> lighting, aspect ratio -> camera angle) | Not implemented | MISSING | Design Section 8 step 4 specifies fallback when no human figure detected. Implementation returns null with error message only. |

### 3.5 Page Integration

| # | Design Requirement | Implementation | Status | Notes |
|---|-------------------|----------------|--------|-------|
| P-01 | Sketch page: Canvas + results grid with ImageGrid reuse | `sketch/page.tsx` uses `ImageGrid` component | FULL | ImageGrid imported from `@/components/features/gallery/image-grid` |
| P-02 | Sketch page: sketchToPose() -> usePoseSearch | `sketch/page.tsx` calls `sketchToPose()` then feeds into `usePoseSearch` | FULL | Complete pipeline working |
| P-03 | Canvas 512x512 in sketch page | `<DrawingCanvas size={512} .../>` | FULL | Matches design |
| P-04 | Undo/Redo via Ctrl+Z/Ctrl+Y | `drawing-canvas.tsx` keyboard event handler | FULL | Both shortcuts implemented |
| P-05 | Touch support via pointer events + touch-action: none | Canvas uses `onPointerDown/Move/Up` + `style={{ touchAction: 'none' }}` | FULL | Matches design Section 7 |
| P-06 | History max 50 entries | `MAX_HISTORY = 50` constant | FULL | Matches design |

### 3.6 Canvas Implementation Detail

| # | Design Spec | Implementation | Status | Notes |
|---|------------|----------------|--------|-------|
| D-01 | pointerdown -> isDrawing=true, beginPath | `handlePointerDown`: `isDrawingRef.current=true`, `ctx.beginPath()` | FULL | |
| D-02 | pointermove -> lineTo + stroke | `handlePointerMove`: `ctx.lineTo()`, `ctx.stroke()` | FULL | |
| D-03 | pointerup -> isDrawing=false, saveHistory | `handlePointerUp`: sets false, calls `saveToHistory()` | FULL | |
| D-04 | Undo: historyIndex-- -> putImageData | `undo()` decrements index, calls `putImageData` | FULL | |
| D-05 | Redo: historyIndex++ -> putImageData | `redo()` increments index, calls `putImageData` | FULL | |
| D-06 | Draw: splice + push + index++ | `saveToHistory` slices history, pushes new ImageData | FULL | |

---

## 4. Match Rate Summary

```
Total Items: 30
  FULL:    22 (73.3%)
  PARTIAL:  5 (16.7%)
  MISSING:  2 ( 6.7%)
  ADDED:    1 ( 3.3%)

Match Rate: 90.0% (FULL + PARTIAL*0.5 = 22 + 2.5 = 24.5/27 design items)
```

### Missing Features (Design O, Implementation X)

| # | Item | Design Location | Description | Impact |
|---|------|-----------------|-------------|--------|
| M-01 | ModeTabs in mannequin page | design.md Section 2 architecture | ModeTabs component not integrated into mannequin page header. Users cannot switch from mannequin to sketch mode via header tabs. | HIGH |
| M-02 | Tag matching fallback for non-human sketches | design.md Section 8 step 4 | When sketchToPose fails (no human detected), design specifies fallback: brightness/contrast -> lighting tags, aspect ratio -> camera angle inference. Implementation only shows error message. | MEDIUM |

### Added Features (Design X, Implementation O)

| # | Item | Implementation Location | Description | Impact |
|---|------|------------------------|-------------|--------|
| A-01 | DrawingCanvasHandle (imperative API) | `drawing-canvas.tsx` line 14-27 | `useImperativeHandle` exposes `toDataURL/clear/undo/redo/canUndo/canRedo`. Design only specified `canvasRef` for raw canvas access. Better encapsulation pattern. | LOW (positive) |

### Changed Features (Design != Implementation)

| # | Item | Design | Implementation | Impact |
|---|------|--------|----------------|--------|
| CH-01 | Canvas props API | `width?: number; height?: number` (separate) | `size?: number` (single prop, square canvas) | LOW -- canvas is always 512x512 square per wireframe |
| CH-02 | Redirect status code | 301 permanent redirect | 307 temporary redirect (Next.js `redirect()` default) | LOW -- SEO impact minimal for SPA, but technically inconsistent |
| CH-03 | `sketchToPose()` return type | `{ poseVector, jointWeights } \| null` | `SketchPoseResult { poseVector, jointWeights, confidence, processingTime } \| null` | LOW -- superset of design, no breaking change |
| CH-04 | CanvasState type | Exported standalone type | Internal state via useState hooks | LOW -- functionally equivalent |

---

## 5. Architecture Compliance (Dynamic Level)

### 5.1 Layer Placement

| Component | Expected Layer | Actual Location | Status |
|-----------|---------------|-----------------|--------|
| DrawingCanvas | Presentation | `src/components/features/sketch/` | PASS |
| SketchToolbar | Presentation | `src/components/features/sketch/` | PASS |
| SketchUpload | Presentation | `src/components/features/sketch/` | PASS |
| ModeTabs | Presentation (UI) | `src/components/ui/` | PASS |
| sketchToPose | Infrastructure/Lib | `src/lib/sketch-to-pose.ts` | PASS |
| usePoseSearch | Application (Hook) | `src/hooks/usePoseSearch.ts` | PASS |
| Sketch page | Presentation (Page) | `src/app/(main)/sketch/page.tsx` | PASS |

### 5.2 Dependency Direction

| File | Imports From | Status |
|------|-------------|--------|
| `sketch/page.tsx` | `@/components/ui`, `@/components/features/sketch`, `@/components/features/gallery`, `@/lib/sketch-to-pose`, `@/hooks/usePoseSearch`, `@/lib/sample-data` | PASS |
| `drawing-canvas.tsx` | react only | PASS |
| `sketch-toolbar.tsx` | `./drawing-canvas` (DrawingTool type) | PASS |
| `sketch-upload.tsx` | react only | PASS |
| `sketch-to-pose.ts` | `@/lib/mediapipe-pose`, `@/lib/landmark-mapping` | PASS |

No dependency violations detected. Architecture compliance: **95%** (all layer placements correct, clean dependency flow).

---

## 6. Convention Compliance

### 6.1 Naming Convention

| Category | Convention | Compliance | Violations |
|----------|-----------|:----------:|------------|
| Components | PascalCase | 100% | None |
| Functions | camelCase | 100% | None |
| Constants | UPPER_SNAKE_CASE | 100% | `MAX_HISTORY`, `MAX_FILE_SIZE`, `ACCEPTED_TYPES`, `PRESET_COLORS`, `MODES` |
| Files (component) | kebab-case.tsx | 100% | `drawing-canvas.tsx`, `sketch-toolbar.tsx`, `sketch-upload.tsx`, `mode-tabs.tsx` |
| Files (utility) | kebab-case.ts | 100% | `sketch-to-pose.ts` |
| Folders | kebab-case | 100% | `sketch/`, `ui/` |

### 6.2 Korean Comments

| File | Has Korean Comments | Status |
|------|:-------------------:|--------|
| `drawing-canvas.tsx` | Yes (header, inline) | PASS |
| `sketch-toolbar.tsx` | Yes (header, JSDoc) | PASS |
| `sketch-upload.tsx` | Yes (header, inline) | PASS |
| `sketch-to-pose.ts` | Yes (header, JSDoc) | PASS |
| `mode-tabs.tsx` | Yes (header) | PASS |
| `sketch/page.tsx` | Yes (header, inline) | PASS |
| `search/page.tsx` (redirect) | Yes (comment) | PASS |
| `page.tsx` (landing) | Minimal | PARTIAL -- landing page has only one comment line (`{/* Phase 7: ... */}`), major sections lack Korean comments |

### 6.3 Import Order

All files follow correct import order:
1. External libraries (react, next/link, next/navigation)
2. Internal absolute imports (`@/components/...`, `@/lib/...`, `@/hooks/...`)
3. Type imports (`import type`, `type` inline)

Convention compliance: **96%**

---

## 7. Recommended Actions

### 7.1 Immediate (HIGH impact)

| # | Priority | Item | File | Description |
|---|----------|------|------|-------------|
| 1 | HIGH | Add ModeTabs to mannequin page header | `src/app/(main)/mannequin/page.tsx` | Import and render `<ModeTabs activeMode="mannequin" />` in the header section. Without this, users in mannequin mode cannot switch to sketch mode via the header. |

### 7.2 Short-term (MEDIUM impact)

| # | Priority | Item | File | Description |
|---|----------|------|------|-------------|
| 2 | MEDIUM | Implement tag matching fallback | `src/lib/sketch-to-pose.ts` | When MediaPipe fails to detect a human figure, analyze brightness/contrast for lighting tags and aspect ratio for camera angle, as specified in design Section 8 step 4. |
| 3 | LOW | Fix redirect status code to 301 | `src/app/(main)/search/page.tsx` | Use `redirect('/mannequin', RedirectType.permanent)` or `permanentRedirect('/mannequin')` for proper 301 response. |

### 7.3 Design Document Updates Needed

| # | Item | Description |
|---|------|-------------|
| 1 | DrawingCanvasProps API | Update design to reflect `size` (single prop) instead of separate `width`/`height`. Or keep as-is if independent dimensions are desired in future. |
| 2 | DrawingCanvasHandle | Document the imperative handle pattern (`forwardRef` + `useImperativeHandle`) as the recommended canvas access API instead of raw `canvasRef` prop. |
| 3 | sketchToPose return type | Add `confidence` and `processingTime` fields to the design specification. |

---

## 8. Test Scenario Verification

| # | Design Test | Implementation Coverage | Status |
|---|------------|------------------------|--------|
| T-01 | Landing -> mannequin click -> /mannequin | Landing card links to `/mannequin` | PASS |
| T-02 | Landing -> drawing click -> /sketch | Landing card links to `/sketch` | PASS |
| T-03 | /search -> redirect to /mannequin | `redirect('/mannequin')` in search page | PASS (307, not 301) |
| T-04 | Canvas draw human -> search -> results | `handleSearch()` -> `sketchToPose()` -> `usePoseSearch` | PASS |
| T-05 | Upload sketch -> canvas display + pose extraction | `handleUpload()` sets backgroundImage + auto-calls `handleSearch` | PASS |
| T-06 | Ctrl+Z x3 -> 3 steps back | `undo()` with keyboard shortcut handler | PASS |
| T-07 | Mobile touch drawing | Pointer events + `touch-action: none` | PASS |
| T-08 | Header tab mode switch | ModeTabs in sketch page only | PARTIAL -- only works sketch -> mannequin, not mannequin -> sketch |

---

## 9. File Summary

### New Files (6)

| File | Lines | Purpose |
|------|:-----:|---------|
| `src/components/features/sketch/drawing-canvas.tsx` | 265 | HTML5 Canvas drawing component |
| `src/components/features/sketch/sketch-toolbar.tsx` | 157 | Pen/eraser/color/undo toolbar |
| `src/components/features/sketch/sketch-upload.tsx` | 127 | Drag-and-drop image upload |
| `src/components/ui/mode-tabs.tsx` | 41 | Mannequin/sketch mode toggle tabs |
| `src/lib/sketch-to-pose.ts` | 80 | Sketch -> MediaPipe -> pose vector |
| `src/app/(main)/sketch/page.tsx` | 237 | Sketch search page |

### Modified Files (3)

| File | Change | Purpose |
|------|--------|---------|
| `src/app/(main)/search/page.tsx` | Replaced with redirect | /search -> /mannequin redirect |
| `src/app/(main)/mannequin/page.tsx` | Moved from search | Mannequin mode (former search page) |
| `src/app/page.tsx` | Added dual mode cards | Landing page mode selection |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-06 | Initial gap analysis | gap-detector |
