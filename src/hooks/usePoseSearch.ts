// ============================================
// 하이브리드 검색 훅 (태그 필터 + 포즈 유사도 + 카메라 앵글 + 조명)
// 마네킹 관절 상태 → FK → 포즈 벡터 → 유사도 정렬
// 카메라 위치 → pitch/yaw → 카메라 앵글 유사도 합산
// 조명 방향 → azimuth/elevation/intensity → 조명 유사도 합산
// ============================================

import { useMemo } from 'react';
import { usePoseStore } from '@/stores/pose-store';
import { computePoseVector } from '@/lib/forward-kinematics';
import { comparePoses } from '@/lib/pose-similarity';
import { computeCameraAngleSimilarity } from '@/lib/camera-matching';
import { computeLightSimilarity } from '@/lib/light-matching';
import { detectShotType, shotTypeSimilarity, tagToShotType } from '@/lib/shot-type';
import type { ShotType } from '@/lib/shot-type';
import type { ReferenceImage, CameraAngle, LightDirection } from '@/types';

/** 유사도 점수가 포함된 이미지 타입 */
export interface ScoredImage extends ReferenceImage {
  /** 최종 복합 유사도 점수 (0~1, undefined면 매칭 비활성) */
  similarityScore?: number;
  /** 포즈 유사도 점수 (개별) */
  poseSimilarity?: number;
  /** 카메라 앵글 유사도 점수 (개별) */
  cameraSimilarity?: number;
  /** 조명 유사도 점수 (개별) */
  lightSimilarity?: number;
  /** 샷 타입 유사도 점수 (개별) */
  shotTypeSimilarity?: number;
}

/** usePoseSearch 훅 반환 타입 */
interface PoseSearchResult {
  /** 정렬된 이미지 목록 (유사도 내림차순 또는 원본 순서) */
  images: ScoredImage[];
  /** 포즈 매칭이 활성화되었는지 여부 */
  isPoseActive: boolean;
  /** 현재 마네킹의 포즈 벡터 */
  currentPoseVector: number[] | null;
  /** 카메라 앵글 매칭 활성 여부 */
  isCameraActive: boolean;
  /** 조명 매칭 활성 여부 */
  isLightActive: boolean;
  /** 샷 타입 매칭 활성 여부 */
  isShotTypeActive: boolean;
  /** 현재 감지된 샷 타입 */
  currentShotType: ShotType | null;
}

/**
 * 관절이 기본 포즈(모든 값 0)인지 확인
 * 하나라도 0이 아닌 관절이 있으면 false
 */
function checkIsDefaultPose(
  joints: Record<string, [number, number, number]>
): boolean {
  const threshold = 0.01; // 라디안 기준 약 0.57도
  for (const rotation of Object.values(joints)) {
    if (
      Math.abs(rotation[0]) > threshold ||
      Math.abs(rotation[1]) > threshold ||
      Math.abs(rotation[2]) > threshold
    ) {
      return false;
    }
  }
  return true;
}

/**
 * 활성화된 유사도 종류에 따라 가중치를 동적으로 분배
 * 4중 모두 활성: 포즈 40% + 카메라 15% + 조명 25% + 샷타입 20%
 * 부분 활성 시 비활성 가중치를 나머지에 비례 재분배
 */
function computeCombinedScore(
  poseSim: number | undefined,
  cameraSim: number | undefined,
  lightSim: number | undefined,
  shotSim: number | undefined,
): number | undefined {
  // 가중치 기본값: 포즈 40%, 카메라 15%, 조명 25%, 샷타입 20%
  const weights: [number | undefined, number][] = [
    [poseSim, 0.40],
    [cameraSim, 0.15],
    [lightSim, 0.25],
    [shotSim, 0.20],
  ];

  // 활성화된 항목만 필터
  const active = weights.filter(([sim]) => sim !== undefined);
  if (active.length === 0) return undefined;

  // 활성 가중치 합 계산 → 1.0으로 정규화
  const totalWeight = active.reduce((sum, [, w]) => sum + w, 0);

  // 정규화된 가중 합산
  let score = 0;
  for (const [sim, w] of active) {
    score += sim! * (w / totalWeight);
  }

  return score;
}

/**
 * 하이브리드 검색 훅
 * - 관절이 기본값이면: 태그 전용 모드 (포즈 매칭 비활성)
 * - 관절이 변경되면: 태그 필터 + 포즈 유사도 정렬
 * - 카메라 앵글이 주어지면: 카메라 유사도도 합산
 * - 조명 방향이 주어지면: 조명 유사도도 합산
 *
 * @param filteredImages 태그/카테고리로 필터된 이미지 목록
 * @param poseMatchEnabled 포즈 매칭 토글 상태
 * @param currentCameraAngle 현재 3D 뷰어의 카메라 앵글 (선택적)
 * @param externalPoseVector 외부 포즈 벡터 (이미지 추출)
 * @param externalWeights 외부 포즈 가중치 (신뢰도 기반)
 * @param currentLightDirection 현재 3D 뷰어 키라이트 방향 (선택적)
 * @param cameraDistance 현재 카메라와 마네킹 사이 거리 (샷 타입 감지용, 선택적)
 * @param cameraFov 현재 카메라 FOV (샷 타입 감지용, 선택적)
 * @returns 유사도 점수 포함된 정렬 결과
 */
export function usePoseSearch(
  filteredImages: ReferenceImage[],
  poseMatchEnabled: boolean = true,
  currentCameraAngle?: CameraAngle | null,
  externalPoseVector?: number[] | null,
  externalWeights?: number[] | null,
  currentLightDirection?: LightDirection | null,
  cameraDistance?: number | null,
  cameraFov?: number | null,
): PoseSearchResult {
  const joints = usePoseStore((s) => s.joints);

  // 기본 포즈 여부 확인
  const isDefault = useMemo(() => checkIsDefaultPose(joints), [joints]);

  // 외부 포즈 벡터 활성 여부 (이미지 업로드 추출)
  const isExternalPose = !!externalPoseVector && externalPoseVector.length === 51;

  // 포즈 매칭 활성화 조건: 외부 벡터 또는 (토글 켜짐 + 기본 포즈 아님)
  const isPoseActive = isExternalPose || (poseMatchEnabled && !isDefault);

  // 카메라 앵글 매칭 활성 여부
  const isCameraActive = !!currentCameraAngle;

  // 조명 매칭 활성 여부
  const isLightActive = !!currentLightDirection;

  // 샷 타입 감지: 카메라 거리 + FOV가 모두 있을 때 자동 감지
  const currentShotType: ShotType | null = useMemo(() => {
    if (cameraDistance != null && cameraDistance > 0 && cameraFov != null && cameraFov > 0) {
      return detectShotType(cameraDistance, cameraFov);
    }
    return null;
  }, [cameraDistance, cameraFov]);

  // 샷 타입 매칭 활성 여부 (카메라 샷 타입이 감지된 경우)
  const isShotTypeActive = currentShotType !== null;

  // 하이브리드 모드 활성화 (포즈, 카메라, 조명, 샷타입 중 하나라도 활성)
  const isHybridActive = isPoseActive || isCameraActive || isLightActive || isShotTypeActive;

  // 현재 포즈 벡터: 외부 벡터 우선, 없으면 마네킹 FK 사용
  const currentPoseVector = useMemo(() => {
    if (isExternalPose) return externalPoseVector!;
    if (poseMatchEnabled && !isDefault) return computePoseVector(joints);
    return null;
  }, [joints, isDefault, poseMatchEnabled, isExternalPose, externalPoseVector]);

  // 유사도 계산 + 정렬
  const images = useMemo(() => {
    if (!isHybridActive) {
      // 매칭 비활성 → 원본 순서 유지 (점수 없음)
      return filteredImages.map((img) => ({ ...img } as ScoredImage));
    }

    // 각 이미지에 유사도 계산
    const scored: ScoredImage[] = filteredImages.map((img) => {
      let poseSim: number | undefined;
      let cameraSim: number | undefined;
      let lightSim: number | undefined;
      let shotSim: number | undefined;

      // 포즈 유사도 계산 (외부 가중치가 있으면 신뢰도 기반 가중 비교)
      if (isPoseActive && currentPoseVector && img.poseVector && img.poseVector.length === 51) {
        const weights = isExternalPose && externalWeights ? externalWeights : undefined;
        poseSim = comparePoses(currentPoseVector, img.poseVector, weights ?? undefined);
      }

      // 카메라 앵글 유사도 계산
      if (isCameraActive && currentCameraAngle && img.cameraAngle) {
        cameraSim = computeCameraAngleSimilarity(currentCameraAngle, img.cameraAngle);
      }

      // 조명 유사도 계산
      if (isLightActive && currentLightDirection && img.lightDirection) {
        lightSim = computeLightSimilarity(currentLightDirection, img.lightDirection);
      }

      // 샷 타입 유사도 계산: 이미지 태그에서 샷 타입 추출 후 비교
      if (isShotTypeActive && currentShotType && img.tags) {
        for (const tag of img.tags) {
          const imgShotType = tagToShotType(tag);
          if (imgShotType) {
            shotSim = shotTypeSimilarity(currentShotType, imgShotType);
            break; // 첫 번째 매칭 태그 사용
          }
        }
      }

      // 동적 가중치 복합 점수 계산 (4차원: 포즈 + 카메라 + 조명 + 샷타입)
      const combinedScore = computeCombinedScore(poseSim, cameraSim, lightSim, shotSim);

      return {
        ...img,
        similarityScore: combinedScore,
        poseSimilarity: poseSim,
        cameraSimilarity: cameraSim,
        lightSimilarity: lightSim,
        shotTypeSimilarity: shotSim,
      };
    });

    // 유사도 점수가 있는 이미지를 상위로, 내림차순 정렬
    scored.sort((a, b) => {
      // 점수 없는 것은 맨 뒤로
      if (a.similarityScore === undefined && b.similarityScore === undefined) return 0;
      if (a.similarityScore === undefined) return 1;
      if (b.similarityScore === undefined) return -1;
      // 높은 점수가 먼저
      return b.similarityScore - a.similarityScore;
    });

    return scored;
  }, [filteredImages, currentPoseVector, isPoseActive, currentCameraAngle, isCameraActive, currentLightDirection, isLightActive, isHybridActive, isShotTypeActive, currentShotType]);

  return { images, isPoseActive, currentPoseVector, isCameraActive, isLightActive, isShotTypeActive, currentShotType };
}
