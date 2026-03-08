// ============================================
// 스케치 → 포즈 벡터 변환 (Phase 7)
// 캔버스 dataURL → MediaPipe 포즈 추출 → 검색용 벡터 반환
// Phase 4의 extractPoseFromImage 파이프라인 재활용
// ============================================

import { extractPoseFromImage, initPoseLandmarker } from '@/lib/mediapipe-pose';
import { mapLandmarksToJoints, jointsToVector, jointsToWeights } from '@/lib/landmark-mapping';

/** 스케치 포즈 추출 결과 */
export interface SketchPoseResult {
  /** 포즈 벡터 (usePoseSearch 입력용) */
  poseVector: number[];
  /** 관절별 신뢰도 가중치 */
  jointWeights: number[];
  /** 전체 신뢰도 (0~1) */
  confidence: number;
  /** 처리 시간 (ms) */
  processingTime: number;
}

/**
 * dataURL → HTMLImageElement 변환 유틸
 */
function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = dataUrl;
  });
}

/**
 * 스케치 이미지(dataURL)에서 포즈 벡터 추출
 *
 * 1. dataURL → Image 객체 변환
 * 2. MediaPipe PoseLandmarker로 33개 랜드마크 추출
 * 3. 33→17 관절 매핑 + 벡터 생성
 *
 * @param dataUrl 캔버스 또는 업로드 이미지의 dataURL
 * @returns 포즈 벡터 + 가중치, 사람 형체 없으면 null
 */
export async function sketchToPose(
  dataUrl: string
): Promise<SketchPoseResult | null> {
  try {
    // MediaPipe 엔진 사전 초기화
    await initPoseLandmarker();

    // dataURL → Image 변환
    const img = await loadImageFromDataUrl(dataUrl);

    // MediaPipe 포즈 추출
    const result = await extractPoseFromImage(img);
    if (!result) return null;

    // 33개 랜드마크 → 17개 ArtRef 관절 매핑
    const joints = mapLandmarksToJoints(result.landmarks);
    if (joints.length !== 17) return null;

    // 관절 → 포즈 벡터 + 가중치 변환
    const poseVector = jointsToVector(joints);
    const jointWeights = jointsToWeights(joints);

    if (poseVector.length === 0) return null;

    return {
      poseVector,
      jointWeights,
      confidence: result.confidence,
      processingTime: result.processingTime,
    };
  } catch (error) {
    console.error('[SketchToPose] 포즈 추출 실패:', error);
    return null;
  }
}
