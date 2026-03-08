'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { useCollectionStore } from '@/stores/collection-store';
import { CollectionCard } from '@/components/features/collection/collection-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * 내 컬렉션 목록 페이지
 * 저장한 컬렉션들을 그리드로 표시하고, 새 컬렉션 생성/삭제 가능
 */
export default function CollectionsPage() {
  const { collections, createCollection, deleteCollection } = useCollectionStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  // 삭제 확인 대상 컬렉션 ID
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // 새 컬렉션 생성
  const handleCreate = () => {
    if (!newName.trim()) return;
    createCollection(newName.trim(), newDesc.trim() || undefined);
    setNewName('');
    setNewDesc('');
    setIsCreating(false);
  };

  // 컬렉션 삭제 (확인 후)
  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      deleteCollection(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      // 3초 후 자동 취소
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  return (
    <div className="min-h-screen">
      {/* 상단 바 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
          {/* 로고 컴포넌트 (h-14 헤더용 size=28) */}
          <Link href="/" className="flex items-center">
            <Logo size={28} />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-50 text-gray-500 hover:bg-orange-100 transition-colors"
            >
              🔍 검색
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 py-8">
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">내 컬렉션</h1>
            <p className="text-sm text-gray-400 mt-1">
              {collections.length}개의 컬렉션
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)} size="sm">
            + 새 컬렉션
          </Button>
        </div>

        {/* 새 컬렉션 생성 폼 */}
        {isCreating && (
          <div className="mb-6 p-5 bg-gray-50 border border-gray-200 rounded-xl">
            <h3 className="text-sm font-medium mb-3">새 컬렉션 만들기</h3>
            <div className="space-y-3">
              <Input
                placeholder="컬렉션 이름 (예: 역광 레퍼런스)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <Input
                placeholder="설명 (선택)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={!newName.trim()} size="sm">
                  만들기
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsCreating(false);
                    setNewName('');
                    setNewDesc('');
                  }}
                >
                  취소
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 삭제 확인 배너 */}
        {confirmDeleteId && (
          <div className="mb-4 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between">
            <p className="text-sm text-red-400">정말 이 컬렉션을 삭제할까요?</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  deleteCollection(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-3 py-1 text-xs bg-red-600 hover:bg-red-500 rounded-lg text-white cursor-pointer transition-colors"
              >
                삭제
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3 py-1 text-xs bg-neutral-700 hover:bg-orange-200 rounded-lg text-gray-600 cursor-pointer transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 컬렉션 그리드 */}
        {collections.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {collections.map((col) => (
              <CollectionCard
                key={col._id}
                collection={col}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          // 빈 상태
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="text-5xl mb-4 opacity-50">📁</div>
            <p className="text-base font-medium mb-1">아직 컬렉션이 없어요</p>
            <p className="text-sm mb-6">레퍼런스를 검색하고 컬렉션에 저장해보세요</p>
            <div className="flex gap-3">
              <Button onClick={() => setIsCreating(true)} size="sm">
                + 새 컬렉션 만들기
              </Button>
              <Link href="/search">
                <Button variant="secondary" size="sm">
                  레퍼런스 검색하기
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
