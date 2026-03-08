'use client';

import { useState } from 'react';
import {
  POSE_PRESETS,
  HAND_PRESETS,
  type PosePreset,
  type HandPreset,
} from '@/lib/pose-presets';

interface PosePresetCardsProps {
  /** 현재 선택된 프리셋 ID */
  selectedPoseId: string | null;
  selectedHandId: string | null;
  /** 프리셋 선택 시 호출 (매핑 태그 전달) */
  onPoseSelect: (preset: PosePreset) => void;
  onHandSelect: (preset: HandPreset) => void;
}

/**
 * 프리셋 포즈 카드 패널
 * 전신 8개 + 손 5개 프리셋을 카드 형태로 표시
 * 클릭 시 매핑 태그를 부모에 전달하여 검색 연동
 */
export function PosePresetCards({
  selectedPoseId,
  selectedHandId,
  onPoseSelect,
  onHandSelect,
}: PosePresetCardsProps) {
  // 손 프리셋 영역 접기/펼치기
  const [showHand, setShowHand] = useState(false);

  return (
    <div className="space-y-3">
      {/* 전신 포즈 프리셋 */}
      <div>
        <p className="text-[11px] font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
          전신 포즈
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {POSE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onPoseSelect(preset)}
              title={`${preset.label} — 태그: ${preset.tags.map((t) => `#${t}`).join(' ')}`}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all cursor-pointer ${
                selectedPoseId === preset.id
                  ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                  : 'border-neutral-700 bg-neutral-800/50 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300'
              }`}
            >
              {/* 실루엣 아이콘 */}
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7"
                fill="currentColor"
              >
                <path d={preset.silhouette} />
              </svg>
              <span className="text-[10px] font-medium leading-tight">
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 손 포즈 프리셋 (접기/펼치기) */}
      <div>
        <button
          onClick={() => setShowHand(!showHand)}
          className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 mb-1.5 uppercase tracking-wider hover:text-neutral-300 cursor-pointer transition-colors"
        >
          <span className={`transition-transform ${showHand ? 'rotate-90' : ''}`}>
            ▸
          </span>
          손 포즈
        </button>
        {showHand && (
          <div className="grid grid-cols-5 gap-1.5">
            {HAND_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onHandSelect(preset)}
                title={`${preset.label} — 태그: ${preset.tags.map((t) => `#${t}`).join(' ')}`}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all cursor-pointer ${
                  selectedHandId === preset.id
                    ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                    : 'border-neutral-700 bg-neutral-800/50 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="currentColor"
                >
                  <path d={preset.silhouette} />
                </svg>
                <span className="text-[10px] font-medium leading-tight">
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
