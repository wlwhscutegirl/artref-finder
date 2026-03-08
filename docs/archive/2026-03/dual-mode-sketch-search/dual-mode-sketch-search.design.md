# Design: dual-mode-sketch-search (듀얼 모드 + 스케치 검색)

## Phase 7 — ArtRef Finder

---

## 1. 라우팅 구조

```
/                  → 랜딩 (모드 선택)
/mannequin         → 마네킹 모드 (기존 /search 이동)
/sketch            → 드로잉 모드 (신규)
/search            → /mannequin 301 리다이렉트
/collections       → 공통 (기존)
/dashboard         → 공통 (기존)
/pricing           → 공통 (기존)
```

---

## 2. 아키텍처

```
┌─────────────────────────────────────────────────┐
│ Landing (page.tsx)                               │
│  ├─ [마네킹 모드 카드] → /mannequin              │
│  └─ [드로잉 모드 카드] → /sketch                 │
├──────────────────────────────────────────────────│
│ 공통 헤더: ModeTabs (마네킹 | 드로잉)              │
├──────────────────────────────────────────────────│
│ /mannequin (기존 search/page.tsx 이동)            │
│  └─ 3D 마네킹 + 태그 필터 + 하이브리드 검색       │
├──────────────────────────────────────────────────│
│ /sketch (신규)                                   │
│  ├─ DrawingCanvas (512×512 Canvas)               │
│  │   ├─ SketchToolbar (펜/지우개/크기/색상/Undo)  │
│  │   └─ SketchUpload (이미지 업로드 오버레이)      │
│  ├─ sketchToPose() → usePoseSearch               │
│  └─ 결과 그리드 (ImageGrid 재활용)                │
└─────────────────────────────────────────────────┘
```

---

## 3. 타입 정의

### DrawingTool

```typescript
export type DrawingTool = 'pen' | 'eraser';

export interface CanvasState {
  tool: DrawingTool;
  lineWidth: number;       // 1~20
  color: string;           // hex
  history: ImageData[];    // undo 스택
  historyIndex: number;    // 현재 위치
}
```

---

## 4. API 시그니처

### drawing-canvas.tsx

```typescript
interface DrawingCanvasProps {
  /** 캔버스 너비 (기본 512) */
  width?: number;
  /** 캔버스 높이 (기본 512) */
  height?: number;
  /** 배경 이미지 (업로드된 스케치) */
  backgroundImage?: string | null;
  /** 캔버스 내용 변경 시 콜백 (dataURL) */
  onChange?: (dataUrl: string) => void;
  /** ref로 캔버스 요소 접근 */
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}
```

### sketch-toolbar.tsx

```typescript
interface SketchToolbarProps {
  tool: DrawingTool;
  lineWidth: number;
  color: string;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: DrawingTool) => void;
  onLineWidthChange: (width: number) => void;
  onColorChange: (color: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}
```

### sketch-to-pose.ts

```typescript
/**
 * 스케치 이미지(dataURL)에서 포즈 벡터 추출
 * Phase 4의 extractPoseFromImage 파이프라인 재활용
 * @returns 포즈 벡터 + 신뢰도 가중치, 또는 null (사람 형체 없음)
 */
export async function sketchToPose(
  dataUrl: string
): Promise<{ poseVector: number[]; jointWeights: number[] } | null>;
```

### mode-tabs.tsx

```typescript
interface ModeTabsProps {
  /** 현재 활성 모드 */
  activeMode: 'mannequin' | 'sketch';
}
```

---

## 5. UI 와이어프레임

### 랜딩 페이지 모드 선택

```
┌─────────────────────────────────────────────┐
│           포즈, 조명, 앵글                    │
│       딱 맞는 레퍼런스를 찾아드립니다           │
│                                              │
│  ┌──────────────────┐ ┌──────────────────┐  │
│  │   🦾 마네킹 모드   │ │   ✏️ 드로잉 모드   │  │
│  │                   │ │                   │  │
│  │ 3D 마네킹으로      │ │ 그림을 그려서      │  │
│  │ 정밀하게 검색      │ │ 쉽게 검색          │  │
│  │                   │ │                   │  │
│  │ 그림에 익숙한      │ │ 초보자도           │  │
│  │ 아티스트용         │ │ 쉽게 사용          │  │
│  │                   │ │                   │  │
│  │   [시작하기 →]     │ │   [시작하기 →]     │  │
│  └──────────────────┘ └──────────────────┘  │
└─────────────────────────────────────────────┘
```

### 드로잉 모드 검색 페이지

```
┌─────────────────────────────────────────────────┐
│ ArtRef  [마네킹|드로잉]  [컬렉션] [대시보드]       │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─ 캔버스 ──────────────┐  ┌─ 결과 ──────────┐ │
│  │                        │  │ 레퍼런스 25건    │ │
│  │     (512×512)          │  │                 │ │
│  │   사용자 드로잉 영역     │  │ ┌───┐ ┌───┐    │ │
│  │                        │  │ │img│ │img│    │ │
│  │                        │  │ │92%│ │87%│    │ │
│  │                        │  │ └───┘ └───┘    │ │
│  ├────────────────────────┤  │ ┌───┐ ┌───┐    │ │
│  │ 🖊️ ◻ │ 3px │ ■ │ ↩ ↪ │🗑│  │ │img│ │img│    │ │
│  │ 펜 지우│ 크기│색 │Undo│Cl│  │ └───┘ └───┘    │ │
│  ├────────────────────────┤  │                 │ │
│  │ 📷 이미지 업로드        │  │                 │ │
│  │ 또는 파일을 드래그하세요  │  │                 │ │
│  └────────────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 6. 구현 순서

| # | 작업 | 파일 | 종류 |
|---|------|------|------|
| 1 | 마네킹 모드 페이지 생성 (search → mannequin 이동) | app/(main)/mannequin/page.tsx | 신규 |
| 2 | search 리다이렉트 설정 | app/(main)/search/page.tsx | 수정 |
| 3 | 모드 전환 탭 컴포넌트 | components/ui/mode-tabs.tsx | 신규 |
| 4 | 랜딩 페이지 모드 선택 UI | app/page.tsx | 수정 |
| 5 | 드로잉 캔버스 컴포넌트 | components/features/sketch/drawing-canvas.tsx | 신규 |
| 6 | 캔버스 도구 바 | components/features/sketch/sketch-toolbar.tsx | 신규 |
| 7 | 스케치 업로드 컴포넌트 | components/features/sketch/sketch-upload.tsx | 신규 |
| 8 | 스케치 → 포즈 변환 유틸 | lib/sketch-to-pose.ts | 신규 |
| 9 | 드로잉 모드 검색 페이지 | app/(main)/sketch/page.tsx | 신규 |
| 10 | TypeScript 검증 + 빌드 | - | - |

---

## 7. 드로잉 캔버스 구현 상세

### Canvas API 이벤트 흐름

```
pointerdown → isDrawing = true, beginPath
pointermove → isDrawing ? lineTo + stroke
pointerup   → isDrawing = false, saveHistory
```

### Undo/Redo 로직

```
history: ImageData[]      // 최대 50개 유지
historyIndex: number      // 현재 위치

Undo: historyIndex-- → putImageData(history[historyIndex])
Redo: historyIndex++ → putImageData(history[historyIndex])
Draw: history.splice(historyIndex + 1) → push(getImageData) → historyIndex++
```

### 터치 지원

```
touch-action: none;       // 기본 스크롤 방지
pointerdown/move/up 통일 (마우스+터치 동시 지원)
```

---

## 8. 스케치 → 포즈 추출 전략

1. 캔버스 dataURL → Image 변환
2. Phase 4의 `extractPoseFromImage()` 호출 (MediaPipe Pose)
3. 성공 → poseVector + jointWeights → usePoseSearch 전달
4. 실패 (사람 형체 없음) → 이미지 특징 기반 태그 매칭 fallback
   - 밝기/대비 → 조명 태그 추론
   - 종횡비/위치 → 카메라 앵글 추론
5. 결과를 기존 ImageGrid로 표시

---

## 9. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| T-01 | 랜딩에서 마네킹 모드 클릭 | /mannequin 이동, 기존 기능 정상 |
| T-02 | 랜딩에서 드로잉 모드 클릭 | /sketch 이동, 캔버스 표시 |
| T-03 | /search 접속 | /mannequin으로 리다이렉트 |
| T-04 | 캔버스에 사람 형태 그리기 → 검색 | 유사 포즈 사진 결과 표시 |
| T-05 | 스케치 이미지 업로드 → 검색 | 캔버스에 표시 + 포즈 추출 |
| T-06 | Ctrl+Z 3회 | 3단계 전 상태 복원 |
| T-07 | 모바일 터치 드로잉 | 터치로 정상 드로잉 |
| T-08 | 헤더 탭으로 모드 전환 | 마네킹↔드로잉 페이지 전환 |
