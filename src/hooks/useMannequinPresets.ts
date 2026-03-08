'use client';

import { useState, useCallback } from 'react';
import { TAG_GROUPS } from '@/lib/sample-data';
import { CAMERA_PRESETS } from '@/lib/pose-presets';
import { usePoseStore } from '@/stores/pose-store';
import type { PosePreset, HandPreset, CameraPreset } from '@/lib/pose-presets';
import type { SavedPose } from '@/lib/pose-storage';

/** 프리셋 훅의 반환 타입 */
export interface MannequinPresetsState {
  // === 프리셋 선택 상태 ===
  /** 선택된 포즈 프리셋 ID */
  selectedPoseId: string | null;
  /** 선택된 손 프리셋 ID */
  selectedHandId: string | null;
  /** 선택된 카메라 프리셋 ID */
  selectedCameraId: string | null;
  /** 카메라 위치 */
  cameraPosition: [number, number, number] | undefined;
  /** 카메라 타겟 */
  cameraTarget: [number, number, number] | undefined;

  // === 체형 토글 ===
  /** 현재 체형 (남성/여성/중립) */
  bodyType: 'male' | 'female' | null;

  // === 좌우반전 ===
  /** 반전 상태 */
  isFlipped: boolean;
  /** 반전 토글 */
  toggleFlip: () => void;
  /** 반전 상태 직접 설정 */
  setIsFlipped: (val: boolean) => void;

  // === 핸들러 ===
  /** 포즈 프리셋 선택 핸들러 (태그도 자동 교체) */
  handlePoseSelect: (preset: PosePreset, selectedTags: string[], setSelectedTags: (tags: string[]) => void) => void;
  /** 손 프리셋 선택 핸들러 */
  handleHandSelect: (preset: HandPreset, selectedTags: string[], setSelectedTags: (tags: string[]) => void) => void;
  /** 카메라 프리셋 선택 핸들러 */
  handleCameraSelect: (preset: CameraPreset, selectedTags: string[], setSelectedTags: (tags: string[]) => void) => void;
  /** 체형 토글 핸들러 */
  handleBodyTypeToggle: (type: 'male' | 'female', selectedTags: string[], setSelectedTags: (tags: string[]) => void) => void;
  /** 저장된 포즈 불러오기 핸들러 */
  handleLoadPose: (pose: SavedPose, setSelectedTags: (tags: string[]) => void) => void;
  /** 모든 프리셋 초기화 */
  resetPresets: () => void;
}

/**
 * 마네킹 페이지의 프리셋 관리 훅
 * - 포즈/손/카메라 프리셋 선택 및 태그 자동 교체
 * - 체형 토글 (남성/여성)
 * - 저장된 포즈 불러오기
 * - 좌우 반전 상태 관리
 */
export function useMannequinPresets(): MannequinPresetsState {
  // === 프리셋 선택 상태 ===
  const [selectedPoseId, setSelectedPoseId] = useState<string | null>(null);
  const [selectedHandId, setSelectedHandId] = useState<string | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [cameraPosition, setCameraPosition] = useState<[number, number, number] | undefined>();
  const [cameraTarget, setCameraTarget] = useState<[number, number, number] | undefined>();

  // === 체형 토글 ===
  const [bodyType, setBodyType] = useState<'male' | 'female' | null>(null);

  // === 좌우반전 ===
  const [isFlipped, setIsFlipped] = useState(false);
  const toggleFlip = useCallback(() => setIsFlipped((prev) => !prev), []);

  /**
   * 포즈 프리셋 선택 시 매핑 태그를 자동 적용
   * 기존 수동 태그는 유지하고, 포즈+카메라 그룹 태그만 교체
   */
  const handlePoseSelect = useCallback((
    preset: PosePreset,
    selectedTags: string[],
    setSelectedTags: (tags: string[]) => void,
  ) => {
    setSelectedPoseId(preset.id);

    // 포즈 그룹 + 카메라 그룹 태그만 교체 (프리셋 매핑 태그)
    const poseTagNames: string[] = TAG_GROUPS.pose.tags.map((t) => t.name);
    const cameraTagNames: string[] = TAG_GROUPS.camera.tags.map((t) => t.name);
    const presetTagNames = [...poseTagNames, ...cameraTagNames];

    // 기존 태그 중 프리셋과 겹치지 않는 것만 유지
    const withoutPresetTags = selectedTags.filter((t) => !presetTagNames.includes(t));
    setSelectedTags([...withoutPresetTags, ...preset.tags]);
  }, []);

  /** 손 프리셋 선택 핸들러 (부위 그룹 태그 교체) */
  const handleHandSelect = useCallback((
    preset: HandPreset,
    selectedTags: string[],
    setSelectedTags: (tags: string[]) => void,
  ) => {
    setSelectedHandId(preset.id);

    // 부위 그룹 태그만 교체
    const bodyTagNames: string[] = TAG_GROUPS.body.tags.map((t) => t.name);
    const withoutBodyTags = selectedTags.filter((t) => !bodyTagNames.includes(t));
    setSelectedTags([...withoutBodyTags, ...preset.tags]);
  }, []);

  /** 카메라 프리셋 선택 핸들러 (카메라 위치 + 태그 교체) */
  const handleCameraSelect = useCallback((
    preset: CameraPreset,
    selectedTags: string[],
    setSelectedTags: (tags: string[]) => void,
  ) => {
    setSelectedCameraId(preset.id);
    setCameraPosition(preset.position);
    setCameraTarget(preset.target);

    // 카메라 그룹 태그만 교체
    const camTagNames: string[] = TAG_GROUPS.camera.tags.map((t) => t.name);
    const withoutCameraTags = selectedTags.filter((t) => !camTagNames.includes(t));
    setSelectedTags([...withoutCameraTags, ...preset.tags]);
  }, []);

  /** 체형 토글 핸들러 (남성/여성 태그 자동 교체) */
  const handleBodyTypeToggle = useCallback((
    type: 'male' | 'female',
    selectedTags: string[],
    setSelectedTags: (tags: string[]) => void,
  ) => {
    const newType = bodyType === type ? null : type;
    setBodyType(newType);

    // 인물 특성 그룹에서 남성/여성 태그만 교체
    const withoutGender = selectedTags.filter((t) => t !== '남성' && t !== '여성');
    if (newType) {
      setSelectedTags([...withoutGender, newType === 'male' ? '남성' : '여성']);
    } else {
      setSelectedTags(withoutGender);
    }
  }, [bodyType]);

  /** 저장된 포즈 불러오기 핸들러 (프리셋+관절+카메라 전체 복원) */
  const handleLoadPose = useCallback((
    pose: SavedPose,
    setSelectedTags: (tags: string[]) => void,
  ) => {
    // 프리셋 상태 복원
    setSelectedPoseId(pose.posePresetId);
    setSelectedHandId(pose.handPresetId);
    setSelectedCameraId(pose.cameraPresetId);
    setBodyType(pose.bodyType);
    setIsFlipped(pose.isFlipped);
    setSelectedTags(pose.tags);

    // 관절 회전값 복원 (기즈모로 조작한 포즈)
    if (pose.jointRotations) {
      const store = usePoseStore.getState();
      for (const [jointId, rotation] of Object.entries(pose.jointRotations)) {
        store.setJointRotation(jointId as any, rotation);
      }
    }

    // 카메라 프리셋이 있으면 카메라 위치도 복원
    if (pose.cameraPresetId) {
      const camPreset = CAMERA_PRESETS.find((p) => p.id === pose.cameraPresetId);
      if (camPreset) {
        setCameraPosition(camPreset.position);
        setCameraTarget(camPreset.target);
      }
    }
  }, []);

  /** 모든 프리셋 초기화 */
  const resetPresets = useCallback(() => {
    setSelectedPoseId(null);
    setSelectedHandId(null);
    setSelectedCameraId(null);
    setBodyType(null);
  }, []);

  return {
    selectedPoseId,
    selectedHandId,
    selectedCameraId,
    cameraPosition,
    cameraTarget,
    bodyType,
    isFlipped,
    toggleFlip,
    setIsFlipped,
    handlePoseSelect,
    handleHandSelect,
    handleCameraSelect,
    handleBodyTypeToggle,
    handleLoadPose,
    resetPresets,
  };
}
