'use client';

// ============================================
// 무드보드 내보내기 버튼 (Phase 6)
// PNG / JPEG 선택 → html2canvas 캡처 → 다운로드
// ============================================

import { useState, useRef, useEffect } from 'react';
import { exportAsImage } from '@/lib/moodboard-export';

interface ExportButtonProps {
  /** 캡처 대상 DOM 요소의 ref */
  targetRef: React.RefObject<HTMLElement | null>;
  /** 파일 이름 (기본: 컬렉션 이름) */
  fileName?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
}

export function ExportButton({ targetRef, fileName, disabled = false }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // 내보내기 실행
  const handleExport = async (format: 'png' | 'jpeg') => {
    if (!targetRef.current || isExporting) return;
    setIsExporting(true);
    setIsOpen(false);

    try {
      await exportAsImage(targetRef.current, {
        format,
        quality: format === 'jpeg' ? 0.9 : undefined,
        fileName,
      });
    } catch {
      // 내보내기 실패 — 조용히 실패
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
          disabled
            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
            : isExporting
              ? 'bg-emerald-600/20 text-emerald-400'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        {isExporting ? '내보내는 중...' : 'Export'}
      </button>

      {/* 포맷 선택 드롭다운 */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-32 bg-gray-50 border border-gray-300 rounded-lg shadow-xl overflow-hidden z-50">
          <button
            onClick={() => handleExport('png')}
            className="w-full px-3 py-2 text-xs text-left text-gray-500 hover:bg-gray-100 hover:text-gray-600 cursor-pointer transition-colors"
          >
            PNG (고화질)
          </button>
          <button
            onClick={() => handleExport('jpeg')}
            className="w-full px-3 py-2 text-xs text-left text-gray-500 hover:bg-gray-100 hover:text-gray-600 cursor-pointer transition-colors"
          >
            JPEG (경량)
          </button>
        </div>
      )}
    </div>
  );
}
