'use client';

// ============================================
// 신규 유저 환영 온보딩 모달
// 회원가입 직후 1회 표시되는 3단계 안내 모달
//
// Step 1: 환영 + 역할 선택 (멀티 선택)
// Step 2: 핵심 기능 소개 (3개 카드)
// Step 3: 시작하기 CTA
//
// localStorage 키: artref_onboarding_done
// ============================================

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogoIcon } from '@/components/ui/logo';
import { STORAGE_KEYS } from '@/lib/constants';

// ============================================
// 상수 정의
// ============================================

/** localStorage 완료 플래그 키 (중앙 상수 참조) */
const STORAGE_KEY = STORAGE_KEYS.ONBOARDING_DONE;

/** 선택 가능한 사용자 역할 목록 */
const ROLES = [
  { id: 'webtoon', label: '웹툰 작가' },
  { id: 'illustrator', label: '일러스트레이터' },
  { id: 'concept', label: '컨셉 아티스트' },
  { id: 'student', label: '학생' },
  { id: 'hobby', label: '취미 작가' },
] as const;

type RoleId = typeof ROLES[number]['id'];

/** 핵심 기능 소개 카드 데이터 */
const FEATURES = [
  {
    id: 'pose',
    icon: (
      // 마네킹/포즈 아이콘
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="5" r="2.5" />
        <path d="M12 7.5v5" />
        <path d="M8.5 10l3.5 2.5 3.5-2.5" />
        <path d="M10 19l2-4 2 4" />
      </svg>
    ),
    title: '3D 포즈로 검색',
    description: '마네킹 포즈를 설정하면 일치하는 실사 사진을 자동으로 찾아드립니다.',
  },
  {
    id: 'light',
    icon: (
      // 조명/카메라 아이콘
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
        <circle cx="12" cy="13" r="3" />
      </svg>
    ),
    title: '조명/카메라 시뮬레이션',
    description: '원하는 조명 방향과 카메라 각도를 설정해 꼭 맞는 레퍼런스를 찾으세요.',
  },
  {
    id: 'collection',
    icon: (
      // 컬렉션/북마크 아이콘
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: '컬렉션 저장',
    description: '마음에 드는 레퍼런스를 컬렉션에 저장하고 나중에 바로 꺼내 쓰세요.',
  },
] as const;

// ============================================
// 스텝 컴포넌트
// ============================================

/** Step 1: 환영 + 역할 선택 */
function Step1({
  selectedRoles,
  onToggleRole,
}: {
  selectedRoles: Set<RoleId>;
  onToggleRole: (roleId: RoleId) => void;
}) {
  return (
    <div className="space-y-5">
      {/* 환영 메시지 */}
      <div className="text-center">
        {/* 브랜드 로고 아이콘 — LogoIcon 컴포넌트 사용 */}
        <div className="flex justify-center mb-3">
          <LogoIcon size={48} />
        </div>
        <h2 className="text-lg font-bold text-gray-900">
          환영합니다!
        </h2>
        <p className="text-[13px] text-gray-500 mt-1">
          ArtRef에 오신 걸 환영해요
        </p>
      </div>

      {/* 역할 선택 안내 */}
      <div>
        <p className="text-xs text-gray-500 text-center mb-3">
          어떤 작업을 주로 하시나요? <span className="text-gray-400">(여러 개 선택 가능)</span>
        </p>

        {/* 역할 버튼 그리드 */}
        <div className="flex flex-wrap gap-2 justify-center">
          {ROLES.map((role) => {
            const isSelected = selectedRoles.has(role.id);
            return (
              <button
                key={role.id}
                onClick={() => onToggleRole(role.id)}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium
                  border transition-all duration-150 cursor-pointer
                  ${isSelected
                    ? 'bg-orange-600 border-orange-500 text-white'
                    : 'bg-orange-50 border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                  }
                `}
              >
                {role.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Step 2: 핵심 기능 소개 카드 */
function Step2() {
  return (
    <div className="space-y-4">
      {/* 섹션 제목 */}
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900">이런 기능이 있어요</h2>
        <p className="text-[13px] text-gray-500 mt-1">
          ArtRef의 핵심 기능을 미리 살펴보세요
        </p>
      </div>

      {/* 기능 카드 목록 */}
      <div className="space-y-2.5">
        {FEATURES.map((feature) => (
          <div
            key={feature.id}
            className="flex items-start gap-3 p-3 rounded-xl bg-orange-50/50 border border-gray-300/50"
          >
            {/* 아이콘 배경 */}
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center text-orange-400">
              {feature.icon}
            </div>
            {/* 텍스트 */}
            <div>
              <p className="text-sm font-semibold text-gray-900">{feature.title}</p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Step 3: 시작하기 CTA */
function Step3({
  onStart,
  onClose,
}: {
  onStart: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* 완료 아이콘 + 메시지 */}
      <div className="text-center">
        {/* 체크 아이콘 */}
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-500/15 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-orange-400">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900">
          준비됐어요!
        </h2>
        <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
          첫 검색을 시작해볼까요?<br />
          마네킹 포즈를 설정하고 레퍼런스를 찾아보세요.
        </p>
      </div>

      {/* CTA 버튼 */}
      <div className="space-y-2">
        {/* 검색하러 가기 — 주요 CTA */}
        <button
          onClick={onStart}
          className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-lg text-sm font-semibold text-white cursor-pointer transition-all duration-150"
        >
          검색하러 가기
        </button>

        {/* 둘러보기 — 보조 CTA */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-orange-50 hover:bg-orange-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 cursor-pointer transition-all duration-150"
        >
          둘러보기
        </button>
      </div>
    </div>
  );
}

// ============================================
// 메인 모달 컴포넌트
// ============================================

interface OnboardingWelcomeModalProps {
  /** 모달 닫기 콜백 */
  onClose: () => void;
}

export function OnboardingWelcomeModal({ onClose }: OnboardingWelcomeModalProps) {
  const router = useRouter();

  // 현재 스텝 (0-indexed: 0, 1, 2)
  const [step, setStep] = useState(0);

  // 선택된 역할 (멀티 선택)
  const [selectedRoles, setSelectedRoles] = useState<Set<RoleId>>(new Set());

  // 페이드 전환용 opacity 상태
  const [isTransitioning, setIsTransitioning] = useState(false);

  const TOTAL_STEPS = 3;

  // ---- 헬퍼 함수들 ----

  /** 온보딩 완료 처리 (localStorage 저장 + 콜백) */
  const markDone = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    onClose();
  }, [onClose]);

  /** 역할 토글 핸들러 */
  const handleToggleRole = useCallback((roleId: RoleId) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      // 선택된 역할을 localStorage에 저장 (향후 개인화용)
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          STORAGE_KEYS.USER_ROLES,
          JSON.stringify(Array.from(next))
        );
      }
      return next;
    });
  }, []);

  /** 페이드 전환을 포함한 스텝 이동 */
  const goToStep = useCallback((nextStep: number) => {
    // 페이드 아웃
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(nextStep);
      // 페이드 인
      setIsTransitioning(false);
    }, 150);
  }, []);

  /** 다음 스텝 */
  const handleNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      goToStep(step + 1);
    }
  }, [step, goToStep]);

  /** 이전 스텝 */
  const handlePrev = useCallback(() => {
    if (step > 0) {
      goToStep(step - 1);
    }
  }, [step, goToStep]);

  /** Step 3: 검색하러 가기 → /mannequin 이동 */
  const handleStart = useCallback(() => {
    markDone();
    router.push('/mannequin');
  }, [markDone, router]);

  /** 오버레이 클릭 시 닫기 */
  const handleOverlayClick = useCallback(() => {
    markDone();
  }, [markDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* 모달 카드 */}
      <div
        className="relative w-[90%] max-w-md bg-gray-50 border border-gray-300 rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="온보딩 안내"
      >
        {/* 상단 그라디언트 바 */}
        <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-pink-500" />

        <div className="p-6">
          {/* 스텝 인디케이터 */}
          <div className="flex items-center justify-between mb-5">
            {/* 닫기 버튼 */}
            <button
              onClick={markDone}
              className="text-xs text-gray-300 hover:text-gray-500 cursor-pointer transition-colors"
              aria-label="온보딩 건너뛰기"
            >
              건너뛰기
            </button>

            {/* 도트 인디케이터 */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goToStep(i)}
                  className={`
                    rounded-full transition-all duration-200 cursor-pointer
                    ${i === step
                      ? 'w-4 h-2 bg-orange-500'
                      : i < step
                      ? 'w-2 h-2 bg-orange-500/40'
                      : 'w-2 h-2 bg-neutral-700'
                    }
                  `}
                  aria-label={`${i + 1}단계로 이동`}
                />
              ))}
            </div>

            {/* 스텝 텍스트 */}
            <span className="text-xs text-gray-400 tabular-nums">
              {step + 1} / {TOTAL_STEPS}
            </span>
          </div>

          {/* 스텝 콘텐츠 (페이드 전환) */}
          <div
            className="transition-opacity duration-150"
            style={{ opacity: isTransitioning ? 0 : 1 }}
          >
            {step === 0 && (
              <Step1
                selectedRoles={selectedRoles}
                onToggleRole={handleToggleRole}
              />
            )}
            {step === 1 && <Step2 />}
            {step === 2 && (
              <Step3
                onStart={handleStart}
                onClose={markDone}
              />
            )}
          </div>

          {/* 이전/다음 버튼 (Step 3에서는 숨김 — Step3 내부 버튼 사용) */}
          {step < TOTAL_STEPS - 1 && (
            <div className="flex items-center justify-between mt-6">
              {/* 이전 버튼 */}
              <button
                onClick={handlePrev}
                disabled={step === 0}
                className="px-4 py-2 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-0 disabled:pointer-events-none cursor-pointer transition-colors"
                aria-label="이전 단계"
              >
                이전
              </button>

              {/* 다음 버튼 */}
              <button
                onClick={handleNext}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-xs font-semibold text-white cursor-pointer transition-colors"
                aria-label="다음 단계"
              >
                다음
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
