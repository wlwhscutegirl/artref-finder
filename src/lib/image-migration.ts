// ============================================
// 이미지 마이그레이션 유틸리티
// sample-data의 로컬 이미지를 bkend.ai images 테이블로 업로드
// ============================================

import { bkend } from '@/lib/bkend';
import { SAMPLE_IMAGES_WITH_POSES } from '@/lib/sample-data';
import type { ReferenceImage } from '@/types';

/** bkend images 테이블명 */
const TABLE = 'images';

/** 마이그레이션 진행률 콜백 타입 */
export type MigrationProgressCallback = (current: number, total: number) => void;

/** 마이그레이션 결과 */
export interface MigrationResult {
  /** 새로 업로드된 이미지 수 */
  migrated: number;
  /** 중복으로 스킵된 이미지 수 */
  skipped: number;
  /** 에러로 실패한 이미지 수 */
  failed: number;
  /** 에러 메시지 목록 */
  errors: string[];
}

/**
 * bkend images 테이블에서 unsplashId 또는 _id로 중복 레코드 확인
 * 존재하면 true, 없으면 false 반환
 */
async function checkDuplicate(image: ReferenceImage): Promise<boolean> {
  try {
    // unsplashId가 있으면 unsplashId로 먼저 중복 확인
    if (image.unsplashId) {
      const result = await bkend.data.list<ReferenceImage>(TABLE, {
        andFilters: JSON.stringify({ unsplashId: { $eq: image.unsplashId } }),
        limit: '1',
      });
      if (result.data.length > 0) return true;
    }

    // _id(샘플 데이터 ID)를 sourceId 필드로 조회
    // 마이그레이션 시 _id 값을 sourceId 필드에 저장해두므로 이것으로도 중복 확인
    const result = await bkend.data.list<ReferenceImage>(TABLE, {
      andFilters: JSON.stringify({ sourceId: { $eq: image._id } }),
      limit: '1',
    });
    return result.data.length > 0;
  } catch {
    // 중복 확인 실패 시 중복 없는 것으로 간주하고 업로드 시도
    return false;
  }
}

/**
 * ReferenceImage(_id 기반)를 bkend 업로드용 레코드로 변환
 * - _id → sourceId 필드로 보존 (bkend는 id를 자동 생성)
 * - bkend 자동 생성 필드(_id, createdAt) 제거
 */
function convertForUpload(image: ReferenceImage): Omit<ReferenceImage, '_id' | 'createdAt'> & { sourceId: string } {
  // _id와 createdAt은 bkend가 자동 생성하므로 제외
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, createdAt, ...rest } = image;

  return {
    ...rest,
    // 원본 _id를 sourceId에 보존 (폴백 조회 시 id 매핑에 활용)
    sourceId: _id,
    // 출처가 없으면 'sample'로 표시
    source: image.source ?? 'sample',
  };
}

/**
 * sample-data의 모든 이미지를 bkend images 테이블로 마이그레이션
 *
 * - 중복 방지: unsplashId 또는 sourceId로 기존 레코드 확인 후 스킵
 * - 진행률 콜백: onProgress(current, total) 호출
 * - 에러 시: 해당 이미지만 스킵하고 계속 진행
 *
 * @param onProgress 진행률 콜백 (current: 처리 완료 수, total: 전체 수)
 * @returns MigrationResult (migrated, skipped, failed, errors)
 */
export async function migrateImagesToCloud(
  onProgress?: MigrationProgressCallback
): Promise<MigrationResult> {
  const result: MigrationResult = {
    migrated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const images = SAMPLE_IMAGES_WITH_POSES;
  const total = images.length;

  for (let i = 0; i < total; i++) {
    const image = images[i];

    try {
      // 중복 확인
      const isDuplicate = await checkDuplicate(image);

      if (isDuplicate) {
        // 이미 존재하는 레코드는 스킵
        result.skipped++;
      } else {
        // bkend에 업로드 (_id → id 변환 처리)
        const payload = convertForUpload(image);
        await bkend.data.create<ReferenceImage>(TABLE, payload);
        result.migrated++;
      }
    } catch (err) {
      // 에러 발생 시 해당 이미지만 스킵하고 계속 진행
      const message = err instanceof Error
        ? `[${image._id}] ${err.message}`
        : `[${image._id}] 알 수 없는 오류`;
      result.errors.push(message);
      result.failed++;
      console.error('[image-migration] 업로드 실패:', message);
    }

    // 진행률 콜백 호출 (i+1번째 완료)
    onProgress?.(i + 1, total);
  }

  console.log(
    `[image-migration] 완료 — 업로드: ${result.migrated}, 스킵: ${result.skipped}, 실패: ${result.failed}`
  );

  return result;
}
