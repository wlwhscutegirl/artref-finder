'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { TAG_GROUPS, getTagGroup } from '@/lib/sample-data';
import { recommendTagsFromJoints } from '@/lib/pose-tag-recommender';
import { useImages } from '@/hooks/useImages';
import type { JointId } from '@/stores/pose-store';
import { useRealPoseExtraction } from '@/hooks/useRealPoseExtraction';
import { usePoseSearch, type ScoredImage } from '@/hooks/usePoseSearch';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import type { ImageCategory, LightDirection, CameraAngle, ReferenceImage } from '@/types';
import type { SafetyLevel } from '@/lib/safety-filter';

/**
 * 광원 각도 → 조명 태그 자동 매핑 함수
 * azimuth/elevation/intensity로 한글 조명 태그 생성
 */
function lightToTags(light: LightDirection): string[] {
  const tags: string[] = [];
  const { azimuth, elevation } = light;

  // 수평 각도(azimuth)로 광원 방향 판별
  if ((azimuth >= 315 || azimuth <= 45) && elevation >= -30 && elevation <= 30) {
    tags.push('정면광');
  }
  if (azimuth >= 135 && azimuth <= 225) {
    tags.push('역광');
  }
  if ((azimuth >= 60 && azimuth <= 120) || (azimuth >= 240 && azimuth <= 300)) {
    tags.push('측광');
  }

  // 수직 각도(elevation)로 탑라이트/림라이트 판별
  if (elevation >= 50) {
    tags.push('탑라이트');
  }
  if (azimuth >= 135 && azimuth <= 225 && elevation >= 10) {
    tags.push('림라이트');
  }

  // 강도 기반 하드/소프트 판별
  if (light.intensity >= 0.7) {
    tags.push('하드라이트');
  } else if (light.intensity <= 0.4) {
    tags.push('소프트라이트');
  }

  return tags;
}

/**
 * 그룹 내 OR, 그룹 간 AND 필터 로직
 * - 같은 그룹 태그는 OR: "역광 OR 림라이트" → 둘 중 하나만 있으면 매치
 * - 다른 그룹 태그는 AND: "역광(조명) AND 풀샷(카메라)" → 둘 다 있어야 매치
 */
function filterWithGroupLogic(
  images: ReferenceImage[],
  selectedTags: string[],
  selectedCategory: ImageCategory | null
) {
  if (selectedTags.length === 0 && !selectedCategory) return images;

  // 선택된 태그를 그룹별로 분류
  const tagsByGroup: Record<string, string[]> = {};
  for (const tag of selectedTags) {
    const group = getTagGroup(tag) || 'unknown';
    if (!tagsByGroup[group]) tagsByGroup[group] = [];
    tagsByGroup[group].push(tag);
  }

  return images.filter((image) => {
    // 카테고리 필터
    if (selectedCategory && image.category !== selectedCategory) return false;

    // 그룹별 AND, 그룹 내 OR
    for (const [, groupTags] of Object.entries(tagsByGroup)) {
      // 이 그룹에서 선택된 태그 중 하나라도 이미지에 있으면 OK (OR)
      const hasAny = groupTags.some((tag) => (image.tags ?? []).includes(tag));
      if (!hasAny) return false; // 어떤 그룹이라도 매치 실패하면 제외 (AND)
    }

    return true;
  });
}

/** 검색/필터 훅의 반환 타입 */
export interface MannequinSearchState {
  // === 이미지 데이터 ===
  /** bkend에서 로드된 전체 이미지 (포즈 벡터 추출 후) */
  allImages: ReferenceImage[];
  /** 실제 포즈 벡터 추출 진행 상태 */
  extractionProgress: { isExtracting: boolean; completed: number; total: number; percent: number };
  /** 이미지 로딩 상태 */
  isImagesLoading: boolean;
  /** 다음 페이지 존재 여부 */
  hasNextPage: boolean;
  /** 다음 페이지 로드 함수 */
  fetchNextPage: () => void;
  /** 다음 페이지 로딩 중 여부 */
  isFetchingNextPage: boolean;

  // === 태그/필터 상태 ===
  /** 선택된 태그 목록 */
  selectedTags: string[];
  /** 태그 변경 핸들러 */
  setSelectedTags: (tags: string[]) => void;
  /** 선택된 카테고리 */
  selectedCategory: ImageCategory | null;
  /** 카테고리 변경 핸들러 */
  setSelectedCategory: (cat: ImageCategory | null) => void;
  /** 콘텐츠 안전 필터 레벨 */
  safetyLevel: SafetyLevel;
  /** 안전 필터 레벨 변경 핸들러 */
  setSafetyLevel: (level: SafetyLevel) => void;

  // === 조명 관련 ===
  /** 조명 추천 태그 */
  lightSuggestedTags: string[];
  /** 조명 필터 활성 여부 */
  lightFilterActive: boolean;
  /** 조명 필터 토글 */
  setLightFilterActive: (active: boolean) => void;
  /** 현재 광원 방향 */
  currentLightDirection: LightDirection | null;
  /** 광원 변경 콜백 (3D 뷰어에서 호출) */
  handleLightChange: (light: LightDirection) => void;
  /** 조명 태그 수동 적용 */
  applyLightTags: () => void;

  // === 기즈모/카메라 추천 태그 ===
  /** 관절 기반 추천 태그 */
  gizmoSuggestedTags: string[];
  /** 카메라 앵글 감지 태그 */
  cameraAngleTags: string[];
  /** 카메라 앵글 감지 콜백 */
  handleCameraAngleDetected: (tags: string[]) => void;
  /** 기즈모 태그 수동 적용 */
  applyGizmoTags: () => void;
  /** 카메라 앵글 태그 수동 적용 */
  applyCameraAngleTags: () => void;

  // === 포즈 매칭 ===
  /** 포즈 매칭 활성 여부 */
  poseMatchEnabled: boolean;
  /** 포즈 매칭 토글 */
  setPoseMatchEnabled: (enabled: boolean) => void;
  /** 유사도 임계값 */
  similarityThreshold: number;
  /** 임계값 변경 핸들러 */
  setSimilarityThreshold: (val: number) => void;
  /** 카메라 앵글 벡터 (Phase 3) */
  currentCameraAngle: CameraAngle | null;
  /** 카메라 앵글 벡터 변경 */
  setCurrentCameraAngle: (angle: CameraAngle | null) => void;

  // === 자동 포즈 추출 ===
  /** 추출된 포즈 벡터 */
  extractedPoseVector: number[] | null;
  /** 추출된 관절 가중치 */
  extractedWeights: number[] | null;
  /** 포즈 추출 콜백 */
  handlePoseExtracted: (result: { poseVector: number[]; jointWeights: number[] }) => void;
  /** 추출 포즈 해제 */
  clearExtractedPose: () => void;

  // === 검색 결과 ===
  /** 최종 필터+매칭 적용된 이미지 (유사도 점수 포함) */
  filteredImages: ScoredImage[];
  /** 임계값 필터 적용된 표시용 이미지 (유사도 점수 포함) */
  displayImages: ScoredImage[];
  /** 포즈 매칭 활성 여부 */
  isPoseActive: boolean;
  /** 조명 매칭 활성 여부 */
  isLightActive: boolean;
  /** 샷 타입 매칭 활성 여부 */
  isShotTypeActive: boolean;
  /** 포즈 매칭된 이미지 수 */
  matchedCount: number;
  /** 유사도 점수 배열 (분포 시각화용) */
  similarityScores: number[];

  // === 플랜 제한 ===
  /** 현재 플랜 */
  plan: string;
  /** 플랜 기능 목록 */
  features: ReturnType<typeof usePlanLimits>['features'];
  /** 업그레이드 배너 표시 여부 */
  showUpgradeBanner: boolean;
  /** 업그레이드 배너 닫기 */
  setShowUpgradeBanner: (show: boolean) => void;
  /** 검색 차단 여부 */
  searchBlocked: boolean;
  /** 검색 제한 체크 */
  checkSearchLimit: ReturnType<typeof usePlanLimits>['checkSearchLimit'];
  /** 남은 포즈 추출 횟수 */
  remainingExtractions: number;

  // === 태그 필터 패널 ===
  /** 태그 필터 패널 접기 상태 */
  showFilters: boolean;
  /** 태그 필터 패널 토글 */
  setShowFilters: (show: boolean) => void;
}

/**
 * 마네킹 페이지의 검색/필터 로직을 관리하는 커스텀 훅
 * - 이미지 데이터 로딩 (bkend + 폴백)
 * - 태그/카테고리 필터링 (그룹 내 OR, 그룹 간 AND)
 * - 포즈 매칭 + 카메라 앵글 매칭
 * - 조명/기즈모/카메라 추천 태그 자동 적용
 * - 플랜 제한 체크 + 검색 히스토리 저장
 */
export function useMannequinSearch(
  joints: Record<JointId, [number, number, number]>,
  getKeyLightDirection: () => LightDirection | null,
  cameraDistance?: number | null,
  cameraFov?: number | null,
): MannequinSearchState {
  // === bkend 이미지 데이터 (폴백: sample-data) ===
  const { images: rawImages, isLoading: isImagesLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useImages();

  // === 실제 포즈 벡터 백그라운드 추출 (합성 벡터 → 진짜 MediaPipe 벡터) ===
  const [allImages, extractionProgress] = useRealPoseExtraction(rawImages);

  // === 태그 & 필터 상태 ===
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory | null>(null);
  const [safetyLevel, setSafetyLevel] = useState<SafetyLevel>('off');

  // === 조명 관련 상태 ===
  const [lightSuggestedTags, setLightSuggestedTags] = useState<string[]>([]);
  const [lightFilterActive, setLightFilterActive] = useState(false);
  const [currentLightDirection, setCurrentLightDirection] = useState<LightDirection | null>(null);

  // === 기즈모/카메라 추천 태그 ===
  const [gizmoSuggestedTags, setGizmoSuggestedTags] = useState<string[]>([]);
  const [cameraAngleTags, setCameraAngleTags] = useState<string[]>([]);

  // === 포즈 매칭 ===
  const [poseMatchEnabled, setPoseMatchEnabled] = useState(true);
  const [similarityThreshold, setSimilarityThreshold] = useState(0);
  const [currentCameraAngle, setCurrentCameraAngle] = useState<CameraAngle | null>(null);

  // === 자동 포즈 추출 (Phase 4) ===
  const [extractedPoseVector, setExtractedPoseVector] = useState<number[] | null>(null);
  const [extractedWeights, setExtractedWeights] = useState<number[] | null>(null);

  // === 플랜 제한 (Phase 3) ===
  const { plan, features, checkSearchLimit, recordSearch, historyLimit, checkExtractionLimit, recordExtraction, remainingExtractions } = usePlanLimits();
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
  const [searchBlocked, setSearchBlocked] = useState(false);

  // === 검색 히스토리 ===
  const { addSearch } = useSearchHistory();

  // === 태그 필터 패널 (기본 펼침) ===
  const [showFilters, setShowFilters] = useState(true);

  // 관절 각도 변경 → 기즈모 추천 태그 업데이트
  useEffect(() => {
    const tags = recommendTagsFromJoints(joints);
    setGizmoSuggestedTags(tags);
  }, [joints]);

  // 3D 뷰어 광원 변경 콜백 (Phase 5: light-store 연동)
  const handleLightChange = useCallback((light: LightDirection) => {
    const suggested = lightToTags(light);
    setLightSuggestedTags(suggested);
    // light-store의 키라이트 방향을 우선 사용
    const keyDir = getKeyLightDirection();
    setCurrentLightDirection(keyDir);
  }, [getKeyLightDirection]);

  // 자유 카메라 회전 시 앵글 자동 감지 콜백
  const handleCameraAngleDetected = useCallback((tags: string[]) => {
    setCameraAngleTags(tags);
  }, []);

  // 추천 태그 적용 (조명 그룹 태그를 교체)
  const applyLightTags = useCallback(() => {
    const lightTagNames: string[] = TAG_GROUPS.light.tags.map((t) => t.name);
    const withoutLight = selectedTags.filter((t) => !lightTagNames.includes(t));
    setSelectedTags([...withoutLight, ...lightSuggestedTags]);
  }, [selectedTags, lightSuggestedTags]);

  // 기즈모 추천 태그 적용 (포즈 그룹 태그를 교체)
  const applyGizmoTags = useCallback(() => {
    const poseTagNames: string[] = TAG_GROUPS.pose.tags.map((t) => t.name);
    const withoutPose = selectedTags.filter((t) => !poseTagNames.includes(t));
    setSelectedTags([...withoutPose, ...gizmoSuggestedTags]);
  }, [selectedTags, gizmoSuggestedTags]);

  // 자유 카메라 앵글 태그 적용
  const applyCameraAngleTags = useCallback(() => {
    const camTagNames: string[] = TAG_GROUPS.camera.tags.map((t) => t.name);
    const withoutCam = selectedTags.filter((t) => !camTagNames.includes(t));
    setSelectedTags([...withoutCam, ...cameraAngleTags]);
  }, [selectedTags, cameraAngleTags]);

  // 자동 포즈 추출 콜백 (Phase 4)
  const handlePoseExtracted = useCallback((result: { poseVector: number[]; jointWeights: number[] }) => {
    const limitResult = checkExtractionLimit();
    if (!limitResult.allowed) {
      setShowUpgradeBanner(true);
      return;
    }
    recordExtraction();
    setExtractedPoseVector(result.poseVector);
    setExtractedWeights(result.jointWeights);
  }, [checkExtractionLimit, recordExtraction]);

  // 추출된 포즈 해제
  const clearExtractedPose = useCallback(() => {
    setExtractedPoseVector(null);
    setExtractedWeights(null);
  }, []);

  // === 추천 태그 자동 적용 (debounce 500ms) ===
  // 기즈모 추천 태그 변경 시 500ms 후 자동 적용
  useEffect(() => {
    if (gizmoSuggestedTags.length === 0) return;
    const timer = setTimeout(() => {
      applyGizmoTags();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gizmoSuggestedTags]);

  // 카메라 앵글 태그 변경 시 500ms 후 자동 적용
  useEffect(() => {
    if (cameraAngleTags.length === 0) return;
    const timer = setTimeout(() => {
      applyCameraAngleTags();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraAngleTags]);

  // 광원 추천 태그 변경 시 500ms 후 자동 적용
  useEffect(() => {
    if (lightSuggestedTags.length === 0) return;
    const timer = setTimeout(() => {
      applyLightTags();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightSuggestedTags]);

  // 그룹 내 OR / 그룹 간 AND 필터링 + 안전 필터 적용
  const tagFilteredImages = useMemo(() => {
    const SAFETY_THRESHOLDS = { strict: 0.3, moderate: 0.6, off: 1.0 } as const;
    const threshold = SAFETY_THRESHOLDS[safetyLevel];
    let filtered = filterWithGroupLogic(allImages, selectedTags, selectedCategory);
    // 안전 필터 적용 (safetyScore가 없는 이미지는 안전으로 간주)
    if (safetyLevel !== 'off') {
      filtered = filtered.filter((img) => (img.safetyScore ?? 0) <= threshold);
    }
    return filtered;
  }, [selectedTags, selectedCategory, allImages, safetyLevel]);

  // 포즈 매칭 + 카메라 앵글 매칭: 태그 필터 결과 → 복합 유사도 정렬
  // advancedFilters가 비활성(Free 플랜)이면 카메라 앵글 매칭 비활성화
  const effectiveCameraAngle = features.advancedFilters ? currentCameraAngle : null;
  // Phase 5: 조명 필터 활성 시 키라이트 방향을 usePoseSearch에 전달
  const effectiveLightDirection = lightFilterActive ? currentLightDirection : null;
  const { images: filteredImages, isPoseActive, isLightActive, isShotTypeActive, currentShotType } = usePoseSearch(
    tagFilteredImages,
    poseMatchEnabled,
    effectiveCameraAngle,
    extractedPoseVector,
    extractedWeights,
    effectiveLightDirection,
    cameraDistance,
    cameraFov,
  );

  // 검색 결과 변경 시 히스토리 자동 저장 + 플랜 제한 체크
  const prevSearchKeyRef = useRef('');
  useEffect(() => {
    if (selectedTags.length === 0 && !selectedCategory) return;
    const searchKey = `${selectedTags.sort().join(',')}|${selectedCategory || ''}`;
    if (searchKey === prevSearchKeyRef.current) return;
    prevSearchKeyRef.current = searchKey;

    const limitResult = checkSearchLimit();
    if (!limitResult.allowed) {
      setSearchBlocked(true);
      setShowUpgradeBanner(true);
      return;
    }
    if (limitResult.remaining !== undefined && limitResult.remaining !== -1 && limitResult.remaining <= 10) {
      setShowUpgradeBanner(true);
    }

    recordSearch();
    addSearch({
      tags: selectedTags,
      category: selectedCategory || undefined,
      poseMatchUsed: isPoseActive,
      resultCount: filteredImages.length,
      timestamp: Date.now(),
    }, historyLimit);
  }, [selectedTags, selectedCategory, filteredImages.length, isPoseActive, checkSearchLimit, recordSearch, addSearch, historyLimit]);

  // 포즈 매칭 결과 중 점수가 있는 이미지 수
  const matchedCount = useMemo(
    () => filteredImages.filter((img) => img.similarityScore !== undefined).length,
    [filteredImages]
  );

  // 유사도 점수 배열 (분포 시각화용)
  const similarityScores = useMemo(
    () => filteredImages
      .map((img) => img.similarityScore)
      .filter((s): s is number => s !== undefined),
    [filteredImages]
  );

  // 임계값 필터 적용된 최종 이미지 목록
  const displayImages = useMemo(() => {
    if (similarityThreshold <= 0) return filteredImages;
    return filteredImages.filter((img) =>
      img.similarityScore === undefined || img.similarityScore >= similarityThreshold
    );
  }, [filteredImages, similarityThreshold]);

  return {
    allImages,
    extractionProgress,
    isImagesLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    selectedTags,
    setSelectedTags,
    selectedCategory,
    setSelectedCategory,
    safetyLevel,
    setSafetyLevel,
    lightSuggestedTags,
    lightFilterActive,
    setLightFilterActive,
    currentLightDirection,
    handleLightChange,
    applyLightTags,
    gizmoSuggestedTags,
    cameraAngleTags,
    handleCameraAngleDetected,
    applyGizmoTags,
    applyCameraAngleTags,
    poseMatchEnabled,
    setPoseMatchEnabled,
    similarityThreshold,
    setSimilarityThreshold,
    currentCameraAngle,
    setCurrentCameraAngle,
    extractedPoseVector,
    extractedWeights,
    handlePoseExtracted,
    clearExtractedPose,
    filteredImages,
    displayImages,
    isPoseActive,
    isLightActive,
    isShotTypeActive,
    matchedCount,
    similarityScores,
    plan,
    features,
    showUpgradeBanner,
    setShowUpgradeBanner,
    searchBlocked,
    checkSearchLimit,
    remainingExtractions,
    showFilters,
    setShowFilters,
  };
}
