'use client';

// ============================================
// 컬렉션 상세 페이지 (Phase 6: 무드보드 강화)
// 드래그앤드롭 재정렬 + 레이아웃 전환 + 어노테이션
// + 색상 팔레트 + 내보내기 + 공유
// ============================================

import { useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useCollectionStore } from '@/stores/collection-store';
import { useImages } from '@/hooks/useImages';
import { SortableImageCard } from '@/components/features/collection/sortable-image-card';
import { LayoutSwitcher } from '@/components/features/collection/layout-switcher';
import { ImageAnnotationEditor } from '@/components/features/collection/image-annotation';
import { ColorPalette } from '@/components/features/collection/color-palette';
import { ExportButton } from '@/components/features/collection/export-button';
import { ShareButton } from '@/components/features/collection/share-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CollectionLayout } from '@/types';

/**
 * 컬렉션 상세 (무드보드) 페이지
 * 드래그 재정렬, 레이아웃 전환, 어노테이션, 내보내기, 공유 지원
 */
export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;

  // bkend 이미지 데이터 (폴백: sample-data)
  const { images: allImages } = useImages();

  // 스토어 액션
  const {
    collections,
    renameCollection,
    deleteCollection,
    removeImage,
    reorderImages,
    setLayout,
    setGridColumns,
    setAnnotation,
    removeAnnotation,
  } = useCollectionStore();

  // 이름 편집 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  // 어노테이션 편집 모달 상태
  const [annotatingImageId, setAnnotatingImageId] = useState<string | null>(null);

  // 무드보드 캡처 대상 ref
  const moodboardRef = useRef<HTMLDivElement>(null);

  // 현재 컬렉션 찾기
  const collection = collections.find((c) => c._id === collectionId);

  // 레이아웃 상태 (컬렉션에서 읽거나 기본값)
  const layout: CollectionLayout = collection?.layout || 'grid';
  const gridColumns = collection?.gridColumns || 3;

  // 컬렉션에 포함된 이미지들 (순서 유지)
  // 컬렉션에 포함된 이미지들 (bkend 데이터에서 매칭, 순서 유지)
  const collectionImages = useMemo(() => {
    if (!collection) return [];
    return collection.imageIds
      .map((id) => allImages.find((img) => img._id === id))
      .filter(Boolean) as typeof allImages;
  }, [collection, allImages]);

  // dnd-kit 센서 설정 (포인터 + 터치 + 키보드)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // 드래그 종료 시 순서 업데이트
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !collection) return;

    const oldIndex = collection.imageIds.indexOf(active.id as string);
    const newIndex = collection.imageIds.indexOf(over.id as string);

    if (oldIndex === -1 || newIndex === -1) return;

    // 순서 변경
    const newOrder = [...collection.imageIds];
    newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, active.id as string);
    reorderImages(collectionId, newOrder);
  }, [collection, collectionId, reorderImages]);

  // 컬렉션이 없으면 404
  if (!collection) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-neutral-500">
        <div className="text-5xl mb-4">📁</div>
        <p className="text-lg font-medium mb-2">컬렉션을 찾을 수 없습니다</p>
        <Link href="/collections">
          <Button variant="secondary" size="sm">
            컬렉션 목록으로
          </Button>
        </Link>
      </div>
    );
  }

  // 이름 수정
  const startEditing = () => { setEditName(collection.name); setIsEditing(true); };
  const finishEditing = () => {
    if (editName.trim() && editName.trim() !== collection.name) {
      renameCollection(collectionId, editName.trim());
    }
    setIsEditing(false);
  };

  // 컬렉션 삭제
  const handleDelete = () => { deleteCollection(collectionId); router.push('/collections'); };

  // 레이아웃별 CSS 클래스
  const gridClass = layout === 'masonry'
    ? `columns-${gridColumns} gap-3 space-y-3`
    : `grid gap-3 grid-cols-${gridColumns}`;

  return (
    <div className="min-h-screen">
      {/* 상단 바 */}
      <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold">
              A
            </div>
            <span className="font-semibold">ArtRef</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 text-neutral-400 hover:bg-neutral-700 transition-colors"
            >
              검색
            </Link>
            <Link
              href="/collections"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 text-neutral-400 hover:bg-neutral-700 transition-colors"
            >
              내 컬렉션
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 py-8">
        {/* 뒤로가기 */}
        <Link
          href="/collections"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-300 transition-colors mb-4"
        >
          ← 컬렉션 목록
        </Link>

        {/* 페이지 헤더 + 도구 바 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2 max-w-md">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishEditing();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  onBlur={finishEditing}
                  autoFocus
                />
              </div>
            ) : (
              <div>
                <h1
                  className="text-2xl font-bold cursor-pointer hover:text-violet-400 transition-colors"
                  onClick={startEditing}
                  title="클릭하여 이름 수정"
                >
                  {collection.name}
                </h1>
                {collection.description && (
                  <p className="text-sm text-neutral-500 mt-1">{collection.description}</p>
                )}
                <p className="text-xs text-neutral-600 mt-1">
                  {collectionImages.length}장 | 마지막 수정{' '}
                  {new Date(collection.updatedAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
            )}
          </div>

          {/* 도구 바 */}
          <div className="flex items-center gap-2 shrink-0">
            <LayoutSwitcher
              layout={layout}
              gridColumns={gridColumns}
              onLayoutChange={(l) => setLayout(collectionId, l)}
              onColumnsChange={(c) => setGridColumns(collectionId, c)}
            />
            <ExportButton
              targetRef={moodboardRef}
              fileName={collection.name}
            />
            <ShareButton collection={collection} />
            <Button variant="ghost" size="sm" onClick={startEditing}>
              이름 수정
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              삭제
            </Button>
          </div>
        </div>

        {/* 색상 팔레트 */}
        <div className="mb-4">
          <ColorPalette images={collectionImages} />
        </div>

        {/* 무드보드 (캡처 대상) */}
        <div ref={moodboardRef}>
          {collectionImages.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={collection.imageIds}
                strategy={rectSortingStrategy}
              >
                {/* Masonry 레이아웃 */}
                {layout === 'masonry' ? (
                  <div
                    style={{ columnCount: gridColumns, columnGap: '12px' }}
                    className="[&>*]:mb-3 [&>*]:break-inside-avoid"
                  >
                    {collectionImages.map((img) => (
                      <SortableImageCard
                        key={img._id}
                        image={img}
                        annotation={collection.annotations?.[img._id]}
                        onAnnotationEdit={setAnnotatingImageId}
                        onRemove={(id) => removeImage(collectionId, id)}
                      />
                    ))}
                  </div>
                ) : (
                  /* Grid 레이아웃 (기본) */
                  <div
                    className="grid gap-3"
                    style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
                  >
                    {collectionImages.map((img) => (
                      <SortableImageCard
                        key={img._id}
                        image={img}
                        annotation={collection.annotations?.[img._id]}
                        onAnnotationEdit={setAnnotatingImageId}
                        onRemove={(id) => removeImage(collectionId, id)}
                      />
                    ))}
                  </div>
                )}
              </SortableContext>
            </DndContext>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
              <div className="text-5xl mb-4 opacity-50">🖼️</div>
              <p className="text-base font-medium mb-1">이 컬렉션은 비어있습니다</p>
              <p className="text-sm mb-6">레퍼런스를 검색해서 이 컬렉션에 추가해보세요</p>
              <Link href="/search">
                <Button size="sm">레퍼런스 검색하기</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 어노테이션 편집 모달 */}
      {annotatingImageId && (
        <ImageAnnotationEditor
          imageId={annotatingImageId}
          annotation={collection.annotations?.[annotatingImageId]}
          onSave={(imageId, annotation) => setAnnotation(collectionId, imageId, annotation)}
          onDelete={(imageId) => removeAnnotation(collectionId, imageId)}
          onClose={() => setAnnotatingImageId(null)}
        />
      )}
    </div>
  );
}
