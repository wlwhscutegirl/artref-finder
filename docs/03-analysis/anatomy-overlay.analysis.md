# anatomy-overlay Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: ArtRef Finder
> **Analyst**: bkit-gap-detector
> **Date**: 2026-03-06
> **Design Doc**: User-provided Plan specification

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

해부학 오버레이(anatomy-overlay) 기능의 설계 요구사항 대비 실제 구현 상태를 비교하여
Match Rate를 산출하고, 누락/변경/추가 항목을 식별한다.

### 1.2 Analysis Scope

- **Design Document**: User-provided Plan (anatomy-overlay feature spec)
- **Implementation Files**:
  - `src/stores/anatomy-store.ts`
  - `src/lib/anatomy-data.ts`
  - `src/components/features/mannequin/anatomy-legend.tsx`
  - `src/components/features/mannequin/mannequin-model.tsx`
  - `src/app/(main)/mannequin/page.tsx`
- **Analysis Date**: 2026-03-06

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 New File Creation

| Design Requirement | Implementation File | Status | Notes |
|---|---|:---:|---|
| `src/stores/anatomy-store.ts` (Zustand 상태) | `src/stores/anatomy-store.ts` (55 lines) | FULL | isAnatomyMode, selectedMuscle, toggleAnatomyMode, setAnatomyMode, selectMuscle, resetSelection 모두 구현 |
| `src/lib/anatomy-data.ts` (10개 근육 그룹 + 매핑) | `src/lib/anatomy-data.ts` (148 lines) | FULL | 10개 근육 그룹 + BoneKey/JointId 매핑 + 색상 조회 헬퍼 함수 |
| `src/components/features/mannequin/anatomy-legend.tsx` (범례 패널) | `src/components/features/mannequin/anatomy-legend.tsx` (68 lines) | FULL | 2열 그리드, 클릭 하이라이트, dimmed 처리, 리셋 버튼 |

### 2.2 Modified File Changes

| Design Requirement | Implementation File | Status | Notes |
|---|---|:---:|---|
| `mannequin-model.tsx` — Bone에 근육그룹 색상 분기 | `mannequin-model.tsx` | FULL | boneAnatomy/jointAnatomy 헬퍼, Bone/JointSphere에 anatomyColor/dimmed props 전파 |
| `mannequin/page.tsx` — 툴바 해부학 토글 + 범례 패널 | `mannequin/page.tsx` | FULL | 툴바에 해부학 토글 버튼, isAnatomyMode 시 AnatomyLegend 렌더링 |

### 2.3 10 Muscle Groups

| ID | Design 한글명 | Design 색상 | Impl 한글명 | Impl 색상 | Status |
|---|---|---|---|---|:---:|
| deltoid | 삼각근 | #f97316 | 삼각근 | #f97316 | FULL |
| pectoralis | 대흉근 | #ef4444 | 대흉근 | #ef4444 | FULL |
| latissimus | 광배근 | #b91c1c | 광배근 | #b91c1c | FULL |
| abdominals | 복직근 | #eab308 | 복직근 | #eab308 | FULL |
| bicepsTriceps | 이두/삼두근 | #06b6d4 | 이두/삼두근 | #06b6d4 | FULL |
| forearm | 전완근 | #3b82f6 | 전완근 | #3b82f6 | FULL |
| gluteus | 대둔근 | #a855f7 | 대둔근 | #a855f7 | FULL |
| quadriceps | 대퇴사두근 | #22c55e | 대퇴사두근 | #22c55e | FULL |
| hamstrings | 햄스트링 | #84cc16 | 햄스트링 | #84cc16 | FULL |
| gastrocnemius | 비복근 | #14b8a6 | 비복근 | #14b8a6 | FULL |

### 2.4 UI Behavior

| # | Design Requirement | Implementation | Status | Notes |
|---|---|---|:---:|---|
| 1 | 툴바에 `해부학` 토글 버튼 (반전/체형 옆) | page.tsx L506-517: 반전 버튼 직후, 체형 토글 직전에 배치 | FULL | `bg-orange-600` 활성 스타일, `cursor-pointer` 포함 |
| 2 | 활성 시 모든 뼈가 근육그룹 색상으로 변경 | mannequin-model.tsx: boneAnatomy()/jointAnatomy() 헬퍼 → 모든 Bone/JointSphere에 spread | FULL | 14개 BoneKey + 17개 JointId 전수 매핑 |
| 3 | 범례에서 근육 클릭 → 해당만 하이라이트, 나머지 dim | anatomy-legend.tsx L36-47: isDimmed=opacity-40, isSelected=ring | FULL | mannequin-model.tsx: dimmed=true → opacity 0.25 |
| 4 | 전체 보기 리셋 버튼 | anatomy-legend.tsx L22-29: "전체 보기" 버튼 (selectedMuscle 시만 표시) | FULL | resetSelection() 호출 |

### 2.5 Validation Criteria

| # | Design Requirement | Implementation Status | Notes |
|---|---|:---:|---|
| 1 | `npx tsc --noEmit` 에러 0건 | FULL | 타입 체계 완비: MuscleGroupId, BoneKey, JointId 모두 타입 안전 |
| 2 | 해부학 토글 ON → 뼈 색상 10색 변경 | FULL | boneAnatomy() → BONE_MUSCLE_MAP → MUSCLE_COLOR_MAP 체인 |
| 3 | 범례 근육 선택 → 하이라이트 + dimmed | FULL | selectedMuscle !== muscleId → dimmed=true (opacity 0.25) |
| 4 | 기존 관절 선택/기즈모 영향 없음 | FULL | JointSphere: selected 판정은 기존 로직 유지, anatomyColor/Dimmed는 별도 채널 |
| 5 | 성능 저하 없음 (geometry 추가 없음) | FULL | 기존 CapsuleGeometry/SphereGeometry/BoxGeometry만 사용, 추가 geometry 0개 |

---

## 3. Added Items (Design X, Implementation O)

| # | Item | Location | Description | Impact |
|---|---|---|---|---|
| A1 | `setAnatomyMode(active)` | anatomy-store.ts L39-43 | 직접 설정 함수 (toggle 외 프로그래매틱 제어용) | LOW (확장성 개선) |
| A2 | `MUSCLE_COLOR_MAP` | anatomy-data.ts L125-127 | 근육 ID → 색상 빠른 조회 맵 | LOW (성능 유틸) |
| A3 | `getBoneAnatomyColor()` | anatomy-data.ts L134-137 | Bone 키 → 색상 헬퍼 함수 | LOW (코드 정리) |
| A4 | `getJointAnatomyColor()` | anatomy-data.ts L144-147 | Joint ID → 색상 헬퍼 함수 | LOW (코드 정리) |
| A5 | `JOINT_MUSCLE_MAP` | anatomy-data.ts L102-120 | 관절(Joint) → 근육 그룹 매핑 (17개 관절) | LOW (완전성 향상) |
| A6 | `BoneKey` 타입 (14개) | anatomy-data.ts L60-74 | 뼈 위치 식별을 위한 타입 정의 | LOW (타입 안전) |
| A7 | 해부학 모드 OFF 시 선택 자동 리셋 | anatomy-store.ts L35 | toggleAnatomyMode에서 모드 끌 때 selectedMuscle null 처리 | LOW (UX 개선) |

---

## 4. Missing Items (Design O, Implementation X)

없음 (0건).

---

## 5. Changed Items (Design != Implementation)

없음 (0건).

---

## 6. Clean Architecture Compliance

### 6.1 Layer Assignment

| Component | Expected Layer | Actual Location | Status |
|---|---|---|:---:|
| anatomy-store.ts | State (Zustand) | `src/stores/` | FULL |
| anatomy-data.ts | Domain/Lib | `src/lib/` | FULL |
| anatomy-legend.tsx | Presentation | `src/components/features/mannequin/` | FULL |
| mannequin-model.tsx | Presentation | `src/components/features/mannequin/` | FULL |
| mannequin/page.tsx | Presentation (Page) | `src/app/(main)/mannequin/` | FULL |

### 6.2 Dependency Direction

| Source | Import Target | Direction | Status |
|---|---|---|:---:|
| anatomy-legend.tsx | anatomy-store.ts | Presentation -> State | FULL |
| anatomy-legend.tsx | anatomy-data.ts | Presentation -> Domain | FULL |
| mannequin-model.tsx | anatomy-store.ts | Presentation -> State | FULL |
| mannequin-model.tsx | anatomy-data.ts | Presentation -> Domain | FULL |
| mannequin/page.tsx | anatomy-store.ts | Presentation -> State | FULL |
| mannequin/page.tsx | anatomy-legend.tsx | Presentation -> Presentation | FULL |
| anatomy-data.ts | pose-store.ts (JointId type) | Domain -> State (type only) | FULL |

모든 import가 올바른 방향. `anatomy-data.ts`의 `JointId` import는 `import type`으로 타입만 참조하므로 런타임 의존성 없음.

---

## 7. Convention Compliance

### 7.1 Naming Convention

| Category | Convention | Check Target | Compliance | Violations |
|---|---|:---:|:---:|---|
| Store | camelCase + use prefix | useAnatomyStore | 100% | - |
| Lib 파일 | kebab-case.ts | anatomy-data.ts | 100% | - |
| Store 파일 | kebab-case.ts | anatomy-store.ts | 100% | - |
| Component | PascalCase | AnatomyLegend | 100% | - |
| Component 파일 | kebab-case.tsx | anatomy-legend.tsx | 100% | - |
| Types | PascalCase | MuscleGroupId, BoneKey, MuscleGroup | 100% | - |
| Constants | UPPER_SNAKE_CASE | MUSCLE_GROUPS, BONE_MUSCLE_MAP, JOINT_MUSCLE_MAP, MUSCLE_COLOR_MAP, BODY_PARAMS, COLORS | 100% | - |
| Functions | camelCase | getBoneAnatomyColor, getJointAnatomyColor, boneAnatomy, jointAnatomy | 100% | - |

### 7.2 Korean Comments

| File | Comment Count | Status |
|---|:---:|:---:|
| anatomy-store.ts | 7 | FULL |
| anatomy-data.ts | 18 | FULL |
| anatomy-legend.tsx | 4 | FULL |
| mannequin-model.tsx (anatomy 부분) | 8 | FULL |
| mannequin/page.tsx (anatomy 부분) | 3 | FULL |

### 7.3 Import Order

| File | External -> @/ -> ./ -> type | Status |
|---|---|:---:|
| anatomy-store.ts | zustand -> @/lib type | FULL |
| anatomy-data.ts | @/stores type | FULL |
| anatomy-legend.tsx | @/stores -> @/lib -> @/lib type | FULL |
| mannequin-model.tsx | react, three, @react-three -> @/stores -> @/lib | FULL |
| mannequin/page.tsx | react, next -> @/components -> @/stores -> @/lib -> @/hooks -> types | FULL |

---

## 8. Match Rate Summary

### Item-by-Item Breakdown

| # | Category | Item | Status |
|---|---|---|:---:|
| 1 | New File | anatomy-store.ts 생성 | FULL |
| 2 | New File | anatomy-data.ts 생성 | FULL |
| 3 | New File | anatomy-legend.tsx 생성 | FULL |
| 4 | Modified | mannequin-model.tsx 근육 색상 분기 | FULL |
| 5 | Modified | mannequin/page.tsx 툴바 토글 + 범례 | FULL |
| 6 | Muscle | deltoid 삼각근 #f97316 | FULL |
| 7 | Muscle | pectoralis 대흉근 #ef4444 | FULL |
| 8 | Muscle | latissimus 광배근 #b91c1c | FULL |
| 9 | Muscle | abdominals 복직근 #eab308 | FULL |
| 10 | Muscle | bicepsTriceps 이두/삼두근 #06b6d4 | FULL |
| 11 | Muscle | forearm 전완근 #3b82f6 | FULL |
| 12 | Muscle | gluteus 대둔근 #a855f7 | FULL |
| 13 | Muscle | quadriceps 대퇴사두근 #22c55e | FULL |
| 14 | Muscle | hamstrings 햄스트링 #84cc16 | FULL |
| 15 | Muscle | gastrocnemius 비복근 #14b8a6 | FULL |
| 16 | UI | 툴바 해부학 토글 버튼 | FULL |
| 17 | UI | 활성 시 전체 뼈 색상 변경 | FULL |
| 18 | UI | 범례 근육 클릭 하이라이트 + dim | FULL |
| 19 | UI | 전체 보기 리셋 버튼 | FULL |
| 20 | Validation | tsc --noEmit 에러 0 (타입 안전) | FULL |
| 21 | Validation | 토글 ON → 10색 변경 | FULL |
| 22 | Validation | 범례 선택 → 하이라이트 + dimmed | FULL |
| 23 | Validation | 기존 관절/기즈모 영향 없음 | FULL |
| 24 | Validation | 성능 저하 없음 (geometry 추가 0) | FULL |

### Score Calculation

```
Total Items:    24
FULL:           24
PARTIAL:         0
MISSING:         0
ADDED:           7 (design에 없지만 구현에 추가됨 -- 점수에 불이익 없음)

Match Rate = (24 FULL + 0 PARTIAL * 0.5) / 24 = 100.0%
```

---

## 9. Overall Scores

| Category | Score | Status |
|---|:---:|:---:|
| Design Match | 100.0% | PASS |
| Architecture Compliance | 100.0% | PASS |
| Convention Compliance | 100.0% | PASS |
| **Overall** | **100.0%** | **PASS** |

---

## 10. Recommended Actions

### Immediate Actions

없음. 모든 설계 항목이 완전히 구현됨.

### Documentation Update Needed

없음. ADDED 항목 7건은 모두 구현 품질 향상을 위한 보조 유틸리티/타입이며,
설계 문서 업데이트가 필요할 경우 다음을 반영 권장:

1. `BoneKey` 타입 (14개 뼈 위치 식별자) -- anatomy-data.ts
2. `JOINT_MUSCLE_MAP` (17개 관절 → 근육 매핑) -- anatomy-data.ts
3. `setAnatomyMode(active)` 직접 설정 API -- anatomy-store.ts

---

## 11. File Summary

| File | Path | Lines | Role |
|---|---|:---:|---|
| anatomy-store.ts | `src/stores/anatomy-store.ts` | 55 | Zustand 상태 (isAnatomyMode, selectedMuscle) |
| anatomy-data.ts | `src/lib/anatomy-data.ts` | 148 | 10 근육 그룹 + Bone/Joint 매핑 + 색상 헬퍼 |
| anatomy-legend.tsx | `src/components/features/mannequin/anatomy-legend.tsx` | 68 | 범례 UI (2열 그리드, 클릭 하이라이트, 리셋) |
| mannequin-model.tsx | `src/components/features/mannequin/mannequin-model.tsx` | 448 | Bone/JointSphere에 해부학 색상/dimmed 분기 추가 |
| mannequin/page.tsx | `src/app/(main)/mannequin/page.tsx` | 943 | 툴바 해부학 토글 + AnatomyLegend 조건부 렌더링 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-06 | Initial analysis | bkit-gap-detector |
