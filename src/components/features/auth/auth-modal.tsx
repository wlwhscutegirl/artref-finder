'use client';

// ============================================
// 인증 모달 (로그인/회원가입)
// bkend.ai 이메일 인증 기반
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';

interface AuthModalProps {
  /** 모달 닫기 콜백 */
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  // 로그인/회원가입 모드 전환
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { login, register, isLoading } = useAuthStore();

  // 모달 컨테이너 ref (포커스 트랩용)
  const modalRef = useRef<HTMLDivElement>(null);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 포커스 트랩: 모달 내부에 포커스를 가둠
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    // 모달 열릴 때 첫 포커스 가능 요소에 포커스
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
  }, [mode]); // mode 변경 시 포커스 가능 요소가 달라짐 (이름 필드)

  // 폼 제출 핸들러
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (mode === 'signin') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || (mode === 'signin' ? '로그인에 실패했습니다' : '회원가입에 실패했습니다'));
    }
  }, [mode, email, password, name, login, register, onClose]);

  // 모드 전환
  const toggleMode = useCallback(() => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
  }, [mode]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 — role/aria 속성으로 접근성 보장 */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-[90%] max-w-sm bg-gray-50 border border-gray-300 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* 상단 그라데이션 */}
        <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-500" />

        <div className="p-6">
          {/* 로고 + 제목 */}
          <div className="text-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-sm font-bold text-white mx-auto mb-3">
              A
            </div>
            <h2 id="auth-modal-title" className="text-lg font-bold text-gray-900">
              {mode === 'signin' ? '로그인' : '회원가입'}
            </h2>
            <p className="text-[11px] text-gray-400 mt-1">
              {mode === 'signin'
                ? '계정에 로그인하여 포즈를 클라우드에 저장하세요'
                : '무료 계정을 만들고 시작하세요'}
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-[11px] text-red-400 text-center">{error}</p>
            </div>
          )}

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* 이름 (회원가입 시만) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                  이름
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  required
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            )}

            {/* 이메일 */}
            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
              />
              {/* 회원가입 시 비밀번호 요구사항 안내 */}
              {mode === 'signup' && (
                <p className="text-[10px] text-gray-300 mt-1">
                  8자 이상, 대소문자 + 숫자 + 특수문자 포함
                </p>
              )}
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white cursor-pointer transition-colors"
            >
              {isLoading
                ? '처리 중...'
                : mode === 'signin'
                ? '로그인'
                : '가입하기'}
            </button>
          </form>

          {/* 모드 전환 */}
          <div className="mt-4 text-center">
            <button
              onClick={toggleMode}
              className="text-[11px] text-gray-400 hover:text-orange-400 cursor-pointer transition-colors"
            >
              {mode === 'signin'
                ? '계정이 없으신가요? 회원가입'
                : '이미 계정이 있으신가요? 로그인'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
