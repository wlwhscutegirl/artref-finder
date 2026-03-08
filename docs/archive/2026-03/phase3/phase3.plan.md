# Phase 3: Full 3D Pipeline + SaaS 기반 구현 계획

## Context

Phase 1 (MVP) + Phase 2 (AI 포즈 매칭) 완료 상태.
현재 포즈 벡터 매칭은 동작하나, **카메라 앵글은 태그 기반만** 지원.
User 타입에 `plan` 필드가 있으나 **구독 기반 기능 제한이 없음**.
검색 히스토리/통계 기능 없음.

Phase 3에서는:
1. 카메라 앵글 벡터 매칭 (포즈와 동일 패턴)
2. 소재/배경 비주얼 필터 강화
3. 구독 플랜 게이팅 + 플랜 비교 페이지
4. 검색 히스토리 + 사용 통계 대시보드

---

## 구현 순서 (4단계)

### Step 1: 카메라 앵글 벡터 매칭

현재 카메라 앵글은 태그(`아이레벨`, `로우앵글` 등)로만 검색됨.
3D 뷰어 카메라 위치를 **pitch/yaw 벡터**로 변환하여 이미지와 매칭.

**새 파일:** `src/lib/camera-matching.ts`
- `extractCameraAngle(position: Vec3, target: Vec3): CameraAngle` — 3D 카메라 → pitch/yaw/fov 추출
- `computeCameraAngleSimilarity(a: CameraAngle, b: CameraAngle): number` — 앵글 유사도 (0~1)
- 각도 차이 기반 유사도: `1 - (angleDiff / maxAngle)`

**새 파일:** `src/lib/camera-vectors.ts`
- 카메라 태그(`하이앵글`, `로우앵글` 등) → CameraAngle 매핑 테이블
- 561개 이미지에 합성 CameraAngle 할당 (태그 기반)
- `generateCameraAngleForImage(tags: string[]): CameraAngle | undefined`

**수정:** `src/lib/sample-data.ts`
- `SAMPLE_IMAGES_WITH_POSES`에 `cameraAngle` 데이터 병합

**수정:** `src/hooks/usePoseSearch.ts`
- 카메라 앵글 유사도를 포즈 유사도와 가중 합산
- `combinedScore = poseSimilarity * 0.7 + cameraSimilarity * 0.3`
- 카메라 위치 변경 시에도 하이브리드 모드 활성화

**수정:** `src/app/(main)/search/page.tsx`
- 3D 뷰어 카메라 위치 → `extractCameraAngle()` → 검색 연동

### Step 2: 소재/배경 비주얼 필터 강화

기존 태그 필터를 **비주얼 카드 + 인기 필터**로 개선.

**새 파일:** `src/components/features/search/material-filter-cards.tsx`
- 소재 태그를 시각적 카드로 표시 (컬러 아이콘 + 이름)
- 배경 태그도 비주얼 카드 (아이콘: 🏠실내, 🌲숲, 🏙️도시 등)
- 인기 태그 조합 "퀵 필터" (예: "야외 자연광", "스튜디오 하드라이트")

**수정:** `src/components/features/search/search-filters.tsx`
- 소재/배경 그룹을 비주얼 카드 모드로 전환
- 기존 태그 토글 로직은 유지

### Step 3: 구독 플랜 게이팅

**새 파일:** `src/lib/plan-limits.ts`
- 플랜별 기능 제한 정의:
  - `free`: 일일 검색 50회, 컬렉션 3개, 저장 포즈 5개
  - `pro`: 무제한 검색, 컬렉션 무제한, 저장 포즈 무제한, 고급 필터
  - `team`: pro + 팀 공유 컬렉션
- `checkLimit(plan: string, feature: string): { allowed: boolean; remaining?: number }`
- `getFeatureAccess(plan: string): Record<string, boolean>`

**새 파일:** `src/hooks/usePlanLimits.ts`
- `usePlanLimits()` 훅: 현재 사용자 플랜 → 기능 접근 권한 반환
- localStorage 기반 일일 카운터 (검색 횟수)

**새 파일:** `src/app/(main)/pricing/page.tsx`
- 플랜 비교 페이지 (Free / Pro / Team 3열)
- 기능별 체크마크 테이블
- CTA 버튼 (현재는 "Coming Soon" 표시)

**새 파일:** `src/components/features/plan/upgrade-banner.tsx`
- 무료 플랜 제한 도달 시 업그레이드 배너
- "프로로 업그레이드하면 무제한 검색!" 메시지

**수정:** `src/app/(main)/search/page.tsx`
- 검색 시 플랜 제한 체크
- 제한 도달 시 업그레이드 배너 표시

### Step 4: 검색 히스토리 + 대시보드

**새 파일:** `src/lib/search-history.ts`
- localStorage 기반 검색 히스토리 저장
- `saveSearch(query: { tags: string[]; category?: string; timestamp: number })`
- `getRecentSearches(limit: number): SearchHistoryEntry[]`
- 최대 100개 보관, FIFO

**새 파일:** `src/hooks/useSearchHistory.ts`
- `useSearchHistory()` 훅: 최근 검색, 인기 태그, 사용 통계

**새 파일:** `src/app/(main)/dashboard/page.tsx`
- 최근 검색 목록 (클릭 시 재검색)
- 자주 사용한 태그 Top 10 차트
- 총 검색 수, 저장된 포즈 수, 컬렉션 수 카드
- 포즈 매칭 사용 통계

**수정:** `src/app/(main)/search/page.tsx`
- 검색 실행 시 히스토리 자동 저장
- 헤더에 "대시보드" 링크 추가

---

## 파일 요약

### 새 파일 (8개)
| 파일 | 역할 |
|------|------|
| `src/lib/camera-matching.ts` | 카메라 앵글 추출 + 유사도 |
| `src/lib/camera-vectors.ts` | 샘플 이미지 카메라 앵글 데이터 |
| `src/components/features/search/material-filter-cards.tsx` | 소재/배경 비주얼 필터 |
| `src/lib/plan-limits.ts` | 구독 플랜 제한 정의 |
| `src/hooks/usePlanLimits.ts` | 플랜 제한 훅 |
| `src/app/(main)/pricing/page.tsx` | 플랜 비교 페이지 |
| `src/components/features/plan/upgrade-banner.tsx` | 업그레이드 배너 |
| `src/lib/search-history.ts` | 검색 히스토리 저장 |
| `src/hooks/useSearchHistory.ts` | 검색 히스토리 훅 |
| `src/app/(main)/dashboard/page.tsx` | 작가 대시보드 |

### 수정 파일 (4개)
| 파일 | 변경 |
|------|------|
| `src/lib/sample-data.ts` | cameraAngle 데이터 병합 |
| `src/hooks/usePoseSearch.ts` | 카메라 앵글 유사도 합산 |
| `src/app/(main)/search/page.tsx` | 카메라 매칭, 플랜 체크, 히스토리 |
| `src/components/features/search/search-filters.tsx` | 비주얼 필터 카드 통합 |

---

## 검증 방법

1. **카메라 매칭**: 3D 뷰어에서 로우앵글 → 로우앵글 이미지 상위 랭킹
2. **복합 매칭**: 포즈(앉기) + 카메라(하이앵글) → 두 조건 모두 반영된 정렬
3. **플랜 제한**: free 계정으로 51번째 검색 시 업그레이드 배너 표시
4. **대시보드**: /dashboard에서 최근 검색 목록 + 통계 확인
5. **TypeScript**: `npx tsc --noEmit` 에러 0건
6. **빌드**: `npm run build` 성공
