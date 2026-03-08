// ============================================
// 클라우드 포즈 저장 (bkend.ai 연동)
// 로그인한 사용자의 포즈를 서버에 저장/불러오기
// 비로그인 시 localStorage로 폴백
// ============================================

import { bkend } from '@/lib/bkend';
import { STORAGE_KEYS } from '@/lib/constants';
import { loadSavedPoses, savePose, deleteSavedPose, type SavedPose } from '@/lib/pose-storage';

/** bkend.ai 테이블명 */
const TABLE = 'saved_poses';

/**
 * 클라우드에서 저장된 포즈 목록 가져오기
 * 비로그인 시 localStorage 폴백
 */
export async function loadCloudPoses(): Promise<SavedPose[]> {
  try {
    const result = await bkend.data.list<SavedPose>(TABLE, {
      sortBy: 'savedAt',
      sortDirection: 'desc',
      limit: '20',
    });
    return result.data;
  } catch {
    // API 실패 시 localStorage 폴백
    return loadSavedPoses();
  }
}

/**
 * 클라우드에 포즈 저장
 * 비로그인 시 localStorage 폴백
 */
export async function saveCloudPose(
  pose: Omit<SavedPose, 'id' | 'savedAt'>
): Promise<SavedPose> {
  try {
    const newPose = {
      ...pose,
      savedAt: new Date().toISOString(),
    };
    const result = await bkend.data.create<SavedPose>(TABLE, newPose);
    return result;
  } catch {
    // API 실패 시 localStorage 폴백
    return savePose(pose);
  }
}

/**
 * 클라우드에서 포즈 삭제
 * 비로그인 시 localStorage 폴백
 */
export async function deleteCloudPose(id: string): Promise<void> {
  try {
    await bkend.data.delete(TABLE, id);
  } catch {
    // API 실패 시 localStorage 폴백
    deleteSavedPose(id);
  }
}

/**
 * localStorage 포즈를 클라우드로 마이그레이션
 * 로그인 직후 호출하여 기존 로컬 데이터를 서버로 이전
 */
export async function migrateLocalToCloud(): Promise<number> {
  const localPoses = loadSavedPoses();
  if (localPoses.length === 0) return 0;

  let migrated = 0;
  for (const pose of localPoses) {
    try {
      await bkend.data.create(TABLE, {
        name: pose.name,
        posePresetId: pose.posePresetId,
        handPresetId: pose.handPresetId,
        cameraPresetId: pose.cameraPresetId,
        bodyType: pose.bodyType,
        isFlipped: pose.isFlipped,
        tags: pose.tags,
        jointRotations: pose.jointRotations,
        savedAt: pose.savedAt,
      });
      migrated++;
    } catch {
      // 개별 포즈 마이그레이션 실패 시 계속 진행
    }
  }

  // 마이그레이션 성공 시 로컬 데이터 정리
  if (migrated > 0) {
    localStorage.removeItem(STORAGE_KEYS.SAVED_POSES);
  }

  return migrated;
}
