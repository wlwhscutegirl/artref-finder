'use client';

// ============================================
// HDRI 환경맵 선택 UI
// 5개 내장 프리셋 + 회전/노출 조절
// ============================================

import { HDRI_PRESETS } from '@/stores/light-store';
import type { HdriState, HdriPresetId } from '@/stores/light-store';

interface HdriSelectorProps {
  /** 현재 HDRI 상태 */
  hdri: HdriState;
  /** HDRI 프리셋 변경 콜백 */
  onPresetChange: (preset: HdriPresetId) => void;
  /** HDRI 속성 변경 콜백 */
  onUpdate: (updates: Partial<HdriState>) => void;
  /** HDRI 토글 콜백 */
  onToggle: () => void;
}

/** 프리셋별 아이콘/이모지 매핑 */
const PRESET_ICONS: Record<HdriPresetId, string> = {
  studio: '🎬',
  outdoor: '🌲',
  indoor: '🏠',
  'golden-hour': '🌅',
  'blue-hour': '🌙',
};

export function HdriSelector({
  hdri,
  onPresetChange,
  onUpdate,
  onToggle,
}: HdriSelectorProps) {
  return (
    <div className="space-y-2">
      {/* 헤더 + 토글 */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
          환경맵 (HDRI)
        </span>
        <button
          onClick={onToggle}
          className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-colors ${
            hdri.enabled
              ? 'bg-emerald-600 text-white'
              : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'
          }`}
        >
          {hdri.enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {hdri.enabled && (
        <div className="space-y-2">
          {/* 프리셋 선택 카드 */}
          <div className="flex gap-1">
            {HDRI_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onPresetChange(preset.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-center cursor-pointer transition-colors ${
                  hdri.preset === preset.id
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-neutral-800/50 border border-neutral-800 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-400'
                }`}
              >
                <span className="text-sm">{PRESET_ICONS[preset.id]}</span>
                <span className="text-[9px] font-medium">{preset.label}</span>
              </button>
            ))}
          </div>

          {/* 회전 슬라이더 */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500 w-8 shrink-0">회전</span>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={hdri.rotation}
              onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
              className="flex-1 h-1 appearance-none rounded-full cursor-pointer"
              style={{
                background: `linear-gradient(to right, #10b981 ${(hdri.rotation / 360) * 100}%, #404040 ${(hdri.rotation / 360) * 100}%)`,
              }}
            />
            <span className="text-[10px] text-neutral-400 w-10 text-right shrink-0">
              {Math.round(hdri.rotation)}°
            </span>
          </div>

          {/* 노출 슬라이더 */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500 w-8 shrink-0">노출</span>
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={hdri.exposure}
              onChange={(e) => onUpdate({ exposure: Number(e.target.value) })}
              className="flex-1 h-1 appearance-none rounded-full cursor-pointer"
              style={{
                background: `linear-gradient(to right, #10b981 ${(hdri.exposure / 2) * 100}%, #404040 ${(hdri.exposure / 2) * 100}%)`,
              }}
            />
            <span className="text-[10px] text-neutral-400 w-10 text-right shrink-0">
              {hdri.exposure.toFixed(1)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
