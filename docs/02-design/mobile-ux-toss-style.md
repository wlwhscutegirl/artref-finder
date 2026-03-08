# ArtRef Finder — 모바일 UX 개선 설계 (Toss 스타일)

작성일: 2026-03-08
작성자: Frontend Architect Agent
대상 시나리오: 러프 스케치를 마친 아티스트가 한 손으로 실사 레퍼런스를 검색하는 흐름

---

## 1. 현재 모바일 UX 문제 진단

### 1-1. 마네킹 페이지 (`/mannequin`) — 핵심 문제

| 구분 | 현재 상태 | 문제 |
|------|----------|------|
| 레이아웃 | `MobileTabView`: 탭 2개(포즈 설정 / 결과) | 탭이 최상단에 있어 엄지로 누르기 불편 |
| 탭 높이 | `py-2.5 text-xs` — 약 32px | 최소 48px 권장 터치 타겟 미달 |
| 포즈 설정 패널 | 관절 슬라이더 + 프리셋 + 카메라 + 저장 포즈 + 태그 필터 + 포즈 추출 한 화면에 모두 표시 | 정보 과부하. 한 화면에 목적이 6~7개 |
| 좌우반전 / 해부학 토글 버튼 | `min-w-[36px] min-h-[36px]` | 역시 48px 미달 |
| 검색바(TagSearchInput) | 헤더 안에 `max-w-sm`으로 협소하게 배치 | 모바일 헤더가 12px 높이, 검색바 거의 보이지 않음 |
| 결과 헤더 | sticky 영역에 PoseMatchIndicator + 샷 타입 뱃지 + 조명 매칭 뱃지 + 초기화 버튼 한 줄 | 텍스트 `text-[10px]` 크기. 읽기 불가 |
| 빈 상태 / 로딩 | 특별한 안내 없음 | 사용자가 다음에 뭘 해야 할지 모름 |
| 색상 | 조명: amber, 카메라: cyan, 포즈 추출: emerald, 포즈 기반: amber — 같은 화면에 4가지 강조색 | 시각적 혼란 |

### 1-2. 랜딩 페이지 (`/`) — 모바일 문제

| 구분 | 현재 상태 | 문제 |
|------|----------|------|
| 히어로 CTA 버튼 | `flex-col sm:flex-row` → 모바일에서 세로 2개 | 두 번째 버튼("무료 계정 만들기")은 과도한 강조. 주 CTA 하나만 필요 |
| nav 링크 | `hidden md:flex` → 모바일 없음 | 괜찮으나 햄버거 없음. 가격/로그인 접근성 |
| 섹션 여백 | `py-24` | 모바일에서 너무 큰 여백 |
| 기능 카드 | 텍스트가 "전 / 후" 비교를 작은 폰트로 설명 | 읽기 부담. 핵심만 뽑아서 크게 |

### 1-3. 언어 / 마이크로카피 문제

현재 텍스트 → Toss 스타일 제안 (예시):
- "레퍼런스 N건" → "N개 찾았어요"
- "검색 결과가 없습니다" (암묵적) → "찾는 포즈가 없어요. 프리셋으로 시작해볼까요?"
- "포즈 기반 추천 태그" → "이 포즈엔 이런 태그가 잘 맞아요"
- "필터 ON / OFF" → "조명 맞추기 켬 / 끔"
- "해제" → "취소"
- "초기화" → "다시 시작"
- "교육 모드: NSFW 점수 0.3 이하만 표시" → "학교에서도 안전하게"

---

## 2. 개선 원칙 (ArtRef × Toss)

> Toss 원칙을 ArtRef 특성에 맞게 변환

1. **한 화면, 하나의 모드** — 포즈 설정 / 필터 / 결과를 명확히 분리
2. **엄지 존 중심 설계** — 주요 액션은 화면 하단 30% 안에
3. **바텀시트로 필터** — 태그 필터 / 카메라 / 조명 설정은 바텀시트로 올림
4. **단계별 진행** — 포즈 → 카메라 → 조명 순서 가이드
5. **친근한 한국어** — 기술 용어 최소화
6. **48px 최소 터치 타겟** — 모든 인터랙티브 요소
7. **단일 강조색** — orange-500 하나로 통일. 상태 표시는 크기/위치로 구분

---

## 3. 마네킹 페이지 — 모바일 재설계

### 3-1. 전체 흐름 (단계별)

```
[진입]
  ↓
[Step 1: 포즈 설정] ← 기본 화면
  마네킹 뷰어 (전체 너비)
  하단: 프리셋 빠른 선택 (수평 스크롤)
  FAB: "레퍼런스 보기 →" (결과 N개)
  ↓ FAB 탭
[Step 2: 결과 보기] ← 슬라이드 업
  이미지 그리드
  상단 스티키: 필터 칩 바
  ↓ 필터 버튼 탭
[Step 3: 필터 설정] ← 바텀시트
  카메라 앵글 / 조명 / 태그 / 안전 필터
```

### 3-2. 레이아웃 구조도

#### 모바일 Step 1: 포즈 설정 화면

```
┌─────────────────────────────────┐  ← 100vh
│  [상단 헤더 — 48px]              │
│  ← ArtRef    [마네킹|드로잉]      │
├─────────────────────────────────┤
│                                 │
│   3D 마네킹 뷰어                  │  ← 50vh (뷰어에 충분한 공간)
│   (터치 드래그 관절 조작)          │
│                                 │
├─────────────────────────────────┤
│  [체형 토글 + 반전 — 48px]        │  ← 엄지 영역 시작
│  ○남  ○여    ↔반전  🦴해부학      │
├─────────────────────────────────┤
│  [포즈 프리셋 — 수평 스크롤]       │  ← swipe 가능
│  [서있기][앉기][눕기][걷기]...     │
├─────────────────────────────────┤
│  [카메라 프리셋 — 수평 스크롤]     │
│  [정면][측면][하이앵글]...         │
├─────────────────────────────────┤
│  [더 많은 설정 — 바텀시트 열기]    │  ← 선택적
│  조명 · 태그 필터 · 포즈 저장      │
├─────────────────────────────────┤
│  ╔═══════════════════════════╗   │  ← FAB (Fixed, 하단 중앙)
│  ║  레퍼런스 보기  ·  23개   ║   │  ← 56px 높이, 풀 너비 가까이
│  ╚═══════════════════════════╝   │
└─────────────────────────────────┘
```

#### 모바일 Step 2: 결과 화면

```
┌─────────────────────────────────┐
│  [상단 헤더 — 48px]              │
│  ← 포즈로 돌아가기    필터 ⊕     │
├─────────────────────────────────┤
│  [활성 필터 칩 바 — 수평 스크롤]   │  ← 있을 때만 표시
│  #standing  #front  ×          │
├─────────────────────────────────┤
│                                 │
│   이미지 그리드 (2열)             │
│   무한 스크롤                     │
│                                 │
│   [빈 상태 안내]                  │
│   "찾는 포즈가 없어요             │
│    프리셋을 바꿔볼까요?"           │
│                                 │
└─────────────────────────────────┘
```

#### 모바일 Step 3: 필터 바텀시트

```
┌─────────────────────────────────┐
│ (반투명 오버레이)                  │
├─────────────────────────────────┤  ← 드래그 핸들
│  ────                           │
│  필터 설정                        │
│  ──────────────────────────     │
│  카메라 앵글                      │
│  [정면] [측면] [하이] [로우]       │  ← 48px 버튼
│                                 │
│  조명 방향                        │
│  [ 조명 맞추기  ON / OFF ]        │
│                                 │
│  태그                            │
│  [#포즈] [#조명] [#카메라] ...     │  ← 그룹별 접기/펼치기
│                                 │
│  콘텐츠 필터                      │
│  [전체] [일반] [학교에서도 안전]    │
│                                 │
│  ┌─────────────────────────┐    │
│  │    적용하기              │    │  ← 48px, full width
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

### 3-3. 컴포넌트 분리 설계

현재 `MobileTabView` → 아래 구조로 교체:

```
MobileMannequinLayout (신규)
├── MobileHeader
│   ├── BackButton (결과 화면에서만)
│   └── MobileModeTabs (마네킹 | 드로잉)
├── MannequinStep (Step 1 — 포즈 설정)
│   ├── MannequinViewer (기존 유지)
│   ├── MobileBodyTypeBar (체형 + 반전 + 해부학 — 48px)
│   ├── MobilePosePresetScroll (수평 스크롤 프리셋)
│   ├── MobileCameraPresetScroll (수평 스크롤)
│   └── MobileMoreSettingsButton → FilterBottomSheet 열기
├── ResultStep (Step 2 — 결과)
│   ├── MobileResultHeader (← 뒤로 | 필터 버튼)
│   ├── ActiveFilterChips (수평 스크롤 칩)
│   ├── ImageGrid (기존 유지)
│   └── EmptyState (신규)
├── FilterBottomSheet (바텀시트 — 신규)
│   ├── BottomSheetHandle
│   ├── CameraPresetSection
│   ├── LightingSection
│   ├── TagFilterSection
│   └── SafetyFilterSection
└── ResultFAB (Step 1에서만 표시 — 신규)
    └── 결과 수 + "레퍼런스 보기"
```

---

## 4. 신규 컴포넌트 상세 설계

### 4-1. `ResultFAB` — 결과 보기 플로팅 버튼

**목적**: Step 1(포즈 설정)에서 결과로 이동하는 주요 CTA
**위치**: 화면 하단 고정, 좌우 여백 16px

```
props:
  resultCount: number
  onClick: () => void
  isLoading?: boolean

크기: height 56px, border-radius 16px
색상: bg-orange-600 text-white
텍스트: isLoading ? "찾는 중..." : `레퍼런스 보기  ·  ${resultCount}개`
애니메이션: resultCount 변경 시 숫자 scale 1→1.2→1 (150ms)
```

### 4-2. `FilterBottomSheet` — 필터 바텀시트

**목적**: 현재 `SearchFilters` (좌측 패널 하단 collapsed 영역)를 바텀시트로 이식
**트리거**: 결과 화면 우상단 "필터 ⊕" 버튼 or 포즈 설정 화면 "더 많은 설정" 버튼

```
props:
  isOpen: boolean
  onClose: () => void
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  selectedCategory: ImageCategory | null
  onCategoryChange: (cat: ImageCategory | null) => void
  lightFilterActive: boolean
  onLightFilterToggle: () => void
  safetyLevel: SafetyLevel
  onSafetyLevelChange: (level: SafetyLevel) => void
  onApply: () => void   // "적용하기" 버튼

구조:
  - 배경 오버레이: bg-black/40, 클릭 시 닫기
  - 시트 높이: max-height 85vh, overflow-y-auto
  - 드래그 핸들: 상단 중앙 w-10 h-1 bg-gray-300 rounded-full
  - 애니메이션: translateY(100%) → translateY(0), duration 300ms ease-out
  - 적용하기 버튼: 하단 고정 (sticky bottom-0), height 48px
```

### 4-3. `MobilePosePresetScroll` — 수평 스크롤 프리셋

**목적**: 현재 `PosePresetCards` (그리드)를 모바일 수평 스크롤 칩 형태로
**현재**: 카드 그리드 (`PosePresetCards`) → 모바일에서 너무 많은 세로 공간 차지

```
props:
  selectedPoseId: string | null
  onSelect: (preset: PosePreset) => void

레이아웃: display flex, overflow-x-auto, gap-2, px-4, snap-x snap-mandatory
칩 크기: height 40px, px-4, rounded-full
선택 상태: bg-orange-600 text-white
비선택: bg-gray-100 text-gray-600
스크롤바: 숨김 (scrollbar-hide)
```

### 4-4. `ActiveFilterChips` — 활성 필터 칩 바

**목적**: 결과 화면 상단에 현재 활성 필터를 작은 칩으로 표시. 탭으로 개별 해제 가능
**현재**: 결과 헤더에 flex-wrap으로 여러 줄 차지

```
props:
  tags: string[]
  cameraPreset: string | null
  lightActive: boolean
  shotType: string | null
  onRemoveTag: (tag: string) => void
  onRemoveCameraPreset: () => void
  onToggleLight: () => void
  onClearAll: () => void

레이아웃: display flex, overflow-x-auto, gap-1.5, px-4, py-2
칩: height 28px, rounded-full, text-xs
색상: bg-orange-100 text-orange-700 (모두 동일색. 구별은 아이콘으로)
닫기: 칩 우측 × 버튼 (24px touch target → padding으로 확장)
"다시 시작" 버튼: 필터 있을 때만 우측 끝에 표시
```

### 4-5. `EmptyState` — 빈 상태 안내

```
props:
  type: 'no-results' | 'no-pose' | 'loading'

no-results:
  아이콘: 돋보기 SVG (48px)
  제목: "찾는 포즈가 없어요"
  설명: "프리셋을 바꾸거나 태그를 줄여볼까요?"
  버튼: "프리셋 골라보기" → Step 1로 이동

no-pose (포즈 미설정):
  제목: "마네킹 포즈를 먼저 잡아보세요"
  설명: "관절을 드래그하거나 프리셋을 골라보세요"

loading:
  스켈레톤 카드 6개 (2열 × 3행)
```

### 4-6. `MobileBodyTypeBar` — 체형/반전/해부학 바

**목적**: 현재 `div.flex items-center gap-2 px-3 py-2` 를 48px 높이 고정 바로
**현재 문제**: 36px 버튼 크기, 배경이 bg-white/90으로 마네킹 뷰어와 분리 어색

```
레이아웃: height 48px, flex, items-center, gap-2, px-4
배경: bg-white border-t border-gray-100

버튼 배치:
  [남성] [여성]  ·  구분선  ·  [↔ 반전]  [뼈 해부학]

각 버튼: min-width 48px, min-height 48px
  → 실제 아이콘은 20px, 나머지는 padding으로 터치 타겟 확보
레이블: 없음 (아이콘만) → 아래 작은 텍스트 캡션
  [남] [여]       [반전]  [해부학]
  8px  8px        작은 캡션 텍스트 10px
```

---

## 5. 랜딩 페이지 — 모바일 개선 포인트

### 5-1. 히어로 섹션

**현재**: CTA 버튼 2개 세로 배치 (w-full)
**개선**: 주 CTA 1개 + 보조 텍스트 링크

```
현재:
  [마네킹 움직여보기]  ← w-full
  [무료 계정 만들기]   ← w-full

개선:
  [무료로 시작하기 →]  ← w-full, height 52px, bg-orange-600
  바로 사용해볼 수 있어요 · 신용카드 불필요  ← 작은 텍스트
```

**현재**: 섹션 여백 `py-24`
**개선**: 모바일 `pt-28 pb-16` (히어로), 하위 섹션 `py-16`

### 5-2. 기능 소개 섹션

**현재**: Before/After 두 줄 + 설명 + 태그 → 카드가 길어짐
**개선**: 핵심 한 문장 + 태그만 표시. 자세히 보기는 accordion으로

```
[아이콘]  3D 마네킹으로 포즈 설정
관절 드래그 → 원하는 포즈 즉시
[관절 조작] [60개 프리셋]

(▼ 더 보기 — 탭하면 Before/After 펼침)
```

### 5-3. 가격 섹션 모바일

**현재**: `grid sm:grid-cols-2` → 모바일에서 세로 2개, Pro 카드가 아래
**개선**: Pro 카드를 먼저, 탭 전환 방식

```
[Free]  [Pro ★]   ← 탭

선택된 플랜 카드만 표시
CTA 버튼 항상 하단 고정
```

---

## 6. 공통 UX 개선 — 마이크로인터랙션

### 6-1. 프리셋 선택 피드백

```
선택 즉시:
  1. 칩 색상 변경 (orange-600)
  2. 마네킹 포즈 전환 (기존 Three.js 애니메이션)
  3. FAB의 숫자 업데이트 (scale bounce 150ms)
```

### 6-2. 결과 로딩 중

```
이미지 그리드에 스켈레톤 카드 표시
  → aspect-ratio 유지한 회색 rounded-xl
  → shimmer 애니메이션 (bg-gradient-to-r animate-shimmer)
FAB: "찾는 중..." + 스피너
```

### 6-3. 필터 바텀시트 열기/닫기

```
열기: translateY(100%) → translateY(0), 300ms ease-out
닫기: translateY(0) → translateY(100%), 200ms ease-in
배경 오버레이: opacity 0 → 0.4, 동기화
```

### 6-4. 태그 선택 토글

```
선택: bg-orange-50 → bg-orange-600, scale 0.95 → 1 (100ms)
해제: bg-orange-600 → bg-orange-50, 동일
```

---

## 7. 접근성 체크리스트

| 항목 | 현재 | 목표 |
|------|------|------|
| 터치 타겟 최소 크기 | 36px (일부) | 48px 모두 |
| 포커스 링 | focus:ring-2 일부만 | 모든 인터랙티브 요소 |
| aria-label | 아이콘 버튼 일부 누락 | 전부 |
| 색상 대비 | text-gray-300 (2.x:1) | WCAG AA 4.5:1 |
| 빈 상태 | 없음 | EmptyState 컴포넌트 |
| 바텀시트 | 없음 | focus trap + ESC 닫기 |
| 스크린리더 | result count 텍스트 | aria-live="polite" |

---

## 8. 구현 우선순위

### Phase A — 즉시 효과 (터치 타겟 + 언어)
1. `MobileBodyTypeBar`: 버튼 48px 확보
2. `MobileTabView` 탭 바: `py-2.5` → `py-3` + `text-sm`
3. 결과 헤더 텍스트: `text-[10px]` → `text-xs` + 뱃지 간소화
4. 마이크로카피 전면 교체 (별도 작업)

### Phase B — 핵심 UX 개선
5. `ResultFAB`: 플로팅 버튼 신규
6. `FilterBottomSheet`: 바텀시트 신규
7. `MobilePosePresetScroll`: 수평 스크롤 프리셋
8. `EmptyState`: 빈 상태 안내

### Phase C — 랜딩 + 마이크로인터랙션
9. 랜딩 히어로 CTA 단순화
10. 스켈레톤 로딩
11. 선택 피드백 애니메이션
12. 가격 섹션 탭 전환

---

## 9. 파일 변경 계획

### 신규 파일
```
src/components/features/mannequin/mobile-mannequin-layout.tsx
src/components/features/mannequin/mobile-pose-preset-scroll.tsx
src/components/features/mannequin/mobile-camera-preset-scroll.tsx
src/components/features/mannequin/mobile-body-type-bar.tsx
src/components/ui/bottom-sheet.tsx
src/components/ui/result-fab.tsx
src/components/ui/active-filter-chips.tsx
src/components/ui/empty-state.tsx
src/components/ui/skeleton-grid.tsx
```

### 수정 파일
```
src/app/(main)/mannequin/page.tsx
  - MobileTabView → MobileMannequinLayout 교체

src/components/features/landing/below-the-fold.tsx
  - 섹션 여백 py-24 → py-16 (모바일)
  - 기능 카드 accordion

src/app/page.tsx
  - 히어로 CTA 단순화
```

---

## 10. 설계 결정 근거

**바텀시트를 선택한 이유**
현재 태그 필터는 좌측 패널 하단에 `max-h-[40vh] overflow-y-auto`로 감춰져 있다. 모바일에서 이 패널은 탭 전환 후 스크롤해야 도달한다. 바텀시트는 어느 탭에서든 즉시 올라오므로 컨텍스트를 잃지 않는다.

**FAB 방식을 선택한 이유**
현재 탭 바는 화면 상단에 있어 엄지가 닿지 않는다. 결과로 이동하는 행동은 포즈 설정 완료 후 가장 빈번한 다음 액션이므로, 엄지 영역 하단 중앙에 고정 FAB가 자연스럽다. Toss 앱의 "다음" 버튼과 같은 패턴이다.

**수평 스크롤 프리셋을 선택한 이유**
현재 `PosePresetCards`는 2열 그리드로 세로 공간을 많이 차지한다. 아티스트 사용 패턴상 프리셋은 빠르게 훑고 고르는 행동이므로, iOS 앱의 태그 수평 스크롤이 적합하다.
