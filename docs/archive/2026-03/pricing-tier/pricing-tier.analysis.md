# pricing-tier Analysis Report

> **Analysis Type**: Gap Analysis (Plan vs Implementation)
>
> **Project**: ArtRef Finder
> **Analyst**: Claude (gap-detector)
> **Date**: 2026-03-06
> **Plan Doc**: [pricing-tier.plan.md](../01-plan/features/pricing-tier.plan.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

pricing-tier 기능(요금제 개편 + 중간 플랜 추가)의 Plan 문서 대비 실제 구현 코드의 일치율을 검증한다.
FR-01 ~ FR-07 총 7개 기능 요구사항을 항목별로 대조한다.

### 1.2 Analysis Scope

- **Plan Document**: `docs/01-plan/features/pricing-tier.plan.md`
- **Implementation Files** (5개):
  - `src/types/index.ts`
  - `src/lib/plan-limits.ts`
  - `src/hooks/usePlanLimits.ts`
  - `src/app/(main)/pricing/page.tsx`
  - `src/components/features/plan/upgrade-banner.tsx`
- **Analysis Date**: 2026-03-06

---

## 2. FR-by-FR Gap Analysis

### FR-01: 무료 플랜 제한 완화

| 항목 | Plan 명세 | 구현 (plan-limits.ts) | Status |
|------|-----------|----------------------|--------|
| 일일 검색 | 50 -> 100 | `dailySearchLimit: 100` (L46) | FULL |
| 컬렉션 | 3 -> 5 | `maxCollections: 5` (L47) | FULL |
| 저장 포즈 | 5 -> 10 | `maxSavedPoses: 10` (L48) | FULL |
| 히스토리 | 20 -> 30 | `historyLimit: 30` (L51) | FULL |

**FR-01 Result: 4/4 FULL**

---

### FR-02: Lite 플랜 신설

| 항목 | Plan 명세 | 구현 (plan-limits.ts) | Status |
|------|-----------|----------------------|--------|
| 가격 | 4,900/월 | `PLAN_PRICING.lite.monthly: 4900` (L37) | FULL |
| 일일 검색 | 무제한 | `dailySearchLimit: -1` (L56) | FULL |
| 컬렉션 | 20개 | `maxCollections: 20` (L57) | FULL |
| 저장 포즈 | 50개 | `maxSavedPoses: 50` (L58) | FULL |
| 고급 필터 | O | `advancedFilters: true` (L59) | FULL |
| AI 포즈 추출 | 15회/일 | `dailyExtractionLimit: 15` (L62) | FULL |
| 배치 | 3장 | `maxBatchSize: 3` (L63) | FULL |
| 히스토리 | 50개 | `historyLimit: 50` (L61) | FULL |
| 팀 공유 | X | `teamSharing: false` (L60) | FULL |

**FR-02 Result: 9/9 FULL**

---

### FR-03: Student 플랜 신설

| 항목 | Plan 명세 | 구현 (plan-limits.ts) | Status |
|------|-----------|----------------------|--------|
| 가격 | 2,900/월 | `PLAN_PRICING.student.monthly: 2900` (L38) | FULL |
| Pro 동급 기능 | 무제한 검색/컬렉션/포즈/추출 | `-1` 전부 확인 (L66-68, L72) | FULL |
| 팀 공유 X | X | `teamSharing: false` (L70) | FULL |
| 배치 3장 | 3 | `maxBatchSize: 3` (L73) | FULL |
| studentVerified 필드 | User 타입에 추가 | `studentVerified?: boolean` (index.ts:13) | FULL |
| 고급 필터 | O | `advancedFilters: true` (L69) | FULL |

**FR-03 Result: 6/6 FULL**

---

### FR-04: 연간 결제 할인

| 항목 | Plan 명세 | 구현 | Status |
|------|-----------|------|--------|
| 20% 할인 | 명시 | 토글 옆 "20% 할인" 텍스트 (pricing/page.tsx:248) | FULL |
| 월간/연간 토글 UI | pricing 페이지 | `useState<BillingCycle>` + 토글 버튼 (L187, L228-250) | FULL |
| Lite 연간 | 3,920/월 (47,040/년) | `annual: 3920` (plan-limits.ts:37) | FULL |
| Pro 연간 | 7,920/월 (95,040/년) | `annual: 7920` (plan-limits.ts:39) | FULL |
| Student 연간 | 2,320/월 (27,840/년) | `annual: 2320` (plan-limits.ts:38) | FULL |
| Team 연간 | 23,920/월 (287,040/년) | `annual: 23920` (plan-limits.ts:40) | FULL |
| 취소선 원래 가격 | (암묵적 UX) | `line-through` 표시 (pricing/page.tsx:296-300) | FULL |

**FR-04 Result: 7/7 FULL**

---

### FR-05: User 타입 확장

| 항목 | Plan 명세 | 구현 (index.ts) | Status |
|------|-----------|-----------------|--------|
| plan 타입 | `'free'\|'lite'\|'student'\|'pro'\|'team'` | 5개 리터럴 유니온 (L11) | FULL |
| studentVerified | `boolean` optional | `studentVerified?: boolean` (L13) | FULL |
| billingCycle | `'monthly'\|'annual'` optional | `billingCycle?: 'monthly' \| 'annual'` (L15) | FULL |
| usePlanLimits 타입 반영 | plan 타입에 lite/student 포함 | `plan` 캐스팅에 5개 포함 (usePlanLimits.ts:134) | FULL |

**FR-05 Result: 4/4 FULL**

---

### FR-06: 업그레이드 배너 다단계 분기

| 항목 | Plan 명세 | 구현 (upgrade-banner.tsx) | Status |
|------|-----------|--------------------------|--------|
| Free -> Lite/Pro 추천 | Lite+Pro 동시 노출 | `isFreePlan` 분기: Lite 메인 CTA + Pro 보조 버튼 (L75-92) | FULL |
| Lite -> Pro 추천 | Pro 추천 | `upgradeLabel` = "Pro 플랜 (9,900/월)" (L45) | FULL |
| 차단 메시지에 Lite 언급 | 추가 | `upgradeDescription` "4,900/월" 포함 (L47) | FULL |
| student/pro/team 무시 | 배너 미표시 | 조건 return null (L39-41) | FULL |
| currentPlan Props | plan 5종 지원 | `currentPlan?: 'free'\|'lite'\|'student'\|'pro'\|'team'` (L21) | FULL |

**FR-06 Result: 5/5 FULL**

---

### FR-07: Pricing 페이지 5열 확장

| 항목 | Plan 명세 | 구현 (pricing/page.tsx) | Status |
|------|-----------|------------------------|--------|
| 5열 비교 | Free/Lite/Student/Pro/Team | `PLANS` 배열 5개 (L39-157) | FULL |
| 월간/연간 토글 스위치 | UI | 토글 버튼 + billingCycle 상태 (L222-250) | FULL |
| 현재 플랜 하이라이트 | 표시 | `isCurrent` -> "현재 플랜" 비활성 버튼 (L326-339) | FULL |
| 모바일 수평 스크롤 | 스크롤 or 아코디언 | `overflow-x-auto` + `min-w-[900px]` (L253-254) | FULL |
| 학생 인증 뱃지 | (암묵적) | `requiresVerification` -> "학생 인증" 뱃지 (L278-282) | FULL |
| 추천 뱃지 (Pro) | (암묵적) | `highlighted` -> "추천" 뱃지 (L271-275) | FULL |
| 가격 표시 | 월간/연간 전환 | `displayPrice` 분기 (L257) | FULL |

**FR-07 Result: 7/7 FULL**

---

## 3. Match Rate Summary

```
+---------------------------------------------+
|  Overall Match Rate: 100.0% (42/42)          |
+---------------------------------------------+
|  FULL:     42 items (100.0%)                 |
|  PARTIAL:   0 items (0.0%)                   |
|  MISSING:   0 items (0.0%)                   |
|  ADDED:     0 items (0.0%)                   |
+---------------------------------------------+
```

| FR | Items | FULL | PARTIAL | MISSING | Rate |
|----|:-----:|:----:|:-------:|:-------:|:----:|
| FR-01 무료 플랜 완화 | 4 | 4 | 0 | 0 | 100% |
| FR-02 Lite 플랜 | 9 | 9 | 0 | 0 | 100% |
| FR-03 Student 플랜 | 6 | 6 | 0 | 0 | 100% |
| FR-04 연간 결제 | 7 | 7 | 0 | 0 | 100% |
| FR-05 User 타입 | 4 | 4 | 0 | 0 | 100% |
| FR-06 배너 분기 | 5 | 5 | 0 | 0 | 100% |
| FR-07 Pricing 5열 | 7 | 7 | 0 | 0 | 100% |
| **Total** | **42** | **42** | **0** | **0** | **100%** |

---

## 4. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 100% | PASS |
| Architecture Compliance | 100% | PASS |
| Convention Compliance | 100% | PASS |
| **Overall** | **100%** | **PASS** |

---

## 5. Architecture & Convention Check

### 5.1 Layer Compliance (Dynamic Level)

| File | Expected Layer | Actual Layer | Status |
|------|---------------|-------------|--------|
| `src/types/index.ts` | Domain | Domain (types/) | PASS |
| `src/lib/plan-limits.ts` | Infrastructure/Application | Lib (lib/) | PASS |
| `src/hooks/usePlanLimits.ts` | Presentation (hooks) | Hooks (hooks/) | PASS |
| `src/app/(main)/pricing/page.tsx` | Presentation (pages) | App Router page | PASS |
| `src/components/features/plan/upgrade-banner.tsx` | Presentation (components) | Components | PASS |

### 5.2 Dependency Direction

| Source | Imports | Direction | Status |
|--------|---------|-----------|--------|
| usePlanLimits.ts | auth-store, plan-limits | Hook -> Store, Lib | PASS |
| pricing/page.tsx | auth-store | Page -> Store | PASS |
| upgrade-banner.tsx | next/link (only) | Component -> Framework | PASS |

### 5.3 Convention Compliance

| Category | Check | Status |
|----------|-------|--------|
| Component naming | UpgradeBanner (PascalCase) | PASS |
| Function naming | formatPrice, checkLimit (camelCase) | PASS |
| Constants | PLAN_CONFIGS, PLAN_PRICING, FEATURE_KEYS (UPPER_SNAKE) | PASS |
| File naming | plan-limits.ts, upgrade-banner.tsx (kebab-case) | PASS |
| Korean comments | All files have Korean comments | PASS |
| Import order | External -> Internal (@/) -> Types | PASS |

---

## 6. Missing / Added / Changed Features

### MISSING (Plan O, Implementation X)

없음.

### ADDED (Plan X, Implementation O)

없음. 구현은 Plan 범위를 정확히 따름.

### CHANGED (Plan != Implementation)

없음. 모든 수치, 타입, UI 요소가 Plan과 정확히 일치.

---

## 7. File Change Verification

Plan 문서의 "파일 변경 계획" 5개 파일이 모두 변경되었는지 확인:

| Plan 파일 변경 계획 | 실제 변경 | Status |
|---------------------|-----------|--------|
| `src/types/index.ts` - plan 타입 확장 + studentVerified, billingCycle | plan 5종 유니온 + 두 필드 확인 | PASS |
| `src/lib/plan-limits.ts` - lite, student 추가 + free 완화 | PLAN_CONFIGS 5플랜 + PLAN_PRICING 추가 | PASS |
| `src/hooks/usePlanLimits.ts` - plan 타입 확장 | 5종 캐스트 반영 | PASS |
| `src/app/(main)/pricing/page.tsx` - 5열 + 토글 + 모바일 | 5 PLANS + BillingCycle 토글 + overflow-x-auto | PASS |
| `src/components/features/plan/upgrade-banner.tsx` - 다단계 분기 | Free->Lite/Pro, Lite->Pro 분기 로직 | PASS |

---

## 8. Recommended Actions

### Immediate Actions

없음. 모든 FR이 완전히 구현됨.

### Documentation Update Needed

없음.

### Future Improvements (참고)

1. **결제 시스템 연동**: CTA 버튼이 현재 "Coming Soon" 상태. 실제 결제 플로우 구현 시 별도 Plan 작성 필요.
2. **학생 인증 플로우**: `studentVerified` 필드는 정의되었으나 인증 프로세스(이메일 검증, 학생증 업로드)는 미구현. 별도 기능으로 분리 적절.
3. **Pricing 페이지 모바일 UX**: 현재 수평 스크롤 방식. Plan에서 "아코디언" 대안도 제시했으나 수평 스크롤로 구현. 사용자 피드백에 따라 아코디언 방식 고려 가능.

---

## 9. Next Steps

- [x] Plan 대비 구현 Gap 분석 완료
- [ ] Completion Report 작성 (`/pdca report pricing-tier`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-06 | Initial analysis - 100% match rate | Claude (gap-detector) |
