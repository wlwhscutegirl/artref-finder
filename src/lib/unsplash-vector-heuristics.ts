// ============================================
// EXIF/태그 기반 조명·카메라 벡터 휴리스틱 추론
// MediaPipe 포즈 추출이 불가능한 경우의 폴백
// Unsplash EXIF + 태그 → LightDirection + CameraAngle
// ============================================

import type { LightDirection, CameraAngle } from '@/types';

/**
 * EXIF 데이터에서 조명 방향 추론
 * ISO, 셔터스피드, 조리개 등으로 실내/실외, 밝기 추정
 */
export function inferLightFromExif(exif?: Record<string, string | number>): LightDirection | null {
  if (!exif) return null;

  // ISO 값으로 밝기 추론
  const iso = typeof exif.iso === 'number' ? exif.iso : parseInt(String(exif.iso), 10);
  const focalLength = typeof exif.focal_length === 'string'
    ? parseFloat(exif.focal_length)
    : typeof exif.focal_length === 'number' ? exif.focal_length : null;

  if (isNaN(iso)) return null;

  // 높은 ISO = 어두운 환경 (실내/야간) → 약한 조명
  // 낮은 ISO = 밝은 환경 (실외/스튜디오) → 강한 조명
  const intensity = iso <= 200 ? 0.8 : iso <= 800 ? 0.5 : 0.3;

  // 기본 조명: 정면 약간 위에서 오는 자연광
  return {
    azimuth: 0,
    elevation: 30,
    intensity,
  };
}

/**
 * 태그 기반 조명 방향 추론
 * 한글 태그에서 조명 특성 추출
 */
export function inferLightFromTags(tags: string[]): LightDirection | null {
  let azimuth = 0;
  let elevation = 30;
  let intensity = 0.6;

  let matched = false;

  // 방향 태그
  if (tags.includes('역광') || tags.includes('림라이트')) {
    azimuth = 180;
    matched = true;
  } else if (tags.includes('측광')) {
    azimuth = 90;
    matched = true;
  } else if (tags.includes('정면광')) {
    azimuth = 0;
    matched = true;
  }

  // 높이 태그
  if (tags.includes('탑라이트')) {
    elevation = 70;
    matched = true;
  }

  // 강도 태그
  if (tags.includes('하드라이트')) {
    intensity = 0.85;
    matched = true;
  } else if (tags.includes('소프트라이트')) {
    intensity = 0.35;
    matched = true;
  }

  // 시간대 태그
  if (tags.includes('골든아워')) {
    azimuth = azimuth || 270; // 서쪽 (석양 기본)
    elevation = 10;
    intensity = 0.6;
    matched = true;
  } else if (tags.includes('블루아워')) {
    elevation = -5;
    intensity = 0.25;
    matched = true;
  }

  if (!matched) return null;

  return { azimuth, elevation, intensity };
}

/**
 * EXIF 데이터에서 카메라 앵글 추론
 * 초점 거리 → 화각(FOV) 추정
 */
export function inferCameraFromExif(exif?: Record<string, string | number>): CameraAngle | null {
  if (!exif) return null;

  const focalLength = typeof exif.focal_length === 'string'
    ? parseFloat(exif.focal_length)
    : typeof exif.focal_length === 'number' ? exif.focal_length : null;

  if (!focalLength) return null;

  // 35mm 환산 화각 근사 (센서 크기 모르므로 추정)
  // FOV ≈ 2 * atan(18 / focalLength) * (180/π)
  const fov = 2 * Math.atan(18 / focalLength) * (180 / Math.PI);

  // 화각으로 촬영 유형 추정
  let type: CameraAngle['type'] = 'eye';
  if (fov > 80) type = 'eye'; // 광각 = 전신
  else if (fov < 20) type = 'eye'; // 망원 = 클로즈업

  return {
    pitch: 0,   // 기본 수평
    yaw: 0,     // 기본 정면
    fov: Math.round(fov),
    type,
  };
}

/**
 * 태그 기반 카메라 앵글 추론
 */
export function inferCameraFromTags(tags: string[]): CameraAngle | null {
  let pitch = 0;
  let yaw = 0;
  let fov = 50; // 기본 화각
  let type: CameraAngle['type'] = 'eye';

  let matched = false;

  // 앵글 태그
  if (tags.includes('하이앵글')) {
    pitch = 30; type = 'high'; matched = true;
  } else if (tags.includes('버드아이')) {
    pitch = 80; type = 'bird'; matched = true;
  } else if (tags.includes('로우앵글')) {
    pitch = -30; type = 'low'; matched = true;
  } else if (tags.includes('웜즈아이')) {
    pitch = -70; type = 'worm'; matched = true;
  } else if (tags.includes('아이레벨')) {
    pitch = 0; type = 'eye'; matched = true;
  }

  // 화각 태그
  if (tags.includes('광각') || tags.includes('풀샷')) {
    fov = 85; matched = true;
  } else if (tags.includes('클로즈업') || tags.includes('바스트샷')) {
    fov = 35; matched = true;
  } else if (tags.includes('망원')) {
    fov = 20; matched = true;
  }

  if (!matched) return null;

  return { pitch, yaw, fov, type };
}

/**
 * 모든 소스에서 조명 벡터 종합 추론
 * EXIF 우선, 없으면 태그 폴백
 */
export function inferLightDirection(
  exif?: Record<string, string | number>,
  tags: string[] = []
): LightDirection | null {
  return inferLightFromExif(exif) || inferLightFromTags(tags);
}

/**
 * 모든 소스에서 카메라 앵글 종합 추론
 * EXIF 우선, 없으면 태그 폴백
 */
export function inferCameraAngle(
  exif?: Record<string, string | number>,
  tags: string[] = []
): CameraAngle | null {
  return inferCameraFromExif(exif) || inferCameraFromTags(tags);
}
