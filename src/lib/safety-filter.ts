// ============================================
// 콘텐츠 안전 필터 (NSFW 감지)
// nsfwjs (TensorFlow.js 브라우저) + Unsplash content_filter 이중 필터
// 교육 모드: safetyScore < 0.3만 표시
// ============================================

/** NSFW 분류 결과 */
export interface SafetyClassification {
  /** 종합 안전 점수 (0=안전, 1=위험) */
  score: number;
  /** 세부 분류별 확률 */
  predictions: {
    neutral: number;
    drawing: number;
    hentai: number;
    porn: number;
    sexy: number;
  };
  /** 처리 소요 시간 (ms) */
  processingTime: number;
}

/** 안전 레벨 임계값 */
export const SAFETY_THRESHOLDS = {
  /** 교육 모드 (매우 엄격): 0.3 이하만 허용 */
  strict: 0.3,
  /** 일반 모드 (보통): 0.6 이하만 허용 */
  moderate: 0.6,
  /** 필터 끔: 전체 허용 */
  off: 1.0,
} as const;

export type SafetyLevel = keyof typeof SAFETY_THRESHOLDS;

// nsfwjs 모델 싱글톤
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nsfwModel: any = null;
let isModelLoading = false;

/**
 * nsfwjs 모델 초기화 (지연 로딩)
 * TensorFlow.js + nsfwjs 모델 (~3MB)
 */
async function loadModel() {
  if (nsfwModel) return nsfwModel;
  if (isModelLoading) {
    // 다른 곳에서 로딩 중이면 대기
    while (isModelLoading) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return nsfwModel;
  }

  isModelLoading = true;

  try {
    // 동적 import (코드 스플리팅)
    const nsfwjs = await import('nsfwjs');
    // MobileNetV2 모델 (경량, 브라우저 최적화)
    nsfwModel = await nsfwjs.load();
    return nsfwModel;
  } catch (err) {
    console.error('[safety-filter] nsfwjs 모델 로드 실패:', err);
    return null;
  } finally {
    isModelLoading = false;
  }
}

/**
 * 이미지 URL로 NSFW 분류 실행
 * HTMLImageElement를 생성하여 nsfwjs에 전달
 */
export async function classifyImageUrl(imageUrl: string): Promise<SafetyClassification | null> {
  const startTime = performance.now();

  try {
    const model = await loadModel();
    if (!model) {
      // 모델 로드 실패 → 안전으로 간주 (Unsplash content_filter에 의존)
      return {
        score: 0,
        predictions: { neutral: 1, drawing: 0, hentai: 0, porn: 0, sexy: 0 },
        processingTime: 0,
      };
    }

    // 이미지 로드
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = imageUrl;
    });

    // 분류 실행
    const predictions = await model.classify(img);

    // 결과 파싱
    const predMap: Record<string, number> = {};
    for (const p of predictions) {
      predMap[p.className.toLowerCase()] = p.probability;
    }

    // 종합 점수 계산: porn + hentai + sexy(가중치 0.5)
    const score = Math.min(1, (predMap.porn || 0) + (predMap.hentai || 0) + (predMap.sexy || 0) * 0.5);

    return {
      score: Math.round(score * 1000) / 1000,
      predictions: {
        neutral: predMap.neutral || 0,
        drawing: predMap.drawing || 0,
        hentai: predMap.hentai || 0,
        porn: predMap.porn || 0,
        sexy: predMap.sexy || 0,
      },
      processingTime: Math.round(performance.now() - startTime),
    };
  } catch (err) {
    console.error('[safety-filter] 분류 실패:', err);
    return null;
  }
}

/**
 * HTMLImageElement로 직접 NSFW 분류
 * 배치 추출 시 이미지 재로드 방지용
 */
export async function classifyImage(img: HTMLImageElement): Promise<SafetyClassification | null> {
  const startTime = performance.now();

  try {
    const model = await loadModel();
    if (!model) {
      return {
        score: 0,
        predictions: { neutral: 1, drawing: 0, hentai: 0, porn: 0, sexy: 0 },
        processingTime: 0,
      };
    }

    const predictions = await model.classify(img);
    const predMap: Record<string, number> = {};
    for (const p of predictions) {
      predMap[p.className.toLowerCase()] = p.probability;
    }

    const score = Math.min(1, (predMap.porn || 0) + (predMap.hentai || 0) + (predMap.sexy || 0) * 0.5);

    return {
      score: Math.round(score * 1000) / 1000,
      predictions: {
        neutral: predMap.neutral || 0,
        drawing: predMap.drawing || 0,
        hentai: predMap.hentai || 0,
        porn: predMap.porn || 0,
        sexy: predMap.sexy || 0,
      },
      processingTime: Math.round(performance.now() - startTime),
    };
  } catch {
    return null;
  }
}

/**
 * 안전 점수가 주어진 레벨을 통과하는지 확인
 */
export function isSafe(safetyScore: number | undefined, level: SafetyLevel): boolean {
  if (level === 'off') return true;
  const threshold = SAFETY_THRESHOLDS[level];
  return (safetyScore ?? 0) <= threshold;
}

/**
 * nsfwjs 모델 메모리 해제
 * 배치 처리 완료 후 호출
 */
export function disposeModel() {
  if (nsfwModel) {
    try {
      nsfwModel.dispose?.();
    } catch { /* ignore */ }
    nsfwModel = null;
  }
}
