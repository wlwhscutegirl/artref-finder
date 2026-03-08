# Plan: collection-moodboard (컬렉션 무드보드 강화)

## Phase 6 — ArtRef Finder

### 개요

기존 컬렉션 시스템(Phase 1 MVP)을 아티스트 워크플로우에 최적화된 무드보드로 강화.
이미지 정렬, 메모, 레이아웃, 내보내기, 공유 기능 추가.

### 현재 상태 (As-Is)

- 컬렉션 CRUD (생성/삭제/이름변경)
- 이미지 추가/제거 (체크박스 모달)
- 기본 그리드 뷰 (2~3열 고정)
- 커버 이미지 자동 설정
- localStorage 기반 영속화

### 목표 상태 (To-Be)

- 드래그앤드롭 이미지 재정렬
- 그리드 / 메이슨리 / 프리폼 레이아웃 전환
- 이미지별 메모/태그 어노테이션
- 무드보드 이미지/PDF 내보내기
- 공유 링크 생성 (읽기 전용)
- 이미지 크기 조절 (프리폼 모드)
- 색상 팔레트 자동 추출

---

## 기능 요구사항 (FR)

### FR-01: 드래그앤드롭 재정렬

- 컬렉션 상세 페이지에서 이미지를 드래그하여 순서 변경
- `@dnd-kit/core` + `@dnd-kit/sortable` 사용
- 순서 변경 즉시 collection-store에 반영
- 모바일 터치 드래그 지원

### FR-02: 레이아웃 모드 전환

- 3가지 레이아웃: Grid(기본) / Masonry / Freeform
- Grid: 고정 열 (2/3/4열 선택)
- Masonry: 높이 기반 자동 배치 (CSS columns)
- Freeform: 자유 위치 + 크기 조절 (캔버스형)
- 레이아웃 설정 컬렉션별 저장

### FR-03: 이미지 어노테이션

- 이미지별 메모 텍스트 (최대 200자)
- 커스텀 태그 추가 (컬렉션 내 개인 태그)
- 메모는 이미지 hover 시 표시, 클릭 시 편집
- collection-store에 annotations Map 추가

### FR-04: 무드보드 내보내기

- 현재 레이아웃 그대로 이미지로 캡처 (html2canvas)
- PNG / JPEG 선택
- PDF 내보내기 (A4 가로, 여러 페이지 지원)
- 파일명 자동 생성: `{컬렉션이름}_{날짜}.png`

### FR-05: 공유 링크 생성

- 컬렉션 데이터를 JSON으로 직렬화 → URL 해시에 인코딩
- 읽기 전용 공유 페이지 (`/collections/shared?data=...`)
- LZ-string 압축으로 URL 길이 최소화
- 프로 플랜 이상에서만 공유 가능 (Free 플랜 제한)

### FR-06: 색상 팔레트 추출

- 이미지에서 주요 색상 5개 자동 추출
- Canvas API getImageData 기반
- 컬렉션 전체의 통합 색상 팔레트 표시
- 색상 클릭 시 hex 코드 복사

---

## 비기능 요구사항 (NFR)

- NFR-01: 드래그앤드롭 60fps 유지 (50개 이미지 기준)
- NFR-02: 내보내기 3초 이내 완료 (20개 이미지 기준)
- NFR-03: 공유 URL 4KB 이내 (20개 이미지 기준)
- NFR-04: 모바일 터치 지원 (드래그, 핀치줌)
- NFR-05: 기존 컬렉션 데이터 하위 호환

---

## 기술 스택 추가

- `@dnd-kit/core` + `@dnd-kit/sortable`: 드래그앤드롭
- `html2canvas`: DOM → 이미지 캡처
- `lz-string`: URL 압축
- Canvas API: 색상 팔레트 추출

---

## 구현 순서

1. collection-store 확장 (순서, 레이아웃, 어노테이션)
2. 드래그앤드롭 재정렬 (dnd-kit)
3. 레이아웃 모드 전환 (Grid/Masonry/Freeform)
4. 이미지 어노테이션 UI
5. 색상 팔레트 추출
6. 무드보드 내보내기 (html2canvas)
7. 공유 링크 생성 (lz-string)
8. search/page.tsx 연동 (플랜 제한)
9. TypeScript 검증 + 빌드

---

## 영향 범위

### 새 파일
- `src/components/features/collection/moodboard-view.tsx`
- `src/components/features/collection/sortable-image-card.tsx`
- `src/components/features/collection/image-annotation.tsx`
- `src/components/features/collection/layout-switcher.tsx`
- `src/components/features/collection/color-palette.tsx`
- `src/components/features/collection/export-button.tsx`
- `src/components/features/collection/share-button.tsx`
- `src/lib/color-extractor.ts`
- `src/lib/moodboard-export.ts`
- `src/app/(main)/collections/shared/page.tsx`

### 수정 파일
- `src/stores/collection-store.ts`
- `src/app/(main)/collections/[id]/page.tsx`
- `src/types/index.ts`
- `src/lib/plan-limits.ts`
