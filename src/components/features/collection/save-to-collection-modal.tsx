'use client';

import { useState, useEffect, useRef } from 'react';
import { useCollectionStore } from '@/stores/collection-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SaveToCollectionModalProps {
  imageId: string;
  imageThumbnailUrl: string;
  onClose: () => void;
}

/**
 * 이미지를 컬렉션에 저장하는 모달
 * 기존 컬렉션 선택 또는 새 컬렉션 생성 가능
 */
export function SaveToCollectionModal({
  imageId,
  imageThumbnailUrl,
  onClose,
}: SaveToCollectionModalProps) {
  const { collections, createCollection, addImage, removeImage, isImageInCollection, setCoverImage } =
    useCollectionStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

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
  }, [isCreating, collections.length]); // 컬렉션 목록이나 생성 모드 변경 시 재계산

  // 컬렉션 토글 (추가/제거)
  const toggleCollection = (collectionId: string) => {
    if (isImageInCollection(collectionId, imageId)) {
      removeImage(collectionId, imageId);
    } else {
      addImage(collectionId, imageId);
      // 커버 이미지가 없으면 자동 설정
      const col = collections.find((c) => c._id === collectionId);
      if (col && !col.coverImageUrl) {
        setCoverImage(collectionId, imageThumbnailUrl);
      }
    }
  };

  // 새 컬렉션 생성 후 이미지 추가
  const handleCreate = () => {
    if (!newName.trim()) return;
    const col = createCollection(newName.trim());
    addImage(col._id, imageId);
    setCoverImage(col._id, imageThumbnailUrl);
    setNewName('');
    setIsCreating(false);
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 모달 컨테이너 — role/aria 속성으로 접근성 보장 */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-collection-modal-title"
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h3 id="save-collection-modal-title" className="font-semibold">컬렉션에 저장</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-800 transition-colors cursor-pointer text-neutral-400"
          >
            &times;
          </button>
        </div>

        {/* 컬렉션 목록 */}
        <div className="px-5 py-3 max-h-60 overflow-y-auto space-y-1">
          {collections.length === 0 && !isCreating && (
            <p className="text-sm text-neutral-500 py-4 text-center">
              아직 컬렉션이 없습니다. 새로 만들어보세요!
            </p>
          )}

          {collections.map((col) => {
            const isInCollection = isImageInCollection(col._id, imageId);
            return (
              <button
                key={col._id}
                onClick={() => toggleCollection(col._id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                  isInCollection
                    ? 'bg-orange-600/20 border border-orange-500/30'
                    : 'hover:bg-neutral-800 border border-transparent'
                }`}
              >
                {/* 체크박스 */}
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isInCollection
                      ? 'bg-orange-600 border-orange-600'
                      : 'border-neutral-600'
                  }`}
                >
                  {isInCollection && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                {/* 컬렉션 정보 */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{col.name}</p>
                  <p className="text-xs text-neutral-500">{col.imageIds.length}장</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* 새 컬렉션 생성 */}
        <div className="px-5 py-3 border-t border-neutral-800">
          {isCreating ? (
            <div className="flex gap-2">
              <Input
                placeholder="컬렉션 이름"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <Button onClick={handleCreate} disabled={!newName.trim()} size="sm">
                생성
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreating(false);
                  setNewName('');
                }}
              >
                취소
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-orange-400 hover:bg-orange-600/10 transition-colors cursor-pointer"
            >
              <span className="text-lg">+</span>
              새 컬렉션 만들기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
