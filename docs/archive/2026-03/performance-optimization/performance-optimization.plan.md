# 성능 최적화 (Performance Optimization) Planning Document

> **Summary**: 모바일/저사양 기기에서 3D 뷰어 성능 개선 + 2D 폴백 모드 + 적응형 렌더링
>
> **Project**: ArtRef Finder
> **Version**: 0.5.0
> **Author**: Claude
> **Date**: 2026-03-06
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

20인 사용자 에이전트 리뷰에서 도출된 Critical 이슈 #1, #2를 해결한다:
- **모바일 3D 뷰어 성능**: 스마트폰 사용자 ~30%가 3D 뷰어 실질 사용 불가
- **저사양 PC Three.js 성능**: 저사양 노트북/데스크탑 ~15%에서 5fps 이하

### 1.2 Background

- 사용자 만족도 조사에서 "모바일 사용성" 2.5/5.0, "저사양 기기 성능" 2.3/5.0으로 최하위
- 현재 Three.js 렌더링: ~10K 삼각형 (경량)이지만 그림자/HDRI/고해상도 렌더링이 모바일에서 과부하
- 명시적 WebGL 감지/폴백 없이, 기기 성능에 무관하게 동일 렌더링 파이프라인 적용
- 배준혁(저사양): "마네킹 모드 들어가면 5fps, 관절 잡는 데 3초"
- 김나연(스마트폰): "모바일에서 3D 뷰어가 거의 사용 불가"

### 1.3 Related Documents

- 사용자 피드백: `docs/05-user-feedback/user-agent-review.md`
- 기존 아키브: `docs/archive/2026-03/_INDEX.md`

---

## 2. Scope

### 2.1 In Scope

- [x] 디바이스 성능 감지 시스템 (GPU/WebGL 능력 벤치마크)
- [x] 3단계 적응형 렌더링 (High/Medium/Low)
- [x] 2D 실루엣 폴백 모드 (Canvas 2D 기반 관절 조작)
- [x] 그림자/HDRI/해상도 품질 조절 옵션
- [x] 디바이스 픽셀 비율(DPR) 제어
- [x] 모바일 터치 UX 개선 (관절 터치 영역 확대)
- [x] 성능 프리셋 수동 전환 UI
- [x] FPS 모니터링 + 자동 품질 다운그레이드

### 2.2 Out of Scope

- WebGPU 마이그레이션 (Three.js 0.183 에서 아직 실험적)
- InstancedMesh 배칭 (현재 ~10K 삼각형으로 효과 미미)
- Worker 스레드 포즈 계산 (복잡도 대비 효과 작음)
- 태블릿 전용 UI 리디자인 (별도 피처로 분리)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | WebGL 능력 + GPU 벤치마크 기반 디바이스 등급 자동 감지 | High | Pending |
| FR-02 | 3단계 적응형 렌더링 프리셋 (High/Medium/Low) | High | Pending |
| FR-03 | Low 등급에서 2D Canvas 폴백 모드 자동 전환 | High | Pending |
| FR-04 | 2D 모드에서 17개 관절 드래그 조작 + 포즈 검색 연동 | High | Pending |
| FR-05 | 수동 품질 전환 UI (설정 패널) | Medium | Pending |
| FR-06 | FPS 모니터 + 자동 다운그레이드 (15fps 미만 시) | Medium | Pending |
| FR-07 | 모바일 터치 관절 히트박스 2배 확대 | Medium | Pending |
| FR-08 | DPR 적응형 제어 (모바일: 1.0, 데스크탑: min(2, devicePixelRatio)) | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | Low 프리셋에서 모바일 30fps 이상 | Chrome DevTools FPS counter |
| Performance | Medium 프리셋에서 저사양 PC 30fps 이상 | requestAnimationFrame 기반 측정 |
| Performance | 2D 모드 초기 로드 < 500ms | Performance API |
| UX | 품질 전환 시 포즈 상태 유지 (데이터 손실 없음) | 수동 테스트 |
| UX | 자동 다운그레이드 시 사용자 알림 (토스트) | UI 확인 |
| Compatibility | iOS Safari 16+, Chrome 100+, Firefox 100+ | 브라우저 테스트 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 디바이스 등급 감지가 모바일/저사양/고사양 3단계로 분류
- [ ] 2D 폴백 모드에서 관절 조작 + 포즈 벡터 생성 정상 작동
- [ ] 3단계 프리셋 전환 시 기존 포즈 유지
- [ ] `npm run build` 성공 + `npx tsc --noEmit` 에러 0건
- [ ] 모바일 Chrome에서 2D 모드 30fps 이상

### 4.2 Quality Criteria

- [ ] Zero TypeScript 에러
- [ ] 빌드 성공
- [ ] 기존 3D 모드 회귀 없음

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 2D 모드가 3D 대비 사용성 저하 | High | Medium | 직관적 관절 드래그 UI + 프리셋 포즈 보완 |
| GPU 벤치마크 불정확 | Medium | Medium | FPS 기반 실시간 자동 다운그레이드로 보완 |
| iOS Safari WebGL 호환성 이슈 | Medium | Low | 2D 폴백이 안전망 역할 |
| 품질 전환 시 렌더링 깜빡임 | Low | Medium | Suspense + 전환 애니메이션으로 마스킹 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | |
| **Dynamic** | Feature-based modules, BaaS | Web apps, SaaS MVPs | ✅ |
| **Enterprise** | Strict layer separation | High-traffic systems | |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 2D 폴백 렌더러 | Canvas 2D / SVG / CSS transform | Canvas 2D | 성능 최적, 관절 회전 표현 용이 |
| 성능 감지 | GPU 벤치마크 / UA 스니핑 / FPS 측정 | GPU 벤치마크 + FPS 하이브리드 | 정확도와 실시간 적응 양립 |
| 상태 관리 | Zustand store / Context / Props | Zustand (perf-store) | 기존 패턴 일관성 |
| 품질 프리셋 저장 | localStorage / 서버 | localStorage | 오프라인에서도 유지 |

### 6.3 구현 파일 구조

```
신규 파일:
├── src/lib/device-detector.ts          — GPU/WebGL 벤치마크 + 등급 판정
├── src/stores/perf-store.ts            — 렌더링 품질 상태 관리
├── src/components/features/mannequin/
│   ├── mannequin-2d.tsx                — 2D Canvas 폴백 뷰어
│   ├── performance-settings.tsx        — 수동 품질 전환 UI
│   └── fps-monitor.tsx                 — FPS 측정 + 자동 다운그레이드
│
수정 파일:
├── src/components/features/mannequin/mannequin-viewer.tsx  — 적응형 렌더링 적용
├── src/app/(main)/mannequin/page.tsx                       — 2D/3D 모드 분기
```

---

## 7. Implementation Plan

### Phase A: 디바이스 감지 + 성능 스토어

| # | 작업 | 파일 | 종류 |
|---|------|------|------|
| A1 | 디바이스 성능 감지 모듈 | `src/lib/device-detector.ts` | 신규 |
| A2 | 렌더링 품질 Zustand 스토어 | `src/stores/perf-store.ts` | 신규 |

**A1 device-detector.ts:**
- `detectDeviceGrade()`: WebGL 렌더러 정보 + 간이 벤치마크 (삼각형 1000개 렌더 시간)
- 결과: `'high' | 'medium' | 'low'`
- High: 데스크탑 전용 GPU, WebGL2 지원, 벤치마크 < 5ms
- Medium: 통합 GPU 또는 고사양 모바일, 벤치마크 5-20ms
- Low: 저사양 모바일/내장 GPU, 벤치마크 > 20ms 또는 WebGL1만 지원
- `getWebGLInfo()`: 렌더러, 벤더, 최대 텍스처 크기, WebGL 버전
- `isMobile()`: 터치 + 화면 크기 기반 모바일 감지

**A2 perf-store.ts:**
- `qualityLevel: 'high' | 'medium' | 'low'` — 자동 감지 또는 수동 선택
- `renderMode: '3d' | '2d'` — Low에서 자동 2D 전환, 수동 오버라이드 가능
- `shadows: boolean` — High만 기본 활성
- `hdri: boolean` — High/Medium만 기본 활성
- `dpr: number` — 디바이스 픽셀 비율 (1.0 ~ 2.0)
- `shadowMapSize: 256 | 512 | 1024` — 품질별 그림자 해상도
- `autoDowngrade: boolean` — FPS 기반 자동 다운그레이드 활성
- `setQuality(level)` / `setRenderMode(mode)` / `toggleAutoDowngrade()`
- localStorage 영속화 (이전 선택 기억)

### Phase B: 3D 뷰어 적응형 렌더링

| # | 작업 | 파일 | 종류 |
|---|------|------|------|
| B1 | FPS 모니터 컴포넌트 | `src/components/features/mannequin/fps-monitor.tsx` | 신규 |
| B2 | mannequin-viewer 적응형 적용 | `src/components/features/mannequin/mannequin-viewer.tsx` | 수정 |

**B1 fps-monitor.tsx:**
- useFrame 훅으로 롤링 FPS 측정 (최근 60프레임)
- 15fps 미만 3초 지속 시 → 자동 다운그레이드 트리거
- 디버그 모드에서 FPS 오버레이 표시 (옵션)

**B2 mannequin-viewer.tsx 수정:**
- Canvas `dpr` prop: `perf-store.dpr` 적용
- Canvas `shadows` prop: `perf-store.shadows` 조건부
- 그림자맵 크기: `perf-store.shadowMapSize`
- HDRI 환경맵: `perf-store.hdri` 조건부
- 관절 스피어 세그먼트: High=16, Medium=8, Low=4
- 히트박스 크기: 모바일이면 3.5배, 데스크탑 2.5배

### Phase C: 2D 폴백 뷰어

| # | 작업 | 파일 | 종류 |
|---|------|------|------|
| C1 | 2D Canvas 마네킹 뷰어 | `src/components/features/mannequin/mannequin-2d.tsx` | 신규 |
| C2 | mannequin/page.tsx 모드 분기 | `src/app/(main)/mannequin/page.tsx` | 수정 |

**C1 mannequin-2d.tsx:**
- HTML5 Canvas 2D API로 관절 기반 스틱맨 렌더링
- 17개 관절 위치를 2D 투영 (정면 뷰 고정)
- 관절 드래그로 회전값 변경 → pose-store 동기화
- 프리셋 포즈 적용 지원
- 터치/마우스 통합 이벤트 처리
- 관절 히트 영역: 20px 반경 (모바일 40px)
- 포즈 벡터 생성: 기존 jointsToVector() 재사용

**C2 page.tsx 수정:**
- `perf-store.renderMode` 기반 3D/2D 컴포넌트 분기
- 2D ↔ 3D 전환 시 포즈 상태 유지 (pose-store 공유)
- 2D 모드에서도 태그 기반 검색 정상 작동

### Phase D: 설정 UI + 통합

| # | 작업 | 파일 | 종류 |
|---|------|------|------|
| D1 | 성능 설정 패널 | `src/components/features/mannequin/performance-settings.tsx` | 신규 |
| D2 | 페이지 통합 + 초기화 로직 | `src/app/(main)/mannequin/page.tsx` | 수정 |

**D1 performance-settings.tsx:**
- 품질 프리셋 선택: High / Medium / Low / Auto
- 렌더 모드 토글: 3D / 2D
- 개별 설정: 그림자 on/off, HDRI on/off, DPR 슬라이더
- 자동 다운그레이드 토글
- 현재 FPS 표시 (3D 모드일 때)
- 자동 감지 결과 표시 ("감지된 등급: Medium")

**D2 page.tsx 통합:**
- 페이지 마운트 시 `detectDeviceGrade()` → perf-store 초기화
- localStorage에서 이전 설정 복원
- 설정 패널을 뷰어 하단 또는 사이드바에 배치

---

## 8. 파일 요약

### 신규 (5개)

| 파일 | 역할 | 예상 LOC |
|------|------|----------|
| `src/lib/device-detector.ts` | GPU/WebGL 벤치마크 + 등급 감지 | ~120 |
| `src/stores/perf-store.ts` | 렌더링 품질 상태 관리 | ~80 |
| `src/components/features/mannequin/fps-monitor.tsx` | FPS 측정 + 자동 다운그레이드 | ~70 |
| `src/components/features/mannequin/mannequin-2d.tsx` | 2D Canvas 폴백 뷰어 | ~350 |
| `src/components/features/mannequin/performance-settings.tsx` | 수동 품질 설정 UI | ~150 |

### 수정 (2개)

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/features/mannequin/mannequin-viewer.tsx` | dpr/shadow/hdri/세그먼트 적응형 |
| `src/app/(main)/mannequin/page.tsx` | 2D/3D 모드 분기 + 성능 감지 초기화 |

### 예상 총 LOC: ~770 (신규) + ~100 (수정)

---

## 9. Next Steps

1. [x] Plan document 작성
2. [ ] Design document 작성 (`/pdca design performance-optimization`)
3. [ ] 구현
4. [ ] Gap 분석 (`/pdca analyze performance-optimization`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-06 | Initial draft — 사용자 리뷰 기반 | Claude |
