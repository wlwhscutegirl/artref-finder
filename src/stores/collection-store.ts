import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/constants';
import type { Collection, CollectionLayout, ImageAnnotation, FreeformPosition } from '@/types';
import { useAuthStore } from '@/stores/auth-store';
import {
  loadCloudCollections,
  saveCloudCollection,
  updateCloudCollection,
  deleteCloudCollection,
  migrateLocalCollectionsToCloud,
} from '@/lib/cloud-collection-storage';

// 컬렉션 관리 상태 인터페이스
interface CollectionState {
  collections: Collection[];
  /** 클라우드 동기화 로딩 상태 */
  isCloudSyncing: boolean;
  // 컬렉션 CRUD 함수들
  createCollection: (name: string, description?: string) => Collection;
  deleteCollection: (id: string) => void;
  renameCollection: (id: string, name: string) => void;
  // 이미지 추가/제거
  addImage: (collectionId: string, imageId: string) => void;
  removeImage: (collectionId: string, imageId: string) => void;
  // 이미지가 특정 컬렉션에 있는지 확인
  isImageInCollection: (collectionId: string, imageId: string) => boolean;
  // 이미지가 포함된 모든 컬렉션 ID 반환
  getCollectionsForImage: (imageId: string) => string[];
  // 커버 이미지 설정
  setCoverImage: (collectionId: string, coverUrl: string) => void;
  // Phase 6: 무드보드 확장 액션
  /** 이미지 순서 변경 (드래그앤드롭) */
  reorderImages: (collectionId: string, newOrder: string[]) => void;
  /** 레이아웃 모드 변경 */
  setLayout: (collectionId: string, layout: CollectionLayout) => void;
  /** 그리드 열 수 변경 */
  setGridColumns: (collectionId: string, columns: 2 | 3 | 4) => void;
  /** 이미지 어노테이션 설정 */
  setAnnotation: (collectionId: string, imageId: string, annotation: Partial<ImageAnnotation>) => void;
  /** 이미지 어노테이션 제거 */
  removeAnnotation: (collectionId: string, imageId: string) => void;
  /** 프리폼 위치/크기 설정 */
  setFreeformPosition: (collectionId: string, imageId: string, position: FreeformPosition) => void;
  /** 클라우드에서 컬렉션 목록 동기화 (로그인 시 호출) */
  syncFromCloud: () => Promise<void>;
  /** localStorage → 클라우드 마이그레이션 (로그인 직후 호출) */
  migrateToCloud: () => Promise<number>;
}

/** 인증 상태 확인 헬퍼 */
function isAuthenticated(): boolean {
  return useAuthStore.getState().isAuthenticated;
}

// 고유 ID 생성 (간단한 UUID 대체)
function generateId(): string {
  return `col_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 클라우드 동기화 래퍼 — 로그인 상태일 때만 updateCloudCollection 호출
 * 반복되는 if (isAuthenticated()) { updateCloudCollection(...) } 패턴을 제거
 */
function withCloudSync(collectionId: string, updates: Partial<Collection>): void {
  if (isAuthenticated()) {
    updateCloudCollection(collectionId, updates);
  }
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      collections: [],
      isCloudSyncing: false,

      // 새 컬렉션 생성 (로그인 시 클라우드 동기화)
      createCollection: (name, description) => {
        const now = new Date().toISOString();
        const newCollection: Collection = {
          _id: generateId(),
          userId: 'local', // 클라우드 저장 시 서버에서 덮어씀
          name,
          description,
          imageIds: [],
          coverImageUrl: undefined,
          createdAt: now,
          updatedAt: now,
        };

        // 로컬 상태 즉시 반영 (낙관적 업데이트)
        set((state) => ({
          collections: [newCollection, ...state.collections],
        }));

        // 로그인 상태면 클라우드에도 저장 (비동기)
        if (isAuthenticated()) {
          saveCloudCollection(newCollection).then((cloudResult) => {
            if (cloudResult) {
              // 클라우드에서 받은 ID로 로컬 상태 갱신
              set((state) => ({
                collections: state.collections.map((c) =>
                  c._id === newCollection._id ? cloudResult : c
                ),
              }));
            }
          });
        }

        return newCollection;
      },

      // 컬렉션 삭제 (로그인 시 클라우드 동기화)
      deleteCollection: (id) => {
        // 로컬 상태 즉시 반영
        set((state) => ({
          collections: state.collections.filter((c) => c._id !== id),
        }));

        // 로그인 상태면 클라우드에서도 삭제 (비동기)
        if (isAuthenticated()) {
          deleteCloudCollection(id);
        }
      },

      // 컬렉션 이름 변경 (로그인 시 클라우드 동기화)
      renameCollection: (id, name) => {
        set((state) => ({
          collections: state.collections.map((c) =>
            c._id === id ? { ...c, name, updatedAt: new Date().toISOString() } : c
          ),
        }));

        // 클라우드 동기화
        withCloudSync(id, { name });
      },

      // 컬렉션에 이미지 추가 (로그인 시 클라우드 동기화)
      addImage: (collectionId, imageId) => {
        const col = get().collections.find((c) => c._id === collectionId);
        if (!col || col.imageIds.includes(imageId)) return;

        const updatedImageIds = [...col.imageIds, imageId];

        set((state) => ({
          collections: state.collections.map((c) => {
            if (c._id !== collectionId) return c;
            // 이미 있으면 추가하지 않음
            if (c.imageIds.includes(imageId)) return c;
            return {
              ...c,
              imageIds: updatedImageIds,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));

        // 클라우드 동기화
        withCloudSync(collectionId, { imageIds: updatedImageIds });
      },

      // 컬렉션에서 이미지 제거 (로그인 시 클라우드 동기화)
      removeImage: (collectionId, imageId) => {
        const col = get().collections.find((c) => c._id === collectionId);
        if (!col) return;

        const updatedImageIds = col.imageIds.filter((id) => id !== imageId);

        set((state) => ({
          collections: state.collections.map((c) => {
            if (c._id !== collectionId) return c;
            return {
              ...c,
              imageIds: updatedImageIds,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));

        // 클라우드 동기화
        withCloudSync(collectionId, { imageIds: updatedImageIds });
      },

      // 이미지가 특정 컬렉션에 포함되어 있는지 확인
      isImageInCollection: (collectionId, imageId) => {
        const col = get().collections.find((c) => c._id === collectionId);
        return col ? col.imageIds.includes(imageId) : false;
      },

      // 이미지가 포함된 모든 컬렉션 ID 반환
      getCollectionsForImage: (imageId) => {
        return get()
          .collections.filter((c) => c.imageIds.includes(imageId))
          .map((c) => c._id);
      },

      // 커버 이미지 URL 설정 (로그인 시 클라우드 동기화)
      setCoverImage: (collectionId, coverUrl) => {
        set((state) => ({
          collections: state.collections.map((c) =>
            c._id === collectionId
              ? { ...c, coverImageUrl: coverUrl, updatedAt: new Date().toISOString() }
              : c
          ),
        }));

        // 클라우드 동기화
        withCloudSync(collectionId, { coverImageUrl: coverUrl });
      },

      // Phase 6: 이미지 순서 변경 (드래그앤드롭, 클라우드 동기화)
      reorderImages: (collectionId, newOrder) => {
        set((state) => ({
          collections: state.collections.map((c) =>
            c._id === collectionId
              ? { ...c, imageIds: newOrder, updatedAt: new Date().toISOString() }
              : c
          ),
        }));

        // 클라우드 동기화
        withCloudSync(collectionId, { imageIds: newOrder });
      },

      // Phase 6: 레이아웃 모드 변경 (클라우드 동기화)
      setLayout: (collectionId, layout) => {
        set((state) => ({
          collections: state.collections.map((c) =>
            c._id === collectionId
              ? { ...c, layout, updatedAt: new Date().toISOString() }
              : c
          ),
        }));

        // 클라우드 동기화
        withCloudSync(collectionId, { layout });
      },

      // Phase 6: 그리드 열 수 변경 (클라우드 동기화)
      setGridColumns: (collectionId, columns) => {
        set((state) => ({
          collections: state.collections.map((c) =>
            c._id === collectionId
              ? { ...c, gridColumns: columns, updatedAt: new Date().toISOString() }
              : c
          ),
        }));

        // 클라우드 동기화
        withCloudSync(collectionId, { gridColumns: columns });
      },

      // Phase 6: 이미지 어노테이션 설정 (병합, 클라우드 동기화)
      setAnnotation: (collectionId, imageId, annotation) => {
        // 병합된 어노테이션 계산
        const col = get().collections.find((c) => c._id === collectionId);
        const existing = col?.annotations?.[imageId] || { memo: '', customTags: [] };
        const mergedAnnotations = {
          ...col?.annotations,
          [imageId]: { ...existing, ...annotation },
        };

        set((state) => ({
          collections: state.collections.map((c) => {
            if (c._id !== collectionId) return c;
            return {
              ...c,
              annotations: mergedAnnotations,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));

        // 클라우드 동기화
        withCloudSync(collectionId, { annotations: mergedAnnotations });
      },

      // Phase 6: 이미지 어노테이션 제거 (클라우드 동기화)
      removeAnnotation: (collectionId, imageId) => {
        const col = get().collections.find((c) => c._id === collectionId);
        if (!col) return;

        const { [imageId]: _, ...restAnnotations } = col.annotations || {};

        set((state) => ({
          collections: state.collections.map((c) => {
            if (c._id !== collectionId) return c;
            return {
              ...c,
              annotations: restAnnotations,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));

        // 클라우드 동기화
        withCloudSync(collectionId, { annotations: restAnnotations });
      },

      // Phase 6: 프리폼 위치/크기 설정 (클라우드 동기화)
      setFreeformPosition: (collectionId, imageId, position) => {
        const col = get().collections.find((c) => c._id === collectionId);
        const updatedPositions = {
          ...col?.freeformPositions,
          [imageId]: position,
        };

        set((state) => ({
          collections: state.collections.map((c) => {
            if (c._id !== collectionId) return c;
            return {
              ...c,
              freeformPositions: updatedPositions,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));

        // 클라우드 동기화
        withCloudSync(collectionId, { freeformPositions: updatedPositions });
      },

      // 클라우드에서 컬렉션 목록 동기화 (로그인 시 호출)
      syncFromCloud: async () => {
        if (!isAuthenticated()) return;

        set({ isCloudSyncing: true });
        try {
          const cloudCollections = await loadCloudCollections();
          set({ collections: cloudCollections, isCloudSyncing: false });
        } catch {
          // 실패 시 기존 로컬 데이터 유지
          set({ isCloudSyncing: false });
        }
      },

      // localStorage → 클라우드 마이그레이션
      migrateToCloud: async () => {
        if (!isAuthenticated()) return 0;
        return migrateLocalCollectionsToCloud();
      },
    }),
    {
      name: STORAGE_KEYS.COLLECTIONS, // localStorage 키 (중앙 상수 참조)
    }
  )
);
