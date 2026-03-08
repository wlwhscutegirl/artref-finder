// ============================================
// 샘플 이미지용 합성 카메라 앵글 데이터 (Phase 3)
// 카메라 태그 → CameraAngle 매핑 + 이미지별 할당
// ============================================

import type { CameraAngle } from '@/types';

// ============================================
// 카메라 태그 → 기준 CameraAngle 매핑 테이블
// TAG_GROUPS.camera의 태그와 1:1 대응
// ============================================

/** 카메라 태그별 기준 앵글 값 */
const TAG_TO_CAMERA_ANGLE: Record<string, CameraAngle> = {
  // 하이앵글: 위에서 내려다봄 (pitch 양수)
  '하이앵글': { pitch: 35, yaw: 0, fov: 50, type: 'high' },
  // 로우앵글: 아래에서 올려다봄 (pitch 음수)
  '로우앵글': { pitch: -30, yaw: 0, fov: 50, type: 'low' },
  // 아이레벨: 눈높이 (pitch ≈ 0)
  '아이레벨': { pitch: 0, yaw: 0, fov: 50, type: 'eye' },
  // 클로즈업: 아이레벨 + 좁은 화각 (줌인)
  '클로즈업': { pitch: 5, yaw: 0, fov: 30, type: 'eye' },
  // 풀샷: 아이레벨 + 넓은 화각
  '풀샷': { pitch: 0, yaw: 0, fov: 60, type: 'eye' },
  // 미디엄샷: 아이레벨 + 중간 화각
  '미디엄샷': { pitch: 0, yaw: 0, fov: 45, type: 'eye' },
  // 바스트샷: 약간 위에서 + 중간 화각
  '바스트샷': { pitch: 5, yaw: 0, fov: 40, type: 'eye' },
  // 오버더숄더: 측면에서 비스듬히
  '오버더숄더': { pitch: 5, yaw: 30, fov: 45, type: 'eye' },
  // 3/4뷰: 45도 측면
  '3/4뷰': { pitch: 0, yaw: 45, fov: 50, type: 'eye' },
};

// ============================================
// 결정론적 랜덤 유틸리티 (pose-vectors.ts와 동일)
// ============================================

/** 시드 기반 결정론적 난수 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// ============================================
// 공개 API
// ============================================

/**
 * 이미지 태그로부터 합성 CameraAngle 생성
 * 카메라 관련 태그가 있으면 해당 기준 앵글 + 약간의 노이즈
 * 태그가 없으면 undefined 반환
 *
 * @param tags 이미지 태그 목록
 * @param imageId 노이즈 시드용 이미지 ID
 * @returns CameraAngle 또는 undefined
 */
export function generateCameraAngleForImage(
  tags: string[],
  imageId: string
): CameraAngle | undefined {
  // 카메라 관련 태그 중 첫 번째 매칭 찾기
  let baseAngle: CameraAngle | undefined;
  let primaryTag: string | undefined;

  for (const tag of tags) {
    if (TAG_TO_CAMERA_ANGLE[tag]) {
      baseAngle = TAG_TO_CAMERA_ANGLE[tag];
      primaryTag = tag;
      break;
    }
  }

  if (!baseAngle) return undefined;

  // 이미지 ID 기반 시드로 약간의 변형 추가
  const seed = parseInt(imageId, 10) || imageId.charCodeAt(0);
  const pitchNoise = (seededRandom(seed + 100) - 0.5) * 10;  // ±5도
  const yawNoise = (seededRandom(seed + 200) - 0.5) * 20;    // ±10도
  const fovNoise = (seededRandom(seed + 300) - 0.5) * 10;    // ±5도

  // 보조 태그로 yaw 보정 (3/4뷰, 오버더숄더 등이 함께 있으면)
  let yawBonus = 0;
  if (tags.includes('3/4뷰') && primaryTag !== '3/4뷰') {
    yawBonus = 30 * (seededRandom(seed + 400) > 0.5 ? 1 : -1);
  }
  if (tags.includes('오버더숄더') && primaryTag !== '오버더숄더') {
    yawBonus = 25 * (seededRandom(seed + 500) > 0.5 ? 1 : -1);
  }

  const pitch = clamp(baseAngle.pitch + pitchNoise, -90, 90);
  let yaw = baseAngle.yaw + yawNoise + yawBonus;
  // -180 ~ 180 정규화
  if (yaw > 180) yaw -= 360;
  if (yaw < -180) yaw += 360;
  const fov = clamp(baseAngle.fov + fovNoise, 20, 80);

  return {
    pitch,
    yaw,
    fov,
    type: baseAngle.type,
  };
}

/** 카메라 태그 → 기준 앵글 매핑 테이블 (외부 참조용) */
export { TAG_TO_CAMERA_ANGLE };

/** 값을 min~max 범위로 제한 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
