# AI 포즈 추출 (ai-pose-extraction) Design

> Plan 문서: `docs/01-plan/features/ai-pose-extraction.plan.md`

## 1. 아키텍처 개요

```
[이미지 업로드] → [MediaPipe WASM] → [33 랜드마크] → [17관절 매핑]
                                                         ↓
                                              [51-element 포즈 벡터]
                                                    ↓           ↓
                                           [comparePoses()]  [Inverse FK]
                                                    ↓           ↓
                                           [유사 이미지 정렬]  [마네킹 적용]
```

### 데이터 플로우

1. 사용자가 이미지를 드래그앤드롭 또는 파일 선택으로 업로드
2. `mediapipe-pose.ts`가 PoseLandmarker를 lazy-init하고 이미지 분석
3. `landmark-mapping.ts`가 33개 MediaPipe 랜드마크 → 17개 ArtRef 관절로 변환
4. 변환된 좌표 → `normalizePoseVector()` → 51-element 정규화 벡터
5. 벡터를 `usePoseSearch` 훅에 주입 → 기존 엔진으로 유사도 정렬
6. (선택) `inverse-fk.ts`가 좌표 → 관절 회전값 역산 → 마네킹 적용

## 2. 새 파일 상세 설계

### 2-1. `src/lib/mediapipe-pose.ts` — MediaPipe 초기화 + 추출

```typescript
// === 타입 정의 ===

/** MediaPipe 추출 결과 */
interface PoseExtractionResult {
  /** 33개 MediaPipe 랜드마크 (x, y, z, visibility) */
  landmarks: Array<{ x: number; y: number; z: number; visibility: number }>;
  /** 추출 소요 시간 (ms) */
  processingTime: number;
  /** 전체 신뢰도 (0~1) */
  confidence: number;
}

// === 공개 API ===

/**
 * MediaPipe PoseLandmarker 싱글톤 초기화
 * - dynamic import로 WASM 번들 지연 로딩 (~5MB)
 * - 최초 호출 시 1회만 로드, 이후 캐시 재사용
 * - GPU delegate 우선, fallback to CPU
 */
export async function initPoseLandmarker(): Promise<void>

/**
 * 이미지에서 포즈 랜드마크 추출
 * @param image HTMLImageElement 또는 ImageBitmap
 * @returns 33개 랜드마크 + 메타데이터, 추출 실패 시 null
 */
export async function extractPoseFromImage(
  image: HTMLImageElement | ImageBitmap
): Promise<PoseExtractionResult | null>

/**
 * PoseLandmarker 리소스 해제
 * (페이지 이탈 시 호출)
 */
export function disposePoseLandmarker(): void
```

**구현 핵심:**
- `@mediapipe/tasks-vision`의 `PoseLandmarker.createFromOptions()` 사용
- WASM 파일 CDN 로드: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm`
- `runningMode: 'IMAGE'` (영상이 아닌 단일 이미지 모드)
- 이미지 크기가 512px 초과 시 자동 리사이즈 (모바일 성능)

### 2-2. `src/lib/landmark-mapping.ts` — 33→17 관절 매핑

```typescript
// === 타입 정의 ===

/** MediaPipe 랜드마크 (33개 중 하나) */
interface MediaPipeLandmark {
  x: number;  // 0~1 정규화 좌표
  y: number;
  z: number;
  visibility: number;  // 0~1 신뢰도
}

/** ArtRef 관절 좌표 (월드 스케일) */
interface ArtRefJointPosition {
  jointId: JointId;
  x: number;
  y: number;
  z: number;
  confidence: number;  // 원본 랜드마크의 visibility 기반
}

// === 매핑 테이블 ===

/** MediaPipe 인덱스 → ArtRef JointId 직접 매핑 (13개) */
const DIRECT_MAPPING: Record<number, JointId> = {
  0: 'head',           // nose
  11: 'leftShoulder',
  12: 'rightShoulder',
  13: 'leftElbow',
  14: 'rightElbow',
  15: 'leftWrist',
  16: 'rightWrist',
  23: 'leftHip',
  24: 'rightHip',
  25: 'leftKnee',
  26: 'rightKnee',
  27: 'leftAnkle',
  28: 'rightAnkle',
}

/** 합성 관절 4개: 두 랜드마크의 중점으로 계산 */
// pelvis  = midpoint(23, 24)               양 엉덩이 중점
// spine   = midpoint(pelvis, chest)         몸통 중심
// chest   = midpoint(11, 12) + y_offset     양 어깨 중점 아래
// neck    = midpoint(11, 12)               양 어깨 중점

// === 공개 API ===

/**
 * 33개 MediaPipe 랜드마크 → 17개 ArtRef 관절 좌표로 변환
 * @param landmarks MediaPipe 추출 결과 (33개)
 * @param imageWidth 원본 이미지 너비 (좌표 역정규화용)
 * @param imageHeight 원본 이미지 높이
 * @returns 17개 관절 좌표 배열
 */
export function mapLandmarksToJoints(
  landmarks: MediaPipeLandmark[],
  imageWidth: number,
  imageHeight: number
): ArtRefJointPosition[]

/**
 * 17개 관절 좌표 → 51-element 포즈 벡터로 변환
 * JOINT_ORDER 순서대로 [x, y, z] 플랫 배열
 * @returns 정규화된 포즈 벡터 (comparePoses에 바로 사용 가능)
 */
export function jointsToVector(joints: ArtRefJointPosition[]): number[]

/**
 * 신뢰도 기반 가중치 생성
 * visibility가 낮은 관절은 유사도 비교 시 가중치 감소
 * @returns 17개 관절 가중치 배열
 */
export function jointsToWeights(joints: ArtRefJointPosition[]): number[]

// === 좌표 변환 상수 ===

/** MediaPipe → ArtRef 좌표계 변환
 * MediaPipe: x=오른쪽, y=아래, z=카메라방향 (0~1 정규화)
 * ArtRef FK: x=오른쪽, y=위, z=앞쪽 (미터 단위)
 *
 * 변환: artRef.x = mp.x * SCALE
 *       artRef.y = (1 - mp.y) * SCALE  (y 반전)
 *       artRef.z = -mp.z * SCALE        (z 반전)
 *       SCALE = 2.0 (대략 인체 높이에 맞춤)
 */
const COORD_SCALE = 2.0;
```

### 2-3. `src/lib/inverse-fk.ts` — Inverse FK (좌표 → 회전값)

```typescript
import type { JointId } from '@/stores/pose-store';

/**
 * 추출된 17관절 월드 좌표 → 각 관절의 Euler 회전값 역계산
 *
 * 방법: 부모-자식 관절 벡터의 방향으로부터 회전값 산출
 * - 각 관절에서 자식 방향 벡터를 계산
 * - 기본 포즈(T-pose)의 자식 방향과 비교
 * - 두 벡터 사이의 회전을 Euler XYZ로 분해
 *
 * 제약: 완벽한 IK가 아닌 근사해 (twist 성분 부정확할 수 있음)
 */
export function computeInverseFK(
  jointPositions: Record<JointId, [number, number, number]>
): Record<JointId, [number, number, number]>

/**
 * 두 벡터 사이의 회전을 Euler XYZ로 변환
 * @param from 기본 방향 벡터 (T-pose)
 * @param to 목표 방향 벡터 (추출된 포즈)
 * @returns [rx, ry, rz] 라디안
 */
function vectorToEuler(
  from: [number, number, number],
  to: [number, number, number]
): [number, number, number]
```

### 2-4. `src/components/features/upload/image-upload-zone.tsx`

```typescript
interface ImageUploadZoneProps {
  /** 추출 완료 콜백 (벡터 + 관절 좌표) */
  onPoseExtracted: (result: {
    poseVector: number[];
    jointPositions: ArtRefJointPosition[];
    jointWeights: number[];
    imageUrl: string;
  }) => void;
  /** 마네킹 적용 콜백 */
  onApplyToMannequin?: (rotations: Record<JointId, [number, number, number]>) => void;
  /** Pro 배치 모드 활성화 */
  batchMode?: boolean;
  /** 비활성화 (플랜 제한 등) */
  disabled?: boolean;
}
```

**UI 구조:**
```
┌─────────────────────────────────────┐
│  📷 이미지를 드래그하거나 클릭하세요  │  ← 드롭존 (점선 테두리)
│     (또는 클릭하여 파일 선택)         │
└─────────────────────────────────────┘
         ↓ (파일 드롭/선택 후)
┌─────────────────────────────────────┐
│  [이미지 프리뷰 + 관절 오버레이]     │  ← pose-overlay.tsx
│  ○──○──○   신뢰도: 92%              │
│  │     │   추출 시간: 0.8s           │
│  ○  ○  ○                            │
│  │  │  │                            │
│  ○  ○  ○                            │
│                                     │
│  [비슷한 포즈 찾기]  [마네킹에 적용]  │  ← 액션 버튼
└─────────────────────────────────────┘
```

**상태 머신:**
```
idle → uploading → extracting → preview → (search | apply | reset)
                      ↓ (실패)
                    error → idle
```

### 2-5. `src/components/features/upload/pose-overlay.tsx`

```typescript
interface PoseOverlayProps {
  /** 17개 관절 좌표 */
  joints: ArtRefJointPosition[];
  /** 원본 이미지 크기 */
  imageWidth: number;
  imageHeight: number;
  /** 표시 크기 (CSS) */
  displayWidth: number;
  displayHeight: number;
}
```

**렌더링:**
- SVG 오버레이로 관절 점(원) + 뼈대(선) 그리기
- 신뢰도에 따라 색상 변화 (높음=보라, 중간=노랑, 낮음=빨강)
- FK 스켈레톤 계층 구조와 동일한 연결선

**뼈대 연결 정의:**
```typescript
const BONE_CONNECTIONS: [JointId, JointId][] = [
  ['pelvis', 'spine'], ['spine', 'chest'],
  ['chest', 'neck'], ['neck', 'head'],
  ['chest', 'leftShoulder'], ['leftShoulder', 'leftElbow'], ['leftElbow', 'leftWrist'],
  ['chest', 'rightShoulder'], ['rightShoulder', 'rightElbow'], ['rightElbow', 'rightWrist'],
  ['pelvis', 'leftHip'], ['leftHip', 'leftKnee'], ['leftKnee', 'leftAnkle'],
  ['pelvis', 'rightHip'], ['rightHip', 'rightKnee'], ['rightKnee', 'rightAnkle'],
];
```

## 3. 수정 파일 상세 설계

### 3-1. `src/hooks/usePoseSearch.ts` 수정

```typescript
// 기존 시그니처에 외부 벡터 파라미터 추가
export function usePoseSearch(
  filteredImages: ReferenceImage[],
  poseMatchEnabled?: boolean,
  currentCameraAngle?: CameraAngle | null,
  // === 신규 파라미터 ===
  externalPoseVector?: number[] | null,   // 업로드 이미지에서 추출된 벡터
  externalWeights?: number[] | null       // 신뢰도 기반 가중치
): PoseSearchResult
```

**변경 로직:**
- `externalPoseVector`가 있으면 마네킹 FK 대신 이 벡터를 사용
- `externalWeights`가 있으면 `computeSimilarity(a, b, weights)`에 전달
- 기존 마네킹 포즈 매칭과 외부 벡터 매칭은 상호 배타적 (외부 벡터 우선)

### 3-2. `src/stores/pose-store.ts` 수정

```typescript
interface PoseState {
  // ... 기존 필드 ...

  // === 신규 메서드 ===
  /** 외부 포즈 (Inverse FK 결과)를 모든 관절에 일괄 적용 */
  applyExternalPose: (rotations: Record<JointId, [number, number, number]>) => void;
}
```

### 3-3. `src/lib/plan-limits.ts` 수정

```typescript
interface PlanConfig {
  // ... 기존 필드 ...
  /** 일일 포즈 추출 횟수 제한 */
  dailyExtractionLimit: number;
  /** 배치 업로드 최대 장수 */
  maxBatchSize: number;
}

// free: dailyExtractionLimit: 5, maxBatchSize: 1
// pro: dailyExtractionLimit: -1, maxBatchSize: 10
// team: dailyExtractionLimit: -1, maxBatchSize: 10
```

### 3-4. `src/app/(main)/search/page.tsx` 수정

**업로드 존 배치 위치:**
- 왼쪽 패널 (마네킹 뷰어 아래)에 `ImageUploadZone` 배치
- 접을 수 있는 패널 (기본 접힘)
- "사진으로 포즈 찾기" 버튼 클릭 시 펼침

**상태 추가:**
```typescript
const [extractedPoseVector, setExtractedPoseVector] = useState<number[] | null>(null);
const [extractedWeights, setExtractedWeights] = useState<number[] | null>(null);
const [showUploadZone, setShowUploadZone] = useState(false);
```

**검색 연동:**
```typescript
// usePoseSearch에 외부 벡터 전달
const { images, isPoseActive } = usePoseSearch(
  filteredImages,
  poseMatchEnabled,
  effectiveCameraAngle,
  extractedPoseVector,    // 신규
  extractedWeights        // 신규
);
```

## 4. 패키지 설치

```bash
npm install @mediapipe/tasks-vision
```

## 5. 구현 순서

| 순서 | 파일 | 의존성 |
|:----:|------|--------|
| 1 | `src/lib/landmark-mapping.ts` | 없음 (순수 로직) |
| 2 | `src/lib/mediapipe-pose.ts` | @mediapipe/tasks-vision |
| 3 | `src/components/features/upload/pose-overlay.tsx` | landmark-mapping 타입 |
| 4 | `src/components/features/upload/image-upload-zone.tsx` | mediapipe-pose, landmark-mapping, pose-overlay |
| 5 | `src/hooks/usePoseSearch.ts` (수정) | 기존 코드 |
| 6 | `src/stores/pose-store.ts` (수정) | 기존 코드 |
| 7 | `src/app/(main)/search/page.tsx` (수정) | upload-zone, usePoseSearch |
| 8 | `src/lib/inverse-fk.ts` | forward-kinematics 참조 |
| 9 | `src/lib/plan-limits.ts` (수정) | 기존 코드 |

## 6. 에러 핸들링

| 상황 | 처리 |
|------|------|
| WASM 로드 실패 | fallback 메시지 + 재시도 버튼 |
| 이미지에 사람 없음 | "포즈를 감지하지 못했습니다" 토스트 |
| 관절 일부 가려짐 (visibility < 0.5) | 해당 관절 가중치 0으로 → 부분 매칭 |
| 모든 관절 신뢰도 낮음 (< 0.3) | 추출 실패로 처리 |
| 플랜 제한 초과 | 업그레이드 배너 표시 |
| 파일 형식 오류 | "JPG, PNG, WebP만 지원합니다" |
| 파일 크기 초과 (> 10MB) | "10MB 이하 파일만 업로드 가능합니다" |

## 7. 성능 최적화

| 전략 | 상세 |
|------|------|
| Lazy Loading | MediaPipe WASM을 dynamic import로 첫 사용 시만 로드 |
| 이미지 리사이즈 | 512px 초과 시 Canvas로 축소 후 분석 |
| 싱글톤 | PoseLandmarker 인스턴스 1개만 유지 |
| Web Worker (향후) | 추출 작업을 Worker로 오프로드 가능 설계 |

## 8. 검증 체크리스트

- [ ] `npm install @mediapipe/tasks-vision` 성공
- [ ] `npx tsc --noEmit` 에러 0건
- [ ] `npm run build` 성공
- [ ] 이미지 업로드 → 관절 오버레이 표시
- [ ] 추출된 벡터로 유사 이미지 상위 정렬
- [ ] "마네킹에 적용" → 3D 마네킹 포즈 변경
- [ ] 신뢰도 낮은 관절 시각적 구분 (빨강)
- [ ] Free 플랜 5회 제한 동작
- [ ] 모바일에서 512px 리사이즈 동작
