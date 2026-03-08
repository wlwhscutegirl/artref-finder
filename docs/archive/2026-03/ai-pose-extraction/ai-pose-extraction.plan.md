# AI 포즈 추출 (ai-pose-extraction) Plan

## 1. 개요

사용자가 업로드한 레퍼런스 이미지에서 **MediaPipe Pose**로 인체 포즈를 자동 추출하고,
추출된 포즈 벡터를 기존 매칭 엔진과 연동하여 **"이 사진과 비슷한 포즈 찾기"** 기능을 제공한다.

### 핵심 가치
- 마네킹을 직접 조작하지 않아도 사진 한 장으로 유사 포즈 검색 가능
- 업로드 이미지 → 17관절 좌표 추출 → 기존 `comparePoses()` 엔진 재사용
- 추출된 포즈를 3D 마네킹에 역적용(Inverse) 가능

## 2. 현재 상태 (As-Is)

| 항목 | 상태 |
|------|------|
| AI/ML 패키지 | 미설치 (MediaPipe, TensorFlow 없음) |
| 이미지 업로드 UI | 없음 |
| 포즈 벡터 형식 | 51개 (17관절 × 3좌표), Procrustes 정규화 |
| 포즈 매칭 엔진 | `comparePoses()` — 코사인 유사도, 가중치 지원 |
| FK 엔진 | 17관절 계층 구조, Euler XYZ → 월드 좌표 |
| 샘플 이미지 | 합성 포즈 벡터 (태그 기반 시드 생성) |

## 3. 목표 상태 (To-Be)

### 3-1. 이미지 업로드 → 포즈 추출
- 드래그앤드롭 또는 파일 선택으로 이미지 업로드
- MediaPipe Pose (WASM/WebGL)로 브라우저 내 관절 좌표 추출
- 33개 MediaPipe 랜드마크 → 17개 ArtRef 관절로 매핑
- 추출된 포즈 벡터로 유사 이미지 즉시 검색

### 3-2. 포즈 프리뷰 + 마네킹 적용
- 추출된 관절을 이미지 위에 오버레이 표시 (확인용)
- "마네킹에 적용" 버튼 → 3D 마네킹이 추출된 포즈로 변경
- 역운동학(IK) 없이 관절 회전값 직접 계산 (Inverse FK)

### 3-3. 배치 분석 (Pro 플랜)
- 여러 이미지 한번에 업로드 → 일괄 포즈 추출
- 추출 결과를 컬렉션에 저장
- Free 플랜: 1장씩, Pro: 최대 10장 배치

## 4. 기술 스택 결정

### MediaPipe Pose (선택)
- **이유**: 브라우저 WASM 실행, 서버 불필요, 33개 3D 랜드마크
- **대안 검토**: TensorFlow.js PoseNet (17개 2D만), MoveNet (비교적 경량이나 2D)
- **MediaPipe 장점**: 3D z좌표 제공 → 기존 51-element 벡터와 호환

### 패키지
```
@mediapipe/tasks-vision  (공식 Vision WASM 패키지)
```

## 5. 구현 단계

### Step 1: MediaPipe 초기화 + 포즈 추출 코어
- `src/lib/mediapipe-pose.ts` — MediaPipe PoseLandmarker 초기화, 이미지 분석
- 33개 랜드마크 → 17개 ArtRef 관절 매핑 테이블
- 추출된 3D 좌표 → 51-element 포즈 벡터 변환
- 정규화: `normalizePoseVector()` 재사용

### Step 2: 이미지 업로드 UI
- `src/components/features/upload/image-upload-zone.tsx` — 드래그앤드롭 + 파일 선택
- 업로드 프리뷰 (이미지 + 추출된 관절 오버레이)
- 추출 진행 상태 표시 (로딩 스피너)

### Step 3: "비슷한 포즈 찾기" 연동
- 추출된 포즈 벡터 → `usePoseSearch` 훅에 주입
- 기존 `comparePoses()` 엔진으로 유사도 계산
- 검색 결과 정렬 + 유사도 점수 표시

### Step 4: 마네킹 역적용 (Inverse FK)
- `src/lib/inverse-fk.ts` — 월드 좌표 → 관절 회전값 역계산
- 추출된 17관절 좌표 → 각 관절의 Euler 회전값 산출
- `usePoseStore.setJointRotation()` 으로 마네킹 업데이트

### Step 5: 배치 + 플랜 게이팅
- 다중 이미지 업로드 지원 (Pro 플랜)
- 추출 결과 컬렉션 저장 연동
- Free 플랜 제한 (일일 5회 추출)

## 6. 관절 매핑 테이블

| MediaPipe (33) | ArtRef (17) | 매핑 방식 |
|----------------|-------------|-----------|
| 0 (nose) | head | 직접 |
| 11 (left_shoulder) | leftShoulder | 직접 |
| 12 (right_shoulder) | rightShoulder | 직접 |
| 13 (left_elbow) | leftElbow | 직접 |
| 14 (right_elbow) | rightElbow | 직접 |
| 15 (left_wrist) | leftWrist | 직접 |
| 16 (right_wrist) | rightWrist | 직접 |
| 23 (left_hip) | leftHip | 직접 |
| 24 (right_hip) | rightHip | 직접 |
| 25 (left_knee) | leftKnee | 직접 |
| 26 (right_knee) | rightKnee | 직접 |
| 27 (left_ankle) | leftAnkle | 직접 |
| 28 (right_ankle) | rightAnkle | 직접 |
| (11+12)/2 | chest | 양 어깨 중점 + 오프셋 |
| (11+12)/2 | neck | 양 어깨 중점 |
| (23+24)/2 | pelvis | 양 엉덩이 중점 |
| (23+24)/2 → (11+12)/2 | spine | pelvis-chest 중점 |

## 7. 파일 목록

### 새 파일 (5개)
| 파일 | 역할 |
|------|------|
| `src/lib/mediapipe-pose.ts` | MediaPipe 초기화 + 포즈 추출 |
| `src/lib/landmark-mapping.ts` | 33→17 관절 매핑 + 벡터 변환 |
| `src/lib/inverse-fk.ts` | 월드 좌표 → 관절 회전값 역계산 |
| `src/components/features/upload/image-upload-zone.tsx` | 업로드 UI + 프리뷰 |
| `src/components/features/upload/pose-overlay.tsx` | 관절 오버레이 시각화 |

### 수정 파일 (4개)
| 파일 | 변경 |
|------|------|
| `src/app/(main)/search/page.tsx` | 업로드 존 배치, 추출 벡터 검색 연동 |
| `src/hooks/usePoseSearch.ts` | 외부 포즈 벡터 주입 지원 |
| `src/stores/pose-store.ts` | 외부 회전값 일괄 적용 메서드 추가 |
| `src/lib/plan-limits.ts` | 포즈 추출 횟수 제한 추가 |

## 8. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| MediaPipe WASM 번들 크기 (~5MB) | 초기 로딩 지연 | dynamic import + 사용 시 로드 |
| 저해상도/가려진 관절 추출 실패 | 매칭 정확도 저하 | confidence 임계값 + 부분 매칭 |
| Inverse FK 수학적 복잡도 | 개발 시간 | 단순 각도 차이 기반 근사해 사용 |
| 모바일 WASM 성능 | 추출 지연 | 해상도 자동 축소 (max 512px) |

## 9. 성공 기준

- [ ] 이미지 업로드 → 2초 이내 포즈 추출 완료
- [ ] 추출된 포즈로 검색 시 상위 5개 중 3개 이상 유사 포즈
- [ ] 마네킹 역적용 시 원본과 시각적 유사도 70% 이상
- [ ] TypeScript 0 에러, Next.js 빌드 성공
- [ ] Free/Pro 플랜별 제한 동작

## 10. 일정 (예상)

| Step | 내용 | 예상 |
|------|------|------|
| 1 | MediaPipe 코어 + 관절 매핑 | 핵심 |
| 2 | 업로드 UI | 핵심 |
| 3 | 검색 연동 | 핵심 |
| 4 | Inverse FK | 확장 |
| 5 | 배치 + 게이팅 | 확장 |
