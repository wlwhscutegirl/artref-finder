// ============================================
// 클라우드 컬렉션 저장 (bkend.ai 연동)
// 로그인한 사용자의 컬렉션을 서버에 저장/불러오기
// 비로그인 시 localStorage로 폴백
// ============================================

import { bkend } from '@/lib/bkend';
import { STORAGE_KEYS } from '@/lib/constants';
import type { Collection } from '@/types';

/** bkend.ai 테이블명 */
const TABLE = 'collections';

/** localStorage 키 (중앙 상수 참조) */
const LOCAL_STORAGE_KEY = STORAGE_KEYS.COLLECTIONS;

/**
 * bkend.ai 응답 타입 (id 필드 사용)
 * bkend.ai는 id를 사용하지만, 로컬 Collection 타입은 _id를 사용
 */
interface CloudCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  imageIds: string[];
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  layout?: string;
  gridColumns?: number;
  annotations?: Record<string, any>;
  freeformPositions?: Record<string, any>;
}

/**
 * 클라우드 응답(id)을 로컬 형식(_id)으로 변환
 */
function toLocal(cloud: CloudCollection): Collection {
  return {
    _id: cloud.id,
    userId: cloud.userId,
    name: cloud.name,
    description: cloud.description,
    imageIds: cloud.imageIds || [],
    coverImageUrl: cloud.coverImageUrl,
    createdAt: cloud.createdAt,
    updatedAt: cloud.updatedAt,
    layout: cloud.layout as Collection['layout'],
    gridColumns: cloud.gridColumns as Collection['gridColumns'],
    annotations: cloud.annotations,
    freeformPositions: cloud.freeformPositions,
  };
}

/**
 * 로컬 형식(_id)을 클라우드 전송용으로 변환 (_id 제거)
 */
function toCloudPayload(local: Collection): Omit<CloudCollection, 'id'> {
  return {
    userId: local.userId,
    name: local.name,
    description: local.description,
    imageIds: local.imageIds,
    coverImageUrl: local.coverImageUrl,
    createdAt: local.createdAt,
    updatedAt: local.updatedAt,
    layout: local.layout,
    gridColumns: local.gridColumns,
    annotations: local.annotations,
    freeformPositions: local.freeformPositions,
  };
}

/**
 * localStorage에서 컬렉션 목록 가져오기 (폴백용)
 */
function loadLocalCollections(): Collection[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // zustand persist 형식: { state: { collections: [...] }, version: 0 }
    return parsed?.state?.collections || [];
  } catch {
    return [];
  }
}

/**
 * 클라우드에서 컬렉션 목록 조회
 * 실패 시 localStorage 폴백
 */
export async function loadCloudCollections(): Promise<Collection[]> {
  try {
    const result = await bkend.data.list<CloudCollection>(TABLE, {
      sortBy: 'updatedAt',
      sortDirection: 'desc',
      limit: '100',
    });
    // 클라우드 응답을 로컬 형식으로 변환
    return result.data.map(toLocal);
  } catch {
    // API 실패 시 localStorage 폴백
    return loadLocalCollections();
  }
}

/**
 * 클라우드에 컬렉션 저장 (생성)
 * 실패 시 null 반환 (호출측에서 localStorage 폴백 처리)
 */
export async function saveCloudCollection(
  collection: Collection
): Promise<Collection | null> {
  try {
    const payload = toCloudPayload(collection);
    const result = await bkend.data.create<CloudCollection>(TABLE, payload);
    return toLocal(result);
  } catch {
    // API 실패 시 null 반환
    return null;
  }
}

/**
 * 클라우드 컬렉션 수정 (부분 업데이트)
 * 실패 시 false 반환
 */
export async function updateCloudCollection(
  id: string,
  updates: Partial<Collection>
): Promise<boolean> {
  try {
    // _id 필드는 클라우드에 전송하지 않음
    const { _id, ...rest } = updates as any;
    await bkend.data.update<CloudCollection>(TABLE, id, {
      ...rest,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch {
    // API 실패 시 false 반환
    return false;
  }
}

/**
 * 클라우드 컬렉션 삭제
 * 실패 시 false 반환
 */
export async function deleteCloudCollection(id: string): Promise<boolean> {
  try {
    await bkend.data.delete(TABLE, id);
    return true;
  } catch {
    // API 실패 시 false 반환
    return false;
  }
}

/**
 * localStorage 컬렉션을 클라우드로 마이그레이션
 * 로그인 직후 호출하여 기존 로컬 데이터를 서버로 이전
 */
export async function migrateLocalCollectionsToCloud(): Promise<number> {
  const localCollections = loadLocalCollections();
  if (localCollections.length === 0) return 0;

  let migrated = 0;
  for (const collection of localCollections) {
    try {
      // 로컬 컬렉션 데이터를 클라우드에 생성
      await bkend.data.create(TABLE, toCloudPayload(collection));
      migrated++;
    } catch {
      // 개별 컬렉션 마이그레이션 실패 시 계속 진행
    }
  }

  // 마이그레이션 성공 시 로컬 데이터 정리
  if (migrated > 0) {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }

  return migrated;
}
