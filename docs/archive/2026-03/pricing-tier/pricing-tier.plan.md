# Plan: pricing-tier (요금제 개편 + 중간 플랜 추가)

## 배경

20명 페르소나 유저 리뷰 Critical #3: 무료 플랜 검색 제한이 너무 빡빡하다 (~60% 사용자 영향).
- 무료 50회/일 → 탐색 단계에서 금방 소진
- Free↔Pro 사이 가격 점프가 큼 (₩0 → ₩9,900)
- 학생/취미 작가 대상 중간 가격대 부재

## 목표

1. 무료 플랜 제한 완화 → 사용자 이탈 방지
2. Lite 플랜 신설 → Free↔Pro 가격 갭 해소
3. 연간 결제 할인 → 장기 구독 유도
4. 학생 플랜 → 교육 시장 확대

## 기능 요구사항 (FR)

### FR-01: 무료 플랜 제한 완화
- 일일 검색: 50 → 100회
- 컬렉션: 3 → 5개
- 저장 포즈: 5 → 10개
- 히스토리: 20 → 30개

### FR-02: Lite 플랜 신설
- 가격: ₩4,900/월
- 일일 검색: 무제한
- 컬렉션: 20개
- 저장 포즈: 50개
- 고급 필터: O (카메라 벡터 매칭)
- AI 포즈 추출: 15회/일
- 배치: 3장
- 히스토리: 50개
- 팀 공유: X

### FR-03: 학생 플랜 신설
- 가격: ₩2,900/월 (학생 인증 필요)
- Pro와 동일한 기능 제공 (무제한 검색, 고급 필터 등)
- 단, 팀 공유 X, 배치 3장
- User 타입에 `studentVerified` 필드 추가

### FR-04: 연간 결제 할인
- 월간/연간 토글 UI (pricing 페이지)
- 연간: 20% 할인 적용
  - Lite: ₩4,900 → ₩3,920/월 (₩47,040/년)
  - Pro: ₩9,900 → ₩7,920/월 (₩95,040/년)
  - Student: ₩2,900 → ₩2,320/월 (₩27,840/년)
  - Team: ₩29,900 → ₩23,920/월 (₩287,040/년)

### FR-05: User 타입 확장
- `plan` 타입: `'free' | 'lite' | 'student' | 'pro' | 'team'`
- `studentVerified?: boolean` 필드 추가
- `billingCycle?: 'monthly' | 'annual'` 필드 추가

### FR-06: 업그레이드 배너 다단계 분기
- Free → Lite/Pro 추천
- Lite → Pro 추천
- 차단 메시지에 Lite 플랜 언급 추가

### FR-07: Pricing 페이지 5열 확장
- Free / Lite / Student / Pro / Team 5열 비교
- 월간/연간 토글 스위치
- 현재 플랜 하이라이트
- 모바일: 수평 스크롤 or 아코디언

## 파일 변경 계획

### 수정 (5개)
| 파일 | 변경 |
|------|------|
| `src/types/index.ts` | User.plan 타입 확장 + studentVerified, billingCycle 필드 |
| `src/lib/plan-limits.ts` | lite, student 플랜 설정 추가 + free 제한 완화 |
| `src/hooks/usePlanLimits.ts` | plan 타입 확장 반영 |
| `src/app/(main)/pricing/page.tsx` | 5열 비교 + 연간 토글 + 모바일 대응 |
| `src/components/features/plan/upgrade-banner.tsx` | 다단계 분기 (Lite 추천 포함) |

### 신규 (0개)
기존 파일 수정만으로 충분.

## 검증 기준

1. `npx tsc --noEmit` 에러 0건
2. `npm run build` 성공
3. Free 플랜: 100회 검색 제한 확인
4. Lite/Student 플랜 PLAN_CONFIGS에 존재
5. Pricing 페이지 5열 렌더링 + 월간/연간 토글 작동
6. 업그레이드 배너에서 Lite 플랜 언급 확인
7. User 타입에 'lite' | 'student' 포함
