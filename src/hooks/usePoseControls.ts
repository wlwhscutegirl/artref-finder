'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePoseStore, type JointId } from '@/stores/pose-store';
import { usePerfStore } from '@/stores/perf-store';
import { useAnatomyStore } from '@/stores/anatomy-store';
import { detectDeviceGrade } from '@/lib/device-detector';
import { extractCameraAngle } from '@/lib/camera-matching';
import { detectShotType, SHOT_TYPE_LABELS } from '@/lib/shot-type';
import type { ShotType } from '@/lib/shot-type';
import type { CameraAngle } from '@/types';

/** 포즈 컨트롤 훅의 반환 타입 */
export interface PoseControlsState {
  // === 디바이스/렌더링 ===
  /** 현재 렌더 모드 (3d / 2d) */
  renderMode: string;

  // === 관절 제어 ===
  /** 현재 선택된 관절 */
  selectedJoint: JointId | null;
  /** 관절 회전값 전체 */
  joints: Record<JointId, [number, number, number]>;
  /** 관절 선택 함수 */
  selectJoint: (joint: JointId | null) => void;
  /** 외부 포즈 적용 (AI 추출 등) */
  applyExternalPose: (rotations: Record<JointId, [number, number, number]>) => void;

  // === 해부학 오버레이 ===
  /** 해부학 모드 활성 여부 */
  isAnatomyMode: boolean;
  /** 해부학 모드 토글 */
  toggleAnatomyMode: () => void;

  // === 성능 설정 패널 ===
  /** 성능 설정 패널 표시 여부 */
  showPerfSettings: boolean;
  /** 성능 설정 패널 토글 */
  setShowPerfSettings: (show: boolean) => void;

  // === 카메라 앵글 추출 ===
  /** 카메라 위치/타겟 변경 시 CameraAngle 벡터 업데이트 */
  updateCameraAngle: (
    position: [number, number, number] | undefined,
    target: [number, number, number] | undefined,
    setAngle: (angle: CameraAngle | null) => void,
  ) => void;

  // === 샷 타입 감지 ===
  /** 현재 자동 감지된 샷 타입 (카메라 거리/FOV 기반) */
  currentShotType: ShotType | null;
  /** 현재 샷 타입의 한글 라벨 */
  currentShotTypeLabel: string | null;
  /** 현재 카메라 거리 (마네킹 중심까지) */
  cameraDistance: number | null;
  /** 현재 카메라 FOV */
  cameraFov: number | null;

  // === 키보드 단축키 ===
  /** 좌우반전 + ESC 관절 해제 키보드 핸들러 등록 (useEffect 내부) */
  // → useEffect로 자동 등록됨

  // === 레이아웃 ===
  /** 데스크톱 패널 비율 (관절 선택 시 자동 확대) */
  desktopRatio: number;
}

/**
 * 마네킹 페이지의 포즈/관절/뷰어 제어 훅
 * - 디바이스 성능 감지 + 렌더모드 결정
 * - 관절 선택/해제 + 외부 포즈 적용
 * - 해부학 오버레이 토글
 * - 키보드 단축키 (F: 반전, ESC: 관절 해제)
 * - 카메라 앵글 벡터 추출
 * - 레이아웃 비율 자동 조정
 */
export function usePoseControls(
  toggleFlip: () => void,
): PoseControlsState {
  // === 디바이스 성능 감지 + 초기화 ===
  const perfInitialized = usePerfStore((s) => s.initialized);
  const initFromDetection = usePerfStore((s) => s.initFromDetection);
  const renderMode = usePerfStore((s) => s.renderMode);

  useEffect(() => {
    if (perfInitialized) return;
    // 페이지 마운트 시 디바이스 등급 감지 (태블릿 포함)
    const result = detectDeviceGrade();
    initFromDetection(result.grade, result.isMobile, result.recommendedDpr, result.isTablet);
  }, [perfInitialized, initFromDetection]);

  // === 포즈 스토어 연동 ===
  const selectedJoint = usePoseStore((s) => s.selectedJoint);
  const joints = usePoseStore((s) => s.joints);
  const selectJoint = usePoseStore((s) => s.selectJoint);
  const applyExternalPose = usePoseStore((s) => s.applyExternalPose);

  // === 해부학 오버레이 ===
  const isAnatomyMode = useAnatomyStore((s) => s.isAnatomyMode);
  const toggleAnatomyMode = useAnatomyStore((s) => s.toggleAnatomyMode);

  // === 성능 설정 패널 (기본 접힘) ===
  const [showPerfSettings, setShowPerfSettings] = useState(false);

  // 좌우반전 키보드 단축키 (F키) + ESC 관절 해제
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 인풋에 포커스된 경우 무시
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'f' || e.key === 'F') {
        toggleFlip();
      }
      // ESC → 관절 선택 해제
      if (e.key === 'Escape') {
        selectJoint(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectJoint, toggleFlip]);

  // === 카메라 거리/FOV 추적 (샷 타입 감지용) ===
  const [cameraDistance, setCameraDistance] = useState<number | null>(null);
  const [cameraFov, setCameraFov] = useState<number | null>(null);

  // 카메라 위치/타겟 → CameraAngle 벡터 추출 + 거리/FOV 업데이트
  const updateCameraAngle = useCallback((
    position: [number, number, number] | undefined,
    target: [number, number, number] | undefined,
    setAngle: (angle: CameraAngle | null) => void,
  ) => {
    if (position && target) {
      const angle = extractCameraAngle(position, target);
      setAngle(angle);

      // 카메라 ~ 타겟 거리 계산 (유클리드 거리)
      const dx = position[0] - target[0];
      const dy = position[1] - target[1];
      const dz = position[2] - target[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      setCameraDistance(dist);

      // FOV 업데이트 (CameraAngle에서 추출)
      setCameraFov(angle.fov);
    }
  }, []);

  // 카메라 거리/FOV에서 샷 타입 자동 감지
  const currentShotType: ShotType | null = useMemo(() => {
    if (cameraDistance != null && cameraDistance > 0 && cameraFov != null && cameraFov > 0) {
      return detectShotType(cameraDistance, cameraFov);
    }
    return null;
  }, [cameraDistance, cameraFov]);

  // 한글 라벨
  const currentShotTypeLabel = currentShotType ? SHOT_TYPE_LABELS[currentShotType] : null;

  // 레이아웃 자동 축소: 관절 선택 시 55% → 관절 해제 시 35%
  const desktopRatio = selectedJoint ? 0.55 : 0.35;

  return {
    renderMode,
    selectedJoint,
    joints,
    selectJoint,
    applyExternalPose,
    isAnatomyMode,
    toggleAnatomyMode,
    showPerfSettings,
    setShowPerfSettings,
    updateCameraAngle,
    currentShotType,
    currentShotTypeLabel,
    cameraDistance,
    cameraFov,
    desktopRatio,
  };
}
