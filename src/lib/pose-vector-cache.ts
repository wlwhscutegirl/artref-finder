// ============================================
// 포즈 벡터 IndexedDB 캐시
// MediaPipe 추출 결과를 브라우저에 영구 저장
// 첫 방문: 추출 → 캐시 / 재방문: 캐시에서 즉시 로드
// ============================================

/** 캐시된 포즈 벡터 항목 */
export interface CachedPoseVector {
  /** 이미지 ID */
  imageId: string;
  /** 51-element 정규화 포즈 벡터 (null = 추출 실패/사람 미감지) */
  poseVector: number[] | null;
  /** 추출 시각 */
  extractedAt: number;
  /** 추출 소스 ('mediapipe' | 'fallback') */
  source: 'mediapipe' | 'fallback';
}

const DB_NAME = 'artref-pose-cache';
const DB_VERSION = 1;
const STORE_NAME = 'vectors';

/** IndexedDB 연결 (싱글톤) */
let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'imageId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

/**
 * 캐시에서 포즈 벡터 일괄 로드
 * @param imageIds 조회할 이미지 ID 배열
 * @returns imageId → CachedPoseVector 맵 (캐시 미스는 포함되지 않음)
 */
export async function loadCachedVectors(
  imageIds: string[]
): Promise<Map<string, CachedPoseVector>> {
  const result = new Map<string, CachedPoseVector>();

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    // 각 ID를 개별 조회 (getAll은 키 필터 미지원)
    const promises = imageIds.map(
      (id) =>
        new Promise<void>((resolve) => {
          const req = store.get(id);
          req.onsuccess = () => {
            if (req.result) {
              result.set(id, req.result as CachedPoseVector);
            }
            resolve();
          };
          req.onerror = () => resolve(); // 에러 시 무시
        })
    );

    await Promise.all(promises);
  } catch {
    // IndexedDB 미지원 또는 에러 → 빈 맵 반환
    console.warn('[PoseCache] IndexedDB 접근 실패');
  }

  return result;
}

/**
 * 단일 포즈 벡터 캐시 저장
 */
export async function saveCachedVector(entry: CachedPoseVector): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(entry);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // 저장 실패 무시 (다음 방문에 재추출)
  }
}

/**
 * 캐시된 벡터 수 조회 (디버그/UI 표시용)
 */
export async function getCachedCount(): Promise<number> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}
