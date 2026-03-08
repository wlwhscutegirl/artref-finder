'use client';

// ============================================
// FPS 모니터 컴포넌트
// 롤링 FPS 측정 + 자동 다운그레이드 트리거
// 15fps 미만 3초 지속 시 품질 자동 하향
// ============================================

import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { usePerfStore } from '@/stores/perf-store';

/** FPS 임계값: 이 아래면 저성능으로 판정 */
const LOW_FPS_THRESHOLD = 15;
/** 저성능 지속 시간 (초): 이 이상 지속 시 다운그레이드 */
const LOW_FPS_DURATION = 3;
/** 측정 윈도우 크기 (프레임 수) */
const WINDOW_SIZE = 60;

interface FpsMonitorProps {
  /** FPS 변경 콜백 (외부 UI 표시용) */
  onFpsUpdate?: (fps: number) => void;
}

/**
 * FPS 모니터 (R3F useFrame 훅 기반)
 * Canvas 내부에서만 사용 가능
 */
export function FpsMonitor({ onFpsUpdate }: FpsMonitorProps) {
  // 최근 프레임 타임스탬프 링버퍼
  const timestampsRef = useRef<number[]>([]);
  // 저성능 상태 시작 시각
  const lowFpsStartRef = useRef<number | null>(null);
  // 마지막 다운그레이드 시각 (중복 방지)
  const lastDowngradeRef = useRef(0);
  // 마지막 콜백 호출 시각 (throttle)
  const lastCallbackRef = useRef(0);

  const autoDowngrade = usePerfStore((s) => s.autoDowngrade);
  const downgradeOneStep = usePerfStore((s) => s.downgradeOneStep);
  const qualityLevel = usePerfStore((s) => s.qualityLevel);

  const handleDowngrade = useCallback(() => {
    const now = Date.now();
    // 최소 10초 간격으로 다운그레이드 (연쇄 방지)
    if (now - lastDowngradeRef.current < 10000) return;
    lastDowngradeRef.current = now;
    downgradeOneStep();
  }, [downgradeOneStep]);

  useFrame(() => {
    const now = performance.now();
    const timestamps = timestampsRef.current;
    timestamps.push(now);

    // 윈도우 크기 초과 시 오래된 프레임 제거
    while (timestamps.length > WINDOW_SIZE) {
      timestamps.shift();
    }

    // 최소 10프레임 이상 수집 후 FPS 계산
    if (timestamps.length < 10) return;

    const oldest = timestamps[0];
    const elapsed = (now - oldest) / 1000; // 초
    const fps = elapsed > 0 ? (timestamps.length - 1) / elapsed : 60;

    // 콜백 호출 (500ms throttle)
    if (onFpsUpdate && now - lastCallbackRef.current > 500) {
      lastCallbackRef.current = now;
      onFpsUpdate(Math.round(fps));
    }

    // 자동 다운그레이드 로직
    if (!autoDowngrade || qualityLevel === 'low') return;

    if (fps < LOW_FPS_THRESHOLD) {
      if (!lowFpsStartRef.current) {
        lowFpsStartRef.current = now;
      } else if ((now - lowFpsStartRef.current) / 1000 >= LOW_FPS_DURATION) {
        // 3초 이상 15fps 미만 → 다운그레이드
        handleDowngrade();
        lowFpsStartRef.current = null;
      }
    } else {
      // FPS 정상 → 타이머 리셋
      lowFpsStartRef.current = null;
    }
  });

  // 렌더링 없음 (순수 로직 컴포넌트)
  return null;
}
