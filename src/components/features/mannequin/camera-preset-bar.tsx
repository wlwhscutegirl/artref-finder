'use client';

import { CAMERA_PRESETS, type CameraPreset } from '@/lib/pose-presets';

interface CameraPresetBarProps {
  /** 현재 선택된 카메라 프리셋 ID */
  selectedId: string | null;
  /** 프리셋 선택 시 호출 */
  onSelect: (preset: CameraPreset) => void;
}

/**
 * 카메라 앵글 프리셋 버튼 바
 * 6개 앵글 프리셋을 가로 버튼으로 표시
 * 클릭 시 카메라 위치 이동 + 태그 매핑 전달
 */
export function CameraPresetBar({ selectedId, onSelect }: CameraPresetBarProps) {
  return (
    <div>
      <p className="text-[11px] font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
        카메라 앵글
      </p>
      <div className="flex flex-wrap gap-1">
        {CAMERA_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset)}
            title={`${preset.label} — 태그: ${preset.tags.map((t) => `#${t}`).join(' ')}`}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              selectedId === preset.id
                ? 'bg-violet-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-300'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
