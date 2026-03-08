// ============================================
// 포즈 매칭 상태 표시 컴포넌트
// 유사도 분포 시각화 + 임계값 필터 + 매칭 결과 표시
// ============================================

'use client';

import { useMemo } from 'react';

/** 유사도 점수 분포 데이터 */
interface SimilarityDistribution {
  /** 80% 이상 (우수) */
  excellent: number;
  /** 60-80% (양호) */
  good: number;
  /** 40-60% (보통) */
  moderate: number;
  /** 40% 미만 (낮음) */
  low: number;
}

interface PoseMatchIndicatorProps {
  /** 포즈 매칭 활성 여부 */
  isActive: boolean;
  /** 유사도 점수가 있는 이미지 수 */
  matchedCount: number;
  /** 전체 검색 결과 수 */
  totalCount: number;
  /** 토글 콜백 */
  onToggle: () => void;
  /** 토글 활성 상태 */
  enabled: boolean;
  /** 유사도 점수 배열 (분포 계산용) */
  scores?: number[];
  /** 최소 유사도 임계값 (0~1) */
  threshold?: number;
  /** 임계값 변경 콜백 */
  onThresholdChange?: (value: number) => void;
}

/** 유사도 분포 계산 */
function computeDistribution(scores: number[]): SimilarityDistribution {
  let excellent = 0, good = 0, moderate = 0, low = 0;
  for (const s of scores) {
    if (s >= 0.8) excellent++;
    else if (s >= 0.6) good++;
    else if (s >= 0.4) moderate++;
    else low++;
  }
  return { excellent, good, moderate, low };
}

/** 임계값 프리셋 */
const THRESHOLD_PRESETS = [
  { value: 0, label: '전체' },
  { value: 0.4, label: '40%+' },
  { value: 0.6, label: '60%+' },
  { value: 0.8, label: '80%+' },
] as const;

export function PoseMatchIndicator({
  isActive,
  matchedCount,
  totalCount,
  onToggle,
  enabled,
  scores = [],
  threshold = 0,
  onThresholdChange,
}: PoseMatchIndicatorProps) {
  /** 분포 계산 (메모이제이션) */
  const dist = useMemo(() => computeDistribution(scores), [scores]);
  const total = dist.excellent + dist.good + dist.moderate + dist.low;

  return (
    <div className="flex items-center gap-2">
      {/* 포즈 매칭 토글 버튼 */}
      <button
        onClick={onToggle}
        aria-pressed={enabled}
        aria-label="포즈 매칭 토글"
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
          transition-colors duration-200 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-orange-500/50
          ${enabled
            ? 'bg-orange-600 text-white hover:bg-orange-500'
            : 'bg-orange-50 text-gray-500 hover:bg-orange-100 hover:text-gray-600'
          }
        `}
      >
        {/* 매칭 상태 SVG 아이콘 */}
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5Z" />
          <path d="M2 21a10 10 0 0 1 20 0" />
        </svg>
        포즈 매칭
      </button>

      {/* 매칭 활성 시: 결과 수 + 분포 바 */}
      {isActive && (
        <div className="flex items-center gap-2">
          {/* 매칭 결과 수 */}
          <span className="text-xs text-orange-600 font-medium tabular-nums">
            {matchedCount}<span className="text-gray-400">/{totalCount}</span>
          </span>

          {/* 유사도 분포 미니 바 */}
          {total > 0 && (
            <div
              className="flex h-2 w-16 rounded-full overflow-hidden bg-orange-50"
              title={`우수 ${dist.excellent} | 양호 ${dist.good} | 보통 ${dist.moderate} | 낮음 ${dist.low}`}
              role="img"
              aria-label={`유사도 분포: 우수 ${dist.excellent}건, 양호 ${dist.good}건, 보통 ${dist.moderate}건, 낮음 ${dist.low}건`}
            >
              {dist.excellent > 0 && (
                <div className="bg-emerald-500 transition-all duration-300" style={{ width: `${(dist.excellent / total) * 100}%` }} />
              )}
              {dist.good > 0 && (
                <div className="bg-cyan-500 transition-all duration-300" style={{ width: `${(dist.good / total) * 100}%` }} />
              )}
              {dist.moderate > 0 && (
                <div className="bg-orange-500 transition-all duration-300" style={{ width: `${(dist.moderate / total) * 100}%` }} />
              )}
              {dist.low > 0 && (
                <div className="bg-neutral-600 transition-all duration-300" style={{ width: `${(dist.low / total) * 100}%` }} />
              )}
            </div>
          )}

          {/* 임계값 필터 버튼 */}
          {onThresholdChange && (
            <div className="flex items-center gap-0.5">
              {THRESHOLD_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => onThresholdChange(preset.value)}
                  aria-label={`최소 유사도 ${preset.label}`}
                  className={`px-1.5 py-0.5 rounded text-xs font-medium cursor-pointer transition-colors duration-150
                    focus:outline-none focus:ring-1 focus:ring-orange-500/50
                    ${threshold === preset.value
                      ? 'bg-orange-100 text-orange-600'
                      : 'text-gray-400 hover:text-gray-600'
                    }
                  `}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
