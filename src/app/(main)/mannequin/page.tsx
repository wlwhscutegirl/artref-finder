'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Logo, LogoIcon } from '@/components/ui/logo';
import { ModeTabs } from '@/components/ui/mode-tabs';
import { ResizablePanel } from '@/components/ui/resizable-panel';
import { SearchFilters } from '@/components/features/search/search-filters';
import { TagSearchInput } from '@/components/features/search/tag-search-input';
import { ImageGrid } from '@/components/features/gallery/image-grid';
import { PosePresetCards } from '@/components/features/mannequin/pose-preset-cards';
import { CameraPresetBar } from '@/components/features/mannequin/camera-preset-bar';
import { SavedPosesPanel } from '@/components/features/mannequin/saved-poses-panel';
import { JointSliderPanel } from '@/components/features/mannequin/joint-slider-panel';
import { PerformanceSettings } from '@/components/features/mannequin/performance-settings';
import { Mannequin2D } from '@/components/features/mannequin/mannequin-2d';
import { OnboardingModal } from '@/components/features/onboarding/onboarding-modal';
import { AuthModal } from '@/components/features/auth/auth-modal';
import { AnatomyLegend } from '@/components/features/mannequin/anatomy-legend';
import { useAuthStore } from '@/stores/auth-store';
import { useLightStore } from '@/stores/light-store';
import { PoseMatchIndicator } from '@/components/features/search/pose-match-indicator';
import { UpgradeBanner } from '@/components/features/plan/upgrade-banner';
import { ImageUploadZone } from '@/components/features/upload/image-upload-zone';
import { useMannequinSearch } from '@/hooks/useMannequinSearch';
import { useMannequinPresets } from '@/hooks/useMannequinPresets';
import { usePoseControls } from '@/hooks/usePoseControls';

// Three.js는 SSR 불가 - dynamic import로 클라이언트에서만 로드
const MannequinViewer = dynamic(
  () => import('@/components/features/mannequin/mannequin-viewer').then(m => ({ default: m.MannequinViewer })),
  { ssr: false, loading: () => <div className="aspect-[4/5] bg-orange-50 rounded-xl animate-pulse" /> }
);

export default function SearchPage() {
  // === 인증 상태 ===
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  // 모바일 검색창 토글 상태
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // === 멀티 라이트 스토어 연동 (Phase 5) ===
  const getKeyLightDirection = useLightStore((s) => s.getKeyLightDirection);

  // === 커스텀 훅: 프리셋 관리 ===
  const presets = useMannequinPresets();

  // === 커스텀 훅: 포즈/관절/뷰어 제어 ===
  const controls = usePoseControls(presets.toggleFlip);

  // === 커스텀 훅: 검색/필터 로직 (샷 타입 매칭 포함) ===
  const search = useMannequinSearch(controls.joints, getKeyLightDirection, controls.cameraDistance, controls.cameraFov);

  // 카메라 위치 변경 시 CameraAngle 벡터 추출 (Phase 3)
  useEffect(() => {
    controls.updateCameraAngle(
      presets.cameraPosition,
      presets.cameraTarget,
      search.setCurrentCameraAngle,
    );
  }, [presets.cameraPosition, presets.cameraTarget, controls, search]);

  // 자동 포즈 추출 → 마네킹에 적용하는 핸들러
  const handleApplyToMannequin = (rotations: Record<string, [number, number, number]>) => {
    controls.applyExternalPose(rotations as any);
    // 마네킹 적용 시 외부 벡터는 초기화 (마네킹 FK 모드로 전환)
    search.clearExtractedPose();
  };

  // === 좌측 패널: 마네킹 + 컨트롤 ===
  const leftPanel = (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* 3D / 2D 마네킹 뷰어 (renderMode에 따라 분기) */}
      {controls.renderMode === '3d' ? (
        <MannequinViewer
          className="w-full shrink-0"
          onLightChange={search.handleLightChange}
          isFlipped={presets.isFlipped}
          bodyType={presets.bodyType}
          cameraPosition={presets.cameraPosition}
          cameraTarget={presets.cameraTarget}
          onCameraAngleDetected={search.handleCameraAngleDetected}
        />
      ) : (
        <Mannequin2D className="w-full shrink-0" bodyType={presets.bodyType} />
      )}

      {/* 뷰어 하단 도구 바 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white/90 border-t border-gray-200">
        {/* 좌우반전 토글 */}
        <button
          onClick={presets.toggleFlip}
          title="좌우 반전 (F키)"
          className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
            presets.isFlipped
              ? 'bg-orange-600 text-white'
              : 'bg-orange-50 text-gray-500 hover:bg-orange-100 hover:text-gray-600'
          }`}
        >
          ↔ 반전
        </button>

        {/* 해부학 오버레이 토글 */}
        <button
          onClick={controls.toggleAnatomyMode}
          title="해부학 오버레이"
          aria-pressed={controls.isAnatomyMode}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
            controls.isAnatomyMode
              ? 'bg-orange-600 text-white'
              : 'bg-orange-50 text-gray-500 hover:bg-orange-100 hover:text-gray-600'
          }`}
        >
          {/* 뼈 아이콘 (SVG) */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18.3 5.7a2.7 2.7 0 0 0-3.8 0L12 8.2 9.5 5.7a2.7 2.7 0 1 0-3.8 3.8L8.2 12l-2.5 2.5a2.7 2.7 0 1 0 3.8 3.8L12 15.8l2.5 2.5a2.7 2.7 0 1 0 3.8-3.8L15.8 12l2.5-2.5a2.7 2.7 0 0 0 0-3.8Z" />
          </svg>
          해부학
        </button>

        {/* 체형 토글 (SVG 아이콘, 44px 최소 터치 타겟) */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => presets.handleBodyTypeToggle('male', search.selectedTags, search.setSelectedTags)}
            title="남성 체형"
            aria-pressed={presets.bodyType === 'male'}
            aria-label="남성 체형"
            /* 터치 타겟 48px 확보 */
            className={`min-w-[48px] min-h-[48px] flex items-center justify-center rounded text-[11px] font-medium cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
              presets.bodyType === 'male'
                ? 'bg-orange-600 text-white'
                : 'bg-orange-50 text-gray-500 hover:bg-orange-100'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10" cy="14" r="5" />
              <path d="M19 5l-5.4 5.4" />
              <path d="M15 5h4v4" />
            </svg>
          </button>
          <button
            onClick={() => presets.handleBodyTypeToggle('female', search.selectedTags, search.setSelectedTags)}
            title="여성 체형"
            aria-pressed={presets.bodyType === 'female'}
            aria-label="여성 체형"
            /* 터치 타겟 48px 확보 */
            className={`min-w-[48px] min-h-[48px] flex items-center justify-center rounded text-[11px] font-medium cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
              presets.bodyType === 'female'
                ? 'bg-orange-700 text-white'
                : 'bg-orange-50 text-gray-500 hover:bg-orange-100'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="10" r="5" />
              <path d="M12 15v6" />
              <path d="M9 18h6" />
            </svg>
          </button>
        </div>
      </div>

      {/* 해부학 범례 패널 (해부학 모드 활성 시만 표시) */}
      {controls.isAnatomyMode && (
        <div className="px-3 pt-2">
          <AnatomyLegend />
        </div>
      )}

      {/* 성능 설정 패널 */}
      <div className="px-3 pt-2">
        <div>
          <button
            onClick={() => controls.setShowPerfSettings(!controls.showPerfSettings)}
            className="flex items-center gap-1 text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider hover:text-gray-600 cursor-pointer transition-colors w-full"
          >
            <span className={`transition-transform ${controls.showPerfSettings ? 'rotate-90' : ''}`}>
              ▸
            </span>
            성능 설정
          </button>
          {controls.showPerfSettings && (
            <div className="bg-gray-50/80 border border-gray-200 rounded-lg p-2 mb-2">
              <PerformanceSettings />
            </div>
          )}
        </div>
      </div>

      {/* 관절 슬라이더 패널 (선택된 관절이 있을 때만 표시) */}
      <div className="px-3 pt-2">
        <JointSliderPanel />
      </div>

      {/* 프리셋 패널 영역 */}
      <div className="p-3 space-y-3 border-t border-gray-200">
        {/* 자동 포즈 추출 (Phase 4): 이미지 업로드 → 포즈 검색/마네킹 적용 */}
        <div>
          <p className="text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
            이미지에서 포즈 추출
          </p>
          <ImageUploadZone
            onPoseExtracted={search.handlePoseExtracted}
            onApplyToMannequin={handleApplyToMannequin}
            disabled={search.remainingExtractions === 0}
            remainingExtractions={search.remainingExtractions}
          />
          {/* 추출된 포즈 벡터 활성 표시 (orange 통일) */}
          {search.extractedPoseVector && (
            <div className="mt-1.5 flex items-center justify-between px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <span className="text-xs text-orange-400">이미지 포즈로 검색 중이에요</span>
              <button
                onClick={search.clearExtractedPose}
                className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                취소
              </button>
            </div>
          )}
        </div>

        {/* 포즈 프리셋 카드 */}
        <PosePresetCards
          selectedPoseId={presets.selectedPoseId}
          selectedHandId={presets.selectedHandId}
          onPoseSelect={(preset) => presets.handlePoseSelect(preset, search.selectedTags, search.setSelectedTags)}
          onHandSelect={(preset) => presets.handleHandSelect(preset, search.selectedTags, search.setSelectedTags)}
        />

        {/* 카메라 앵글 프리셋 */}
        <CameraPresetBar
          selectedId={presets.selectedCameraId}
          onSelect={(preset) => presets.handleCameraSelect(preset, search.selectedTags, search.setSelectedTags)}
        />

        {/* 기즈모 기반 태그 추천 패널 - 자동 적용 (debounce 500ms, orange 통일, 친근한 카피) */}
        {search.gizmoSuggestedTags.length > 0 && (
          <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-xs text-orange-400 font-medium mb-1">이 포즈엔 이런 태그가 잘 맞아요</p>
            <div className="flex flex-wrap gap-1">
              {search.gizmoSuggestedTags.map((tag) => (
                <span key={tag} className="text-xs px-1.5 py-0.5 bg-orange-500/20 rounded-full text-orange-500">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 자유 카메라 앵글 자동 감지 태그 - 자동 적용 (debounce 500ms, orange 통일) */}
        {search.cameraAngleTags.length > 0 && !presets.selectedCameraId && (
          <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-xs text-orange-400 font-medium mb-1">카메라 앵글이 감지됐어요</p>
            <div className="flex flex-wrap gap-1">
              {search.cameraAngleTags.map((tag) => (
                <span key={tag} className="text-xs px-1.5 py-0.5 bg-orange-500/20 rounded-full text-orange-400">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 광원 → 태그 자동 연동 패널 - 자동 적용 (debounce 500ms) */}
        {search.lightSuggestedTags.length > 0 && (
          <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-xs text-orange-400 font-medium mb-1">조명에 맞는 태그예요</p>
            <div className="flex flex-wrap gap-1">
              {search.lightSuggestedTags.map((tag) => (
                <span key={tag} className="text-xs px-1.5 py-0.5 bg-orange-500/20 rounded-full text-orange-400">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 포즈 저장/불러오기 패널 */}
        <SavedPosesPanel
          currentPose={{
            posePresetId: presets.selectedPoseId,
            handPresetId: presets.selectedHandId,
            cameraPresetId: presets.selectedCameraId,
            bodyType: presets.bodyType,
            isFlipped: presets.isFlipped,
            tags: search.selectedTags,
            jointRotations: controls.joints,
          }}
          onLoad={(pose) => presets.handleLoadPose(pose, search.setSelectedTags)}
        />

        {/* 태그 필터 패널 (접기/펼치기) */}
        <div>
          <button
            onClick={() => search.setShowFilters(!search.showFilters)}
            className="flex items-center gap-1 text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider hover:text-gray-600 cursor-pointer transition-colors w-full"
          >
            <span className={`transition-transform ${search.showFilters ? 'rotate-90' : ''}`}>
              ▸
            </span>
            태그 필터 {search.selectedTags.length > 0 && `(${search.selectedTags.length})`}
          </button>
          {search.showFilters && (
            <div className="bg-gray-50/80 border border-gray-200 rounded-lg p-3 max-h-[40vh] overflow-y-auto">
              <SearchFilters
                selectedTags={search.selectedTags}
                selectedCategory={search.selectedCategory}
                onTagsChange={search.setSelectedTags}
                onCategoryChange={search.setSelectedCategory}
                lightDirection={search.currentLightDirection}
                lightFilterActive={search.lightFilterActive}
                onLightFilterToggle={() => search.setLightFilterActive(!search.lightFilterActive)}
                lightMatchCount={search.filteredImages.filter((img) => img.lightSimilarity !== undefined).length}
                isLightVectorActive={search.isLightActive}
                safetyLevel={search.safetyLevel}
                onSafetyLevelChange={search.setSafetyLevel}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // === 우측 패널: 검색 결과 ===
  const rightPanel = (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* 결과 헤더 + 활성 태그 표시 */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          {/* 결과 헤더: 친근한 마이크로카피 */}
          <h2 className="text-sm font-semibold">
            <span className="text-orange-400">{search.displayImages.length}</span>개 찾았어요
            {/* 포즈 벡터 추출 진행 표시 (orange 통일) */}
            {search.extractionProgress.isExtracting && (
              <span className="ml-2 text-xs text-orange-400 font-normal animate-pulse">
                포즈 분석 중 {search.extractionProgress.completed}/{search.extractionProgress.total}장 ({search.extractionProgress.percent}%)
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {/* 포즈 매칭 토글 + 상태 표시 */}
            <PoseMatchIndicator
              isActive={search.isPoseActive}
              matchedCount={search.matchedCount}
              totalCount={search.filteredImages.length}
              onToggle={() => search.setPoseMatchEnabled(!search.poseMatchEnabled)}
              enabled={search.poseMatchEnabled}
              scores={search.similarityScores}
              threshold={search.similarityThreshold}
              onThresholdChange={search.setSimilarityThreshold}
            />
            {/* 샷 타입 매칭 활성 표시 (orange 통일) */}
            {search.isShotTypeActive && controls.currentShotTypeLabel && (
              <span className="text-xs px-1.5 py-0.5 bg-orange-500/15 text-orange-400 rounded">
                {controls.currentShotTypeLabel}
              </span>
            )}
            {/* 조명 매칭 활성 표시 (orange 통일) */}
            {search.isLightActive && (
              <span className="text-xs px-1.5 py-0.5 bg-orange-500/15 text-orange-400 rounded">
                조명 매칭
              </span>
            )}
            {search.selectedTags.length > 0 && (
              <button
                onClick={() => {
                  search.setSelectedTags([]);
                  presets.resetPresets();
                }}
                className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                다시 시작
              </button>
            )}
          </div>
        </div>

        {/* 활성 태그 칩 */}
        {search.selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {search.selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/15 text-orange-400"
              >
                #{tag}
                <button
                  onClick={() => search.setSelectedTags(search.selectedTags.filter((t) => t !== tag))}
                  className="hover:text-gray-900 cursor-pointer"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 플랜 제한 배너 (Phase 3) */}
      {search.showUpgradeBanner && (
        <UpgradeBanner
          remaining={search.checkSearchLimit().remaining}
          limit={search.checkSearchLimit().limit}
          isBlocked={search.searchBlocked}
          onDismiss={() => search.setShowUpgradeBanner(false)}
        />
      )}

      {/* 이미지 그리드 (임계값 필터 적용) */}
      <div className="p-4">
        <ImageGrid
          images={search.displayImages}
          hasNextPage={search.hasNextPage}
          isFetchingNextPage={search.isFetchingNextPage}
          fetchNextPage={search.fetchNextPage}
        />
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col">
      {/* 온보딩 모달 (첫 방문 시 표시) */}
      <OnboardingModal />

      {/* 인증 모달 */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {/* 상단 바 */}
      <header className="shrink-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-4 h-12 flex items-center justify-between">
          {/* 로고: 모바일에서 아이콘만, 데스크탑에서 전체 */}
          <Link href="/" className="flex items-center">
            <span className="md:hidden">
              <LogoIcon size={28} />
            </span>
            <span className="hidden md:block">
              <Logo size={28} />
            </span>
          </Link>

          {/* 모드 전환 탭 */}
          <ModeTabs activeMode="mannequin" />

          {/* 텍스트 검색바: 데스크탑에서 표시 */}
          <div className="hidden md:block flex-1 max-w-sm mx-4">
            <TagSearchInput
              selectedTags={search.selectedTags}
              onTagsChange={search.setSelectedTags}
            />
          </div>

          {/* 모바일 검색 토글 버튼 (돋보기 아이콘) */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            aria-label="검색 열기"
            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            {/* 대시보드/컬렉션: 모바일에서 숨김 */}
            <Link
              href="/dashboard"
              className="hidden md:flex px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-50 text-gray-500 hover:bg-orange-100 transition-colors"
            >
              대시보드
            </Link>
            <Link
              href="/collections"
              className="hidden md:flex px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-50 text-gray-500 hover:bg-orange-100 transition-colors"
            >
              내 컬렉션
            </Link>

            {/* 인증 버튼 */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 hidden sm:inline">{user.name}</span>
                <button
                  onClick={() => logout()}
                  className="px-2 py-1 rounded text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-600 text-white hover:bg-orange-500 cursor-pointer transition-colors"
              >
                로그인
              </button>
            )}
          </div>
        </div>

        {/* 모바일 검색창 (토글로 열림) */}
        {showMobileSearch && (
          <div className="md:hidden px-4 pb-2">
            <TagSearchInput
              selectedTags={search.selectedTags}
              onTagsChange={search.setSelectedTags}
            />
          </div>
        )}
      </header>

      {/* 데스크탑 (1024px+): 리사이즈 가능 좌우 분할, 관절 선택 시 자동 축소 */}
      <div className="flex-1 min-h-0 hidden lg:block">
        <ResizablePanel
          left={leftPanel}
          right={rightPanel}
          defaultRatio={0.55}
          controlledRatio={controls.desktopRatio}
          minRatio={0.25}
          maxRatio={0.75}
        />
      </div>

      {/* 태블릿 (768~1024px): 좌우 분할 40:60 */}
      <div className="flex-1 min-h-0 hidden md:block lg:hidden">
        <ResizablePanel
          left={leftPanel}
          right={rightPanel}
          defaultRatio={0.4}
          minRatio={0.25}
          maxRatio={0.65}
        />
      </div>

      {/* 모바일 (~768px): 탭 전환 */}
      <div className="flex-1 min-h-0 md:hidden">
        <MobileTabView
          leftPanel={leftPanel}
          rightPanel={rightPanel}
          resultCount={search.displayImages.length}
        />
      </div>
    </div>
  );
}

/**
 * 모바일 탭 전환 뷰
 * 마네킹 탭 / 결과 탭으로 전환
 */
function MobileTabView({
  leftPanel,
  rightPanel,
  resultCount,
}: {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  resultCount: number;
}) {
  const [activeTab, setActiveTab] = useState<'mannequin' | 'results'>('mannequin');

  return (
    <div className="flex flex-col h-full">
      {/* 탭 바 */}
      <div className="flex border-b border-gray-200 shrink-0">
        <button
          onClick={() => setActiveTab('mannequin')}
          /* 탭 바 터치 타겟 48px 확보: py-3 + text-sm */
          className={`flex-1 py-3 text-sm font-medium text-center cursor-pointer transition-colors ${
            activeTab === 'mannequin'
              ? 'text-orange-400 border-b-2 border-orange-500'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          포즈 설정
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`flex-1 py-3 text-sm font-medium text-center cursor-pointer transition-colors ${
            activeTab === 'results'
              ? 'text-orange-400 border-b-2 border-orange-500'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          결과 ({resultCount})
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className={activeTab === 'mannequin' ? 'h-full' : 'hidden'}>
          {leftPanel}
        </div>
        <div className={activeTab === 'results' ? 'h-full' : 'hidden'}>
          {rightPanel}
        </div>
      </div>
    </div>
  );
}
