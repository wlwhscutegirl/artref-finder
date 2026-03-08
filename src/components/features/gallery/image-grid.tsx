'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getTagTooltip } from '@/lib/sample-data';
import { SaveToCollectionModal } from '@/components/features/collection/save-to-collection-modal';
import type { ReferenceImage } from '@/types';

/** 유사도 점수가 포함될 수 있는 이미지 타입 */
interface ScoredImage extends ReferenceImage {
  similarityScore?: number;
  /** 포즈 유사도 (개별) */
  poseSimilarity?: number;
  /** 카메라 앵글 유사도 (개별) */
  cameraSimilarity?: number;
  /** 조명 유사도 (개별) */
  lightSimilarity?: number;
}

interface ImageGridProps {
  images: ScoredImage[];
  isLoading?: boolean;
  /** 다음 페이지 존재 여부 (무한 스크롤용) */
  hasNextPage?: boolean;
  /** 다음 페이지 로딩 중 여부 */
  isFetchingNextPage?: boolean;
  /** 다음 페이지 로드 함수 */
  fetchNextPage?: () => void;
}

/**
 * 유사도 점수에 따른 뱃지 스타일 결정
 * ≥80% 에메랄드(우수), 60-80% 시안(양호), 40-60% 앰버(보통), <40% 중립(낮음)
 */
function getSimilarityBadge(score: number | undefined): {
  text: string;
  bgColor: string;
  textColor: string;
  ringColor: string;
  tier: string;
} | null {
  if (score === undefined) return null;
  const percent = Math.round(score * 100);
  if (percent >= 80) return {
    text: `${percent}%`,
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-300',
    ringColor: 'ring-emerald-500/40',
    tier: 'excellent',
  };
  if (percent >= 60) return {
    text: `${percent}%`,
    bgColor: 'bg-cyan-500/20',
    textColor: 'text-cyan-300',
    ringColor: 'ring-cyan-500/40',
    tier: 'good',
  };
  if (percent >= 40) return {
    text: `${percent}%`,
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-300',
    ringColor: 'ring-amber-500/30',
    tier: 'moderate',
  };
  return {
    text: `${percent}%`,
    bgColor: 'bg-neutral-700/40',
    textColor: 'text-gray-500',
    ringColor: 'ring-neutral-600/30',
    tier: 'low',
  };
}

export function ImageGrid({ images, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage }: ImageGridProps) {
  // 무한 스크롤 감지용 sentinel 엘리먼트 ref
  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver로 스크롤 끝 감지 → 다음 페이지 자동 로드
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !fetchNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // sentinel이 뷰포트에 진입하고, 다음 페이지가 있고, 로딩 중이 아니면 다음 페이지 로드
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        // 뷰포트 하단 300px 전에 미리 로드 시작 (부드러운 스크롤 경험)
        rootMargin: '0px 0px 300px 0px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  // 현재 선택된 이미지의 인덱스 (-1이면 모달 닫힘)
  const [selectedIndex, setSelectedIndex] = useState(-1);
  // 이미지 도구 상태
  const [isFlipped, setIsFlipped] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  // 컬렉션 저장 모달 표시 여부
  const [showSaveModal, setShowSaveModal] = useState(false);
  // 이미지 다운로드 진행 상태
  const [isDownloading, setIsDownloading] = useState(false);

  const selectedImage = selectedIndex >= 0 ? images[selectedIndex] : null;

  // 모달 열기
  const openModal = (index: number) => {
    setSelectedIndex(index);
    setIsFlipped(false);
    setZoomLevel(1);
  };

  // 모달 닫기
  const closeModal = () => {
    setSelectedIndex(-1);
    setIsFlipped(false);
    setZoomLevel(1);
  };

  // 이전/다음 이미지로 이동
  const goToPrev = useCallback(() => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
      setIsFlipped(false);
      setZoomLevel(1);
    }
  }, [selectedIndex]);

  const goToNext = useCallback(() => {
    if (selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
      setIsFlipped(false);
      setZoomLevel(1);
    }
  }, [selectedIndex, images.length]);

  /** 이미지 다운로드 핸들러 — blob으로 변환 후 로컬 저장 */
  const handleDownload = async () => {
    if (!selectedImage) return;
    setIsDownloading(true);
    try {
      const response = await fetch(selectedImage.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // 파일명에서 특수문자 제거
      a.download = `artref-${selectedImage.title.replace(/[^가-힣a-zA-Z0-9]/g, '_')}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('다운로드 실패:', err);
    }
    setIsDownloading(false);
  };

  /** 드래그 시작 핸들러 — PureRef 등 외부 앱으로 이미지 드래그 지원 */
  const handleDragStart = (e: React.DragEvent, image: ScoredImage) => {
    e.dataTransfer.setData('text/uri-list', image.url);
    e.dataTransfer.setData('text/plain', image.url);
  };

  // 키보드 네비게이션 (좌/우 화살표, ESC)
  useEffect(() => {
    if (selectedIndex < 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          closeModal();
          break;
        case 'f':
          // F키로 좌우반전 토글
          setIsFlipped((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, goToPrev, goToNext]);

  // 로딩 스켈레톤
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  // 결과 없음
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        {/* 검색 아이콘 (SVG) */}
        <svg className="w-10 h-10 mb-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <p className="text-sm">검색 조건에 맞는 레퍼런스가 없습니다</p>
        <p className="text-xs mt-1">태그를 줄이거나 같은 그룹 내 다른 태그를 추가해보세요 (OR 검색)</p>
      </div>
    );
  }

  return (
    <>
      {/* 이미지 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((image, index) => (
          <button
            key={image._id}
            onClick={() => openModal(index)}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, image)}
            className={`group relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 cursor-pointer transition-all duration-200
              ${(() => {
                const badge = getSimilarityBadge((image as ScoredImage).similarityScore);
                if (!badge) return '';
                if (badge.tier === 'excellent') return 'ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/5';
                if (badge.tier === 'good') return 'ring-1 ring-cyan-500/20';
                return '';
              })()}
            `}
          >
            <img
              src={image.thumbnailUrl}
              alt={image.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
              loading="lazy"
            />
            {/* 유사도 뱃지 — 큰 사이즈, 링 강조 (포즈 매칭 활성 시) */}
            {(() => {
              const badge = getSimilarityBadge((image as ScoredImage).similarityScore);
              return badge ? (
                <div className={`absolute top-2 right-2 z-10 px-2 py-1 rounded-lg text-xs font-bold ring-1 backdrop-blur-sm ${badge.bgColor} ${badge.textColor} ${badge.ringColor}`}>
                  {badge.text}
                </div>
              ) : null;
            })()}
            {/* 호버 시 정보 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-sm font-medium truncate">{image.title}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(image.tags ?? []).slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded-full">
                      #{tag}
                    </span>
                  ))}
                  {(image.tags ?? []).length > 3 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded-full">
                      +{image.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 무한 스크롤 sentinel + 상태 표시 영역 */}
      {fetchNextPage && (
        <div className="mt-6 flex flex-col items-center gap-3">
          {/* 추가 페이지 로딩 중 인디케이터 */}
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-gray-400">
              {/* 스피너 애니메이션 */}
              <div className="w-5 h-5 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
              <span className="text-sm">이미지 불러오는 중...</span>
            </div>
          )}

          {/* 더 이상 결과 없음 메시지 */}
          {!hasNextPage && images.length > 0 && (
            <p className="text-sm text-gray-300 py-4">
              모든 레퍼런스를 불러왔습니다
            </p>
          )}

          {/* IntersectionObserver가 감지할 sentinel 엘리먼트 */}
          <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
        </div>
      )}

      {/* 컬렉션 저장 모달 */}
      {showSaveModal && selectedImage && (
        <SaveToCollectionModal
          imageId={selectedImage._id}
          imageThumbnailUrl={selectedImage.thumbnailUrl}
          onClose={() => setShowSaveModal(false)}
        />
      )}

      {/* ======== 이미지 상세 모달 (개선) ======== */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 이미지 영역 */}
            <div className="flex-1 min-h-[300px] md:min-h-0 bg-white flex items-center justify-center relative overflow-hidden">
              {/* 이전 버튼 (44px 최소 터치 타겟) */}
              {selectedIndex > 0 && (
                <button
                  onClick={goToPrev}
                  aria-label="이전 이미지"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white z-10 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
              )}

              {/* 모달 이미지 (좌우반전 + 확대 적용, 드래그로 PureRef 등 외부 앱에 전달 가능) */}
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="max-w-full max-h-[70vh] object-contain transition-transform duration-200"
                style={{
                  transform: `scaleX(${isFlipped ? -1 : 1}) scale(${zoomLevel})`,
                }}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, selectedImage)}
              />

              {/* 다음 버튼 (44px 최소 터치 타겟) */}
              {selectedIndex < images.length - 1 && (
                <button
                  onClick={goToNext}
                  aria-label="다음 이미지"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white z-10 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              )}

              {/* 하단 이미지 도구 바 */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5">
                {/* 좌우반전 */}
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  title="좌우 반전 (F키)"
                  className={`px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                    isFlipped ? 'bg-orange-600 text-white' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  ↔ 반전
                </button>
                {/* 축소 */}
                <button
                  onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                  disabled={zoomLevel <= 0.5}
                  className="px-2 py-1 rounded text-xs text-gray-500 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  -
                </button>
                <span className="text-xs text-gray-500 min-w-[3ch] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                {/* 확대 */}
                <button
                  onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
                  disabled={zoomLevel >= 3}
                  className="px-2 py-1 rounded text-xs text-gray-500 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  +
                </button>
                {/* 원본 크기 리셋 */}
                <button
                  onClick={() => { setZoomLevel(1); setIsFlipped(false); }}
                  className="px-2 py-1 rounded text-xs text-gray-500 hover:text-white cursor-pointer"
                >
                  리셋
                </button>
                {/* 구분선 */}
                <div className="w-px h-4 bg-neutral-600" />
                {/* 이미지 다운로드 */}
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="px-2 py-1 rounded text-xs text-gray-500 hover:text-white disabled:opacity-50 cursor-pointer"
                  title="이미지 다운로드"
                >
                  {isDownloading ? '저장 중...' : '↓ 저장'}
                </button>
              </div>

              {/* 이미지 카운터 */}
              <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 rounded text-xs text-gray-500">
                {selectedIndex + 1} / {images.length}
              </div>
            </div>

            {/* 정보 패널 */}
            <div className="w-full md:w-72 p-5 border-t md:border-t-0 md:border-l border-gray-200 overflow-y-auto">
              <h3 className="font-semibold text-lg mb-3">{selectedImage.title}</h3>

              <div className="space-y-3">
                {/* 카테고리 */}
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">카테고리</p>
                  <span className="px-2 py-1 bg-orange-500/10 text-orange-400 rounded text-xs">
                    {selectedImage.category}
                  </span>
                </div>

                {/* 태그 (툴팁 포함) */}
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">태그</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedImage.tags ?? []).map((tag) => (
                      <span
                        key={tag}
                        title={getTagTooltip(tag)}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 cursor-help"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 유사도 분석 (포즈 매칭 활성 시 표시) */}
                {(selectedImage as ScoredImage).similarityScore !== undefined && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-400 mb-2">유사도 분석</p>
                    {/* 종합 점수 */}
                    {(() => {
                      const badge = getSimilarityBadge((selectedImage as ScoredImage).similarityScore);
                      return badge ? (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-bold ring-1 mb-2 ${badge.bgColor} ${badge.textColor} ${badge.ringColor}`}>
                          {badge.text} 매치
                        </div>
                      ) : null;
                    })()}
                    {/* 개별 유사도 바 */}
                    <div className="space-y-1.5">
                      {(selectedImage as ScoredImage).poseSimilarity !== undefined && (
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-0.5">
                            <span className="text-orange-400">포즈</span>
                            <span className="text-gray-500 tabular-nums">{Math.round((selectedImage as ScoredImage).poseSimilarity! * 100)}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${(selectedImage as ScoredImage).poseSimilarity! * 100}%` }} />
                          </div>
                        </div>
                      )}
                      {(selectedImage as ScoredImage).cameraSimilarity !== undefined && (
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-0.5">
                            <span className="text-blue-400">카메라</span>
                            <span className="text-gray-500 tabular-nums">{Math.round((selectedImage as ScoredImage).cameraSimilarity! * 100)}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(selectedImage as ScoredImage).cameraSimilarity! * 100}%` }} />
                          </div>
                        </div>
                      )}
                      {(selectedImage as ScoredImage).lightSimilarity !== undefined && (
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-0.5">
                            <span className="text-amber-400">조명</span>
                            <span className="text-gray-500 tabular-nums">{Math.round((selectedImage as ScoredImage).lightSimilarity! * 100)}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${(selectedImage as ScoredImage).lightSimilarity! * 100}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 키보드 단축키 안내 */}
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-400 mb-2">단축키</p>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-400">
                    <span>← → 이전/다음</span>
                    <span>F 좌우반전</span>
                    <span>ESC 닫기</span>
                  </div>
                </div>

                {/* 컬렉션 저장 + 다운로드 */}
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                  >
                    컬렉션에 저장
                  </button>
                  {/* 정보 패널 다운로드 버튼 (보조 스타일) */}
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors cursor-pointer text-gray-600"
                  >
                    {isDownloading ? '다운로드 중...' : '이미지 다운로드'}
                  </button>
                </div>
              </div>
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors cursor-pointer text-lg"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  );
}
