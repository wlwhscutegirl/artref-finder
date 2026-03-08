# anatomy-overlay-v2 Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: ArtRef Finder
> **Analyst**: gap-detector
> **Date**: 2026-03-06
> **Previous Analysis**: anatomy-overlay (v1) -- 100.0% PASS

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

anatomy-overlay v1에서 투표를 통해 확인된 Critical 이슈 2건(C1: 다중 근육 선택, C2: 모바일 범례 최적화)의 구현 일치도 검증.

### 1.2 Analysis Scope

- **Design Requirements**: C1 (다중 근육 선택, 16/20 동의), C2 (모바일 범례 최적화, 15/20 동의)
- **Implementation Files**:
  - `src/stores/anatomy-store.ts` (다중 선택 Set 기반 리팩터링)
  - `src/components/features/mannequin/anatomy-legend.tsx` (반응형 아코디언)
  - `src/components/features/mannequin/mannequin-model.tsx` (selectedMuscles Set 연동)
  - `src/app/(main)/mannequin/page.tsx` (호환 확인)
- **Analysis Date**: 2026-03-06

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 C1: 다중 근육 선택

| # | Design Requirement | Implementation | Status | Notes |
|:-:|-------------------|----------------|:------:|-------|
| 1 | `selectedMuscles: Set<MuscleGroupId>` (다중 선택) | `anatomy-store.ts:14` -- `selectedMuscles: Set<MuscleGroupId>` | FULL | 기존 `selectedMuscle: ... \| null` 에서 Set으로 리팩터링 완료 |
| 2 | Ctrl/Cmd + 클릭 다중 선택 토글 | `anatomy-store.ts:60-68` -- `if (multi)` 분기에서 Set add/delete | FULL | `anatomy-legend.tsx:22-23`에서 `e.ctrlKey \|\| e.metaKey` 감지 |
| 3 | 일반 클릭: 단독 선택 (다른 선택 해제) | `anatomy-store.ts:70-77` -- `else` 분기에서 `new Set([id])` | FULL | 정확히 설계대로 구현 |
| 4 | 이미 단독 선택된 근육 다시 클릭: 전체 보기 | `anatomy-store.ts:71-73` -- `current.size === 1 && current.has(id)` 체크 | FULL | `new Set()`으로 비우기 = 전체 보기 |
| 5 | 범례에 "N개 선택" 카운트 표시 | `anatomy-legend.tsx:38-40` (데스크탑) / `103-106` (모바일) | FULL | 데스크탑: "(N개 선택)", 모바일: "N개" |
| 6 | 데스크탑 "Ctrl+클릭 다중선택" 힌트 표시 | `anatomy-legend.tsx:44-46` -- `text-[9px] text-neutral-600` | FULL | 항상 표시 (선택 유무 무관) |
| 7 | 3D 뷰어: 선택된 모든 근육 하이라이트, 나머지 dim (opacity 0.25) | `mannequin-model.tsx:196` -- `selectedMuscles.size > 0 && !selectedMuscles.has(muscleId)` | FULL | Bone/Joint 모두 Set 기반 dim 계산 |
| 8 | dim opacity 값 0.25 | `mannequin-model.tsx:87` (Bone) / `156` (JointSphere) | FULL | `opacity={dimmed ? 0.25 : 1}` 정확 일치 |
| 9 | `toggleMuscle(id, multi?)` API | `anatomy-store.ts:26,57` | FULL | `multi` boolean 파라미터로 분기 |
| 10 | `resetSelection()` 전체 보기 리셋 | `anatomy-store.ts:81-83` | FULL | `new Set()` 초기화 |
| 11 | `isMuscleSelected(id)` 헬퍼 | `anatomy-store.ts:85-87` | FULL | `selectedMuscles.has(id)` |
| 12 | `hasSelection()` 선택 존재 확인 | `anatomy-store.ts:89-91` | FULL | `selectedMuscles.size > 0` |
| 13 | `isMuscledDimmed(id)` dimmed 계산 | `anatomy-store.ts:93-96` | FULL | 선택 있고 미선택인 경우 true |
| 14 | 모드 끌 때 선택 리셋 | `anatomy-store.ts:46` -- `!current ? get().selectedMuscles : new Set()` | FULL | toggleAnatomyMode에서 자동 리셋 |

### 2.2 C2: 모바일 범례 최적화

| # | Design Requirement | Implementation | Status | Notes |
|:-:|-------------------|----------------|:------:|-------|
| 15 | md+: 기존 2열 그리드 유지 | `anatomy-legend.tsx:33` -- `hidden md:block` | FULL | md 브레이크포인트에서 2열 그리드 표시 |
| 16 | ~md(모바일): 아코디언 (기본 접힘) | `anatomy-legend.tsx:18,90` -- `useState(false)` + `md:hidden` | FULL | 기본 `expanded=false` |
| 17 | 접힘 상태: 선택된 근육 칩만 가로 스크롤 표시 | `anatomy-legend.tsx:120-136` -- `!expanded && selectedMuscles.size > 0` 조건부 렌더링 | FULL | `overflow-x-auto scrollbar-hide` 적용 |
| 18 | 펼침 상태: flex-wrap 칩 레이아웃 (작은 크기) | `anatomy-legend.tsx:146` -- `flex flex-wrap gap-1` | FULL | `text-[10px]` 작은 크기 칩 |
| 19 | 길게 누르기(contextmenu): 다중 선택 지원 | `anatomy-legend.tsx:151-155` -- `onContextMenu` 핸들러 | FULL | `e.preventDefault()` + `toggleMuscle(id, true)` |
| 20 | 초기화 버튼 | `anatomy-legend.tsx:109-116` -- `onClick={resetSelection}` | FULL | 선택 있을 때만 표시 |
| 21 | 아코디언 헤더 탭으로 펼치기/접기 | `anatomy-legend.tsx:93` -- `onClick={() => setExpanded(!expanded)}` | FULL | 전체 영역 클릭으로 토글 |
| 22 | 모바일 펼침 시 다중선택 힌트 | `anatomy-legend.tsx:142-144` -- `"탭: 단독 선택 . 길게 누르기: 추가 선택"` | FULL | 모바일 전용 힌트 텍스트 |

### 2.3 호환성 검증

| # | Design Requirement | Implementation | Status | Notes |
|:-:|-------------------|----------------|:------:|-------|
| 23 | mannequin/page.tsx 변경 없이 호환 | `page.tsx:19,24,192-193,507-517,547-551` | FULL | 기존 `useAnatomyStore` 사용 패턴 유지, `isAnatomyMode`/`toggleAnatomyMode` 인터페이스 동일 |
| 24 | 관절 선택 + 기즈모 기능 정상 작동 | `mannequin-model.tsx:263-268` -- `handleJointClick`, TransformControls 코드 불변 | FULL | 해부학 오버레이와 기즈모 독립 동작 |
| 25 | mannequin-model.tsx: selectedMuscles Set 연동 | `mannequin-model.tsx:184` -- `useAnatomyStore((s) => s.selectedMuscles)` | FULL | Set 직접 구독, boneAnatomy/jointAnatomy 헬퍼에서 `.has()` 사용 |

### 2.4 추가 구현 (설계 외)

| # | Item | Implementation | Impact |
|:-:|------|----------------|--------|
| A1 | `setAnatomyMode(active)` 직접 설정 API | `anatomy-store.ts:50-55` | LOW -- 편의 함수, 기존 v1에서 유지 |
| A2 | 접힘 칩에 색상 배경+도트 적용 | `anatomy-legend.tsx:126-127` -- `backgroundColor: group.color + '25'` | LOW -- UX 향상 |
| A3 | 펼침 칩에 선택/비선택 스타일 분기 | `anatomy-legend.tsx:156-166` -- ring, opacity, color 분기 | LOW -- UX 향상 |

---

## 3. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match (C1: 다중 선택) | 100.0% (14/14) | PASS |
| Design Match (C2: 모바일 범례) | 100.0% (8/8) | PASS |
| Compatibility | 100.0% (3/3) | PASS |
| **Overall** | **100.0%** (25 FULL / 0 PARTIAL / 0 MISSING / 3 ADDED) | **PASS** |

```
Total Items: 25 design requirements + 3 added
  FULL:    25 (100.0%)
  PARTIAL:  0 (0.0%)
  MISSING:  0 (0.0%)
  ADDED:    3 (design에 없으나 구현됨 -- 모두 LOW impact)
```

---

## 4. Convention Compliance

### 4.1 Naming Convention

| File | Convention | Status |
|------|-----------|:------:|
| `anatomy-store.ts` | kebab-case file, camelCase exports | PASS |
| `anatomy-legend.tsx` | kebab-case file, PascalCase component (`AnatomyLegend`) | PASS |
| `mannequin-model.tsx` | kebab-case file, PascalCase component (`Mannequin`) | PASS |

### 4.2 Korean Comments

| File | Comment Coverage | Status |
|------|:----------------:|:------:|
| `anatomy-store.ts` | 모든 함수/분기에 한글 주석 | PASS |
| `anatomy-legend.tsx` | 주요 섹션별 한글 주석 | PASS |
| `mannequin-model.tsx` | JSDoc + 인라인 한글 주석 | PASS |

### 4.3 Import Order

| File | External -> Absolute -> Relative -> Type | Status |
|------|:------------------------------------------:|:------:|
| `anatomy-store.ts` | `zustand` -> `@/lib/anatomy-data` (type import) | PASS |
| `anatomy-legend.tsx` | `react` -> `@/stores/..` -> `@/lib/..` -> type import | PASS |
| `mannequin-model.tsx` | `react`, `three`, `@react-three/*` -> `@/stores/..` -> `@/lib/..` | PASS |

### 4.4 Architecture (Dynamic Level)

| Check | Status | Notes |
|-------|:------:|-------|
| Store -> Domain types only | PASS | `anatomy-store.ts` imports `MuscleGroupId` type from lib |
| Component -> Store (hook) | PASS | `anatomy-legend.tsx` uses `useAnatomyStore` |
| Component -> Lib (data) | PASS | Direct `MUSCLE_GROUPS` import is acceptable (constants) |
| No circular dependencies | PASS | |

```
Convention Compliance: 100%
```

---

## 5. Verification Criteria Status

| # | Criterion | Status | Evidence |
|:-:|-----------|:------:|---------|
| 1 | `npx tsc --noEmit` error 0 | PASS | User confirmed |
| 2 | 다중 선택: Ctrl+클릭 여러 근육 동시 하이라이트 | PASS | `toggleMuscle(id, true)` -> Set add/delete |
| 3 | 단독 선택: 일반 클릭 해당만 선택, 다시 클릭 해제 | PASS | `new Set([id])` / `new Set()` 분기 |
| 4 | 모바일: 아코디언 기본 접힘, 탭 펼치기 | PASS | `useState(false)` + `onClick toggle` |
| 5 | 모바일: 접힘 시 선택된 칩만 가로 스크롤 | PASS | `!expanded && selectedMuscles.size > 0` 조건부 렌더링 |
| 6 | 기존 기능 호환 (관절 선택, 기즈모) | PASS | `mannequin/page.tsx` 변경 없음, 기즈모 코드 불변 |
| 7 | 3D 뷰어 다중 근육 하이라이트 정상 동작 | PASS | `boneAnatomy`/`jointAnatomy` 헬퍼가 Set.has() 기반으로 dim 계산 |

---

## 6. File Change Summary

### Modified Files (3)

| File | Key Changes |
|------|-------------|
| `src/stores/anatomy-store.ts` | `selectedMuscle: ... \| null` -> `selectedMuscles: Set<MuscleGroupId>`, `toggleMuscle(id, multi?)` 시그니처 추가, `resetSelection`/`isMuscleSelected`/`hasSelection`/`isMuscledDimmed` 헬퍼 추가 |
| `src/components/features/mannequin/anatomy-legend.tsx` | 전면 재작성: 데스크탑 2열 그리드 + 모바일 아코디언 레이아웃, Ctrl 키 감지, contextmenu 다중 선택, 카운트 표시 |
| `src/components/features/mannequin/mannequin-model.tsx` | `selectedMuscle` -> `selectedMuscles` (Set) 구독, `boneAnatomy`/`jointAnatomy` 헬퍼에서 `Set.has()` 기반 dim 계산 |

### Unchanged Files (1)

| File | Reason |
|------|--------|
| `src/app/(main)/mannequin/page.tsx` | `useAnatomyStore` 인터페이스(`isAnatomyMode`, `toggleAnatomyMode`) 불변으로 수정 불필요 |

### No New Files

v2는 기존 파일 수정만으로 구현 완료. 신규 파일 없음.

---

## 7. Recommended Actions

없음. Match Rate 100.0%로 설계-구현 완전 일치.

---

## 8. Conclusion

anatomy-overlay-v2는 Critical 이슈 2건(C1: 다중 근육 선택, C2: 모바일 범례 최적화)을 **100.0% 설계대로 구현** 완료.

- C1 (다중 선택): Set 기반 상태, Ctrl/Cmd 다중 토글, 단독 클릭 해제, 카운트 표시, 힌트 텍스트 -- 14개 항목 모두 FULL
- C2 (모바일 범례): 아코디언 기본 접힘, 선택 칩 가로 스크롤, flex-wrap 펼침, contextmenu 다중 선택, 초기화 버튼 -- 8개 항목 모두 FULL
- 호환성: mannequin/page.tsx 무변경, 기즈모/관절 선택 독립 동작 확인 -- 3개 항목 모두 FULL

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-06 | Initial v2 gap analysis (C1 + C2) | gap-detector |
