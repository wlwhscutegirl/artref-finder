'use client';

// ============================================
// 이미지 업로드 존: 드래그앤드롭 + 파일 선택
// MediaPipe 포즈 추출 → 프리뷰 → 검색/마네킹 적용
// ============================================

import { useState, useRef, useCallback } from 'react';
import { extractPoseFromImage, initPoseLandmarker } from '@/lib/mediapipe-pose';
import { mapLandmarksToJoints, jointsToVector, jointsToWeights, jointsToRecord } from '@/lib/landmark-mapping';
import { computeInverseFK } from '@/lib/inverse-fk';
import { PoseOverlay } from './pose-overlay';
import type { ArtRefJointPosition } from '@/lib/landmark-mapping';
import type { JointId } from '@/stores/pose-store';

/** 상태 머신 */
type UploadState = 'idle' | 'loading-engine' | 'extracting' | 'preview' | 'error';

interface ImageUploadZoneProps {
  /** 추출 완료 콜백 (포즈 벡터 + 가중치) */
  onPoseExtracted: (result: {
    poseVector: number[];
    jointWeights: number[];
  }) => void;
  /** 마네킹 적용 콜백 */
  onApplyToMannequin?: (rotations: Record<JointId, [number, number, number]>) => void;
  /** 비활성화 (플랜 제한 등) */
  disabled?: boolean;
  /** 남은 추출 횟수 (-1 = 무제한) */
  remainingExtractions?: number;
}

/** 허용 파일 형식 */
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
/** 최대 파일 크기 (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function ImageUploadZone({
  onPoseExtracted,
  onApplyToMannequin,
  disabled = false,
  remainingExtractions,
}: ImageUploadZoneProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [joints, setJoints] = useState<ArtRefJointPosition[] | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewSize, setPreviewSize] = useState({ width: 300, height: 300 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  /** 파일 유효성 검사 */
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) return 'JPG, PNG, WebP만 지원합니다.';
    if (file.size > MAX_FILE_SIZE) return '10MB 이하 파일만 업로드 가능합니다.';
    return null;
  };

  /** 이미지 로드 + 포즈 추출 실행 */
  const processImage = useCallback(async (file: File) => {
    // 유효성 검사
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      setState('error');
      return;
    }

    // 이미지 URL 생성
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setJoints(null);
    setErrorMessage('');

    // MediaPipe 엔진 로드
    setState('loading-engine');
    try {
      await initPoseLandmarker();
    } catch {
      setErrorMessage('포즈 인식 엔진을 로드할 수 없습니다. 네트워크를 확인해주세요.');
      setState('error');
      return;
    }

    // 이미지 로드 대기
    setState('extracting');
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = url;
    }).catch(() => {
      setErrorMessage('이미지를 로드할 수 없습니다.');
      setState('error');
      return;
    });

    // 포즈 추출
    const result = await extractPoseFromImage(img);

    if (!result) {
      setErrorMessage('이미지에서 포즈를 감지하지 못했습니다. 사람이 잘 보이는 사진을 사용해주세요.');
      setState('error');
      return;
    }

    // 전체 신뢰도 체크
    if (result.confidence < 0.3) {
      setErrorMessage('포즈 인식 신뢰도가 너무 낮습니다. 더 선명한 사진을 사용해주세요.');
      setState('error');
      return;
    }

    // 33 → 17 관절 매핑
    const mappedJoints = mapLandmarksToJoints(result.landmarks);
    if (mappedJoints.length !== 17) {
      setErrorMessage('관절 매핑에 실패했습니다.');
      setState('error');
      return;
    }

    // 프리뷰 크기 계산
    const maxW = 300;
    const ratio = img.naturalHeight / img.naturalWidth;
    setPreviewSize({ width: maxW, height: Math.round(maxW * ratio) });

    setJoints(mappedJoints);
    setConfidence(result.confidence);
    setProcessingTime(result.processingTime);
    setState('preview');
  }, []);

  /** 검색 실행 */
  const handleSearch = useCallback(() => {
    if (!joints) return;
    const poseVector = jointsToVector(joints);
    const jointWeights = jointsToWeights(joints);
    if (poseVector.length === 0) return;
    onPoseExtracted({ poseVector, jointWeights });
  }, [joints, onPoseExtracted]);

  /** 마네킹 적용 */
  const handleApplyToMannequin = useCallback(() => {
    if (!joints || !onApplyToMannequin) return;
    const positions = jointsToRecord(joints);
    const rotations = computeInverseFK(positions);
    onApplyToMannequin(rotations);
  }, [joints, onApplyToMannequin]);

  /** 초기화 */
  const handleReset = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setJoints(null);
    setState('idle');
    setErrorMessage('');
  }, [imageUrl]);

  /** 드래그 이벤트 핸들러 */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) processImage(file);
  };

  /** 파일 선택 핸들러 */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
    // 같은 파일 재선택 허용
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      {/* === idle / 드롭존 === */}
      {(state === 'idle' || state === 'error') && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors
            ${disabled
              ? 'border-neutral-800 bg-neutral-900/50 cursor-not-allowed opacity-50'
              : isDragOver
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-neutral-700 bg-neutral-900/30 hover:border-neutral-600 hover:bg-neutral-800/30'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          {/* 카메라 아이콘 (SVG) */}
          <svg className="w-7 h-7 mx-auto mb-1 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
          <p className="text-xs text-neutral-400">
            사진을 드래그하거나 클릭하여 업로드
          </p>
          <p className="text-[10px] text-neutral-600 mt-1">
            JPG, PNG, WebP (최대 10MB)
          </p>
          {remainingExtractions !== undefined && remainingExtractions !== -1 && (
            <p className="text-[10px] text-neutral-500 mt-1">
              오늘 남은 횟수: {remainingExtractions}회
            </p>
          )}
        </div>
      )}

      {/* 에러 메시지 */}
      {state === 'error' && errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <p className="text-[11px] text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* === 로딩 === */}
      {(state === 'loading-engine' || state === 'extracting') && (
        <div className="border border-neutral-700 rounded-xl p-6 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-xs text-neutral-400">
            {state === 'loading-engine' ? '포즈 인식 엔진 로딩 중...' : '포즈 추출 중...'}
          </p>
        </div>
      )}

      {/* === 프리뷰 === */}
      {state === 'preview' && imageUrl && joints && (
        <div className="border border-neutral-700 rounded-xl overflow-hidden">
          {/* 이미지 + 오버레이 */}
          <div className="relative mx-auto" style={{ width: previewSize.width, height: previewSize.height }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageUrl}
              alt="업로드 이미지"
              className="w-full h-full object-cover"
            />
            <PoseOverlay
              joints={joints}
              width={previewSize.width}
              height={previewSize.height}
            />
          </div>

          {/* 메타 정보 */}
          <div className="px-3 py-2 bg-neutral-800/50 flex items-center justify-between text-[10px] text-neutral-500">
            <span>신뢰도: {Math.round(confidence * 100)}%</span>
            <span>{processingTime}ms</span>
          </div>

          {/* 액션 버튼 */}
          <div className="px-3 py-2 flex gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded-lg text-xs font-medium text-white cursor-pointer transition-colors"
            >
              비슷한 포즈 찾기
            </button>
            {onApplyToMannequin && (
              <button
                onClick={handleApplyToMannequin}
                className="flex-1 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-xs font-medium text-neutral-300 cursor-pointer transition-colors"
              >
                마네킹에 적용
              </button>
            )}
          </div>

          {/* 리셋 */}
          <div className="px-3 pb-2">
            <button
              onClick={handleReset}
              className="w-full text-[10px] text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors"
            >
              다른 사진 선택
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
