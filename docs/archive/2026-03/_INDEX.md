# Archive Index — 2026-03

## phase3 (Full 3D Pipeline + SaaS)

- **Archived**: 2026-03-06
- **Match Rate**: 97.7%
- **Status**: Completed

| Document | Path |
|----------|------|
| Plan | `phase3/phase3.plan.md` |
| Analysis (Gap) | `phase3/phase3.analysis.md` |
| Report | `phase3/phase3.report.md` |

### Summary
- 카메라 앵글 벡터 매칭 (pitch/yaw/fov 기반)
- 소재/배경 비주얼 필터 카드
- 구독 플랜 게이팅 (free/pro/team)
- 검색 히스토리 + 대시보드
- 마네킹-이미지 매치율 개선 (프리셋 8→16, 유사도 매핑 개선)
- 페르소나 리뷰 Tier 1+2 전체 반영

---

## ai-pose-extraction (AI 포즈 추출)

- **Archived**: 2026-03-06
- **Match Rate**: 97.4%
- **Status**: Completed

| Document | Path |
|----------|------|
| Plan | `ai-pose-extraction/ai-pose-extraction.plan.md` |
| Design | `ai-pose-extraction/ai-pose-extraction.design.md` |
| Analysis (Gap) | `ai-pose-extraction/ai-pose-extraction.analysis.md` |
| Report | `ai-pose-extraction/ai-pose-extraction.report.md` |

### Summary
- MediaPipe Pose WASM 기반 브라우저 내 포즈 추출
- 33→17 관절 매핑 + 좌표계 변환
- Inverse FK: 월드 좌표 → Euler 회전값 역계산
- 이미지 업로드 → 포즈 검색 / 마네킹 적용 파이프라인
- 신뢰도 기반 가중 매칭 (visibility < 0.5 → 무시)
- 플랜별 일일 추출 횟수 제한 (free: 5회, pro/team: 무제한)

---

## lighting-simulation (조명 시뮬레이션)

- **Archived**: 2026-03-06
- **Match Rate**: 96.0%
- **Status**: Completed

| Document | Path |
|----------|------|
| Plan | `lighting-simulation/lighting-simulation.plan.md` |
| Design | `lighting-simulation/lighting-simulation.design.md` |
| Analysis (Gap) | `lighting-simulation/lighting-simulation.analysis.md` |
| Report | `lighting-simulation/lighting-simulation.report.md` |

### Summary
- 멀티 라이트 시스템 (Key/Fill/Back 최대 3개 독립 제어)
- HDRI 환경맵 (5개 프리셋: studio/forest/apartment/sunset/night)
- 조명 유사도 매칭 (azimuth 45% + elevation 40% + intensity 15%)
- 3중 하이브리드 검색 (포즈 50% + 카메라 20% + 조명 30%)
- 확장 조명 프리셋 12개 + 커스텀 저장/불러오기 (localStorage)
- Zustand light-store + 색온도 Tanner Helland 변환

---

## collection-moodboard (컬렉션 무드보드)

- **Archived**: 2026-03-06
- **Match Rate**: 95.2%
- **Status**: Completed

| Document | Path |
|----------|------|
| Plan | `collection-moodboard/collection-moodboard.plan.md` |
| Design | `collection-moodboard/collection-moodboard.design.md` |
| Analysis (Gap) | `collection-moodboard/collection-moodboard.analysis.md` |
| Report | `collection-moodboard/collection-moodboard.report.md` |

---

## dual-mode-sketch-search (듀얼 모드 스케치 검색)

- **Archived**: 2026-03-07
- **Match Rate**: 90.0%
- **Status**: Completed

| Document | Path |
|----------|------|
| Plan | `dual-mode-sketch-search/dual-mode-sketch-search.plan.md` |
| Design | `dual-mode-sketch-search/dual-mode-sketch-search.design.md` |
| Analysis (Gap) | `dual-mode-sketch-search/dual-mode-sketch-search.analysis.md` |
| Report | `dual-mode-sketch-search/dual-mode-sketch-search.report.md` |

---

## image-pipeline (이미지 데이터 파이프라인 + 백엔드 연동 + 안전 필터)

- **Archived**: 2026-03-06
- **Match Rate**: 97.5%
- **Status**: Completed

| Document | Path |
|----------|------|
| Analysis (Gap) | `image-pipeline/image-pipeline.analysis.md` |
| Report | `image-pipeline/image-pipeline.report.md` |

### Summary
- bkend.ai 백엔드 연동 (image-service + useImages 훅 + sample-data 폴백)
- Unsplash API 수집 파이프라인 (rate limit 추적, 120+ 영→한 태그 매핑)
- 관리자 수집 대시보드 + 일괄 포즈 추출 페이지 (MediaPipe WASM)
- EXIF/태그 기반 조명·카메라 벡터 휴리스틱 추론
- nsfwjs 기반 NSFW 감지 + 3단계 안전 필터 (strict/moderate/off)
- 9개 신규 파일, 5개 수정, ~2,055 LOC 추가

---

## performance-optimization (성능 최적화)

- **Archived**: 2026-03-06
- **Match Rate**: 100.0%
- **Status**: Completed

| Document | Path |
|----------|------|
| Plan | `performance-optimization/performance-optimization.plan.md` |
| Analysis (Gap) | `performance-optimization/performance-optimization.analysis.md` |
| Report | `performance-optimization/performance-optimization.report.md` |

### Summary
- GPU/WebGL 벤치마크 기반 3단계 디바이스 등급 감지 (high/medium/low)
- 적응형 렌더링: 그림자/HDRI/DPR/세그먼트 품질별 자동 조절
- 2D Canvas 폴백 뷰어 (저사양/모바일 대응, 17개 관절 드래그)
- FPS 모니터 + 15fps 미만 3초 지속 시 자동 다운그레이드
- 모바일 히트박스 3.5배 확대 (터치 UX 개선)
- localStorage 기반 성능 설정 영속화
- 5개 신규 파일, 2개 수정, ~870 LOC 추가

---

## pricing-tier (요금제 개편 + 중간 플랜 추가)

- **Archived**: 2026-03-06
- **Match Rate**: 100.0%
- **Status**: Completed

| Document | Path |
|----------|------|
| Plan | `pricing-tier/pricing-tier.plan.md` |
| Analysis (Gap) | `pricing-tier/pricing-tier.analysis.md` |
| Report | `pricing-tier/pricing-tier.report.md` |

### Summary
- 무료 플랜 완화 (50→100 검색, 3→5 컬렉션, 5→10 포즈)
- Lite 플랜 신설 (₩4,900/월, 무제한 검색, 고급 필터)
- Student 플랜 신설 (₩2,900/월, Pro급 혜택, 학생 인증)
- 연간 결제 20% 할인 토글 UI
- 5열 비교 Pricing 페이지 + 모바일 수평 스크롤
- 업그레이드 배너 다단계 분기 (Free→Lite/Pro, Lite→Pro)
- 0개 신규 파일, 5개 수정

---

## tablet-touch-ux (태블릿 터치 UX 개선)

- **Archived**: 2026-03-06
- **Match Rate**: 100.0%
- **Status**: Completed

| Document | Path |
|----------|------|
| Plan | `tablet-touch-ux/tablet-touch-ux.plan.md` |
| Analysis (Gap) | `tablet-touch-ux/tablet-touch-ux.analysis.md` |
| Report | `tablet-touch-ux/tablet-touch-ux.report.md` |

### Summary
- isTablet() 감지 함수 추가 (768px~1366px + 터치 + iPadOS UA 판별)
- 태블릿 히트박스 3.5배 적용 (모바일과 동일, 기존 2.5배에서 상향)
- Canvas touch-action: none으로 브라우저 기본 제스처 충돌 방지
- 관절 터치 피드백: 탭 시 25% 스케일 펄스 애니메이션 (useFrame lerp)
- 터치 기기 전용 힌트 텍스트 분기
- 0개 신규 파일, 5개 수정, ~50 LOC 추가
