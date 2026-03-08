'use client';

// ============================================
// 색상 팔레트 표시 컴포넌트 (Phase 6)
// 이미지에서 추출된 주요 색상을 표시
// 클릭 시 hex 코드 복사
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { extractPalette, mergePalettes } from '@/lib/color-extractor';
import type { ReferenceImage } from '@/types';

interface ColorPaletteProps {
  /** 팔레트 추출 대상 이미지 목록 */
  images: ReferenceImage[];
  /** 최대 색상 수 (기본 8) */
  maxColors?: number;
}

export function ColorPalette({ images, maxColors = 8 }: ColorPaletteProps) {
  const [palette, setPalette] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // 이미지 URL 목록 (최대 20개만 추출)
  const imageUrls = useMemo(
    () => images.slice(0, 20).map((img) => img.thumbnailUrl || img.url),
    [images]
  );

  // 팔레트 추출 (이미지 변경 시 재계산)
  useEffect(() => {
    if (imageUrls.length === 0) {
      setPalette([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    // 각 이미지에서 5개씩 추출 → 병합
    Promise.all(imageUrls.map((url) => extractPalette(url, 5)))
      .then((palettes) => {
        if (cancelled) return;
        const merged = mergePalettes(palettes, maxColors);
        setPalette(merged);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [imageUrls, maxColors]);

  // hex 코드 클립보드 복사
  const handleCopy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(null), 1500);
    } catch {
      // 복사 실패 무시
    }
  };

  if (images.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100/50 rounded-lg">
      <span className="text-[10px] text-gray-400 shrink-0">🎨 팔레트</span>
      {loading ? (
        <div className="flex gap-1">
          {Array.from({ length: maxColors }).map((_, i) => (
            <div key={i} className="w-5 h-5 rounded-full bg-neutral-700 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex gap-1 flex-wrap">
          {palette.map((hex) => (
            <button
              key={hex}
              onClick={() => handleCopy(hex)}
              title={`${hex} — 클릭하여 복사`}
              className="w-5 h-5 rounded-full border border-gray-400 hover:scale-125 transition-transform cursor-pointer relative"
              style={{ backgroundColor: hex }}
            >
              {copiedHex === hex && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] text-emerald-400 whitespace-nowrap bg-gray-50 px-1 rounded">
                  복사됨
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
