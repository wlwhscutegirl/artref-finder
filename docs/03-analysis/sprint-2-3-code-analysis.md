# Sprint 2~3 코드 품질 분석 결과

## 분석 개요
- **분석 경로**: `src/` (Sprint 2~3 산출물 16개 파일)
- **파일 수**: 16
- **분석일**: 2026-03-08
- **분석 항목**: TypeScript 타입 안전성, React 패턴, 에러 처리, 성능, 접근성, 보안, 코드 중복

---

## 전체 품질 점수: 82/100

| 카테고리 | 점수 | 비고 |
|---------|------|------|
| TypeScript 타입 안전성 | 90/100 | any 사용 없음, 타입 단언 최소화 |
| React 패턴 준수 | 80/100 | 의존성 배열 양호, 일부 조건부 훅 호출 패턴 위반 |
| 에러 처리 일관성 | 85/100 | try-catch + 폴백 패턴 일관적, 실패 시 허용 정책 명확 |
| 성능 | 78/100 | 메모이제이션 양호, 일부 리렌더링 최적화 가능 |
| 접근성 | 72/100 | aria-label 제공, 키보드 트랩/포커스 관리 부재 |
| 보안 | 75/100 | XSS 위험 요소 존재, localStorage 민감 데이터 |
| 코드 중복 (DRY) | 78/100 | 모달 패턴/SVG 아이콘 중복 |
| 한글 주석 준수 | 95/100 | 거의 모든 함수/블록에 한글 주석 존재 |

---

## 파일별 점수

| 파일 | 줄 수 | 점수 | 요약 |
|------|-------|------|------|
| `hooks/use-infinite-images.ts` | 71 | 92 | 깔끔한 TanStack Query 래퍼, 주석 우수 |
| `hooks/use-intersection-observer.ts` | 99 | 95 | 콜백 ref 패턴, SSR 가드, 클린업 모두 양호 |
| `styles/design-tokens.ts` | 487 | 88 | 체계적 토큰 관리, 다만 파일 길이 초과(487줄) |
| `lib/subscription-service.ts` | 382 | 83 | 폴백 전략 우수, switch 구조 반복, 파일 길이 초과 |
| `stores/subscription-store.ts` | 205 | 85 | persist 미들웨어 활용, import 위치 비정상 |
| `lib/image-migration.ts` | 134 | 87 | 순차 처리, 진행률 콜백 제공, 병렬화 미적용 |
| `lib/pose-presets.ts` | 505 | 80 | 프리셋 데이터 파일, 길이 초과하나 데이터 특성상 허용 가능 |
| `app/page.tsx` | 422 | 76 | 랜딩페이지 JSX 단일 파일, 컴포넌트 분리 필요 |
| `components/features/subscription/upgrade-modal.tsx` | 237 | 84 | 접근성(키보드/포커스) 부재, UI 로직 분리 양호 |
| `components/features/subscription/usage-banner.tsx` | 197 | 79 | 조건부 early return 전 훅 호출 위반 |
| `hooks/use-search-limit.ts` | 153 | 86 | 한도 체크 로직 체계적, 상태 5개로 다소 많음 |
| `components/features/onboarding/onboarding-welcome-modal.tsx` | 417 | 81 | 3단계 UI 우수, 파일 길이 초과, 포커스 트랩 부재 |
| `hooks/use-onboarding-welcome.ts` | 77 | 90 | 간결한 훅, localStorage 가드 양호 |
| `components/seo/json-ld.tsx` | 87 | 82 | dangerouslySetInnerHTML 사용, XSS 주의 필요 |
| `app/robots.ts` | 31 | 93 | Next.js 컨벤션 준수, 간결 |
| `app/sitemap.ts` | 62 | 91 | 표준 sitemap 구성, 동적 페이지 미포함 |

---

## 이슈 상세

### [CRITICAL] 즉시 수정 필요

| # | 파일 | 줄 | 이슈 | 권장 조치 |
|---|------|-----|------|----------|
| C1 | `usage-banner.tsx` | 33-49 | **React 훅 규칙 위반**: `useState`(33줄) 호출 후 조건부 early return(41줄, 49줄)이 있으나, 이 사이에 추가 훅이 없으므로 실질적으로는 안전. 그러나 `isUnlimited` 체크가 훅 호출 사이에 위치하여 향후 훅 추가 시 규칙 위반 발생 가능 | 모든 early return을 훅 호출 이후로 이동하거나, 조건을 JSX 내부에서 처리 |
| C2 | `json-ld.tsx` | 69, 84 | **XSS 위험**: `dangerouslySetInnerHTML`에 `JSON.stringify` 결과 직접 삽입. `CustomJsonLd`의 `data` prop이 외부 입력을 받을 경우 `</script>` 태그 주입 가능 | `CustomJsonLd`에 입력값 검증 추가 또는 `JSON.stringify` 결과에서 `</script>` 이스케이핑 처리 |
| C3 | `onboarding-welcome-modal.tsx` | 250-252 | **STORAGE_KEY 중복 정의**: `use-onboarding-welcome.ts`(17줄)와 `onboarding-welcome-modal.tsx`(22줄) 모두 동일한 `STORAGE_KEY = 'artref_onboarding_done'`을 별도 정의. 한쪽 변경 시 동기화 누락 위험 | 공통 상수 파일(예: `lib/constants.ts`)로 추출하여 단일 출처 유지 |

### [WARNING] 개선 권장

| # | 파일 | 줄 | 이슈 | 권장 조치 |
|---|------|-----|------|----------|
| W1 | `subscription-service.ts` | 261-380 | **switch 문 중복 패턴**: `checkLimit`의 `createCollection`, `savePose` 케이스가 거의 동일한 구조 (bkend.data.list -> total 비교 -> LimitCheckResult 반환). 3회 반복 | 제네릭 헬퍼 함수 `checkCountLimit(table, field, maxValue)` 추출 |
| W2 | `subscription-store.ts` | 61 | **import 위치 비정상**: `PLAN_LIMITS` import가 인터페이스 정의 후(61줄)에 위치. ESM 표준에서는 작동하나 가독성 저하 | 파일 최상단(6-13줄 부근)으로 이동 |
| W3 | `app/page.tsx` | 1-422 | **파일 길이 초과(422줄)**: 단일 컴포넌트에 7개 섹션 JSX가 모두 포함. 300줄 권장 기준 초과 | Nav, HeroSection, FeatureGrid, PricingCompare, Footer 등으로 컴포넌트 분리 |
| W4 | `design-tokens.ts` | 1-487 | **파일 길이 초과(487줄)**: 데이터 정의 파일이므로 심각도는 낮으나, 토큰 카테고리별 분리 고려 | `color-tokens.ts`, `typography-tokens.ts`, `spacing-tokens.ts` 등으로 분리 후 `tokens/index.ts`에서 re-export |
| W5 | `onboarding-welcome-modal.tsx` | 1-417 | **파일 길이 초과(417줄)**: Step1/Step2/Step3 내부 컴포넌트가 같은 파일에 정의. 분리하면 테스트/재사용 용이 | 각 Step을 별도 파일로 분리 |
| W6 | `upgrade-modal.tsx` | 118-235 | **모달 접근성 부재**: `role="dialog"`, `aria-modal` 미설정. 키보드 포커스 트랩 없음. ESC 키 닫기 미구현 | `role="dialog"`, `aria-modal="true"` 추가, ESC 키 이벤트 리스너, 포커스 트랩 구현 |
| W7 | `onboarding-welcome-modal.tsx` | 312-414 | **모달 포커스 트랩 부재**: `role="dialog"`, `aria-modal` 설정됨(양호), 그러나 ESC 키 닫기 및 포커스 트랩 미구현 | `useEffect`로 ESC 키 리스너 추가, 포커스 가둠 로직 구현 |
| W8 | `image-migration.ts` | 98-126 | **순차 처리로 인한 성능 저하**: 이미지를 for 루프로 1건씩 순차 업로드. N개 이미지 시 N번의 네트워크 왕복 | `Promise.allSettled` + 동시성 제한(예: p-limit 5~10)으로 병렬화 |
| W9 | `usage-banner.tsx` | 33-36 | **SSR 불일치(Hydration Mismatch) 가능**: `useState` 초기값에서 `sessionStorage` 직접 접근. SSR 시 `false`, CSR 시 `true`가 될 수 있어 hydration mismatch 발생 가능 | `useEffect`에서 초기값 설정하거나, `useSyncExternalStore` 사용 |
| W10 | `use-search-limit.ts` | 64-141 | **상태 5개 동시 관리**: `showUpgradeModal`, `dailyUsage`, `dailyLimit`, `canSearch`, `isChecking` — 하나의 `useReducer`로 통합하면 상태 관리 명확 | `useReducer` 패턴으로 리팩토링 |
| W11 | `subscription-service.ts` | 27-76 | **플랜 제한 하드코딩**: PLAN_LIMITS가 코드에 직접 정의. 플랜 변경 시 코드 수정 + 배포 필요 | 서버(bkend) 또는 환경변수에서 동적으로 로드하는 방안 검토. 현재는 MVP 단계이므로 허용 가능 |
| W12 | `pose-presets.ts` | 1-505 | **파일 길이 초과(505줄)**: 데이터 파일이므로 로직 복잡도는 낮으나, 프리셋 종류별(body/camera/lighting/hand) 분리 검토 | `presets/body-presets.ts`, `presets/camera-presets.ts` 등으로 분리 |
| W13 | `app/page.tsx` | 276-297 | **기능 목록 리스트 아이템 key에 문자열 내용 사용**: `key={item}`으로 텍스트 내용을 key로 사용. 내용 변경 시 불필요한 DOM 재생성 | 인덱스 기반 또는 고유 ID 기반 key 사용 (정적 리스트에서는 현재 방식도 허용 가능) |

### [INFO] 참고 사항

- **TypeScript 타입 안전성 우수**: 분석 대상 16개 파일 전체에서 `any` 타입 사용 0건. 타입 단언(`as`) 사용은 `use-infinite-images.ts:36`의 `pageParam as number` 1건만 존재하며, TanStack Query v5의 API 설계상 필요한 부분
- **에러 처리 전략 일관성**: subscription-service, use-search-limit 등에서 "실패 시 허용(사용자 경험 우선)" 정책이 일관되게 적용됨. 비즈니스 로직상 합리적 판단
- **한글 주석 커버리지**: 모든 파일에 함수/블록 단위 한글 주석 존재. CLAUDE.md의 "모든 코드에 한글 주석 필수" 규칙 준수율 95% 이상
- **exhaustive check 패턴**: `subscription-service.ts:376`과 `subscription-store.ts:145`에서 `never` 타입을 활용한 exhaustive switch 패턴 적용 - 타입 안전성 우수
- **네이밍 컨벤션**: PascalCase(컴포넌트), camelCase(함수/변수), kebab-case(파일명) 일관 준수
- **SEO 구현 양호**: robots.ts, sitemap.ts가 Next.js App Router 컨벤션을 정확히 따르며, JSON-LD 구조화 데이터까지 포함
- **디자인 토큰 체계**: Tailwind 클래스 기반 Single Source of Truth 구현으로 향후 다크/라이트 테마 전환 대비 완료

---

## 중복 코드 분석

### 발견된 중복

| 유형 | 위치 1 | 위치 2 | 유사도 | 권장 조치 |
|------|--------|--------|--------|----------|
| 정확 | `use-onboarding-welcome.ts:17` | `onboarding-welcome-modal.tsx:22` | 100% | `STORAGE_KEY` 상수를 공통 파일로 추출 |
| 구조 | `subscription-service.ts:299-323` (createCollection) | `subscription-service.ts:326-350` (savePose) | 85% | 제네릭 카운트 체크 함수 추출 |
| 구조 | `upgrade-modal.tsx:118-235` (모달 오버레이) | `onboarding-welcome-modal.tsx:312-414` (모달 오버레이) | 70% | 공통 Modal 래퍼 컴포넌트 추출 |
| 구조 | `usage-banner.tsx` 내 SVG close 아이콘 (3회 반복) | - | 100% | `CloseIcon` 컴포넌트 추출 |
| 기존 | `onboarding-modal.tsx:12` | `onboarding-welcome-modal.tsx:22` | - | 온보딩 관련 localStorage 키가 2종류 (`artref-onboarding-seen`, `artref_onboarding_done`). 명명 규칙 불일치(하이픈 vs 언더스코어) + 역할 중복 가능 |

### 재사용 기회

| 함수/컴포넌트 | 현재 위치 | 제안 | 이유 |
|-------------|----------|------|------|
| 모달 오버레이 + 컨테이너 | upgrade-modal, onboarding-welcome-modal | `components/ui/modal.tsx` 공통 래퍼 추출 | 동일한 backdrop blur + 카드 패턴 반복 |
| SVG 닫기(X) 아이콘 | usage-banner, upgrade-modal | `components/ui/icons.tsx` 추출 | 4+ 곳에서 동일 SVG 반복 |
| localStorage 상수 키 | 5+ 파일에 분산 | `lib/storage-keys.ts` 중앙 관리 | 키 충돌 방지 및 단일 출처 |

---

## 확장성 분석

### 하드코딩 발견

| 파일 | 줄 | 코드 | 제안 |
|------|-----|------|------|
| `subscription-service.ts` | 27-76 | PLAN_LIMITS 전체 | MVP 단계에서는 허용. 향후 서버 설정 또는 환경변수로 이동 검토 |
| `use-search-limit.ts` | 73 | `dailyLimit` 초기값 `10` | PLAN_LIMITS.free.dailySearches에서 참조하도록 변경 |
| `upgrade-modal.tsx` | 57-63 | PLAN_HIGHLIGHTS 가격 문자열 | PLAN_LIMITS에서 priceMonthly를 포맷팅하여 생성 |
| `app/page.tsx` | 277-281 | Free 플랜 기능 목록 하드코딩 | PLAN_LIMITS와 동기화되지 않음 (코드에는 100회, PLAN_LIMITS에는 10회) |

### 데이터 불일치 (Critical)

| 위치 | 값 | 실제 PLAN_LIMITS 값 | 영향 |
|------|-----|---------------------|------|
| `app/page.tsx:277` | "일일 검색 100회" | `PLAN_LIMITS.free.dailySearches = 10` | 랜딩페이지에서 사용자에게 잘못된 정보 표시 |
| `app/page.tsx:279` | "저장 포즈 10개" | `PLAN_LIMITS.free.maxSavedPoses = 3` | 동일 |
| `app/page.tsx:278` | "컬렉션 5개" | `PLAN_LIMITS.free.maxCollections = 1` | 동일 |

---

## 보안 분석

| # | 파일 | 이슈 | 심각도 | 설명 |
|---|------|------|--------|------|
| S1 | `json-ld.tsx:80-86` | `CustomJsonLd`에 외부 데이터 삽입 | 중 | `dangerouslySetInnerHTML` + 외부 `data` prop. 현재는 서버 컴포넌트에서만 사용되나, 향후 클라이언트에서 사용자 입력이 포함될 경우 `</script>` 주입 가능 |
| S2 | `onboarding-welcome-modal.tsx:267` | 역할 선택을 localStorage에 저장 | 저 | 개인화 데이터(사용자 역할)가 localStorage에 평문 저장. 민감하지 않은 데이터이므로 현재 허용 |
| S3 | `subscription-store.ts:159-168` | 구독 정보 localStorage persist | 저 | 구독 상태가 localStorage에 캐시됨. 클라이언트에서 조작 가능하나, 실제 권한 검증은 서버에서 수행하므로 허용 |
| S4 | `use-search-limit.ts:91-141` | 검색 로그 기록 실패 무시 | 저 | 검색은 허용하되 로그 기록이 누락될 수 있어, 무료 사용자가 한도 이상 검색 가능한 edge case 존재 |

---

## 개선 권장 사항 (우선순위)

### 1순위 (즉시)
1. **랜딩페이지 데이터 불일치 수정** (C4 해당): `app/page.tsx`의 Free 플랜 기능 목록을 `PLAN_LIMITS` 상수와 동기화하거나, 상수에서 동적으로 생성
2. **STORAGE_KEY 중복 제거** (C3): `lib/storage-keys.ts` 파일 생성하여 모든 localStorage/sessionStorage 키를 중앙 관리

### 2순위 (이번 스프린트 내)
3. **모달 접근성 강화** (W6, W7): ESC 키 닫기, 포커스 트랩, `role="dialog"` 통일
4. **subscription-service.ts 리팩토링** (W1): 중복 switch 케이스를 제네릭 헬퍼로 추출
5. **usage-banner.tsx hydration 수정** (W9): SSR/CSR 불일치 방지

### 3순위 (다음 스프린트)
6. **랜딩페이지 컴포넌트 분리** (W3): 7개 섹션을 개별 컴포넌트로 추출
7. **공통 Modal 컴포넌트** 추출: upgrade-modal, onboarding-welcome-modal 패턴 통합
8. **이미지 마이그레이션 병렬화** (W8): 동시 업로드 5-10건으로 제한하여 병렬 처리

---

## 배포 판정

**WARNING 이슈만 존재 (Critical은 데이터 불일치 1건) -- 데이터 불일치 수정 후 배포 가능**

랜딩페이지의 Free 플랜 수치(100회/5개/10개)가 실제 PLAN_LIMITS(10회/1개/3개)와 불일치하는 문제는 사용자 신뢰에 직접 영향을 미치므로, 이 부분만 수정하면 배포 진행 가능합니다.
