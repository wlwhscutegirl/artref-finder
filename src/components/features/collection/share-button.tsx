'use client';

// ============================================
// 무드보드 공유 버튼 (Phase 6)
// LZ-string 압축 → URL 생성 → 클립보드 복사
// ============================================

import { useState } from 'react';
import { encodeShareUrl } from '@/lib/moodboard-export';
import type { Collection } from '@/types';

interface ShareButtonProps {
  /** 공유할 컬렉션 데이터 */
  collection: Collection;
  /** 비활성화 (Free 플랜) */
  disabled?: boolean;
  /** 비활성화 사유 메시지 */
  disabledMessage?: string;
}

export function ShareButton({
  collection,
  disabled = false,
  disabledMessage = '프로 플랜에서 사용 가능',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // 공유 URL 생성 + 클립보드 복사
  const handleShare = async () => {
    if (disabled) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      return;
    }

    try {
      const encoded = encodeShareUrl(collection);
      const shareUrl = `${window.location.origin}/collections/shared?data=${encoded}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 복사 실패 무시
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
          copied
            ? 'bg-emerald-600/20 text-emerald-400'
            : disabled
              ? 'bg-orange-50 text-gray-300'
              : 'bg-orange-50 text-gray-500 hover:bg-orange-100'
        }`}
      >
        {copied ? '링크 복사됨!' : 'Share'}
      </button>

      {/* 비활성 툴팁 */}
      {showTooltip && disabled && (
        <div className="absolute top-full right-0 mt-1 px-2 py-1 bg-orange-50 border border-gray-300 rounded text-[10px] text-gray-500 whitespace-nowrap z-50">
          {disabledMessage}
        </div>
      )}
    </div>
  );
}
