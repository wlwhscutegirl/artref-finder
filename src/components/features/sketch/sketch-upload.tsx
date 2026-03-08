'use client';

// ============================================
// 스케치 업로드 컴포넌트 (Phase 7)
// 드래그 앤 드롭 / 클릭 업로드로 이미지를 캔버스 배경에 로드
// ============================================

import { useRef, useState, useCallback } from 'react';

interface SketchUploadProps {
  /** 업로드된 이미지 dataURL 콜백 */
  onUpload: (dataUrl: string) => void;
}

/** 허용 파일 형식 */
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
/** 최대 파일 크기 (5MB) */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function SketchUpload({ onUpload }: SketchUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** 파일 유효성 검사 + dataURL 변환 */
  const processFile = useCallback(
    (file: File) => {
      setError(null);

      // 파일 형식 체크
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('PNG, JPEG, WebP 형식만 지원합니다.');
        return;
      }

      // 파일 크기 체크
      if (file.size > MAX_FILE_SIZE) {
        setError('5MB 이하 파일만 업로드할 수 있습니다.');
        return;
      }

      // FileReader로 dataURL 변환
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          onUpload(result);
        }
      };
      reader.readAsDataURL(file);
    },
    [onUpload]
  );

  /** 드래그 이벤트 핸들러 */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  /** 클릭 업로드 핸들러 */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // 같은 파일 재선택 허용
      e.target.value = '';
    },
    [processFile]
  );

  return (
    <div className="space-y-2">
      {/* 드래그 앤 드롭 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
          isDragging
            ? 'border-amber-400 bg-amber-500/10'
            : 'border-gray-300 hover:border-neutral-500 bg-orange-50/50'
        }`}
      >
        <span className="text-2xl">📷</span>
        <p className="text-xs text-gray-500 text-center">
          스케치 이미지를 드래그하거나
          <br />
          <span className="text-amber-400 underline">클릭하여 업로드</span>
        </p>
        <p className="text-xs text-gray-300">PNG, JPEG, WebP · 최대 5MB</p>

        {/* 숨겨진 파일 input */}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
