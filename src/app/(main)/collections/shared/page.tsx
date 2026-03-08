'use client';

// ============================================
// 공유된 무드보드 읽기 전용 페이지 (Phase 6)
// URL 파라미터에서 LZ-string 압축 데이터 디코딩
// ============================================

import { useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { decodeShareUrl } from '@/lib/moodboard-export';
import { SAMPLE_IMAGES } from '@/lib/sample-data';
import { ColorPalette } from '@/components/features/collection/color-palette';
import { Button } from '@/components/ui/button';

/** Suspense 경계로 감싼 기본 export */
export default function SharedCollectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">로딩 중...</div>}>
      <SharedCollectionContent />
    </Suspense>
  );
}

/** 실제 공유 컬렉션 콘텐츠 */
function SharedCollectionContent() {
  const searchParams = useSearchParams();
  const data = searchParams.get('data');

  // URL 데이터 디코딩
  const sharedCollection = useMemo(() => {
    if (!data) return null;
    return decodeShareUrl(data);
  }, [data]);

  // 이미지 목록 조회
  const images = useMemo(() => {
    if (!sharedCollection?.imageIds) return [];
    return sharedCollection.imageIds
      .map((id) => SAMPLE_IMAGES.find((img) => img._id === id))
      .filter(Boolean) as typeof SAMPLE_IMAGES;
  }, [sharedCollection]);

  // 잘못된 URL
  if (!sharedCollection) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-400">
        <div className="text-5xl mb-4">🔗</div>
        <p className="text-lg font-medium mb-2">잘못된 공유 링크입니다</p>
        <Link href="/search">
          <Button size="sm">레퍼런스 검색하기</Button>
        </Link>
      </div>
    );
  }

  const gridColumns = sharedCollection.gridColumns || 3;

  return (
    <div className="min-h-screen">
      {/* 상단 바 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
          {/* 로고 컴포넌트 (h-14 헤더용 size=28) */}
          <Link href="/" className="flex items-center">
            <Logo size={28} />
          </Link>
          <span className="text-xs px-2 py-1 bg-orange-600/20 text-orange-300 rounded-full">
            공유된 무드보드
          </span>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{sharedCollection.name}</h1>
          {sharedCollection.description && (
            <p className="text-sm text-gray-400 mt-1">{sharedCollection.description}</p>
          )}
          <p className="text-xs text-gray-300 mt-1">
            {images.length}장 | 읽기 전용
          </p>
        </div>

        {/* 색상 팔레트 */}
        <div className="mb-4">
          <ColorPalette images={images} />
        </div>

        {/* 이미지 그리드 (읽기 전용, 드래그 없음) */}
        {images.length > 0 ? (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
          >
            {images.map((img) => {
              const annotation = sharedCollection.annotations?.[img._id];
              return (
                <div
                  key={img._id}
                  className="rounded-lg overflow-hidden bg-orange-50 border border-gray-300/50"
                >
                  <div className="aspect-[4/5]">
                    <img
                      src={img.thumbnailUrl || img.url}
                      alt={img.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* 어노테이션 표시 */}
                  {annotation && (annotation.memo || annotation.customTags?.length > 0) && (
                    <div className="p-2 bg-white/90 border-t border-gray-300/50">
                      {annotation.memo && (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                          {annotation.memo}
                        </p>
                      )}
                      {annotation.customTags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {annotation.customTags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] px-1.5 py-0.5 bg-orange-500/20 rounded-full text-orange-300"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-base">아직 이미지가 없어요</p>
          </div>
        )}
      </div>
    </div>
  );
}
