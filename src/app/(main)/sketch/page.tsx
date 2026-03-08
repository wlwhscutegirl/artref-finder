'use client';

// ============================================
// 드로잉 모드 검색 페이지 (Phase 7)
// 스케치/업로드 → 포즈 추출 → 유사 레퍼런스 검색
// 초보자도 쉽게 사용할 수 있는 인터페이스
// ============================================

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ModeTabs } from '@/components/ui/mode-tabs';
import { DrawingCanvas, type DrawingCanvasHandle, type DrawingTool } from '@/components/features/sketch/drawing-canvas';
import { SketchToolbar } from '@/components/features/sketch/sketch-toolbar';
import { SketchUpload } from '@/components/features/sketch/sketch-upload';
import { ImageGrid } from '@/components/features/gallery/image-grid';
import { sketchToPose } from '@/lib/sketch-to-pose';
import { usePoseSearch } from '@/hooks/usePoseSearch';
import { useImages } from '@/hooks/useImages';

export default function SketchSearchPage() {
  // bkend 이미지 데이터 (폴백: sample-data)
  const { images: allImages } = useImages();

  // 캔버스 핸들 ref
  const canvasRef = useRef<DrawingCanvasHandle>(null);

  // 드로잉 도구 상태
  const [tool, setTool] = useState<DrawingTool>('pen');
  const [lineWidth, setLineWidth] = useState(3);
  const [color, setColor] = useState('#ffffff');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // 배경 이미지 (업로드 시 캔버스에 표시)
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  // 포즈 추출 상태
  const [poseVector, setPoseVector] = useState<number[] | null>(null);
  const [jointWeights, setJointWeights] = useState<number[] | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

  // 검색 결과 (usePoseSearch 훅 재활용)
  const { images: rankedImages, isPoseActive: isActive } = usePoseSearch(
    allImages,
    true,           // poseMatchEnabled
    null,           // cameraAngle (드로잉 모드에서는 미사용)
    poseVector,     // 외부 포즈 벡터
    jointWeights,   // 관절 가중치
    null            // lightDirection (드로잉 모드에서는 미사용)
  );

  /** 캔버스 내용 변경 시 Undo/Redo 상태 동기화 */
  const handleCanvasChange = useCallback(() => {
    if (canvasRef.current) {
      setCanUndo(canvasRef.current.canUndo);
      setCanRedo(canvasRef.current.canRedo);
    }
  }, []);

  /** 스케치 업로드 → 캔버스 배경으로 설정 */
  const handleUpload = useCallback((dataUrl: string) => {
    setBackgroundImage(dataUrl);
    // 업로드 즉시 자동 검색
    handleSearch(dataUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 포즈 검색 실행 */
  const handleSearch = useCallback(async (directDataUrl?: string) => {
    setIsExtracting(true);
    setExtractionError(null);

    try {
      // 캔버스 또는 직접 전달된 dataURL 사용
      const dataUrl = directDataUrl || canvasRef.current?.toDataURL();
      if (!dataUrl) {
        setExtractionError('캔버스가 비어 있습니다.');
        return;
      }

      // 스케치 → 포즈 벡터 추출
      const result = await sketchToPose(dataUrl);
      if (!result) {
        setExtractionError('사람 형체를 인식할 수 없습니다. 더 뚜렷하게 그려보세요.');
        setPoseVector(null);
        setJointWeights(null);
        setConfidence(null);
        return;
      }

      // 검색용 포즈 벡터 설정
      setPoseVector(result.poseVector);
      setJointWeights(result.jointWeights);
      setConfidence(result.confidence);
    } catch {
      setExtractionError('포즈 추출 중 오류가 발생했습니다.');
    } finally {
      setIsExtracting(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* 로고 */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-xs font-bold text-white">
                A
              </div>
              <span className="font-semibold text-sm">ArtRef</span>
            </Link>

            {/* 모드 탭 */}
            <ModeTabs activeMode="sketch" />
          </div>

          <div className="flex items-center gap-3">
            <Link href="/collections" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
              컬렉션
            </Link>
            <Link href="/dashboard" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
              대시보드
            </Link>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[400px_1fr] gap-6">
          {/* 좌측: 캔버스 + 도구 */}
          <div className="space-y-4">
            {/* 안내 문구 */}
            <div className="text-center">
              <h1 className="text-lg font-bold text-amber-400">드로잉 모드</h1>
              <p className="text-xs text-gray-400 mt-1">
                원하는 포즈를 그리면 AI가 유사한 실사 레퍼런스를 찾아줍니다
              </p>
            </div>

            {/* 드로잉 캔버스 */}
            <DrawingCanvas
              ref={canvasRef}
              size={512}
              tool={tool}
              lineWidth={lineWidth}
              color={color}
              backgroundImage={backgroundImage}
              onChange={handleCanvasChange}
            />

            {/* 도구 바 */}
            <SketchToolbar
              tool={tool}
              lineWidth={lineWidth}
              color={color}
              canUndo={canUndo}
              canRedo={canRedo}
              onToolChange={setTool}
              onLineWidthChange={setLineWidth}
              onColorChange={setColor}
              onUndo={() => { canvasRef.current?.undo(); handleCanvasChange(); }}
              onRedo={() => { canvasRef.current?.redo(); handleCanvasChange(); }}
              onClear={() => { canvasRef.current?.clear(); handleCanvasChange(); }}
            />

            {/* 이미지 업로드 영역 */}
            <SketchUpload onUpload={handleUpload} />

            {/* 검색 버튼 */}
            <button
              onClick={() => handleSearch()}
              disabled={isExtracting}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-sm transition-all text-white"
            >
              {isExtracting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  포즈 인식 중...
                </span>
              ) : (
                '레퍼런스 검색하기'
              )}
            </button>

            {/* 추출 결과 상태 */}
            {extractionError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 text-center">
                {extractionError}
              </div>
            )}
            {confidence !== null && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400 text-center">
                포즈 인식 완료 · 신뢰도 {Math.round(confidence * 100)}%
              </div>
            )}
          </div>

          {/* 우측: 검색 결과 */}
          <div className="space-y-4">
            {/* 결과 헤더 */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-600">
                {isActive
                  ? `유사 레퍼런스 ${rankedImages.length}건`
                  : '캔버스에 포즈를 그리고 검색해보세요'}
              </h2>
              {isActive && confidence !== null && (
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full">
                  포즈 매칭 활성
                </span>
              )}
            </div>

            {/* 검색 전 가이드 */}
            {!isActive && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                <span className="text-6xl mb-4">✏️</span>
                <p className="text-sm mb-2">왼쪽 캔버스에 포즈를 그려보세요</p>
                <p className="text-xs text-neutral-700">
                  또는 스케치 이미지를 업로드하세요
                </p>
              </div>
            )}

            {/* 결과 그리드 */}
            {isActive && (
              <ImageGrid images={rankedImages} isLoading={isExtracting} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
