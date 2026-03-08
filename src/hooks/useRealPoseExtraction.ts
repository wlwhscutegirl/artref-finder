// ============================================
// 실제 포즈 벡터 백그라운드 추출 훅
// 샘플 이미지에서 MediaPipe로 진짜 포즈를 추출하고
// IndexedDB에 캐싱하여 검색 정확도를 비약적으로 향상
// ============================================

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ReferenceImage } from '@/types';
import { loadCachedVectors, saveCachedVector, getCachedCount } from '@/lib/pose-vector-cache';

/** 추출 진행 상태 */
export interface ExtractionProgress {
  /** 전체 대상 이미지 수 */
  total: number;
  /** 추출 완료 수 */
  completed: number;
  /** 추출 중인지 여부 */
  isExtracting: boolean;
  /** 진행률 (0~100) */
  percent: number;
}

/**
 * 실제 포즈 벡터 백그라운드 추출 훅
 * - 첫 방문: IndexedDB 캐시 로드 → 미추출 이미지 백그라운드 추출
 * - 재방문: 캐시에서 즉시 로드 (추출 불필요)
 * - figure/anatomy 카테고리만 추출 대상
 *
 * @param images 원본 이미지 배열
 * @returns [실제 벡터가 병합된 이미지 배열, 추출 진행 상태]
 */
export function useRealPoseExtraction(
  images: ReferenceImage[]
): [ReferenceImage[], ExtractionProgress] {
  // 실제 벡터가 병합된 이미지 (렌더링용)
  const [enhancedImages, setEnhancedImages] = useState<ReferenceImage[]>(images);
  // 추출 진행 상태
  const [progress, setProgress] = useState<ExtractionProgress>({
    total: 0,
    completed: 0,
    isExtracting: false,
    percent: 100,
  });

  // 중단 플래그 (언마운트 시 정리)
  const abortRef = useRef(false);
  // 추출 중복 방지 (이미 시작된 경우 재실행 방지)
  const extractingRef = useRef(false);
  // 실시간 벡터 맵 (콜백 내에서 참조)
  const vectorMapRef = useRef<Map<string, number[] | null>>(new Map());

  /**
   * 단일 이미지에서 포즈 벡터 추출
   * MediaPipe WASM 로드 → 이미지 로드 → 랜드마크 추출 → 벡터 변환
   */
  const extractSingleImage = useCallback(
    async (image: ReferenceImage): Promise<number[] | null> => {
      try {
        // 이미지 HTMLElement 생성
        const img = new Image();
        img.crossOrigin = 'anonymous';

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('이미지 로드 실패'));
          // 썸네일 사용 (속도 우선, 400px이면 포즈 추출 충분)
          img.src = image.thumbnailUrl;
        });

        // MediaPipe 포즈 추출 (동적 import로 번들 영향 최소화)
        const { extractPoseFromImage } = await import('@/lib/mediapipe-pose');
        const result = await extractPoseFromImage(img);

        if (!result || result.confidence < 0.3) {
          return null; // 포즈 미감지 또는 신뢰도 너무 낮음
        }

        // 랜드마크 → 관절 → 벡터 변환
        const { mapLandmarksToJoints, jointsToVector } = await import(
          '@/lib/landmark-mapping'
        );
        const joints = mapLandmarksToJoints(result.landmarks);
        const vector = jointsToVector(joints);

        return vector.length === 51 ? vector : null;
      } catch {
        return null; // 추출 실패 → null (합성 벡터 폴백)
      }
    },
    []
  );

  /**
   * 메인 추출 로직
   * 1. 캐시 로드
   * 2. 캐시 미스 이미지 → 백그라운드 순차 추출
   * 3. 추출 결과 → 캐시 저장 + 이미지 배열 업데이트
   */
  useEffect(() => {
    if (images.length === 0) return;

    // 추출 대상: figure/anatomy 카테고리만
    const extractTargets = images.filter(
      (img) => img.category === 'figure' || img.category === 'anatomy'
    );

    if (extractTargets.length === 0) {
      setEnhancedImages(images);
      return;
    }

    let isMounted = true;
    abortRef.current = false;

    const run = async () => {
      // 1단계: 캐시에서 기존 벡터 로드
      const targetIds = extractTargets.map((img) => img._id);
      const cached = await loadCachedVectors(targetIds);

      // 벡터 맵 초기화 (캐시된 것 먼저 적용)
      const vMap = new Map<string, number[] | null>();
      for (const [id, entry] of cached) {
        vMap.set(id, entry.poseVector);
      }
      vectorMapRef.current = vMap;

      // 캐시 적용된 이미지 즉시 반영
      if (isMounted) {
        setEnhancedImages(applyVectors(images, vMap));
      }

      // 2단계: 미추출 이미지 필터
      const uncached = extractTargets.filter((img) => !cached.has(img._id));

      if (uncached.length === 0) {
        // 모두 캐시 히트 → 추출 불필요
        if (isMounted) {
          setProgress({ total: 0, completed: 0, isExtracting: false, percent: 100 });
        }
        return;
      }

      // 이미 추출 중이면 중복 실행 방지
      if (extractingRef.current) return;
      extractingRef.current = true;

      // 3단계: 백그라운드 순차 추출 시작
      if (isMounted) {
        setProgress({
          total: uncached.length,
          completed: 0,
          isExtracting: true,
          percent: 0,
        });
      }

      // MediaPipe 초기화 (최초 1회)
      try {
        const { initPoseLandmarker } = await import('@/lib/mediapipe-pose');
        await initPoseLandmarker();
      } catch (err) {
        console.error('[RealPose] MediaPipe 초기화 실패:', err);
        extractingRef.current = false;
        if (isMounted) {
          setProgress((p) => ({ ...p, isExtracting: false }));
        }
        return;
      }

      // 순차 추출 (병렬 시 메모리 이슈)
      let completedCount = 0;

      for (const img of uncached) {
        if (abortRef.current || !isMounted) break;

        const vector = await extractSingleImage(img);

        // 캐시 저장 (비동기, 실패 무시)
        saveCachedVector({
          imageId: img._id,
          poseVector: vector,
          extractedAt: Date.now(),
          source: vector ? 'mediapipe' : 'fallback',
        });

        // 벡터 맵 업데이트
        vMap.set(img._id, vector);
        vectorMapRef.current = vMap;
        completedCount++;

        // 5장마다 UI 업데이트 (추출 결과 빠르게 반영)
        if (isMounted && (completedCount % 5 === 0 || completedCount === uncached.length)) {
          setEnhancedImages(applyVectors(images, new Map(vMap)));
          setProgress({
            total: uncached.length,
            completed: completedCount,
            isExtracting: completedCount < uncached.length,
            percent: Math.round((completedCount / uncached.length) * 100),
          });
        }
      }

      extractingRef.current = false;

      // 최종 업데이트
      if (isMounted) {
        setEnhancedImages(applyVectors(images, new Map(vMap)));
        setProgress({
          total: uncached.length,
          completed: completedCount,
          isExtracting: false,
          percent: 100,
        });
      }

      // 캐시 통계 로그
      const cachedTotal = await getCachedCount();
      console.log(
        `[RealPose] 추출 완료: ${completedCount}/${uncached.length}장 (총 캐시: ${cachedTotal}장)`
      );
    };

    run();

    return () => {
      isMounted = false;
      abortRef.current = true;
    };
    // images 참조가 변경될 때만 재실행 (length 기반)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length, extractSingleImage]);

  return [enhancedImages, progress];
}

/**
 * 실제 벡터를 이미지 배열에 병합
 * 실제 벡터가 있으면 합성 벡터를 대체, 없으면 기존 유지
 */
function applyVectors(
  images: ReferenceImage[],
  vectorMap: Map<string, number[] | null>
): ReferenceImage[] {
  return images.map((img) => {
    const realVector = vectorMap.get(img._id);

    if (realVector && realVector.length === 51) {
      // 실제 벡터로 대체
      return { ...img, poseVector: realVector };
    }

    if (vectorMap.has(img._id) && realVector === null) {
      // 추출 시도했지만 실패 → 기존 합성 벡터 유지
      return img;
    }

    // 캐시에 없음 → 기존 유지 (아직 추출 전)
    return img;
  });
}
