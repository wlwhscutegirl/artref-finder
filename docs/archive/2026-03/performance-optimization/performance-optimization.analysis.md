# performance-optimization Gap Analysis

> **Summary**: 모바일/저사양 기기 성능 최적화 피처의 Plan vs Implementation 비교 분석
>
> **Date**: 2026-03-06
> **Match Rate**: 100.0%
> **Status**: PASS (>= 70%)
> **Previous Match Rate**: 88.1% (v1.0)

---

## Summary

performance-optimization 피처는 8개 기능 요구사항(FR-01~FR-08) 모두 완전 구현(FULL)되었다.
v1.0 분석에서 4건의 PARTIAL 항목(FR-05, FR-06, FR-07, FR-08)이 발견되었으며,
모두 수정 완료되어 매치율이 88.1%에서 100.0%로 상승하였다.

### 수정 이력 (v1.0 -> v2.0)

| Gap | 이전 상태 | 수정 내용 | 검증 결과 |
|-----|----------|----------|----------|
| FR-05 "Auto" 버튼 누락 | PARTIAL 80% | `performance-settings.tsx:62-76` "자동" 버튼 추가, `detectedGrade`로 복원 | FULL 100% |
| FR-06 debug prop 미사용 | PARTIAL 85% | `fps-monitor.tsx` 인터페이스에서 `debug` prop 제거, 순수 로직 컴포넌트로 정리 | FULL 100% |
| FR-07 3D 히트박스 데드코드 | PARTIAL 60% | `mannequin-model.tsx`에 `hitboxScale` prop 추가, `JointSphere`에 `hitboxMultiplier`로 전달. `mannequin-viewer.tsx`에서 모바일 3.5x/데스크탑 2.5x 전달 | FULL 100% |
| FR-08 모바일 Medium DPR 1.5 | PARTIAL 80% | `device-detector.ts:224-226` 모바일 DPR 1.0 무조건 고정 (등급 무관) | FULL 100% |

### 파일 분석 범위

| 구분 | 파일 | 상태 |
|------|------|------|
| 신규 | `src/lib/device-detector.ts` (243줄) | 구현 완료 |
| 신규 | `src/stores/perf-store.ts` (231줄) | 구현 완료 |
| 신규 | `src/components/features/mannequin/fps-monitor.tsx` (94줄) | 구현 완료 |
| 신규 | `src/components/features/mannequin/mannequin-2d.tsx` (333줄) | 구현 완료 |
| 신규 | `src/components/features/mannequin/performance-settings.tsx` (192줄) | 구현 완료 |
| 수정 | `src/components/features/mannequin/mannequin-model.tsx` (354줄) | hitboxScale prop 추가 |
| 수정 | `src/components/features/mannequin/mannequin-viewer.tsx` (281줄) | 적응형 렌더링 + hitboxScale 전달 |
| 수정 | `src/app/(main)/mannequin/page.tsx` (917줄) | 2D/3D 분기 + 성능 감지 초기화 |

---

## Detailed Analysis

| ID | Requirement | Status | Score | Evidence | Notes |
|----|-------------|--------|:-----:|----------|-------|
| FR-01 | WebGL 능력 + GPU 벤치마크 기반 디바이스 등급 자동 감지 | FULL | 100% | `device-detector.ts:187-242` | `detectDeviceGrade()` 구현 완벽. GPU 벤치마크(1000 삼각형), WebGL 정보, 모바일 감지, 저사양 GPU 키워드 매칭. 임계값 High<5ms, Medium 5-20ms, Low>20ms 플랜과 일치 |
| FR-02 | 3단계 적응형 렌더링 프리셋 (High/Medium/Low) | FULL | 100% | `perf-store.ts:29-54`, `mannequin-viewer.tsx:157-161,178-182` | `QUALITY_PRESETS` 정의 + Canvas에 `dpr`, `shadows`, `shadowMapSize` 적용. 세그먼트 수(16/8/4)도 포함 |
| FR-03 | Low 등급에서 2D Canvas 폴백 모드 자동 전환 | FULL | 100% | `perf-store.ts:154`, `mannequin/page.tsx:471-483` | `setQuality('low')` 시 `renderMode: '2d'` 자동 설정. page.tsx에서 renderMode 기반 3D/2D 컴포넌트 분기 |
| FR-04 | 2D 모드에서 17개 관절 드래그 조작 + 포즈 검색 연동 | FULL | 100% | `mannequin-2d.tsx:27-49,252-296` | 17개 관절 정의(JOINT_LAYOUT), 포인터 드래그로 회전값 변경, pose-store 동기화, 기존 검색 파이프라인 재사용 |
| FR-05 | 수동 품질 전환 UI (Auto + High/Medium/Low 4가지) | FULL | 100% | `performance-settings.tsx:62-95` | **[v2.0 수정됨]** "자동" 버튼 추가 (`line 64-76`). 클릭 시 `setQuality(detectedGrade)` 호출하여 감지된 등급으로 복원. `detectedGrade`와 `qualityLevel` 일치 시 보라색 하이라이트. 개별 설정(그림자, HDRI, DPR 슬라이더, 자동 다운그레이드 토글)도 모두 구현 |
| FR-06 | FPS 모니터 + 자동 다운그레이드 (15fps 미만 시) | FULL | 100% | `fps-monitor.tsx:20-93` | **[v2.0 수정됨]** 미사용 `debug` prop 제거. `FpsMonitorProps`에 `onFpsUpdate`만 정의. useFrame 기반 롤링 60프레임 FPS 측정, 15fps 미만 3초 지속 시 다운그레이드 트리거. `onFpsUpdate` 콜백으로 외부 UI(`performance-settings.tsx`)에 FPS 수치 전달 구현 |
| FR-07 | 모바일 터치 관절 히트박스 확대 (3D: 3.5x/2.5x, 2D: 2x) | FULL | 100% | `mannequin-viewer.tsx:173,206`, `mannequin-model.tsx:76-83,118-121,203+` | **[v2.0 수정됨]** (1) `MannequinProps`에 `hitboxScale?: number` 추가. (2) `Mannequin` 컴포넌트가 `hitboxScale` 수신하여 모든 `JointSphere`에 `hitboxMultiplier={hitboxScale}` 전달 (17개 관절 모두). (3) `JointSphere`의 투명 히트박스 반경: `radius * hitboxMultiplier`. (4) `mannequin-viewer.tsx`에서 `perfIsMobile ? 3.5 : 2.5` 계산 후 `<Mannequin hitboxScale={hitboxScale}>` 전달. (5) 2D 모드: 히트 검출 영역 40px/20px = 2x 유지 |
| FR-08 | DPR 적응형 제어 (모바일: 1.0 고정) | FULL | 100% | `device-detector.ts:221-226` | **[v2.0 수정됨]** `if (mobile) { recommendedDpr = 1; }` -- 모바일은 등급 무관하게 DPR 1.0 고정. 데스크탑: High=min(dpr,2), Medium=min(dpr,1.5), Low=1.0 |

---

## Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 100.0% | PASS |
| Architecture Compliance | 95% | PASS |
| Convention Compliance | 98% | PASS |
| **Overall** | **100.0%** | **PASS** |

### Architecture Notes
- Zustand 스토어 패턴 일관: `perf-store.ts` 기존 `pose-store.ts`, `light-store.ts`와 동일 구조
- Dynamic 레벨 폴더 구조 준수: `lib/`, `stores/`, `components/features/mannequin/`
- localStorage 영속화 패턴 적절
- `@/` 절대 경로 임포트 일관 사용
- `hitboxScale` prop 체인이 깔끔하게 `MannequinViewer -> Mannequin -> JointSphere` 단방향 전달

### Convention Notes
- 한글 주석 모든 파일에 적용
- PascalCase 컴포넌트 (`FpsMonitor`, `Mannequin2D`, `PerformanceSettings`)
- camelCase 함수 (`detectDeviceGrade`, `runGpuBenchmark`)
- kebab-case 파일명 (`device-detector.ts`, `perf-store.ts`, `fps-monitor.tsx`)

---

## Gaps Found

### PARTIAL / MISSING Items: 0건

모든 FR-01~FR-08이 FULL 구현 완료.

---

## Added Features (Plan X, Implementation O)

| Item | Location | Description |
|------|----------|-------------|
| 캡슐 세그먼트 | `perf-store.ts:25-26` | `capsuleSegments` 프리셋 추가 (플랜에서 관절 스피어 세그먼트만 명시, 캡슐은 미언급) |
| 저사양 GPU 키워드 감지 | `device-detector.ts:169-181` | `isLowEndGpu()` -- Intel HD/UHD, Mali, Adreno, PowerVR, SwiftShader 등 패턴 매칭. 플랜에서 별도 언급 없으나 등급 판정 정확도 향상 |
| 다운그레이드 연쇄 방지 | `fps-monitor.tsx:47-49` | 최소 10초 간격 다운그레이드 제한. 플랜에서 미언급이나 UX 안정성 기여 |
| 설정 패널 접기/펼치기 | `mannequin/page.tsx:528-545` | 성능 설정 패널 토글 UI (기본 접힘). 플랜에서 "하단 또는 사이드바에 배치"만 명시 |

---

## Recommendations

모든 Gap이 해결되어 즉시 수정 사항 없음.

### 향후 개선 고려사항 (Optional)

1. **2D 시각적 반경**: `mannequin-2d.tsx:186`의 모바일 배율이 1.5x로 유지됨. 히트 검출 영역(40px vs 20px = 2x)과 시각적 반경(1.5x)의 불일치는 경미하나, 통일하려면 `isMobile ? 2 : 1`로 변경 가능
2. **Canvas 내부 FPS 오버레이**: `debug` prop은 제거했으나, 향후 개발자 도구로 Canvas 내부 HUD 표시가 필요하면 drei `Html` 컴포넌트로 구현 가능

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-06 | Initial gap analysis (88.1%, 4 PARTIAL) | Claude (gap-detector) |
| 2.0 | 2026-03-06 | Re-analysis after fixes (100.0%, 0 gaps) -- FR-05/06/07/08 all resolved | Claude (gap-detector) |
