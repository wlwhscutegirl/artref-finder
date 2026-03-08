# Design: collection-moodboard (컬렉션 무드보드 강화)

## Phase 6 — ArtRef Finder

---

## 1. 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│ collections/[id]/page.tsx (무드보드 뷰)                    │
│  ├─ LayoutSwitcher (Grid/Masonry/Freeform)               │
│  ├─ ExportButton (PNG/PDF)                               │
│  ├─ ShareButton (URL 공유)                                │
│  ├─ ColorPalette (통합 색상)                               │
│  └─ MoodboardView                                        │
│      ├─ SortableImageCard (dnd-kit)                      │
│      └─ ImageAnnotation (메모/태그)                       │
├──────────────────────────────────────────────────────────│
│ collection-store.ts (확장)                                │
│  ├─ imageOrder: string[]                                 │
│  ├─ layout: 'grid' | 'masonry' | 'freeform'             │
│  ├─ gridColumns: 2 | 3 | 4                              │
│  ├─ annotations: Record<imageId, Annotation>             │
│  └─ freeformPositions: Record<imageId, Position>         │
├──────────────────────────────────────────────────────────│
│ color-extractor.ts         moodboard-export.ts           │
│  └─ extractPalette()        ├─ exportAsImage()           │
│                              └─ exportAsPdf()            │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 타입 정의

### types/index.ts 확장

```typescript
/** 이미지 어노테이션 (FR-03) */
export interface ImageAnnotation {
  memo: string;           // 메모 텍스트 (최대 200자)
  customTags: string[];   // 개인 태그 (최대 5개)
}

/** 프리폼 위치/크기 (FR-02) */
export interface FreeformPosition {
  x: number;    // 캔버스 내 X좌표 (px)
  y: number;    // 캔버스 내 Y좌표 (px)
  width: number;  // 이미지 너비 (px)
  height: number; // 이미지 높이 (px)
}

/** 컬렉션 레이아웃 타입 */
export type CollectionLayout = 'grid' | 'masonry' | 'freeform';
```

### Collection 인터페이스 확장

```typescript
export interface Collection {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  imageIds: string[];
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  // Phase 6 확장 (하위 호환: 모두 optional)
  layout?: CollectionLayout;
  gridColumns?: 2 | 3 | 4;
  annotations?: Record<string, ImageAnnotation>;
  freeformPositions?: Record<string, FreeformPosition>;
}
```

---

## 3. API 시그니처

### collection-store.ts 확장 액션

```typescript
// 이미지 순서 변경 (드래그앤드롭)
reorderImages: (collectionId: string, newOrder: string[]) => void;

// 레이아웃 설정 변경
setLayout: (collectionId: string, layout: CollectionLayout) => void;
setGridColumns: (collectionId: string, columns: 2 | 3 | 4) => void;

// 어노테이션 CRUD
setAnnotation: (collectionId: string, imageId: string, annotation: Partial<ImageAnnotation>) => void;
removeAnnotation: (collectionId: string, imageId: string) => void;

// 프리폼 위치 설정
setFreeformPosition: (collectionId: string, imageId: string, position: FreeformPosition) => void;
```

### color-extractor.ts

```typescript
/** 이미지 URL에서 주요 색상 N개 추출 */
export function extractPalette(
  imageUrl: string,
  count?: number  // 기본 5
): Promise<string[]>; // hex 색상 배열

/** 여러 이미지의 팔레트를 병합하여 통합 팔레트 생성 */
export function mergepalettes(
  palettes: string[][],
  count?: number  // 기본 8
): string[];
```

### moodboard-export.ts

```typescript
/** 무드보드 DOM을 이미지로 캡처 */
export function exportAsImage(
  element: HTMLElement,
  options?: { format?: 'png' | 'jpeg'; quality?: number; fileName?: string }
): Promise<void>;

/** 무드보드를 PDF로 내보내기 */
export function exportAsPdf(
  element: HTMLElement,
  options?: { fileName?: string; orientation?: 'landscape' | 'portrait' }
): Promise<void>;
```

### 공유 URL 인코딩

```typescript
/** 컬렉션 데이터를 압축 URL로 인코딩 */
export function encodeShareUrl(collection: Collection): string;

/** 압축 URL에서 컬렉션 데이터 디코딩 */
export function decodeShareUrl(encoded: string): Collection | null;
```

---

## 4. UI 와이어프레임

### 컬렉션 상세 페이지 (리디자인)

```
┌─────────────────────────────────────────────────┐
│ ArtRef    [검색] [컬렉션]                         │
├─────────────────────────────────────────────────┤
│ ← 컬렉션 목록                                     │
│                                                  │
│ 「인물 드로잉 참고」 ✏️           [Grid▾] [Export] [Share] │
│ 25장 | 2026-03-06                                │
│                                                  │
│ ┌────────────────────────────────────────────┐  │
│ │ 🎨 색상 팔레트: ● ● ● ● ● ● ● ●          │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │
│ │ img │ │ img │ │ img │ │ img │  ← 드래그 재정렬  │
│ │     │ │     │ │     │ │     │               │
│ │memo │ │     │ │memo │ │     │               │
│ └─────┘ └─────┘ └─────┘ └─────┘               │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │
│ │ img │ │ img │ │ img │ │ img │               │
│ └─────┘ └─────┘ └─────┘ └─────┘               │
└─────────────────────────────────────────────────┘
```

### 레이아웃 드롭다운

```
┌──────────────┐
│ ▦ Grid  2열  │
│ ▦ Grid  3열  │
│ ▦ Grid  4열  │
│ ▤ Masonry    │
│ ⊞ Freeform   │
└──────────────┘
```

### 이미지 카드 (어노테이션 포함)

```
┌──────────────────┐
│                   │
│   (이미지)        │
│                   │
├──────────────────┤
│ 📝 "렘브란트 조명  │
│     참고용"       │
│ #인물 #조명참고    │
└──────────────────┘
```

---

## 5. 구현 순서 (9단계)

| # | 작업 | 파일 | 종류 |
|---|------|------|------|
| 1 | 타입 확장 (Collection, Annotation, Freeform) | types/index.ts | 수정 |
| 2 | collection-store 확장 (reorder, layout, annotation) | stores/collection-store.ts | 수정 |
| 3 | 색상 팔레트 추출 유틸 | lib/color-extractor.ts | 신규 |
| 4 | 무드보드 내보내기 유틸 | lib/moodboard-export.ts | 신규 |
| 5 | 드래그 정렬 카드 컴포넌트 | components/.../sortable-image-card.tsx | 신규 |
| 6 | 레이아웃 전환 컴포넌트 | components/.../layout-switcher.tsx | 신규 |
| 7 | 이미지 어노테이션 컴포넌트 | components/.../image-annotation.tsx | 신규 |
| 8 | 색상 팔레트 + 내보내기 + 공유 컴포넌트 | components/.../color-palette.tsx, export-button.tsx, share-button.tsx | 신규 |
| 9 | 컬렉션 상세 페이지 리디자인 + 통합 | collections/[id]/page.tsx | 수정 |

---

## 6. 의존성 추가

```json
{
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "html2canvas": "^1.4.1",
  "lz-string": "^1.5.0"
}
```

---

## 7. 플랜 제한 (FR-05)

| 기능 | Free | Pro | Team |
|------|------|-----|------|
| 레이아웃 전환 | Grid만 | 전체 | 전체 |
| 무드보드 내보내기 | 월 3회 | 무제한 | 무제한 |
| 공유 링크 | 불가 | 가능 | 가능 |
| 색상 팔레트 | 가능 | 가능 | 가능 |
| 어노테이션 | 가능 | 가능 | 가능 |

---

## 8. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| T-01 | 이미지 3개 드래그 순서 변경 | imageIds 순서 업데이트 |
| T-02 | Grid → Masonry 전환 | CSS columns 레이아웃으로 변경 |
| T-03 | 이미지 메모 200자 입력 | annotations에 저장, hover 시 표시 |
| T-04 | PNG 내보내기 클릭 | html2canvas → 다운로드 |
| T-05 | 공유 URL 생성 → 새 탭에서 열기 | 읽기 전용 컬렉션 표시 |
| T-06 | 색상 팔레트 hex 클릭 | 클립보드 복사 |
| T-07 | Free 플랜에서 공유 시도 | 업그레이드 배너 표시 |
| T-08 | 50개 이미지 드래그앤드롭 | 60fps 유지 |
