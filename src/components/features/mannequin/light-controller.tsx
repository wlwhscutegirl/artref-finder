'use client';

import type { LightDirection } from '@/types';

interface LightControllerProps {
  value: LightDirection;
  onChange: (light: LightDirection) => void;
}

export function LightController({ value, onChange }: LightControllerProps) {
  return (
    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-300 p-3 w-48">
      <p className="text-xs font-medium text-gray-600 mb-2">광원 조절</p>

      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>수평 각도</span>
            <span>{value.azimuth}°</span>
          </div>
          <input
            type="range"
            min={0}
            max={360}
            value={value.azimuth}
            onChange={(e) => onChange({ ...value, azimuth: Number(e.target.value) })}
            className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>수직 각도</span>
            <span>{value.elevation}°</span>
          </div>
          <input
            type="range"
            min={-90}
            max={90}
            value={value.elevation}
            onChange={(e) => onChange({ ...value, elevation: Number(e.target.value) })}
            className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>강도</span>
            <span>{Math.round(value.intensity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(value.intensity * 100)}
            onChange={(e) => onChange({ ...value, intensity: Number(e.target.value) / 100 })}
            className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>
    </div>
  );
}
