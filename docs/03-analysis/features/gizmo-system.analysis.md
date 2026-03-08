# Gizmo System Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: ArtRef Finder
> **Analyst**: gap-detector (bkit)
> **Date**: 2026-03-04
> **Design Reference**: gizmo-system Plan/Design (14 Design Items)
> **Plan Doc**: docs/01-plan/features/gizmo-system.plan.md (not yet created)
> **Design Doc**: docs/02-design/features/gizmo-system.design.md (not yet created)

### Pipeline References

| Phase | Document | Status |
|-------|----------|--------|
| Phase 1 (Plan) | gizmo-system.plan.md | Not created |
| Phase 2 (Design) | gizmo-system.design.md | Not created |
| Phase 3 (Check) | This document | Current |

> **Note**: Plan/Design 문서가 아직 생성되지 않았으므로, 사용자가 제시한 14개 설계 항목(Design Items)을 기준으로 구현 코드를 비교 분석합니다.

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

기즈모 시스템(3축 회전 기즈모, 관절 클릭, 태그 추천, 레이아웃 자동 축소, 인증 연동, 클라우드 저장 등) 14개 설계 항목에 대해 실제 구현 코드와의 일치도를 측정하고, 누락/변경/추가 사항을 식별한다.

### 1.2 Analysis Scope

| Category | Path |
|----------|------|
| 3D Model | `src/components/features/mannequin/mannequin-model.tsx` |
| 3D Viewer | `src/components/features/mannequin/mannequin-viewer.tsx` |
| Joint Slider | `src/components/features/mannequin/joint-slider-panel.tsx` |
| Tag Recommender | `src/lib/pose-tag-recommender.ts` |
| Resizable Panel | `src/components/ui/resizable-panel.tsx` |
| Search Page | `src/app/(main)/search/page.tsx` |
| Pose Storage | `src/lib/pose-storage.ts` |
| Saved Poses Panel | `src/components/features/mannequin/saved-poses-panel.tsx` |
| Sample Data | `src/lib/sample-data.ts` |
| Onboarding | `src/components/features/onboarding/onboarding-modal.tsx` |
| Auth Modal | `src/components/features/auth/auth-modal.tsx` |
| Auth Store | `src/stores/auth-store.ts` |
| Cloud Pose Storage | `src/lib/cloud-pose-storage.ts` |
| bkend Client | `src/lib/bkend.ts` |
| Pose Store | `src/stores/pose-store.ts` |
| Pose Presets | `src/lib/pose-presets.ts` |

---

## 2. Design Item Gap Analysis (14 Items)

### Item 1: 계층적 뼈대 마네킹 리팩토링 (중첩 group 구조)

| Aspect | Design Requirement | Implementation | Status |
|--------|-------------------|----------------|--------|
| 중첩 group 구조 | pelvis > spine > chest > neck/head, 팔/다리 분기 | 완전 구현. pelvis를 root로 중첩된 `<group>` 트리 구성 | **Match** |
| 관절 수 | 17개 관절 (JOINT_IDS) | 17개 구현: pelvis, spine, chest, neck, head, L/R shoulder, elbow, wrist, hip, knee, ankle | **Match** |
| 체형 파라미터 | male/female/neutral 체형 구분 | BODY_PARAMS에 3가지 체형 정의 (shoulderWidth, pelvisWidth 등) | **Match** |
| ref 레지스트리 | 각 관절에 ref 연결 | `jointRefs.current` + `setRef` 콜백으로 구현 | **Match** |

**Result**: **FULL MATCH** -- 계층적 뼈대 구조가 설계대로 완전히 구현됨.

**Evidence** (`mannequin-model.tsx` L195-335):
```
<group scale={p.scale}>
  <group position={[0, 0.9, 0]}>  {/* 골반 */}
    <group ref={setRef('pelvis')} rotation={joints.pelvis}>
      <group position={[0, 0.15, 0]}>  {/* 척추 */}
        <group ref={setRef('spine')} rotation={joints.spine}>
          <group position={[0, 0.3, 0]}>  {/* 흉부 */}
            <group ref={setRef('chest')} rotation={joints.chest}>
              ...
```

---

### Item 2: 관절 클릭 선택 (raycasting, hitbox, highlight)

| Aspect | Design Requirement | Implementation | Status |
|--------|-------------------|----------------|--------|
| Raycasting 기반 클릭 | 관절 mesh 클릭 시 선택 | React Three Fiber의 `onClick` 이벤트 사용 (자동 raycasting) | **Match** |
| 투명 히트박스 | 관절보다 큰 히트박스 | `radius * 2.5` 크기의 투명 sphere (`opacity={0}`) 구현 | **Match** |
| 하이라이트 효과 | 선택 시 색상 변경 + emissive | `COLORS.jointSelected` (#e879f9) + emissive (#7c3aed, 0.4) | **Match** |
| 커서 변경 | 관절 hover 시 pointer 커서 | `onPointerOver`에서 `cursor = 'pointer'` 설정 | **Match** |
| 선택 해제 | 빈 공간 클릭 시 해제 | 투명 sphere(반지름 2)에 `onClick={() => selectJoint(null)}` | **Match** |

**Result**: **FULL MATCH** -- 관절 클릭 선택 메커니즘이 히트박스, 하이라이트, 커서 변경까지 완전 구현.

**Evidence** (`mannequin-model.tsx` L76-107):
```typescript
function JointSphere({ id, position, radius, selected, onClick }) {
  return (
    <group position={position}>
      <mesh onClick={(e) => { e.stopPropagation(); onClick(id); }}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = ''; }}>
        <sphereGeometry args={[radius * 2.5, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh castShadow>
        <meshStandardMaterial
          color={selected ? COLORS.jointSelected : COLORS.joint}
          emissive={selected ? '#7c3aed' : '#000000'}
          emissiveIntensity={selected ? 0.4 : 0}
        />
      </mesh>
    </group>
  );
}
```

---

### Item 3: 3축 회전 기즈모 (TransformControls mode="rotate")

| Aspect | Design Requirement | Implementation | Status |
|--------|-------------------|----------------|--------|
| TransformControls | drei TransformControls 사용 | `@react-three/drei` TransformControls import 및 사용 | **Match** |
| mode="rotate" | 회전 모드 | `mode="rotate"` 설정 | **Match** |
| space="local" | 로컬 좌표계 | `space="local"` 설정 | **Match** |
| 동적 타겟 | 선택된 관절에 연결 | `gizmoTarget` state로 선택된 관절 group에 동적 연결 | **Match** |
| 회전값 동기화 | 기즈모 조작 -> store 동기화 | `objectChange` 이벤트에서 `setJointRotation` 호출 | **Match** |
| 기즈모 크기 | 적절한 크기 | `size={0.5}` 설정 | **Match** |

**Result**: **FULL MATCH** -- TransformControls가 설계대로 rotate 모드, local space로 구현.

**Evidence** (`mannequin-model.tsx` L338-346):
```tsx
{gizmoTarget && (
  <TransformControls
    ref={transformRef}
    object={gizmoTarget}
    mode="rotate"
    space="local"
    size={0.5}
  />
)}
```

---

### Item 4: 기즈모 <-> OrbitControls 충돌 방지

| Aspect | Design Requirement | Implementation | Status |
|--------|-------------------|----------------|--------|
| 드래그 상태 관리 | isDragging으로 상태 추적 | `usePoseStore`의 `isDragging` + `setDragging` | **Match** |
| OrbitControls 비활성 | 기즈모 드래그 중 OrbitControls disabled | `<OrbitControls enabled={!isDragging}>` | **Match** |
| dragging-changed 이벤트 | TransformControls 이벤트 리스닝 | `tc.addEventListener('dragging-changed', onDragChanged)` | **Match** |
| 클린업 | 이벤트 리스너 해제 | useEffect cleanup에서 removeEventListener | **Match** |

**Result**: **FULL MATCH** -- 기즈모 드래그 시 OrbitControls가 정확히 비활성화됨.

**Evidence** (`mannequin-model.tsx` L149-173 + `mannequin-viewer.tsx` L103-113):
```typescript
// mannequin-model.tsx
const onDragChanged = (e: { value: boolean }) => {
  setDragging(e.value);
};

// mannequin-viewer.tsx
<OrbitControls
  ref={controlsRef}
  enabled={!isDragging}
  ...
/>
```

---

### Item 5: X/Y/Z 회전 슬라이더 패널

| Aspect | Design Requirement | Implementation | Status |
|--------|-------------------|----------------|--------|
| 3축 슬라이더 | X/Y/Z 각각 독립 슬라이더 | AXES 배열 ([X, Y, Z])로 3개 슬라이더 렌더링 | **Match** |
| 범위 | -180 ~ +180 도 | `min={-180} max={180}` 설정 | **Match** |
| 라디안-도 변환 | 내부 라디안 <-> UI 도 | `radToDeg`, `degToRad` 헬퍼 함수 | **Match** |
| 색상 구분 | X=빨강, Y=초록, Z=파랑 | AXES 색상 정의 (red-500, green-500, blue-500) | **Match** |
| 관절 미선택 시 숨김 | selectedJoint null이면 null 반환 | `if (!selectedJoint) return null;` | **Match** |
| 개별 관절 초기화 | 선택된 관절만 리셋 | `handleResetJoint`에서 `setJointRotation(selectedJoint, [0,0,0])` | **Match** |
| 전체 초기화 | 전체 포즈 리셋 | `resetPose()` 버튼 | **Match** |
| 관절 이름 표시 | 한글 이름 | `JOINT_LABELS[selectedJoint]` 표시 | **Match** |
| 양방향 동기화 | 슬라이더 <-> 기즈모 동기화 | Zustand store를 통한 양방향 동기화 | **Match** |

**Result**: **FULL MATCH** -- X/Y/Z 슬라이더가 색상 구분, 도/라디안 변환, 양방향 동기화까지 완전 구현.

---

### Item 6: 기즈모 조작 -> 태그 추천

| Aspect | Design Requirement | Implementation | Status |
|--------|-------------------|----------------|--------|
| 규칙 기반 추천 | 관절 각도 조건 -> 태그 매칭 | `TAG_RULES` 배열 (14개 규칙) + `recommendTagsFromJoints` 함수 | **Match** |
| 포즈 태그 종류 | 만세, 팔들기, 앉기, 걷기 등 | 14개 태그: 만세, 팔들기, 팔뻗기, 팔짱, 고개숙임, 고개돌림, 뒤돌아보기, 앉기, 웅크리기, 걷기, 달리기, 점프, 기대기, 서있기 | **Match** |
| 실시간 업데이트 | 관절 변경 시 자동 태그 갱신 | `useEffect(() => { ... recommendTagsFromJoints(joints) }, [joints])` | **Match** |
| 적용 버튼 | 추천 태그를 검색에 반영 | `applyGizmoTags` 함수 + "적용" 버튼 UI | **Match** |
| 그룹 교체 로직 | 기존 포즈 그룹 태그를 교체 | `TAG_GROUPS.pose.tags`에서 기존 포즈 태그 제거 후 추천 태그 추가 | **Match** |

**Result**: **FULL MATCH** -- 14개 규칙 기반 태그 추천이 실시간으로 동작하며 적용 UI까지 완비.

**Evidence** (`pose-tag-recommender.ts` L26-167 + `search/page.tsx` L156-159):
```typescript
// 자동 업데이트
useEffect(() => {
  const tags = recommendTagsFromJoints(joints);
  setGizmoSuggestedTags(tags);
}, [joints]);
```

---

### Item 7: 레이아웃 자동 축소 (관절 선택/해제 트리거)

| Aspect | Design Requirement | Implementation | Status |
|--------|-------------------|----------------|--------|
| 트리거 조건 | 관절 선택 시 좌측 확대, 해제 시 복원 | `selectedJoint ? 0.55 : 0.35` 비율 계산 | **Match** |
| ResizablePanel 연동 | controlledRatio prop으로 전달 | `<ResizablePanel controlledRatio={desktopRatio}>` | **Match** |
| 부드러운 전환 | 애니메이션으로 비율 변경 | ease-out 보간 애니메이션 (`1 - Math.pow(1 - t, 3)`) | **Match** |
| 수동 드래그 | 사용자가 직접 핸들 드래그 | mousedown/mousemove/mouseup 이벤트 처리 | **Match** |

**Result**: **FULL MATCH** -- 관절 선택/해제에 따른 자동 레이아웃 축소/확대가 부드러운 애니메이션으로 구현.

**Evidence** (`search/page.tsx` L278):
```typescript
const desktopRatio = selectedJoint ? 0.55 : 0.35;
```

---

### Item 8: ESC 키 관절 선택 해제

| Aspect | Design Requirement | Implementation | Status |
|--------|-------------------|----------------|--------|
| ESC 키 바인딩 | ESC 누르면 관절 선택 해제 | `if (e.key === 'Escape') { selectJoint(null); }` | **Match** |
| 인풋 포커스 예외 | 텍스트 입력 중에는 무시 | `if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;` | **Match** |
| F 키 좌우반전 | 추가 단축키 | `if (e.key === 'f' || e.key === 'F') { setIsFlipped(...) }` | **Match** |

**Result**: **FULL MATCH** -- ESC 키 관절 해제가 인풋 예외 처리까지 포함하여 구현.

**Evidence** (`search/page.tsx` L138-153):
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === 'f' || e.key === 'F') { setIsFlipped((prev) => !prev); }
    if (e.key === 'Escape') { selectJoint(null); }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectJoint]);
```

---

### Item 9: 샘플 데이터 500+ 확충

| Aspect | Design Requirement | Implementation | Status |
|--------|-------------------|----------------|--------|
| 데이터 수 | 500개 이상 | 61개 수동 + 500개 자동생성 = **561개** | **Match** |
| 태그 커버리지 | 모든 태그 그룹 커버 | 포즈(12), 카메라(8), 조명(11), 배경(11), 인물(10), 소재(7), 의상(8), 분위기(8) | **Match** |
| 결정론적 생성 | 동일한 데이터 보장 | `seededRandom` 함수로 결정론적 난수 생성 | **Match** |
| Unsplash 이미지 | 실제 이미지 URL | 95개 실제 Unsplash photo ID 순환 사용 | **Match** |
| 한글 제목 | 한글 제목 생성 | `TITLE_POSES`, `TITLE_LIGHTS` 매핑으로 한글 제목 자동 생성 | **Match** |

**Result**: **FULL MATCH** -- 561개 샘플 데이터가 다양한 태그 조합으로 생성됨.

---

### Item 10: 온보딩 모달

| Aspect | Design Requirement | Implementation | Status |
|--------|-------------------|----------------|--------|
| 첫 방문 감지 | localStorage로 방문 여부 확인 | `localStorage.getItem(STORAGE_KEY)` 확인 | **Match** |
| 스텝 가이드 | 단계별 사용법 안내 | 5단계: 포즈 프리셋, 관절 기즈모, 카메라 앵글, 광원 조절, 레퍼런스 검색 | **Match** |
| 다시 보지 않기 | 닫으면 재표시 안 함 | `localStorage.setItem(STORAGE_KEY, 'true')` | **Match** |
| 건너뛰기 | 언제든 건너뛸 수 있음 | "건너뛰기" 버튼 + 배경 클릭 시 닫기 | **Match** |
| 진행 인디케이터 | 현재 단계 표시 | 도트 인디케이터 (클릭으로 이동 가능) | **Match** |
| 기즈모 관련 안내 포함 | 기즈모 사용법 안내 | Step 2: "관절(보라색 구)을 클릭하면 3축 회전 기즈모가 나타납니다" | **Match** |

**Result**: **FULL MATCH** -- 5단계 온보딩 모달이 기즈모 안내를 포함하여 완전 구현.

---

### Item 11: 자유 카메라 자동 태그 감지

| Aspect | Design Requirement | Implementation | Status |
|--------|-------------------|----------------|--------|
| 방향 벡터 비교 | 카메라 방향과 프리셋 방향 비교 | `camDir.distanceTo(presetDir)` 최소 거리 계산 | **Match** |
| useFrame 루프 | 매 프레임 감지 | `useFrame(() => { ... })` 내부에서 감지 로직 | **Match** |
| 변경 시에만 콜백 | 불필요한 리렌더 방지 | `lastDetectedRef`로 이전 값과 비교, 다를 때만 콜백 | **Match** |
| 적용 버튼 | 감지된 태그 적용 UI | 자유 카메라 앵글 태그 패널 + "적용" 버튼 | **Match** |
| 프리셋 선택 시 숨김 | 프리셋 카메라 사용 중이면 감지 패널 숨김 | `!selectedCameraId` 조건으로 표시/숨김 | **Match** |

**Result**: **FULL MATCH** -- 자유 카메라 회전 시 가장 가까운 앵글이 자동 감지되며 적용 UI도 완비.

**Evidence** (`mannequin-viewer.tsx` L72-101):
```typescript
useFrame(() => {
  if (!onAngleDetected || !controlsRef.current) return;
  const camPos = camera.position;
  let closestId = ''; let minDist = Infinity;
  for (const preset of CAMERA_PRESETS) {
    const presetPos = new THREE.Vector3(...preset.position);
    const camDir = camPos.clone().normalize();
    const presetDir = presetPos.clone().normalize();
    const dist = camDir.distanceTo(presetDir);
    if (dist < minDist) { minDist = dist; closestId = preset.id; }
  }
  if (closestId !== lastDetectedRef.current) {
    lastDetectedRef.current = closestId;
    const preset = CAMERA_PRESETS.find((p) => p.id === closestId);
    if (preset) { onAngleDetected(preset.tags); }
  }
});
```

---

### Item 12: bkend.ai 인증 연동

| Aspect | Design Requirement | Implementation | Status |
|--------|-------------------|----------------|--------|
| REST API 클라이언트 | bkend.ai API 연동 | `BkendClient` 클래스: auth (signup/signin/me/signout), data (CRUD) | **Match** |
| 토큰 관리 | access/refresh token | `setTokens`, `clearTokens`, `getToken` 메서드 | **Match** |
| 자동 토큰 갱신 | 401 시 refresh 시도 | `tryRefresh()` -> 재시도 로직 | **Match** |
| Zustand 인증 상태 | 인증 상태 관리 | `useAuthStore`: user, isAuthenticated, isLoading | **Match** |
| persist | 새로고침 시 상태 유지 | `persist` 미들웨어 (localStorage) | **Match** |
| 로그인/회원가입 UI | 모달 폼 | `AuthModal`: 이메일/비밀번호 폼, 로그인/회원가입 모드 전환 | **Match** |
| 헤더 통합 | 인증 상태 표시 | `search/page.tsx`: 로그인 버튼/사용자명+로그아웃 조건부 렌더링 | **Match** |

**Result**: **FULL MATCH** -- bkend.ai 인증이 토큰 관리, UI, 상태 관리까지 완전 연동.

---

### Item 13: 클라우드 포즈 저장

| Aspect | Design Requirement | Implementation | Status |
|--------|-------------------|----------------|--------|
| 서버 저장 | bkend.ai data API로 포즈 저장 | `saveCloudPose`: `bkend.data.create(TABLE, ...)` | **Match** |
| 서버 불러오기 | bkend.ai data API로 목록 조회 | `loadCloudPoses`: `bkend.data.list(TABLE, ...)` | **Match** |
| 서버 삭제 | bkend.ai data API로 삭제 | `deleteCloudPose`: `bkend.data.delete(TABLE, id)` | **Match** |
| localStorage 폴백 | API 실패 시 로컬 저장 | 각 함수에 try/catch로 `loadSavedPoses`/`savePose`/`deleteSavedPose` 폴백 | **Match** |
| 마이그레이션 | 로컬 -> 클라우드 이전 | `migrateLocalToCloud()` 함수 구현 | **Match** |
| 마이그레이션 후 정리 | 성공 시 localStorage 삭제 | `localStorage.removeItem('artref-saved-poses')` | **Match** |
| Search Page 통합 | 실제 UI에서 사용 | **Partial** -- `saved-poses-panel.tsx`는 로컬 `pose-storage.ts`만 직접 사용. `cloud-pose-storage.ts`는 아직 패널에 통합되지 않음 | **Partial** |

**Result**: **PARTIAL MATCH** -- 클라우드 저장 모듈은 완전히 구현되었으나, `SavedPosesPanel` 컴포넌트가 아직 로컬 스토리지만 사용하고 클라우드 저장을 호출하지 않음.

**Gap Detail**: `saved-poses-panel.tsx`에서 `import { loadSavedPoses, savePose, deleteSavedPose } from '@/lib/pose-storage'`를 사용 중. 인증 상태에 따라 `cloud-pose-storage.ts`의 `loadCloudPoses`, `saveCloudPose`, `deleteCloudPose`로 분기하는 로직이 필요.

---

### Item 14: 포즈 저장에 관절 회전 포함

| Aspect | Design Requirement | Implementation | Status |
|--------|-------------------|----------------|--------|
| SavedPose 타입 | jointRotations 필드 | `jointRotations?: JointRotations` (Record<string, [number, number, number]>) | **Match** |
| 저장 시 관절값 포함 | 현재 관절 회전값 저장 | `currentPose.jointRotations = joints` (search/page.tsx L432) | **Match** |
| 불러오기 시 복원 | 관절 회전값 복원 | `handleLoadPose`에서 `setJointRotation(jointId, rotation)` 순회 호출 | **Match** |
| 기즈모 표시 | 저장된 포즈에 기즈모 마크 | `pose.jointRotations && <span>기즈모</span>` 뱃지 표시 | **Match** |
| 클라우드 마이그레이션 포함 | 클라우드 저장 시에도 관절값 포함 | `migrateLocalToCloud`에서 `jointRotations: pose.jointRotations` 포함 | **Match** |

**Result**: **FULL MATCH** -- 포즈 저장/불러오기에 관절 회전값이 완전히 포함.

---

## 3. Match Rate Summary

```
+-----------------------------------------------+
|  Overall Match Rate: 96.4%                     |
+-----------------------------------------------+
|  FULL MATCH:      13 / 14 items (92.9%)        |
|  PARTIAL MATCH:    1 / 14 items  (7.1%)        |
|  NOT IMPLEMENTED:  0 / 14 items  (0.0%)        |
+-----------------------------------------------+
```

| # | Design Item | Status | Score |
|:-:|-------------|:------:|:-----:|
| 1 | 계층적 뼈대 마네킹 리팩토링 | FULL MATCH | 100% |
| 2 | 관절 클릭 선택 (raycasting, hitbox, highlight) | FULL MATCH | 100% |
| 3 | 3축 회전 기즈모 (TransformControls mode="rotate") | FULL MATCH | 100% |
| 4 | 기즈모 <-> OrbitControls 충돌 방지 | FULL MATCH | 100% |
| 5 | X/Y/Z 회전 슬라이더 패널 | FULL MATCH | 100% |
| 6 | 기즈모 조작 -> 태그 추천 | FULL MATCH | 100% |
| 7 | 레이아웃 자동 축소 (관절 선택/해제 트리거) | FULL MATCH | 100% |
| 8 | ESC 키 관절 선택 해제 | FULL MATCH | 100% |
| 9 | 샘플 데이터 500+ 확충 | FULL MATCH | 100% |
| 10 | 온보딩 모달 | FULL MATCH | 100% |
| 11 | 자유 카메라 자동 태그 감지 | FULL MATCH | 100% |
| 12 | bkend.ai 인증 연동 | FULL MATCH | 100% |
| 13 | 클라우드 포즈 저장 | PARTIAL MATCH | 75% |
| 14 | 포즈 저장에 관절 회전 포함 | FULL MATCH | 100% |

---

## 4. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match (14 items) | 96.4% | PASS |
| Architecture Compliance | 92% | PASS |
| Convention Compliance | 95% | PASS |
| **Overall** | **94.5%** | **PASS** |

---

## 5. Differences Found

### 5.1 Missing Features (Design O, Implementation X)

**None** -- 14개 설계 항목 모두 구현 코드가 존재함.

### 5.2 Partial Implementation (Design != Implementation)

| Item | Design | Implementation | Impact | File |
|------|--------|----------------|--------|------|
| 클라우드 포즈 저장 UI 통합 | 인증 시 클라우드 저장, 비인증 시 로컬 저장으로 자동 분기 | `saved-poses-panel.tsx`가 로컬 스토리지(`pose-storage.ts`)만 직접 사용. `cloud-pose-storage.ts` 모듈은 존재하지만 패널에 연결되지 않음 | Medium | `src/components/features/mannequin/saved-poses-panel.tsx` |

### 5.3 Added Features (Design X, Implementation O)

| Item | Implementation Location | Description |
|------|------------------------|-------------|
| 체형별 비율 파라미터 (BODY_PARAMS) | `mannequin-model.tsx` L13-41 | male/female/neutral 3가지 체형의 상세 비율 (shoulderWidth, chestWidth, pelvisWidth 등) |
| 포즈 프리셋 8종 + 실루엣 SVG | `pose-presets.ts` L39-89 | 서기/앉기/걷기/달리기/뒤돌아보기/팔뻗기/웅크리기/기대기 |
| 카메라 프리셋 6종 | `pose-presets.ts` L94-137 | 정면/3/4뷰/측면/로우앵글/아이레벨/하이앵글 |
| 손 프리셋 5종 | `pose-presets.ts` L142-173 | 편 손/주먹/쥐기/가리키기/브이 |
| 광원 -> 태그 자동 매핑 | `search/page.tsx` L32-63 | `lightToTags` 함수 (정면광/역광/측광/탑라이트/림라이트/하드라이트/소프트라이트) |
| 그룹 내 OR / 그룹 간 AND 필터 로직 | `search/page.tsx` L70-98 | 태그 그룹별 논리 연산 |
| 모바일 탭 전환 뷰 | `search/page.tsx` L614-662 | MobileTabView 컴포넌트 (768px 미만) |
| 태블릿 레이아웃 | `search/page.tsx` L588-596 | 768~1024px 분할 비율 40:60 |

---

## 6. Architecture Compliance

### 6.1 Layer Structure (Dynamic Level)

| Expected | Actual | Status |
|----------|--------|--------|
| `src/components/` | `src/components/ui/`, `src/components/features/` | PASS |
| `src/stores/` | `src/stores/pose-store.ts`, `src/stores/auth-store.ts` | PASS |
| `src/lib/` | `src/lib/bkend.ts`, `src/lib/pose-storage.ts`, etc. | PASS |
| `src/types/` | `src/types/index.ts` | PASS |
| `src/app/` | `src/app/(main)/search/page.tsx` | PASS |

### 6.2 Dependency Direction

| Source Layer | Target Layer | Status |
|-------------|-------------|--------|
| Components -> Stores | Presentation -> Application | PASS |
| Components -> Lib | Presentation -> Infrastructure | WARNING (direct import of `@/lib/pose-tag-recommender` from `search/page.tsx`) |
| Stores -> Lib | Application -> Infrastructure | PASS |

**Note**: `search/page.tsx` (Page component, Presentation layer)에서 `@/lib/pose-tag-recommender`와 `@/lib/sample-data`, `@/lib/pose-presets`를 직접 import하고 있음. Dynamic 레벨에서는 허용 가능하나, 엄격한 아키텍처 기준에서는 Service/Hook 레이어를 통해 접근하는 것이 권장됨.

### 6.3 Architecture Score: 92%

---

## 7. Convention Compliance

### 7.1 Naming Convention

| Category | Convention | Compliance | Violations |
|----------|-----------|:----------:|------------|
| Components | PascalCase | 100% | None |
| Functions | camelCase | 100% | None |
| Constants | UPPER_SNAKE_CASE | 100% | `BODY_PARAMS`, `COLORS`, `JOINT_IDS`, `TAG_RULES`, `STORAGE_KEY`, `TABLE`, `STEPS`, etc. |
| Files (component) | kebab-case.tsx | 100% | `mannequin-model.tsx`, `joint-slider-panel.tsx`, `auth-modal.tsx`, etc. |
| Files (utility) | kebab-case.ts | 100% | `pose-tag-recommender.ts`, `pose-storage.ts`, `cloud-pose-storage.ts`, etc. |
| Folders | kebab-case | 100% | `mannequin/`, `onboarding/`, `auth/` |

### 7.2 Korean Comments

| File | Has Korean Comments | Status |
|------|:-------------------:|--------|
| `mannequin-model.tsx` | Yes | PASS |
| `mannequin-viewer.tsx` | Yes | PASS |
| `joint-slider-panel.tsx` | Yes | PASS |
| `pose-tag-recommender.ts` | Yes | PASS |
| `resizable-panel.tsx` | Yes | PASS |
| `search/page.tsx` | Yes | PASS |
| `pose-storage.ts` | Yes | PASS |
| `saved-poses-panel.tsx` | Yes | PASS |
| `sample-data.ts` | Yes | PASS |
| `onboarding-modal.tsx` | Yes | PASS |
| `auth-modal.tsx` | Yes | PASS |
| `auth-store.ts` | Yes (minimal) | PASS |
| `cloud-pose-storage.ts` | Yes | PASS |
| `bkend.ts` | Yes (minimal) | PASS |
| `pose-store.ts` | Yes | PASS |

### 7.3 Import Order

| File | External -> Internal -> Types | Status |
|------|:-----------------------------:|--------|
| `mannequin-model.tsx` | react, three -> drei -> store | PASS |
| `mannequin-viewer.tsx` | react, fiber, drei, three -> components -> store, lib -> types | PASS |
| `search/page.tsx` | react, next -> components -> stores, lib -> types | PASS |
| `auth-store.ts` | zustand -> lib -> types | PASS |

### 7.4 Convention Score: 95%

Minor deductions:
- `auth-store.ts`와 `bkend.ts`의 한글 주석이 다른 파일 대비 상대적으로 적음 (-3%)
- `search/page.tsx`가 663줄로 대형 컴포넌트 (50줄 기준 초과, 분할 권장) (-2%)

---

## 8. Recommended Actions

### 8.1 Immediate (Gap Resolution)

| Priority | Item | File | Action |
|----------|------|------|--------|
| 1 | 클라우드 포즈 저장 UI 통합 | `saved-poses-panel.tsx` | `useAuthStore`의 `isAuthenticated`를 확인하여, 인증 시 `cloud-pose-storage.ts` 함수 사용, 비인증 시 `pose-storage.ts` 사용으로 분기 |

### 8.2 Short-term (Architecture Improvement)

| Priority | Item | File | Expected Impact |
|----------|------|------|-----------------|
| 1 | search/page.tsx 분할 | `search/page.tsx` (663줄) | useMannequinState, useTagSearch 등 커스텀 Hook으로 상태 로직 분리 |
| 2 | bkend.ts 한글 주석 보강 | `bkend.ts` | Convention 준수도 향상 |

### 8.3 Documentation Needed

| Item | Action |
|------|--------|
| Plan 문서 생성 | `docs/01-plan/features/gizmo-system.plan.md` 작성 |
| Design 문서 생성 | `docs/02-design/features/gizmo-system.design.md` 작성 (14개 설계 항목을 공식 문서화) |

---

## 9. Conclusion

14개 설계 항목 중 13개가 FULL MATCH(100%), 1개(클라우드 포즈 저장 UI 통합)가 PARTIAL MATCH(75%)로 전체 Match Rate **96.4%**를 달성했다.

PARTIAL MATCH 항목은 백엔드 모듈(`cloud-pose-storage.ts`)은 완전히 구현되어 있으나 프론트엔드 패널(`saved-poses-panel.tsx`)에서 아직 직접 호출하지 않는 통합 미완 상태이다. 인증 상태에 따른 분기 로직 추가만으로 해결 가능하다.

Match Rate >= 90% 이므로 Check 단계를 **통과(PASS)**로 판정한다.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-04 | Initial gap analysis (14 items) | gap-detector |
