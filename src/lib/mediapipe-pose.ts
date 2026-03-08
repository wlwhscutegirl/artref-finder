// ============================================
// MediaPipe PoseLandmarker 초기화 + 이미지 포즈 추출
// WASM 기반 브라우저 내 실행, 서버 불필요
// dynamic import로 지연 로딩 (~5MB)
// ============================================

import type { MediaPipeLandmark } from '@/lib/landmark-mapping';

/** MediaPipe 추출 결과 */
export interface PoseExtractionResult {
  /** 33개 MediaPipe 랜드마크 */
  landmarks: MediaPipeLandmark[];
  /** 추출 소요 시간 (ms) */
  processingTime: number;
  /** 전체 신뢰도 (0~1, 감지된 관절의 평균 visibility) */
  confidence: number;
}

// 싱글톤 인스턴스 (초기화 후 재사용)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let poseLandmarker: any = null;
let isInitializing = false;

/** 최대 이미지 크기 (모바일 성능 최적화) */
const MAX_IMAGE_SIZE = 512;

/**
 * 이미지를 최대 크기로 리사이즈 (Canvas 사용)
 * 원본이 MAX_IMAGE_SIZE 이하면 그대로 반환
 */
async function resizeImageIfNeeded(image: HTMLImageElement): Promise<HTMLImageElement | HTMLCanvasElement> {
  const { naturalWidth: w, naturalHeight: h } = image;

  if (w <= MAX_IMAGE_SIZE && h <= MAX_IMAGE_SIZE) return image;

  // 비율 유지 축소
  const scale = MAX_IMAGE_SIZE / Math.max(w, h);
  const newW = Math.round(w * scale);
  const newH = Math.round(h * scale);

  const canvas = document.createElement('canvas');
  canvas.width = newW;
  canvas.height = newH;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0, newW, newH);

  return canvas;
}

/**
 * MediaPipe PoseLandmarker 싱글톤 초기화
 * - 최초 호출 시 WASM 모듈 다운로드 (~5MB)
 * - GPU delegate 우선, CPU fallback
 * - 이미 초기화됐으면 즉시 반환
 */
export async function initPoseLandmarker(): Promise<void> {
  if (poseLandmarker) return;
  if (isInitializing) {
    // 동시 호출 방지: 초기화 완료 대기
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (poseLandmarker || !isInitializing) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
    return;
  }

  isInitializing = true;

  try {
    // dynamic import로 번들 크기 최소화
    const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');

    // WASM 파일셋 로드 (CDN)
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    // PoseLandmarker 생성
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
        delegate: 'GPU', // GPU 우선, 실패 시 자동 CPU fallback
      },
      runningMode: 'IMAGE',
      numPoses: 1, // 단일 인물 (다인 미지원)
    });
  } catch (error) {
    console.error('[MediaPipe] 초기화 실패:', error);
    throw new Error('MediaPipe 포즈 인식 엔진을 로드할 수 없습니다.');
  } finally {
    isInitializing = false;
  }
}

/**
 * 이미지에서 포즈 랜드마크 추출
 * @param image 분석할 이미지 엘리먼트
 * @returns 33개 랜드마크 + 메타데이터, 실패 시 null
 */
export async function extractPoseFromImage(
  image: HTMLImageElement
): Promise<PoseExtractionResult | null> {
  // 초기화 확인
  if (!poseLandmarker) {
    await initPoseLandmarker();
  }
  if (!poseLandmarker) return null;

  try {
    const startTime = performance.now();

    // 이미지 리사이즈 (모바일 성능)
    const processImage = await resizeImageIfNeeded(image);

    // MediaPipe 포즈 추출 실행
    const result = poseLandmarker.detect(processImage);
    const processingTime = Math.round(performance.now() - startTime);

    // 포즈 미감지
    if (!result.landmarks || result.landmarks.length === 0) {
      return null;
    }

    // 첫 번째 인물의 33개 랜드마크
    // worldLandmarks가 있으면 3D 좌표 사용, 없으면 2D + z 추정
    const rawLandmarks = result.worldLandmarks?.[0] || result.landmarks[0];

    const landmarks: MediaPipeLandmark[] = rawLandmarks.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (lm: any) => ({
        x: lm.x ?? 0,
        y: lm.y ?? 0,
        z: lm.z ?? 0,
        visibility: lm.visibility ?? 0,
      })
    );

    // 전체 신뢰도 (평균 visibility)
    const confidence =
      landmarks.reduce((sum, lm) => sum + lm.visibility, 0) / landmarks.length;

    return { landmarks, processingTime, confidence };
  } catch (error) {
    console.error('[MediaPipe] 포즈 추출 실패:', error);
    return null;
  }
}

/**
 * PoseLandmarker 리소스 해제
 */
export function disposePoseLandmarker(): void {
  if (poseLandmarker) {
    poseLandmarker.close();
    poseLandmarker = null;
  }
}
