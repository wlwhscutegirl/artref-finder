'use client';

import Link from 'next/link';
import type { Collection } from '@/types';

interface CollectionCardProps {
  collection: Collection;
  onDelete?: (id: string) => void;
}

/**
 * 컬렉션 카드 컴포넌트
 * 컬렉션 목록 페이지에서 각 컬렉션을 카드 형태로 표시
 */
export function CollectionCard({ collection, onDelete }: CollectionCardProps) {
  return (
    <div className="group relative rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-orange-500/30 transition-colors">
      {/* 커버 이미지 영역 */}
      <Link href={`/collections/${collection._id}`}>
        <div className="aspect-[4/3] bg-neutral-800 relative overflow-hidden">
          {collection.coverImageUrl ? (
            <img
              src={collection.coverImageUrl}
              alt={collection.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            // 커버 이미지 없을 때 기본 표시
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
              <span className="text-4xl opacity-30">📁</span>
            </div>
          )}

          {/* 이미지 개수 배지 */}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full text-xs text-neutral-300">
            {collection.imageIds.length}장
          </div>
        </div>
      </Link>

      {/* 정보 영역 */}
      <div className="p-4">
        <Link href={`/collections/${collection._id}`}>
          <h3 className="font-medium text-sm truncate hover:text-orange-400 transition-colors">
            {collection.name}
          </h3>
        </Link>
        {collection.description && (
          <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
            {collection.description}
          </p>
        )}
        <p className="text-xs text-neutral-600 mt-2">
          {new Date(collection.updatedAt).toLocaleDateString('ko-KR')}
        </p>
      </div>

      {/* 삭제 버튼 (호버 시 노출) */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(collection._id);
          }}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-neutral-400 hover:text-red-400 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-sm"
          title="컬렉션 삭제"
        >
          &times;
        </button>
      )}
    </div>
  );
}
