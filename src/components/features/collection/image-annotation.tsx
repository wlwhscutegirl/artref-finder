'use client';

// ============================================
// 이미지 어노테이션 편집 모달 (Phase 6)
// 메모 (200자) + 커스텀 태그 (5개) 편집
// ============================================

import { useState, useEffect, useRef } from 'react';
import type { ImageAnnotation as AnnotationType } from '@/types';

interface ImageAnnotationEditorProps {
  /** 현재 어노테이션 데이터 */
  annotation?: AnnotationType;
  /** 대상 이미지 ID */
  imageId: string;
  /** 저장 콜백 */
  onSave: (imageId: string, annotation: Partial<AnnotationType>) => void;
  /** 삭제 콜백 */
  onDelete: (imageId: string) => void;
  /** 닫기 콜백 */
  onClose: () => void;
}

export function ImageAnnotationEditor({
  annotation,
  imageId,
  onSave,
  onDelete,
  onClose,
}: ImageAnnotationEditorProps) {
  const [memo, setMemo] = useState(annotation?.memo || '');
  const [tagInput, setTagInput] = useState('');
  const [customTags, setCustomTags] = useState<string[]>(annotation?.customTags || []);
  const memoRef = useRef<HTMLTextAreaElement>(null);

  // 마운트 시 메모 필드 포커스
  useEffect(() => {
    memoRef.current?.focus();
  }, []);

  // 태그 추가 (Enter 키 또는 콤마)
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '');
      if (newTag && customTags.length < 5 && !customTags.includes(newTag)) {
        setCustomTags([...customTags, newTag]);
      }
      setTagInput('');
    }
  };

  // 태그 제거
  const removeTag = (tag: string) => {
    setCustomTags(customTags.filter((t) => t !== tag));
  };

  // 저장
  const handleSave = () => {
    onSave(imageId, { memo: memo.trim(), customTags });
    onClose();
  };

  // 삭제
  const handleDelete = () => {
    onDelete(imageId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-gray-50 border border-gray-300 rounded-xl shadow-2xl p-4 mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">메모 편집</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg"
          >
            ✕
          </button>
        </div>

        {/* 메모 텍스트 */}
        <div className="mb-3">
          <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block">
            메모 ({memo.length}/200)
          </label>
          <textarea
            ref={memoRef}
            value={memo}
            onChange={(e) => setMemo(e.target.value.slice(0, 200))}
            placeholder="이 레퍼런스에 대한 메모..."
            rows={3}
            className="w-full bg-orange-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 resize-none focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* 커스텀 태그 */}
        <div className="mb-4">
          <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block">
            태그 ({customTags.length}/5)
          </label>
          {/* 태그 목록 */}
          {customTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {customTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-500/20 text-orange-300"
                >
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-gray-900 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          {/* 태그 입력 */}
          {customTags.length < 5 && (
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="태그 입력 후 Enter"
              className="w-full bg-orange-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-orange-500"
            />
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between">
          {/* 어노테이션 삭제 */}
          {(annotation?.memo || annotation?.customTags?.length) ? (
            <button
              onClick={handleDelete}
              className="text-[11px] text-red-400 hover:text-red-300 cursor-pointer"
            >
              메모 삭제
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-50 text-gray-500 hover:bg-orange-100 cursor-pointer transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-600 text-white hover:bg-orange-500 cursor-pointer transition-colors"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
