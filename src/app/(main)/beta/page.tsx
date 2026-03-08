'use client';

/**
 * 베타 테스터 모집 페이지
 *
 * 구성:
 * 1. 히어로 섹션 — 모집 안내 타이틀 + 서브텍스트
 * 2. 혜택 섹션 — 베타 테스터 혜택 3가지
 * 3. 가입 폼 — 이름, 이메일, 직업, 한줄 소개
 * 4. 제출 → bkend.ai beta_signups 테이블에 저장
 */

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { bkend } from '@/lib/bkend';

/** 베타 신청 데이터 타입 */
interface BetaSignupData {
  name: string;
  email: string;
  occupation: string;
  introduction: string;
}

/** 직업 선택지 목록 */
const OCCUPATION_OPTIONS = [
  { value: '', label: '직업을 선택해주세요' },
  { value: 'webtoon', label: '웹툰 작가' },
  { value: 'illustrator', label: '일러스트레이터' },
  { value: 'other', label: '기타' },
] as const;

/** 베타 테스터 혜택 목록 */
const BENEFITS = [
  {
    icon: '🎁',
    title: 'Pro 플랜 3개월 무료',
    description:
      '베타 테스터에게 Pro 플랜의 모든 기능을 3개월간 무료로 제공합니다. 무제한 검색, 컬렉션, 포즈 프리셋을 마음껏 사용하세요.',
    color: 'orange',
  },
  {
    icon: '💬',
    title: '피드백 반영 우선순위',
    description:
      '베타 테스터의 피드백은 최우선으로 검토하여 제품에 반영합니다. 여러분이 원하는 기능을 직접 만들어갑니다.',
    color: 'amber',
  },
  {
    icon: '💰',
    title: '얼리버드 할인',
    description:
      '정식 출시 후 Pro 플랜 구독 시 영구 30% 할인 혜택을 드립니다. 베타 테스터만의 특별한 가격입니다.',
    color: 'pink',
  },
] as const;

/** 혜택 카드별 컬러 매핑 (Tailwind 동적 클래스 방지용) */
const BENEFIT_STYLES: Record<string, { iconBg: string; hoverBorder: string; titleHover: string }> = {
  orange: {
    iconBg: 'bg-orange-500/10',
    hoverBorder: 'hover:border-orange-500/40',
    titleHover: 'group-hover:text-orange-300',
  },
  amber: {
    iconBg: 'bg-amber-500/10',
    hoverBorder: 'hover:border-amber-500/40',
    titleHover: 'group-hover:text-amber-300',
  },
  pink: {
    iconBg: 'bg-pink-500/10',
    hoverBorder: 'hover:border-pink-500/40',
    titleHover: 'group-hover:text-pink-300',
  },
};

export default function BetaPage() {
  // --- 폼 상태 관리 ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [occupation, setOccupation] = useState('');
  const [introduction, setIntroduction] = useState('');

  // --- 제출 상태 ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  /** 폼 제출 핸들러 — beta_signups 테이블에 데이터 저장 */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      // bkend.ai data API로 beta_signups 테이블에 레코드 생성
      await bkend.data.create<BetaSignupData>('beta_signups', {
        name,
        email,
        occupation,
        introduction,
      });

      // 성공 시 완료 상태로 전환
      setIsSuccess(true);
    } catch (err) {
      // 에러 발생 시 사용자에게 안내
      const message =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">

      {/* ====================================================
          내비게이션 바 (랜딩페이지와 동일한 스타일)
          ==================================================== */}
      <nav className="fixed top-0 w-full z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* 로고 — 홈으로 이동 */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-sm font-bold">
              A
            </div>
            <span className="font-semibold text-lg">ArtRef</span>
          </Link>

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
          1. 히어로 섹션 — 모집 안내
          ==================================================== */}
      <section className="relative pt-36 pb-16 px-4 overflow-hidden">

        {/* 배경 글로우 효과 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[120px]" />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-20 right-1/4 w-[250px] h-[250px] rounded-full bg-amber-600/8 blur-[100px]"
        />

        <div className="relative max-w-3xl mx-auto text-center">
          {/* 베타 배지 */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" aria-hidden="true" />
            Beta Tester Recruitment
          </div>

          {/* 메인 헤드라인 */}
          <h1 className="text-4xl sm:text-6xl font-bold leading-tight tracking-tight mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-pink-400">
              ArtRef 베타 테스터를
            </span>
            <br />
            <span className="text-white">모집합니다</span>
          </h1>

          {/* 서브 카피 */}
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            AI 기반 실사 레퍼런스 검색 엔진의 첫 번째 사용자가 되어주세요.
            <br className="hidden sm:block" />
            여러분의 피드백으로 <span className="text-neutral-200 font-medium">더 나은 도구</span>를 함께 만들어갑니다.
          </p>
        </div>
      </section>

      {/* ====================================================
          2. 혜택 섹션 — 베타 테스터 혜택 3가지
          ==================================================== */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">

          {/* 섹션 헤더 */}
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">베타 테스터 혜택</h2>
            <p className="text-neutral-400 text-sm">참여해주시는 분들께 특별한 혜택을 드립니다</p>
          </div>

          {/* 혜택 카드 3개 그리드 */}
          <div className="grid sm:grid-cols-3 gap-5">
            {BENEFITS.map((benefit) => {
              const style = BENEFIT_STYLES[benefit.color];
              return (
                <div
                  key={benefit.title}
                  className={`group p-6 rounded-2xl bg-neutral-900 border border-neutral-800 ${style.hoverBorder} transition-all`}
                >
                  {/* 아이콘 */}
                  <div className={`w-12 h-12 rounded-xl ${style.iconBg} flex items-center justify-center text-2xl mb-4`}>
                    {benefit.icon}
                  </div>
                  {/* 혜택 제목 */}
                  <h3 className={`text-lg font-semibold mb-2 ${style.titleHover} transition-colors`}>
                    {benefit.title}
                  </h3>
                  {/* 혜택 설명 */}
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================
          3. 가입 폼 섹션
          ==================================================== */}
      <section className="py-16 px-4 border-t border-neutral-800">
        <div className="max-w-lg mx-auto">

          {/* 섹션 헤더 */}
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-3">베타 테스터 신청</h2>
            <p className="text-neutral-400 text-sm">아래 양식을 작성하여 베타 프로그램에 참여하세요</p>
          </div>

          {/* 성공 메시지 — 제출 완료 시 폼 대신 표시 */}
          {isSuccess ? (
            <div className="rounded-2xl bg-neutral-900 border border-emerald-500/30 p-10 text-center">
              {/* 완료 아이콘 */}
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-3xl mx-auto mb-5">
                ✓
              </div>
              <h3 className="text-xl font-bold text-emerald-400 mb-3">
                신청이 완료되었습니다!
              </h3>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                베타 테스트 준비가 되면 입력하신 이메일로 안내드리겠습니다.
                <br />
                관심을 가져주셔서 감사합니다.
              </p>
              {/* 홈으로 돌아가기 */}
              <Link
                href="/"
                className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              >
                홈으로 돌아가기
              </Link>
            </div>
          ) : (
            /* 가입 폼 */
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl bg-neutral-900 border border-neutral-800 p-8 space-y-5"
            >
              {/* 이름 입력 */}
              <div>
                <label htmlFor="beta-name" className="block text-sm font-medium text-neutral-300 mb-1.5">
                  이름 <span className="text-red-400">*</span>
                </label>
                <input
                  id="beta-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-3 py-2 rounded-lg text-sm bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors duration-150"
                />
              </div>

              {/* 이메일 입력 */}
              <div>
                <label htmlFor="beta-email" className="block text-sm font-medium text-neutral-300 mb-1.5">
                  이메일 <span className="text-red-400">*</span>
                </label>
                <input
                  id="beta-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="artist@example.com"
                  className="w-full px-3 py-2 rounded-lg text-sm bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors duration-150"
                />
              </div>

              {/* 직업 선택 */}
              <div>
                <label htmlFor="beta-occupation" className="block text-sm font-medium text-neutral-300 mb-1.5">
                  직업 <span className="text-red-400">*</span>
                </label>
                <select
                  id="beta-occupation"
                  required
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-neutral-900 border border-neutral-700 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors duration-150"
                >
                  {OCCUPATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 한줄 소개 */}
              <div>
                <label htmlFor="beta-intro" className="block text-sm font-medium text-neutral-300 mb-1.5">
                  한줄 소개
                </label>
                <textarea
                  id="beta-intro"
                  rows={3}
                  value={introduction}
                  onChange={(e) => setIntroduction(e.target.value)}
                  placeholder="어떤 작업을 주로 하시나요? ArtRef에 기대하는 점이 있다면 알려주세요."
                  className="w-full px-3 py-2 rounded-lg text-sm bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors duration-150 resize-none"
                />
              </div>

              {/* 에러 메시지 */}
              {errorMessage && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                  {errorMessage}
                </div>
              )}

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-semibold text-base bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '신청 중...' : '베타 테스터 신청하기'}
              </button>

              {/* 안내 문구 */}
              <p className="text-center text-xs text-neutral-600">
                입력하신 정보는 베타 프로그램 운영 목적으로만 사용됩니다.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ====================================================
          푸터 (랜딩페이지와 동일한 스타일)
          ==================================================== */}
      <footer className="py-10 px-4 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
          {/* 브랜드 */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-[10px] font-bold text-white">
              A
            </div>
            <span className="font-medium text-neutral-400">ArtRef Finder</span>
          </div>

          {/* 슬로건 */}
          <span className="hidden sm:block">Built for artists, by artists</span>

          {/* 링크 */}
          <div className="flex items-center gap-4 text-xs">
            <Link href="/pricing" className="hover:text-neutral-300 transition-colors">가격</Link>
            <a href="mailto:support@artref.app" className="hover:text-neutral-300 transition-colors">문의</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
