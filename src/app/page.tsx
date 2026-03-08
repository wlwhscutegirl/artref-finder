/**
 * ArtRef Finder 랜딩 페이지 (리뉴얼 v2 — 진정성 있는 디자인)
 *
 * 성능 최적화:
 * - 서버 컴포넌트 유지 (인터랙션 없는 정적 페이지)
 * - below-the-fold 섹션은 lazy loading (dynamic import)
 * - 히어로 섹션은 즉시 렌더링 (LCP 최적화)
 *
 * 디자인 철학:
 * - 가짜 소셜 프루프 제거, 솔직한 카피
 * - 과도한 그라디언트/글로우 절제
 * - 문제 중심 헤드라인 + 구체적 기능 설명
 */

import Link from 'next/link';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

/**
 * below-the-fold 섹션 (지연 로딩 대상)
 * 스크롤해야 보이는 콘텐츠를 분리하여 초기 번들 절감
 */
const BelowTheFold = dynamic(() => import('@/components/features/landing/below-the-fold'));

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">

      {/* ====================================================
          1. 내비게이션 바 (above-the-fold)
          ==================================================== */}
      <nav className="fixed top-0 w-full z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* 로고 */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-sm font-bold">
              A
            </div>
            <span className="font-semibold text-lg">ArtRef</span>
          </div>

          {/* 내비 링크 */}
          <div className="hidden md:flex items-center gap-6 text-sm text-neutral-400">
            <a href="#features" className="hover:text-white transition-colors">기능</a>
            <a href="#for-who" className="hover:text-white transition-colors">추천 대상</a>
            <a href="#pricing" className="hover:text-white transition-colors">가격</a>
          </div>

          {/* 인증 버튼 */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm text-neutral-300 hover:text-white transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-500 rounded-lg font-medium transition-colors"
            >
              무료로 시작
            </Link>
          </div>
        </div>
      </nav>

      {/* ====================================================
          2. 히어로 섹션 (above-the-fold — LCP 최적화)
          — 문제 중심 헤드라인, 구체적 기능 설명, 제품 미리보기
          ==================================================== */}
      <section className="relative pt-36 pb-20 px-4 overflow-hidden">

        {/* 배경 글로우 — 절제된 단일 원형 (과도한 글로우 제거) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="w-[500px] h-[500px] rounded-full bg-orange-600/8 blur-[140px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">

          {/* 메인 헤드라인 — 문제 중심, 직관적 */}
          <h1 className="text-5xl sm:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
            <span className="text-white">원하는 포즈를</span>
            <br />
            {/* 강조 — 그라디언트는 핵심 키워드에만 사용 */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
              3초 만에 찾으세요
            </span>
          </h1>

          {/* 서브카피 — 구체적 기능 설명 (What → How) */}
          <p className="text-lg sm:text-xl text-neutral-400 max-w-xl mx-auto mb-12 leading-relaxed">
            3D 마네킹으로 포즈를 잡으면,
            <br className="hidden sm:block" />
            AI가 일치하는 <span className="text-neutral-200 font-medium">실사 레퍼런스</span>를 찾아줍니다.
          </p>

          {/* 듀얼 CTA — Primary는 구체적 행동, Ghost는 데모 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            {/* Primary CTA — 구체적 행동 유도 */}
            <Link
              href="/mannequin"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-base bg-orange-600 hover:bg-orange-500 transition-colors"
            >
              마네킹 움직여보기
            </Link>
            {/* Ghost CTA — 가입 유도 */}
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-base border border-neutral-700 hover:border-neutral-500 hover:bg-neutral-900 transition-all text-neutral-300"
            >
              무료 계정 만들기
            </Link>
          </div>

          {/* 제품 미리보기 영역 — 실제 스크린샷으로 교체 예정 */}
          {/* TODO: 실제 제품 스크린샷 또는 애니메이션 프리뷰 삽입 */}
          <div className="max-w-3xl mx-auto">
            <div
              className="aspect-[16/9] rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center"
              aria-label="제품 미리보기 — 추후 실제 스크린샷으로 교체"
            >
              {/* 플레이스홀더 — 마네킹 + 검색결과 UI 시각화 */}
              <div className="text-center">
                <div className="text-4xl mb-3 opacity-40">🦾</div>
                <p className="text-sm text-neutral-600">3D 마네킹 → 실사 매칭 미리보기</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
          3~7. below-the-fold 섹션 (지연 로딩)
          Suspense로 감싸서 히어로 섹션 렌더링을 차단하지 않음
          ==================================================== */}
      <Suspense fallback={
        <div className="py-20 text-center text-neutral-600 text-sm" aria-hidden="true">
          {/* 스켈레톤 placeholder — below-the-fold 로딩 중 */}
        </div>
      }>
        <BelowTheFold />
      </Suspense>
    </div>
  );
}
