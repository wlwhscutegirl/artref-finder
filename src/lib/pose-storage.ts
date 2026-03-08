// ============================================
// 포즈 저장/불러오기 (localStorage 기반)
// 설계서 §8: 최대 20개, 로그인 불필요
// ============================================

import { STORAGE_KEYS } from '@/lib/constants';

/** 관절 회전값 (라디안 [x, y, z]) */
type JointRotations = Record<string, [number, number, number]>;

/** 저장된 포즈 데이터 구조 */
export interface SavedPose {
  /** 고유 ID */
  id: string;
  /** 포즈 이름 (사용자 입력) */
  name: string;
  /** 선택된 전신 프리셋 ID */
  posePresetId: string | null;
  /** 선택된 손 프리셋 ID */
  handPresetId: string | null;
  /** 선택된 카메라 프리셋 ID */
  cameraPresetId: string | null;
  /** 체형 (남성/여성/중립) */
  bodyType: 'male' | 'female' | null;
  /** 좌우반전 여부 */
  isFlipped: boolean;
  /** 검색에 사용된 태그 목록 */
  tags: string[];
  /** 기즈모로 조작된 관절 회전값 (라디안) */
  jointRotations?: JointRotations;
  /** 저장 시각 */
  savedAt: string;
}

/** localStorage 키 (중앙 상수 참조) */
const STORAGE_KEY = STORAGE_KEYS.SAVED_POSES;
const MAX_POSES = 20;

/** localStorage에서 저장된 포즈 목록 불러오기 */
export function loadSavedPoses(): SavedPose[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedPose[];
  } catch {
    return [];
  }
}

/** 포즈 저장 (최대 20개, 초과 시 가장 오래된 것 삭제) */
export function savePose(pose: Omit<SavedPose, 'id' | 'savedAt'>): SavedPose {
  const poses = loadSavedPoses();

  const newPose: SavedPose = {
    ...pose,
    id: `pose-${Date.now()}`,
    savedAt: new Date().toISOString(),
  };

  // 최대 개수 초과 시 가장 오래된 것 제거
  const updated = [newPose, ...poses].slice(0, MAX_POSES);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newPose;
}

/** 저장된 포즈 삭제 */
export function deleteSavedPose(id: string): void {
  const poses = loadSavedPoses();
  const filtered = poses.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/** 저장된 포즈 전체 삭제 */
export function clearAllPoses(): void {
  localStorage.removeItem(STORAGE_KEY);
}
