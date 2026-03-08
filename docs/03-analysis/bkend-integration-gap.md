# bkend.ai Integration Gap Analysis v2.0

> **Summary**: bkend.ai REST API 연동 코드 전체 검증 (API 스펙, 에러 핸들링, 타입 안전성, 인증, 보안, 동기화)
>
> **Author**: gap-detector
> **Created**: 2026-03-08
> **Last Modified**: 2026-03-08
> **Status**: Approved

---

## Analysis Overview

- **Analysis Target**: bkend.ai BaaS 연동 코드 (8개 파일)
- **Design Spec**: bkend.ai 공식 API 스펙 (api-client.bkend.ai/v1)
- **Implementation Path**: `src/lib/bkend.ts`, `src/stores/auth-store.ts`, `src/lib/cloud-collection-storage.ts`, `src/stores/collection-store.ts`, `src/lib/cloud-pose-storage.ts`, `src/lib/image-service.ts`, `src/lib/providers.tsx`, `src/components/features/auth/auth-modal.tsx`
- **Analysis Date**: 2026-03-08
- **Version**: 2.0 (v1.0 M-2 gap resolved -- providers.tsx에 동기화 로직 확인)

---

## Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| API Spec Compliance | 92% | PASS |
| Error Handling | 90% | PASS |
| Type Safety | 88% | PASS |
| Auth Flow | 92% | PASS |
| Cloud Sync Safety | 82% | WARN |
| Security | 78% | WARN |
| **Overall** | **87.0%** | **PASS** |

---

## 1. API Spec Compliance (92%) -- 12 items

### FULL (11/12)

| # | Item | File:Line | Status |
|---|------|-----------|:------:|
| 1 | Base URL: `api-client.bkend.ai/v1` | bkend.ts:6 | FULL |
| 2 | X-API-Key header | bkend.ts:77 | FULL |
| 3 | `{ success, data }` response unwrap | bkend.ts:99-106 | FULL |
| 4 | Auth signup: `POST /auth/email/signup` + `method: 'password'` | bkend.ts:139-146 | FULL |
| 5 | Auth signin: `POST /auth/email/signin` + `method: 'password'` | bkend.ts:149-156 | FULL |
| 6 | Auth me: `GET /auth/me` (토큰만 반환하는 signin 후 별도 me() 호출) | bkend.ts:159 | FULL |
| 7 | Auth signout: `POST /auth/signout` | bkend.ts:162-165 | FULL |
| 8 | Auth refresh: `POST /auth/refresh` + refreshToken body | bkend.ts:115-133 | FULL |
| 9 | Data CRUD: `/data/{table}` + `/data/{table}/{id}` (GET/POST/PATCH/DELETE) | bkend.ts:169-205 | FULL |
| 10 | List 응답: `{ items[], pagination{} }` unwrap | bkend.ts:174-181 | FULL |
| 11 | Bearer token in Authorization header | bkend.ts:78 | FULL |

### PARTIAL (1/12)

| # | Item | Spec | Implementation | Impact |
|---|------|------|----------------|--------|
| 12 | Error response 구조화 | `{ error: { code, message, details } }` | `new Error(message)` -- code/details 소실 | MEDIUM |

**Detail**: `bkend.ts:94-96`에서 에러 body를 파싱하지만, `Error` 객체로 변환 시 `code`와 `details` 필드가 버려짐. `auth-modal.tsx:38`에서 `err.message`만 표시하므로 현재는 동작하지만, 향후 에러 코드 기반 분기(예: `VALIDATION_ERROR` vs `RATE_LIMIT`)가 불가능.

---

## 2. Error Handling (90%) -- 20 items

### FULL (17/20)

| # | Category | File:Line | Status |
|---|----------|-----------|:------:|
| 1 | 401 auto-refresh + retry | bkend.ts:84-91 | FULL |
| 2 | Refresh 실패 시 토큰 삭제 | bkend.ts:89 | FULL |
| 3 | Non-OK response error throw | bkend.ts:93-97 | FULL |
| 4 | `success: false` handling | bkend.ts:102-104 | FULL |
| 5 | JSON parse 실패 graceful | bkend.ts:94 `.catch(() => null)` | FULL |
| 6 | Cloud collection load fallback | cloud-collection-storage.ts:103-106 | FULL |
| 7 | Cloud collection save null on failure | cloud-collection-storage.ts:121-123 | FULL |
| 8 | Cloud collection update false on failure | cloud-collection-storage.ts:143-145 | FULL |
| 9 | Cloud collection delete false on failure | cloud-collection-storage.ts:157-159 | FULL |
| 10 | Cloud collection migration per-item continue | cloud-collection-storage.ts:176-178 | FULL |
| 11 | Cloud pose load fallback | cloud-pose-storage.ts:25-28 | FULL |
| 12 | Cloud pose save fallback | cloud-pose-storage.ts:45-48 | FULL |
| 13 | Cloud pose delete fallback | cloud-pose-storage.ts:58-61 | FULL |
| 14 | Cloud pose migration per-item continue | cloud-pose-storage.ts:87-89 | FULL |
| 15 | Image service bkend->sample+Pexels fallback | image-service.ts:76-80 | FULL |
| 16 | Image service fetchImageById fallback | image-service.ts:142-145 | FULL |
| 17 | Auth checkAuth silences error + clears state | auth-store.ts:75-78 | FULL |

### PARTIAL (2/20)

| # | Item | Spec | Implementation | Impact |
|---|------|------|----------------|--------|
| 18 | 낙관적 업데이트 실패 롤백 | 실패 시 로컬 상태 복구 | 클라우드 저장 실패 시 로컬 상태는 이미 변경됨, 롤백 없음 | MEDIUM |
| 19 | 마이그레이션 부분 실패 처리 | 부분 성공 시 성공분만 삭제 | `migrated > 0`이면 전체 localStorage 삭제 -- 미마이그레이션 항목 유실 가능 | MEDIUM |

**Detail #18**: `collection-store.ts`에서 `createCollection`, `deleteCollection` 등은 로컬 상태를 먼저 변경(낙관적 업데이트)한 후 비동기로 클라우드에 반영. 클라우드 실패 시 로컬과 서버 간 불일치가 발생하지만 롤백 로직이 없음. 다음 `syncFromCloud()` 호출 시까지 불일치 지속.

**Detail #19**: `cloud-collection-storage.ts:182`에서 `migrated > 0`이면 `localStorage.removeItem(LOCAL_STORAGE_KEY)`로 전체 삭제. 예: 5개 중 3개만 마이그레이션 성공 시 나머지 2개 유실. `cloud-pose-storage.ts:94`도 동일 패턴.

### MISSING (1/20)

| # | Item | Location | Description | Impact |
|---|------|----------|-------------|--------|
| 20 | 네트워크 retry (timeout/ECONNRESET) | bkend.ts | 401 외 네트워크 에러 재시도 없음 | LOW |

---

## 3. Type Safety (88%) -- 8 items

### FULL (7/8)

| # | Item | Status |
|---|------|:------:|
| 1 | `BkendResponse<T>` 제네릭 래퍼 타입 | FULL |
| 2 | `ListResponse<T>` 제네릭 타입 | FULL |
| 3 | `AuthTokenResponse` 토큰 응답 타입 | FULL |
| 4 | `BkendUser` 서버 응답 전용 타입 (id 필드) | FULL |
| 5 | `CloudCollection` 클라우드 전용 타입 + `toLocal`/`toCloudPayload` 변환 | FULL |
| 6 | `Collection._id` vs 클라우드 `id` 변환 로직 | FULL |
| 7 | `SavedPose` 타입 일관성 (pose-storage + cloud) | FULL |

### PARTIAL (1/8)

| # | Item | Spec | Implementation | Impact |
|---|------|------|----------------|--------|
| 8 | `BkendUser` vs `User` 타입 불일치 | bkend.ts `BkendUser` (서버 필드만) | types/index.ts `User` (plan, studentVerified, billingCycle 추가) | MEDIUM |

**Detail**: `bkend.auth.me()`는 `BkendUser`를 반환하지만, `auth-store.ts:41`에서 이를 `User` 타입 변수에 할당. `User`의 추가 필드(`plan`, `studentVerified`, `billingCycle`)가 모두 optional이라 컴파일 에러는 없지만, 런타임에서 `user.plan`은 항상 `undefined`. 프로필 조회와 플랜 조회를 분리하거나, `BkendUser`를 `User`로 명시적 매핑 함수가 필요.

---

## 4. Auth Flow (92%) -- 7 items

### FULL (6/7)

| # | Item | File:Line | Status |
|---|------|-----------|:------:|
| 1 | Login: signin -> setTokens -> me() -> set state | auth-store.ts:34-46 | FULL |
| 2 | Register: signup -> setTokens -> me() -> set state | auth-store.ts:48-59 | FULL |
| 3 | Logout: signout -> clearTokens -> clear state + cookie | auth-store.ts:62-65 | FULL |
| 4 | App init: token 존재 시 checkAuth (me() 검증) | providers.tsx:15-19 | FULL |
| 5 | Cookie sync for middleware (artref-auth-status) | auth-store.ts:7-15 | FULL |
| 6 | 인증 후 클라우드 동기화 (migrateToCloud -> syncFromCloud) | providers.tsx:23-31 | FULL |

**Note (v1.0 -> v2.0 변경)**: v1.0에서 M-2로 "로그인 후 컬렉션 동기화 자동 호출 없음"을 보고했으나, `providers.tsx:23-31`의 `AuthInitializer`에서 `isAuthenticated` 변경 시 `migrateToCloud().then(() => syncFromCloud())`를 호출하고 있음 확인. `hasSynced` ref로 1회만 실행되는 방어도 적용됨. **해결 완료**.

### PARTIAL (1/7)

| # | Item | Spec | Implementation | Impact |
|---|------|------|----------------|--------|
| 7 | Token refresh 무한 재귀 방지 | 명시적 isRefreshing flag | tryRefresh false 반환에 암시적 의존 | LOW |

**Detail**: `bkend.ts:84-91`에서 401 -> `tryRefresh()` -> 재요청. 만약 refresh는 성공했으나 재요청도 401이면 다시 `tryRefresh()`가 호출됨. refresh가 새 토큰을 반환했는데 서버가 계속 401을 주는 극단적 경우 무한 재귀 가능. `isRefreshing` flag 또는 retry count로 방어 권장.

---

## 5. Cloud Sync Safety (82%) -- 8 items

### FULL (5/8)

| # | Item | File:Line | Status |
|---|------|-----------|:------:|
| 1 | 낙관적 업데이트 (로컬 즉시 반영) | collection-store.ts:80-83 | FULL |
| 2 | 클라우드 ID로 로컬 상태 갱신 (create 후) | collection-store.ts:87-95 | FULL |
| 3 | syncFromCloud: 인증 상태 체크 | collection-store.ts:333-334 | FULL |
| 4 | migrateToCloud: 인증 상태 체크 | collection-store.ts:347-348 | FULL |
| 5 | AuthInitializer: hasSynced ref로 1회만 동기화 | providers.tsx:12,24-25 | FULL |

### PARTIAL (2/8)

| # | Item | Spec | Implementation | Impact |
|---|------|------|----------------|--------|
| 6 | 낙관적 업데이트 실패 롤백 | 실패 시 이전 상태 복구 | 클라우드 실패 무시, 로컬 불일치 잔존 | MEDIUM |
| 7 | 마이그레이션 부분 실패: 데이터 유실 | 성공분만 삭제 | `migrated > 0` 시 전체 localStorage 삭제 | MEDIUM |

### MISSING (1/8)

| # | Item | Description | Impact |
|---|------|-------------|--------|
| 8 | Race condition 방지 (동시 수정) | 빠른 연속 클릭 시 updateCloudCollection이 병렬 호출되어 마지막 쓰기 우선(last-write-wins). imageIds 배열이 중간 상태로 덮어써질 수 있음 | LOW |

**Detail #8**: 예를 들어 이미지 A, B를 빠르게 연속 추가하면: (1) addImage(A) -> 로컬 [A] -> cloud update [A], (2) addImage(B) -> 로컬 [A,B] -> cloud update [A,B]. 네트워크 지연으로 (2)가 먼저 도착하고 (1)이 나중에 도착하면 클라우드에는 [A]만 저장됨. 발생 확률은 낮지만 이론적 위험 존재. debounce 또는 queue 패턴으로 해결 가능.

---

## 6. Security (78%) -- 7 items

### FULL (4/7)

| # | Item | Detail |
|---|------|--------|
| 1 | API Key 환경변수 관리 | `.env.example`에 템플릿, 코드에서 `process.env` 참조 |
| 2 | Bearer token Authorization header | bkend.ts:78 |
| 3 | Signout 시 토큰 정리 | localStorage 삭제 + 서버 signout |
| 4 | 비밀번호 최소 길이 클라이언트 검증 | auth-modal.tsx:128 `minLength={8}` |

### PARTIAL (1/7)

| # | Item | Spec | Implementation | Impact |
|---|------|------|----------------|--------|
| 5 | 쿠키 Secure 플래그 | Production에서 Secure 필요 | `SameSite=Lax` only | LOW |

**Detail**: `auth-store.ts:11`의 `artref-auth-status` 쿠키는 인증 "상태"만 담고 있어 (값: "true") 토큰 자체는 노출되지 않음. 실질적 위험은 낮지만, Production 배포 시 `Secure` 플래그 추가 권장:
```
document.cookie = `artref-auth-status=true;path=/;SameSite=Lax${location.protocol === 'https:' ? ';Secure' : ''}`;
```

### MISSING (2/7)

| # | Item | Description | Impact |
|---|------|-------------|--------|
| 6 | API Key 클라이언트 노출 주의 | `NEXT_PUBLIC_BKEND_API_KEY`는 클라이언트 번들에 포함됨. bkend.ai Publishable Key이므로 의도된 동작이나, `.env.example`에 "Secret Key 절대 사용 금지" 경고 필요 | LOW |
| 7 | Token localStorage XSS 취약점 | accessToken/refreshToken을 localStorage에 저장. XSS 공격 시 토큰 탈취 가능. bkend.ai 클라이언트 SDK 특성상 일반적이나, CSP 헤더 등 XSS 방어 레이어 권장 | MEDIUM |

---

## 7. Environment Variable Consistency

| Variable | `.env.example` | `src/.env.local.example` | Code Reference | Status |
|----------|:-:|:-:|----------------|:------:|
| `NEXT_PUBLIC_BKEND_API_URL` | `api-client.bkend.ai/v1` | `api.bkend.ai/v1` | bkend.ts:6 | WARN -- 도메인 불일치 |
| `NEXT_PUBLIC_BKEND_API_KEY` | O | X | bkend.ts:7 | WARN |
| `NEXT_PUBLIC_BKEND_PROJECT_ID` | X | O | (미사용) | WARN -- 구버전 잔재 |
| `NEXT_PUBLIC_BKEND_ENV` | X | O | (미사용) | WARN -- 구버전 잔재 |
| `NEXT_PUBLIC_PEXELS_API_KEY` | O | X | pexels-image-loader.ts | OK |

**Issues**:
- `src/.env.local.example`은 구버전 설정 파일로 추정. `api.bkend.ai/v1`(구 도메인)과 미사용 변수 2개 포함
- `.env.example`이 SSOT(Single Source of Truth)이므로 `src/.env.local.example` 삭제 권장
- `.env.example`에 환경변수 타입 설명 주석 추가 권장 (Publishable Key만 사용, Secret Key 금지)

---

## 8. Architecture Compliance (Clean Architecture)

| Rule | Status | Detail |
|------|:------:|--------|
| Store -> Lib 방향 의존 | FULL | auth-store -> bkend, collection-store -> cloud-collection-storage |
| Component -> Store 의존 | FULL | auth-modal -> auth-store, providers -> auth-store + collection-store |
| Lib 계층 독립성 | FULL | bkend.ts는 외부 의존 없음 (순수 HTTP 클라이언트) |
| Cloud storage -> bkend client | FULL | cloud-collection-storage, cloud-pose-storage -> bkend |
| Image service -> bkend + fallback | FULL | 적절한 3단 폴백 체인 (bkend -> sample + Pexels) |
| id/\_id 변환 계층 분리 | FULL | CloudCollection 전용 타입 + toLocal/toCloudPayload |

---

## 9. Convention Compliance

| Rule | Status | Violations |
|------|:------:|------------|
| 한글 주석 | FULL | 모든 파일에 한글 주석 존재 |
| camelCase 함수명 | FULL | fetchImages, loadCloudCollections 등 |
| kebab-case 파일명 | FULL | bkend.ts, auth-store.ts, cloud-collection-storage.ts 등 |
| PascalCase 컴포넌트 | FULL | AuthModal, AuthInitializer, Providers |
| 절대 경로 import (@/) | FULL | 모든 import에서 @/ 사용 |
| catch 블록 `any` 사용 | WARN | auth-modal.tsx:38 `catch (err: any)` -- 타입 좁히기 권장 |

---

## Differences Summary

### MISSING (Spec O, Implementation X)

| # | Item | Location | Description | Impact |
|---|------|----------|-------------|--------|
| M-1 | BkendError 클래스 (code/details 보존) | bkend.ts:94-96 | Error 객체로 변환 시 에러 코드 소실, 호출측 분기 불가 | MEDIUM |
| M-2 | 네트워크 retry (timeout/ECONNRESET) | bkend.ts | 401 외 네트워크 에러 재시도 없음 | LOW |
| M-3 | Race condition 방어 (동시 cloud write) | collection-store.ts | 빠른 연속 수정 시 last-write-wins 위험 | LOW |

### CHANGED (Spec != Implementation)

| # | Item | Spec | Implementation | Impact |
|---|------|------|----------------|--------|
| C-1 | .env URL 불일치 | `api-client.bkend.ai` | `src/.env.local.example`: `api.bkend.ai` | MEDIUM |
| C-2 | 쿠키 Secure 플래그 | Production Secure | `SameSite=Lax` only | LOW |
| C-3 | Refresh 무한 재귀 방지 | 명시적 flag | 암시적 (tryRefresh false 의존) | LOW |
| C-4 | 마이그레이션 부분 실패 시 전체 삭제 | 성공분만 localStorage 삭제 | `migrated > 0` 시 전체 삭제 (미성공분 유실) | MEDIUM |

### ADDED (Spec X, Implementation O)

| # | Item | Location | Description |
|---|------|----------|-------------|
| A-1 | Pexels 폴백 체인 | image-service.ts + pexels-image-loader.ts | bkend 실패 시 sample-data + Pexels API 폴백 |
| A-2 | Zustand persist 인증 캐시 | auth-store.ts:81-84 | user/isAuthenticated를 localStorage에 캐시 |
| A-3 | AuthInitializer 자동 동기화 | providers.tsx:23-31 | 인증 후 migrateToCloud -> syncFromCloud 자동 호출 |

---

## Recommended Actions

### Immediate (High Priority)

1. **M-1: BkendError 클래스 도입**
   - `bkend.ts`에서 에러 발생 시 code/details를 보존하는 커스텀 Error 클래스 사용
   - `auth-modal.tsx` 등에서 에러 코드 기반 분기 가능해짐
   ```typescript
   // bkend.ts에 추가
   export class BkendError extends Error {
     code: string;
     details?: unknown;
     constructor(message: string, code: string, details?: unknown) {
       super(message);
       this.name = 'BkendError';
       this.code = code;
       this.details = details;
     }
   }
   ```

2. **C-1: src/.env.local.example 삭제**
   - 구버전 잔재 파일. `.env.example`이 SSOT
   - `NEXT_PUBLIC_BKEND_PROJECT_ID`, `NEXT_PUBLIC_BKEND_ENV`는 코드에서 미사용

3. **C-4: 마이그레이션 부분 실패 안전 처리**
   - 성공한 항목만 localStorage에서 개별 제거하도록 변경
   - 또는 마이그레이션 성공 ID 목록을 추적하여 실패분을 보존

### Medium Priority

4. **C-2: Production 쿠키 Secure 플래그**
   - `auth-store.ts:11`에서 `location.protocol === 'https:'` 조건부 Secure 추가

5. **C-3: Refresh 재귀 방지**
   - `isRefreshing` flag 또는 retry 시 refresh 건너뛰기 로직 추가

6. **Type gap: BkendUser -> User 명시적 매핑**
   - `auth.me()` 반환값에 앱 기본값(plan: 'free' 등) 주입하는 매핑 함수 추가

### Low Priority

7. **M-2: 네트워크 retry** -- exponential backoff (1회 재시도)
8. **M-3: Cloud write debounce** -- 동일 컬렉션 대상 업데이트를 300ms debounce
9. **A-1: Pexels 폴백 문서화** -- 폴백 체인 구조를 설계 문서에 반영

---

## File-Level Summary

| File | Lines | Issues | Score |
|------|------:|:------:|:-----:|
| `src/lib/bkend.ts` | 209 | M-1, M-2, C-3 | 85% |
| `src/stores/auth-store.ts` | 87 | C-2, Type gap | 90% |
| `src/lib/cloud-collection-storage.ts` | 188 | C-4 (migration) | 92% |
| `src/stores/collection-store.ts` | 357 | M-3 (race), partial rollback | 85% |
| `src/lib/cloud-pose-storage.ts` | 99 | C-4 (migration) | 92% |
| `src/lib/image-service.ts` | 208 | None | 100% |
| `src/lib/providers.tsx` | 56 | None | 100% |
| `src/components/features/auth/auth-modal.tsx` | 168 | `catch (err: any)` | 95% |
| `src/types/index.ts` | 172 | BkendUser/User gap | 90% |

---

## v1.0 -> v2.0 Changes

| v1.0 Item | v1.0 Status | v2.0 Status | Detail |
|-----------|:-----------:|:-----------:|--------|
| M-2: 로그인 후 동기화 | MISSING | **RESOLVED** | providers.tsx AuthInitializer에서 isAuthenticated 변경 시 migrateToCloud -> syncFromCloud 호출 확인 |
| Cloud Sync Safety | (미검사) | **NEW (82%)** | 낙관적 업데이트 롤백, 마이그레이션 부분 실패, race condition 추가 분석 |
| Convention Compliance | (미검사) | **NEW** | 한글 주석, 네이밍, import 규칙 검증 추가 |
| providers.tsx | (미검사) | **NEW** | AuthInitializer 컴포넌트 전체 검증 추가 |
| auth-modal.tsx | (미검사) | **NEW** | UI 컴포넌트 에러 처리/접근성 검증 추가 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-08 | Initial analysis (7 files, 20+ items) | gap-detector |
| 2.0 | 2026-03-08 | M-2 resolved, +Cloud Sync Safety/Convention 카테고리, +providers.tsx/auth-modal.tsx 분석, 8개 파일 62 items | gap-detector |
