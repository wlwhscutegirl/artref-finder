# Plan: tablet-touch-ux

## Overview
태블릿 터치 UX 개선 — 20 페르소나 유저 리뷰 High #5
태블릿 사용자(~20%)의 관절 터치 정확도 + 핀치 줌 제스처 개선

## Problem
- `isMobile()` 함수가 768px 이상 태블릿을 데스크탑으로 분류
- 태블릿에서 히트박스 2.5x (모바일 3.5x 대비 작음) → 터치 정확도 저하
- 터치 피드백(시각적 응답) 부재
- `touch-action` CSS 미설정 → 브라우저 기본 제스처와 충돌 가능

## Requirements (FR)
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-01 | `isTablet()` 감지 함수 추가 | 필수 |
| FR-02 | 태블릿 히트박스 3.5x 적용 (모바일과 동일) | 필수 |
| FR-03 | Canvas에 touch-action: none CSS 적용 | 필수 |
| FR-04 | 관절 터치 시 시각적 피드백 (스케일 애니메이션) | 필수 |
| FR-05 | 태블릿용 터치 힌트 텍스트 개선 | 선택 |

## Implementation Plan

### 1. device-detector.ts 수정
- `isTablet()` 함수 추가: 터치 지원 + 768px~1024px
- `isTouchDevice()` 함수 추가: 터치 지원 여부만 판별
- perf-store에 `isTablet` 상태 추가

### 2. mannequin-viewer.tsx 수정
- hitboxScale: `perfIsMobile || perfIsTablet ? 3.5 : 2.5`
- Canvas에 `touch-action: 'none'` 스타일 적용
- 터치 힌트 텍스트 태블릿 분기

### 3. mannequin-model.tsx 수정
- JointSphere에 터치 피드백 애니메이션 (onPointerDown 스케일 업)
- useSpring 또는 간단한 state 기반 스케일 변경

### 4. perf-store.ts 수정
- `isTablet` 상태 필드 추가
- `initFromDetection`에 isTablet 파라미터 추가

## Files to Modify
| 파일 | 변경 |
|------|------|
| `src/lib/device-detector.ts` | isTablet(), isTouchDevice() 추가 |
| `src/stores/perf-store.ts` | isTablet 상태 추가 |
| `src/components/features/mannequin/mannequin-viewer.tsx` | 히트박스/touch-action/힌트 |
| `src/components/features/mannequin/mannequin-model.tsx` | 터치 피드백 |
| `src/app/(main)/mannequin/page.tsx` | isTablet 초기화 |

## Acceptance Criteria
- 태블릿에서 히트박스 3.5x 적용 확인
- Canvas 터치 시 브라우저 스크롤/줌 차단
- 관절 터치 시 시각적 피드백 표시
- 기존 데스크탑/모바일 동작 변경 없음
- `npx tsc --noEmit` 에러 0건
