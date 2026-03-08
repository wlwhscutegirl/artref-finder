'use client';

import { useCallback, useEffect, useRef } from 'react';

/** 바텀시트 컴포넌트 props */
interface BottomSheetProps {
  /** 시트 열림 상태 */
  isOpen: boolean;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 시트 상단 타이틀 (선택) */
  title?: string;
  /** 시트 내부 콘텐츠 */
  children: React.ReactNode;
}

/**
 * 범용 바텀시트 컴포넌트
 * - 배경 오버레이 클릭 시 닫기
 * - ESC 키로 닫기
 * - 드래그 핸들 표시
 * - max-height 85vh, 스크롤 가능
 * - 열기/닫기 translateY 애니메이션 300ms
 * - 하단 safe area 고려 (pb-safe)
 */
export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  /** ESC 키 닫기 처리 */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  /** ESC 키 리스너 등록/해제 */
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // 시트 열릴 때 배경 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  /** 오버레이 클릭 시 닫기 */
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      // 시트 내부 클릭은 무시
      if (sheetRef.current && sheetRef.current.contains(e.target as Node)) {
        return;
      }
      onClose();
    },
    [onClose]
  );

  return (
    /* 오버레이 컨테이너 — isOpen에 따라 표시/숨김 */
    <div
      className={`
        fixed inset-0 z-50
        transition-opacity duration-300
        ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={title || '바텀시트'}
    >
      {/* 반투명 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/40" />

      {/* 시트 본체 */}
      <div
        ref={sheetRef}
        className={`
          absolute bottom-0 left-0 right-0
          bg-white rounded-t-2xl
          max-h-[85vh] overflow-y-auto
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          pb-[env(safe-area-inset-bottom,0px)]
        `}
      >
        {/* 드래그 핸들 — 시트 상단 중앙 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 타이틀 영역 (있을 때만) */}
        {title && (
          <div className="px-4 pb-3">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
        )}

        {/* 시트 콘텐츠 */}
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}
