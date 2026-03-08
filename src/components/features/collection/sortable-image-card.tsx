'use client';

// ============================================
// 드래그앤드롭 정렬 가능한 이미지 카드 (Phase 6)
// @dnd-kit/sortable 기반
// ============================================

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReferenceImage } from '@/types';
import type { ImageAnnotation } from '@/types';

interface SortableImageCardProps {
  /** 이미지 데이터 */
  image: ReferenceImage;
  /** 이미지 어노테이션 (있으면 표시) */
  annotation?: ImageAnnotation;
  /** 어노테이션 편집 콜백 */
  onAnnotationEdit?: (imageId: string) => void;
  /** 이미지 클릭 콜백 */
  onClick?: (imageId: string) => void;
  /** 이미지 제거 콜백 */
  onRemove?: (imageId: string) => void;
}

export function SortableImageCard({
  image,
  annotation,
  onAnnotationEdit,
  onClick,
  onRemove,
}: SortableImageCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // dnd-kit sortable 훅
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group rounded-lg overflow-hidden bg-neutral-800 border border-neutral-700/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 드래그 핸들 (상단) */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-0 left-0 right-0 h-6 z-10 cursor-grab active:cursor-grabbing flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-black/60 to-transparent"
      >
        <div className="flex gap-0.5">
          <span className="w-1 h-1 rounded-full bg-white/60" />
          <span className="w-1 h-1 rounded-full bg-white/60" />
          <span className="w-1 h-1 rounded-full bg-white/60" />
        </div>
      </div>

      {/* 이미지 */}
      <div
        className="aspect-[4/5] cursor-pointer"
        onClick={() => onClick?.(image._id)}
      >
        <img
          src={image.thumbnailUrl || image.url}
          alt={image.title}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* 액션 버튼 (hover 시 표시) */}
      {isHovered && (
        <div className="absolute top-1 right-1 flex gap-1 z-10">
          {/* 어노테이션 편집 */}
          {onAnnotationEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onAnnotationEdit(image._id); }}
              className="w-6 h-6 rounded bg-black/60 text-[10px] text-white flex items-center justify-center hover:bg-black/80 cursor-pointer"
              title="메모 편집"
            >
              📝
            </button>
          )}
          {/* 제거 */}
          {onRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(image._id); }}
              className="w-6 h-6 rounded bg-black/60 text-[10px] text-red-400 flex items-center justify-center hover:bg-red-600/80 hover:text-white cursor-pointer"
              title="컬렉션에서 제거"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* 어노테이션 표시 (메모가 있을 때) */}
      {annotation && (annotation.memo || annotation.customTags.length > 0) && (
        <div className="p-2 bg-neutral-900/90 border-t border-neutral-700/50">
          {annotation.memo && (
            <p className="text-[10px] text-neutral-300 line-clamp-2 mb-1">
              {annotation.memo}
            </p>
          )}
          {annotation.customTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {annotation.customTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] px-1.5 py-0.5 bg-violet-500/20 rounded-full text-violet-300"
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
}
