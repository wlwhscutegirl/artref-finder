'use client';

// ============================================
// 일괄 포즈 벡터 추출 관리 페이지
// MediaPipe WASM 브라우저에서 순차 처리
// 200개마다 메모리 리셋, 실패 시 태그 기반 폴백
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { fetchUnextractedImages, updateImage } from '@/lib/image-service';
import { inferLightDirection, inferCameraAngle } from '@/lib/unsplash-vector-heuristics';
import { classifyImage } from '@/lib/safety-filter';
import type { ReferenceImage } from '@/types';

/** 추출 작업 상태 */
interface ExtractionState {
  /** 대기 중인 이미지 목록 */
  queue: ReferenceImage[];
  /** 처리 완료 수 */
  completed: number;
  /** 성공 수 */
  success: number;
  /** 실패 (폴백 적용) 수 */
  fallback: number;
  /** 총 대상 수 */
  total: number;
  /** 현재 처리 중인 이미지 */
  currentImage: ReferenceImage | null;
  /** 실행 상태 */
  status: 'idle' | 'loading' | 'running' | 'paused' | 'done';
  /** 초당 처리 속도 */
  speed: number;
  /** 예상 남은 시간 (초) */
  eta: number;
}

export default function BatchExtractPage() {
  const [state, setState] = useState<ExtractionState>({
    queue: [],
    completed: 0,
    success: 0,
    fallback: 0,
    total: 0,
    currentImage: null,
    status: 'idle',
    speed: 0,
    eta: 0,
  });

  // 일시정지 플래그 (ref로 비동기 루프 제어)
  const pauseRef = useRef(false);
  // 중단 플래그
  const abortRef = useRef(false);
  // MediaPipe 인스턴스 (동적 로드)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const poseLandmarkerRef = useRef<any>(null);
  // 처리 시작 시각
  const startTimeRef = useRef(0);

  /**
   * 미추출 이미지 목록 로드
   */
  const loadQueue = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));

    try {
      // 전체 미추출 이미지 조회 (최대 5000장)
      const allImages: ReferenceImage[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore && allImages.length < 5000) {
        const result = await fetchUnextractedImages(page, 100);
        allImages.push(...result.images);
        hasMore = result.hasNextPage;
        page++;
      }

      setState((s) => ({
        ...s,
        queue: allImages,
        total: allImages.length,
        completed: 0,
        success: 0,
        fallback: 0,
        status: 'idle',
      }));
    } catch (err) {
      console.error('[extract] 이미지 목록 로드 실패:', err);
      setState((s) => ({ ...s, status: 'idle' }));
    }
  }, []);

  // 페이지 로드 시 미추출 이미지 수 확인
  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  /**
   * MediaPipe PoseLandmarker 초기화/메모리 해제
   */
  const initPoseLandmarker = useCallback(async () => {
    // 기존 인스턴스 해제
    if (poseLandmarkerRef.current) {
      try {
        poseLandmarkerRef.current.close();
      } catch { /* ignore */ }
      poseLandmarkerRef.current = null;
    }

    // mediapipe-pose 모듈의 initPoseLandmarker 사용
    const { initPoseLandmarker: init } = await import('@/lib/mediapipe-pose');
    await init();
    poseLandmarkerRef.current = true; // 싱글톤이므로 플래그만 저장
  }, []);

  /**
   * 단일 이미지 포즈 추출
   * 성공 시 poseVector 저장, 실패 시 태그 기반 휴리스틱 폴백
   */
  const processImage = useCallback(async (image: ReferenceImage): Promise<boolean> => {
    try {
      // 이미지를 HTMLImageElement로 로드
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('이미지 로드 실패'));
        img.src = image.url;
      });

      // MediaPipe 포즈 추출
      const { extractPoseFromImage } = await import('@/lib/mediapipe-pose');
      const result = await extractPoseFromImage(img);

      if (result) {
        // 포즈 추출 성공 → 벡터 저장
        const { mapLandmarksToJoints, jointsToVector } = await import('@/lib/landmark-mapping');
        const joints = mapLandmarksToJoints(result.landmarks);
        const poseVector = jointsToVector(joints);

        // EXIF/태그 기반 조명·카메라 추론
        const lightDirection = inferLightDirection(
          image.unsplashMeta?.exif,
          image.tags
        );
        const cameraAngle = inferCameraAngle(
          image.unsplashMeta?.exif,
          image.tags
        );

        // NSFW 안전 분류 (이미지가 이미 로드된 상태이므로 재활용)
        const safetyResult = await classifyImage(img);
        const safetyScore = safetyResult?.score ?? 0;

        await updateImage(image._id, {
          poseVector,
          poseExtracted: true,
          safetyScore,
          ...(lightDirection && { lightDirection }),
          ...(cameraAngle && { cameraAngle }),
        });

        return true;
      }

      // 포즈 인식 실패 → 폴백
      throw new Error('포즈 감지 실패');
    } catch {
      // 폴백: 태그 기반 휴리스틱만 저장
      const lightDirection = inferLightDirection(
        image.unsplashMeta?.exif,
        image.tags
      );
      const cameraAngle = inferCameraAngle(
        image.unsplashMeta?.exif,
        image.tags
      );

      await updateImage(image._id, {
        poseExtracted: true, // 시도 완료 표시
        ...(lightDirection && { lightDirection }),
        ...(cameraAngle && { cameraAngle }),
      });

      return false;
    }
  }, []);

  /**
   * 일괄 추출 시작
   * 순차 처리, 200개마다 MediaPipe 메모리 리셋
   */
  const startExtraction = useCallback(async () => {
    setState((s) => ({ ...s, status: 'running', completed: 0, success: 0, fallback: 0 }));
    pauseRef.current = false;
    abortRef.current = false;
    startTimeRef.current = Date.now();

    // MediaPipe 초기화
    await initPoseLandmarker();

    const queue = state.queue;
    let successCount = 0;
    let fallbackCount = 0;

    for (let i = 0; i < queue.length; i++) {
      // 중단 체크
      if (abortRef.current) break;

      // 일시정지 대기
      while (pauseRef.current) {
        await new Promise((r) => setTimeout(r, 500));
        if (abortRef.current) break;
      }

      // 200개마다 MediaPipe 메모리 리셋
      if (i > 0 && i % 200 === 0) {
        await initPoseLandmarker();
      }

      // 현재 이미지 업데이트
      setState((s) => ({
        ...s,
        currentImage: queue[i],
        completed: i,
      }));

      // 포즈 추출
      const isSuccess = await processImage(queue[i]);
      if (isSuccess) successCount++; else fallbackCount++;

      // 속도·ETA 계산
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const speed = elapsed > 0 ? (i + 1) / elapsed : 0;
      const remaining = queue.length - i - 1;
      const eta = speed > 0 ? remaining / speed : 0;

      setState((s) => ({
        ...s,
        success: successCount,
        fallback: fallbackCount,
        speed: Math.round(speed * 10) / 10,
        eta: Math.round(eta),
      }));
    }

    setState((s) => ({
      ...s,
      status: 'done',
      completed: queue.length,
      currentImage: null,
    }));
  }, [state.queue, initPoseLandmarker, processImage]);

  // 일시정지/재개
  const togglePause = () => {
    pauseRef.current = !pauseRef.current;
    setState((s) => ({ ...s, status: pauseRef.current ? 'paused' : 'running' }));
  };

  // 중단
  const abort = () => {
    abortRef.current = true;
    pauseRef.current = false;
  };

  // 진행률
  const progress = state.total > 0 ? Math.round((state.completed / state.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-xs font-bold">
                A
              </div>
              <span className="font-semibold text-sm">ArtRef</span>
            </Link>
            <span className="text-neutral-600">|</span>
            <span className="text-sm text-neutral-400">벡터 추출</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/pipeline" className="text-xs text-neutral-400 hover:text-white transition-colors">
              수집 파이프라인
            </Link>
            <Link href="/mannequin" className="text-xs text-neutral-400 hover:text-white transition-colors">
              검색
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* 상태 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
            <p className="text-xs text-neutral-500 mb-1">미추출 이미지</p>
            <p className="text-2xl font-bold">{state.total}</p>
          </div>
          <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
            <p className="text-xs text-neutral-500 mb-1">추출 성공</p>
            <p className="text-2xl font-bold text-emerald-400">{state.success}</p>
          </div>
          <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
            <p className="text-xs text-neutral-500 mb-1">폴백 적용</p>
            <p className="text-2xl font-bold text-amber-400">{state.fallback}</p>
          </div>
          <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
            <p className="text-xs text-neutral-500 mb-1">처리 속도</p>
            <p className="text-2xl font-bold">{state.speed} img/s</p>
          </div>
        </div>

        {/* 컨트롤 버튼 */}
        <div className="flex items-center gap-3">
          {state.status === 'idle' && (
            <>
              <button
                onClick={startExtraction}
                disabled={state.total === 0}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                추출 시작 ({state.total}장)
              </button>
              <button
                onClick={loadQueue}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm transition-colors"
              >
                새로고침
              </button>
            </>
          )}
          {(state.status === 'running' || state.status === 'paused') && (
            <>
              <button
                onClick={togglePause}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  state.status === 'paused'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                {state.status === 'paused' ? '재개' : '일시정지'}
              </button>
              <button
                onClick={abort}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors"
              >
                중단
              </button>
            </>
          )}
          {state.status === 'done' && (
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-medium">추출 완료</span>
              <button
                onClick={loadQueue}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm transition-colors"
              >
                다시 확인
              </button>
            </div>
          )}
        </div>

        {/* 진행률 바 */}
        {state.status !== 'idle' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>{progress}% ({state.completed}/{state.total})</span>
              {state.eta > 0 && (
                <span>예상 남은 시간: {Math.floor(state.eta / 60)}분 {state.eta % 60}초</span>
              )}
            </div>
            <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 현재 처리 중인 이미지 미리보기 */}
        {state.currentImage && (
          <div className="flex items-center gap-4 p-4 bg-neutral-900 rounded-xl border border-neutral-800">
            <img
              src={state.currentImage.thumbnailUrl}
              alt={state.currentImage.title}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div>
              <p className="text-sm font-medium truncate max-w-md">{state.currentImage.title}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                태그: {state.currentImage.tags.slice(0, 5).join(', ')}
                {state.currentImage.tags.length > 5 && ` +${state.currentImage.tags.length - 5}`}
              </p>
            </div>
            <div className="ml-auto">
              <span className="w-5 h-5 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin inline-block" />
            </div>
          </div>
        )}

        {/* 안내 */}
        <div className="p-4 bg-neutral-900/50 rounded-xl border border-neutral-800 text-xs text-neutral-500 space-y-1">
          <p>• MediaPipe WASM을 사용하여 브라우저에서 포즈를 추출합니다 (서버 불필요)</p>
          <p>• 200장마다 메모리를 리셋하여 OOM을 방지합니다</p>
          <p>• 포즈 감지 실패 시 태그 기반 조명/카메라 휴리스틱을 폴백으로 적용합니다</p>
          <p>• 3,000장 기준 약 17분 소요됩니다 (3 img/sec)</p>
          <p>• 탭을 닫거나 새로고침하면 진행이 중단됩니다</p>
        </div>
      </main>
    </div>
  );
}
