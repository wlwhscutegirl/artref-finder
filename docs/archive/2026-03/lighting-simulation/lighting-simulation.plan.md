# 조명 시뮬레이션 (lighting-simulation) Plan

## 1. 개요

3D 뷰어의 조명 시스템을 **멀티 라이트 + HDRI 환경맵** 기반으로 고도화하고,
조명 프리셋 저장/불러오기, 이미지 조명 매칭 검색을 구현한다.

### 핵심 가치
- 현재 단일 Directional Light → **최대 3개 광원 + 환경맵**으로 사실적 조명
- 클래식 조명 프리셋(렘브란트, 루프 등) 외에 **사용자 커스텀 조명 셋업 저장**
- 이미지의 조명 방향을 분석하여 **조명 유사도 기반 검색** 활성화
- 기존 `light-analyzer.ts` (미사용 코드) 활용하여 이미지 조명 자동 추출

## 2. 현재 상태 (As-Is)

| 항목 | 상태 |
|------|------|
| 3D 조명 | Ambient(0.2) + Directional(1개), 그림자 지원 |
| 조명 컨트롤러 | 3슬라이더 (azimuth, elevation, intensity) |
| LightDirection 타입 | azimuth(0~360), elevation(-90~90), intensity(0~1) |
| 조명 프리셋 | 4개 클래식 (Rembrandt, Loop, Butterfly, Split) |
| 조명 태그 | 11개 (정면광, 역광, 측광, 탑라이트, 림라이트 등) |
| lightToTags 매핑 | 자동 적용 (500ms debounce) |
| 조명 필터 UI | 완성 (UI만, 필터링 로직 미구현) |
| light-analyzer.ts | 구현 완료 (3×3 그리드 휘도 분석, 미사용) |
| 이미지 조명 데이터 | 없음 (샘플 이미지에 lightDirection 미할당) |
| HDRI 환경맵 | 없음 |

## 3. 목표 상태 (To-Be)

### 3-1. 멀티 라이트 시스템
- 기존 단일 Directional Light → **최대 3개 라이트** 동시 사용
- 각 라이트 독립 제어: azimuth, elevation, intensity, color
- 키라이트/필라이트/백라이트 역할 시각적 표시
- 라이트 색온도 슬라이더 (2700K 웜 ~ 6500K 쿨)

### 3-2. HDRI 환경맵
- 3~5개 내장 HDRI 프리셋 (스튜디오, 야외, 실내, 골든아워, 블루아워)
- 환경맵 회전(azimuth) 조절
- 환경맵 강도(exposure) 조절
- IBL(Image-Based Lighting) → 마네킹에 반사/환경광 반영

### 3-3. 조명 프리셋 확장 + 커스텀 저장
- 기존 4개 클래식 프리셋 유지
- 6~8개 추가 프리셋 (시네마틱, 드라마틱, 하이키, 로키, 스플릿+필 등)
- 사용자 커스텀 조명 저장/불러오기 (localStorage)
- 프리셋 카드에 미니 썸네일 (조명 방향 아이콘)

### 3-4. 이미지 조명 매칭 검색
- 기존 `light-analyzer.ts`의 `analyzeLightFromImage()` 활용
- 샘플 561장에 합성 조명 데이터(LightDirection) 할당 (태그 기반)
- 3D 뷰어 조명 상태 → 이미지 조명 유사도 계산
- 포즈+카메라+조명 3중 유사도 합산 (포즈 50%, 카메라 20%, 조명 30%)

### 3-5. 조명 필터 활성화
- 기존 조명 필터 UI (미구현 상태) → 실제 필터링 로직 연결
- 조명 방향 기반 이미지 필터 (현재 뷰어 조명과 유사한 이미지 상위 표시)

## 4. 기능 요구사항

### FR-01: 멀티 라이트 컨트롤러
- 최대 3개 라이트 추가/제거 버튼
- 각 라이트별 독립 슬라이더 (azimuth, elevation, intensity, color)
- 라이트 역할 라벨 (Key/Fill/Back)
- 전체 라이트 On/Off 토글

### FR-02: HDRI 환경맵
- 내장 5개 HDRI 프리셋 선택 UI
- 환경맵 azimuth 회전 슬라이더
- 환경맵 exposure 강도 슬라이더
- 환경맵 ON/OFF 토글

### FR-03: 조명 프리셋 확장
- 10~12개 기본 프리셋 카드
- "현재 조명 저장" 버튼 → localStorage
- 저장된 커스텀 조명 목록 + 삭제
- 프리셋 적용 시 멀티 라이트 + HDRI 일괄 설정

### FR-04: 이미지 조명 데이터 생성
- 561개 샘플 이미지에 LightDirection 합성 데이터 할당
- 조명 태그(정면광, 역광 등) → LightDirection 매핑 테이블
- 이미지 조명 유사도 계산 함수

### FR-05: 하이브리드 검색 확장
- usePoseSearch 훅에 조명 유사도 가중치 추가
- combinedScore = poseSim * 0.5 + cameraSim * 0.2 + lightSim * 0.3
- 조명만 활성 시 조명 유사도만 사용

### FR-06: 조명 필터 활성화
- 기존 조명 필터 UI → 실제 동작 연결
- 조명 방향 기반 필터링 (뷰어 조명 ↔ 이미지 조명 비교)

## 5. 비기능 요구사항

| 항목 | 기준 |
|------|------|
| 성능 | HDRI 로드 < 2초, 멀티라이트 렌더링 60fps |
| 번들 크기 | HDRI 파일 각 < 500KB (압축 HDR) |
| 접근성 | 슬라이더 키보드 조작 지원 |
| 호환성 | WebGL2 필수 (Three.js 기본) |
| 저장소 | 커스텀 프리셋 localStorage (최대 20개) |

## 6. 구현 순서 (제안)

| Step | 내용 | 난이도 |
|:----:|------|:------:|
| 1 | 이미지 조명 데이터 생성 (light-vectors.ts) | 중 |
| 2 | 조명 유사도 계산 함수 (light-matching.ts) | 중 |
| 3 | usePoseSearch 조명 유사도 합산 | 중 |
| 4 | 멀티 라이트 스토어 (light-store.ts) | 중 |
| 5 | 멀티 라이트 컨트롤러 UI | 상 |
| 6 | mannequin-viewer 멀티 라이트 적용 | 상 |
| 7 | HDRI 환경맵 통합 | 상 |
| 8 | 조명 프리셋 확장 + 커스텀 저장 | 중 |
| 9 | 조명 필터 활성화 | 중 |
| 10 | search/page.tsx 통합 | 중 |

## 7. 범위 밖 (Out of Scope)

- 실시간 레이트레이싱 (WebGPU 기반)
- 커스텀 HDRI 업로드
- 조명 애니메이션/트랜지션
- 서버 사이드 조명 분석 (현재 클라이언트 only)

## 8. 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|-----------|
| HDRI 파일 크기 | 번들 비대화 | 저해상도 HDR + CDN lazy load |
| 멀티 라이트 성능 | 모바일 프레임 저하 | 모바일에서 최대 2개 제한 |
| 조명 매칭 정확도 | 합성 데이터 한계 | 태그 기반 매핑 + 노이즈로 다양화 |

## 9. 관련 파일

### 기존 파일 (수정 대상)
- `src/components/features/mannequin/mannequin-viewer.tsx` — 멀티 라이트 적용
- `src/components/features/mannequin/light-controller.tsx` — 멀티 라이트 UI
- `src/hooks/usePoseSearch.ts` — 조명 유사도 합산
- `src/lib/pose-presets.ts` — 조명 프리셋 확장
- `src/app/(main)/search/page.tsx` — 조명 매칭 통합
- `src/components/features/search/search-filters.tsx` — 조명 필터 활성화

### 신규 파일 (생성 대상)
- `src/lib/light-vectors.ts` — 이미지 조명 합성 데이터
- `src/lib/light-matching.ts` — 조명 유사도 계산
- `src/stores/light-store.ts` — 멀티 라이트 상태 관리
- `src/lib/lighting-presets.ts` — 확장 프리셋 + 커스텀 저장
- `src/components/features/mannequin/multi-light-controller.tsx` — 멀티 라이트 UI
- `src/components/features/mannequin/hdri-selector.tsx` — HDRI 환경맵 선택
