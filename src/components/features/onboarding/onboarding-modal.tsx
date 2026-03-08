'use client';

// ============================================
// 온보딩 모달 (설계서 §9)
// 첫 접속 시 사용법 안내, 15초 루프 GIF 대신
// 스텝별 가이드로 구현 (이미지 없이 텍스트+아이콘)
// localStorage로 "다시 보지 않기" 관리
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';

/** localStorage 키 (중앙 상수 참조) */
const STORAGE_KEY = STORAGE_KEYS.ONBOARDING_SEEN;

/** 온보딩 스텝별 SVG 아이콘 컴포넌트 */
function StepIcon({ step, className }: { step: number; className?: string }) {
  const props = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (step) {
    case 0: return ( // 포즈 카드
      <svg {...props}><circle cx="12" cy="5" r="3" /><path d="M12 8v4" /><path d="M8 12l4 4 4-4" /><path d="M10 20l2-4 2 4" /></svg>
    );
    case 1: return ( // 관절 드래그
      <svg {...props}><path d="M18.3 5.7a2.7 2.7 0 0 0-3.8 0L12 8.2 9.5 5.7a2.7 2.7 0 1 0-3.8 3.8L8.2 12l-2.5 2.5a2.7 2.7 0 1 0 3.8 3.8L12 15.8l2.5 2.5a2.7 2.7 0 1 0 3.8-3.8L15.8 12l2.5-2.5a2.7 2.7 0 0 0 0-3.8Z" /></svg>
    );
    case 2: return ( // 카메라
      <svg {...props}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" /><circle cx="12" cy="13" r="3" /></svg>
    );
    case 3: return ( // 조명
      <svg {...props}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>
    );
    default: return ( // 검색
      <svg {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
    );
  }
}

/** 온보딩 스텝 정의 (페르소나 리뷰 반영: 초보자 친화적 용어) */
const STEPS = [
  {
    title: '포즈 카드를 눌러보세요',
    description: '왼쪽 패널에 있는 포즈 카드를 클릭하면\n3D 마네킹이 해당 포즈로 바뀌고,\n관련 검색 태그가 자동으로 적용됩니다.',
    tip: '서기, 앉기, 걷기, 격투 등 13가지 포즈를 제공합니다',
    spotlight: '[data-onboarding="pose-presets"]',
  },
  {
    title: '보라색 동그라미를 드래그하세요',
    description: '마네킹 위의 보라색 동그라미(관절)를 클릭하면\n빨강/초록/파랑 원형 손잡이가 나타납니다.\n손잡이를 드래그하면 팔다리가 움직여요!',
    tip: '빨강 = 좌우 회전 | 초록 = 앞뒤 기울기 | 파랑 = 비틀기',
    spotlight: '[data-onboarding="mannequin-viewer"]',
  },
  {
    title: '카메라 각도를 바꿔보세요',
    description: '마네킹 아래의 카메라 버튼으로\n위에서 내려다보기, 아래에서 올려다보기 등\n다양한 각도를 선택할 수 있습니다.',
    tip: '마우스로 3D 화면을 드래그하면 자유롭게 회전됩니다',
    spotlight: '[data-onboarding="camera-presets"]',
  },
  {
    title: '빛의 방향을 조절하세요',
    description: '3D 화면 왼쪽 아래의 노란 점을 드래그하면\n빛이 비추는 방향이 바뀝니다.\n조명에 맞는 태그가 자동으로 추천됩니다.',
    tip: '앞에서 비추기, 뒤에서 비추기, 옆에서 비추기 등 자동 인식',
    spotlight: '[data-onboarding="light-control"]',
  },
  {
    title: '레퍼런스 사진이 자동으로 찾아져요',
    description: '포즈, 카메라, 빛을 설정하면\n오른쪽에 조건에 맞는 사진이 자동으로 나타납니다.\n사진을 클릭하면 크게 볼 수 있고, 다운로드도 가능해요!',
    tip: 'F키: 좌우반전 | 사진 드래그: 다른 앱으로 바로 옮기기',
    spotlight: '[data-onboarding="image-grid"]',
  },
] as const;

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  // 모달 컨테이너 ref (포커스 트랩용)
  const modalRef = useRef<HTMLDivElement>(null);

  // 첫 방문 시 모달 표시
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // 약간의 지연 후 표시 (페이지 로드 완료 대기)
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // 닫기 핸들러 (다시 보지 않기)
  const handleClose = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  // 다음 스텝
  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  }, [step, handleClose]);

  // 이전 스텝
  const handlePrev = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // 포커스 트랩: 모달 내부에 포커스를 가둠
  useEffect(() => {
    if (!isOpen) return;
    const modal = modalRef.current;
    if (!modal) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = modal.querySelectorAll<HTMLElement>(focusableSelector);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleTabTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = modal.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // Shift+Tab: 첫 요소에서 마지막으로 이동
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
      // Tab: 마지막 요소에서 첫 요소로 이동
      else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleTabTrap);
    return () => document.removeEventListener('keydown', handleTabTrap);
  }, [isOpen, step]); // step 변경 시 포커스 가능 요소 재계산

  if (!isOpen) return null;

  const currentStep = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 모달 카드 — role/aria 속성으로 접근성 보장 */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-modal-title"
        className="relative w-[90%] max-w-md bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* 상단 그라데이션 바 */}
        <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-pink-500" />

        {/* 콘텐츠 */}
        <div className="p-6">
          {/* 스텝 표시 */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
              시작 가이드
            </span>
            <span className="text-[10px] text-neutral-500">
              {step + 1} / {STEPS.length}
            </span>
          </div>

          {/* 아이콘 + 제목 */}
          <div className="text-center mb-4">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400">
              <StepIcon step={step} className="w-6 h-6" />
            </div>
            <h2 id="onboarding-modal-title" className="text-lg font-bold text-white">{currentStep.title}</h2>
          </div>

          {/* 설명 */}
          <p className="text-sm text-neutral-300 text-center whitespace-pre-line leading-relaxed mb-3">
            {currentStep.description}
          </p>

          {/* 팁 */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2 mb-6">
            <p className="text-[11px] text-orange-300 text-center">
              {currentStep.tip}
            </p>
          </div>

          {/* 진행 인디케이터 */}
          <div className="flex justify-center gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                  i === step
                    ? 'bg-orange-500'
                    : i < step
                    ? 'bg-orange-500/40'
                    : 'bg-neutral-700'
                }`}
              />
            ))}
          </div>

          {/* 버튼 */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={step === 0}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              이전
            </button>

            <button
              onClick={handleClose}
              className="text-[10px] text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors"
            >
              건너뛰기
            </button>

            <button
              onClick={handleNext}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-xs font-medium text-white cursor-pointer transition-colors"
            >
              {step === STEPS.length - 1 ? '시작하기' : '다음'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
