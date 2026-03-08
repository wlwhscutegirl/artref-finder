'use client';

// ============================================
// 멀티 라이트 컨트롤러 UI
// 최대 3개 라이트 독립 제어 (azimuth, elevation, intensity, 색온도)
// 기존 light-controller.tsx의 상위 대체
// ============================================

import { useState } from 'react';
import { LIGHT_ROLE_LABELS, colorTempToHex } from '@/stores/light-store';
import type { LightSource, LightRole } from '@/stores/light-store';

interface MultiLightControllerProps {
  /** 현재 라이트 배열 */
  lights: LightSource[];
  /** 라이트 추가 콜백 */
  onAddLight: (role: LightRole) => void;
  /** 라이트 제거 콜백 */
  onRemoveLight: (id: string) => void;
  /** 라이트 속성 변경 콜백 */
  onUpdateLight: (id: string, updates: Partial<Omit<LightSource, 'id'>>) => void;
  /** 라이트 토글 콜백 */
  onToggleLight: (id: string) => void;
}

/** 슬라이더 공통 컴포넌트 */
function LightSlider({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  color,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-neutral-500 w-8 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1 appearance-none rounded-full cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${((value - min) / (max - min)) * 100}%, #404040 ${((value - min) / (max - min)) * 100}%)`,
        }}
      />
      <span className="text-[10px] text-neutral-400 w-10 text-right shrink-0">{displayValue}</span>
    </div>
  );
}

export function MultiLightController({
  lights,
  onAddLight,
  onRemoveLight,
  onUpdateLight,
  onToggleLight,
}: MultiLightControllerProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="space-y-2">
      {/* 헤더 */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 uppercase tracking-wider hover:text-neutral-300 cursor-pointer transition-colors w-full"
      >
        <span className={`transition-transform ${collapsed ? '' : 'rotate-90'}`}>▸</span>
        조명 조절 ({lights.length}/3)
      </button>

      {!collapsed && (
        <div className="space-y-2">
          {/* 각 라이트 슬라이더 그룹 */}
          {lights.map((light) => (
            <div
              key={light.id}
              className={`p-2 rounded-lg border transition-colors ${
                light.enabled
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-neutral-800 bg-neutral-900/30 opacity-50'
              }`}
            >
              {/* 라이트 헤더 (역할 + 토글 + 삭제) */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {/* 역할 뱃지 */}
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      light.role === 'key'
                        ? 'bg-amber-500/20 text-amber-400'
                        : light.role === 'fill'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-purple-500/20 text-purple-400'
                    }`}
                  >
                    {LIGHT_ROLE_LABELS[light.role]}
                  </span>
                  {/* 색온도 미리보기 */}
                  <span
                    className="w-3 h-3 rounded-full border border-neutral-700"
                    style={{ backgroundColor: colorTempToHex(light.colorTemp) }}
                  />
                </div>

                <div className="flex items-center gap-1">
                  {/* On/Off 토글 */}
                  <button
                    onClick={() => onToggleLight(light.id)}
                    className={`w-5 h-5 rounded-full text-[8px] font-bold cursor-pointer transition-colors ${
                      light.enabled
                        ? 'bg-amber-500 text-black'
                        : 'bg-neutral-700 text-neutral-500'
                    }`}
                  >
                    {light.enabled ? 'ON' : ''}
                  </button>
                  {/* 삭제 버튼 (키라이트 제외) */}
                  {light.role !== 'key' && (
                    <button
                      onClick={() => onRemoveLight(light.id)}
                      className="text-[10px] text-neutral-600 hover:text-red-400 cursor-pointer transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* 슬라이더 */}
              {light.enabled && (
                <div className="space-y-1">
                  <LightSlider
                    label="방향"
                    value={light.azimuth}
                    min={0}
                    max={360}
                    step={1}
                    displayValue={`${Math.round(light.azimuth)}°`}
                    color="#f59e0b"
                    onChange={(v) => onUpdateLight(light.id, { azimuth: v })}
                  />
                  <LightSlider
                    label="높이"
                    value={light.elevation}
                    min={-90}
                    max={90}
                    step={1}
                    displayValue={`${Math.round(light.elevation)}°`}
                    color="#d946ef"
                    onChange={(v) => onUpdateLight(light.id, { elevation: v })}
                  />
                  <LightSlider
                    label="강도"
                    value={light.intensity}
                    min={0}
                    max={1}
                    step={0.01}
                    displayValue={`${Math.round(light.intensity * 100)}%`}
                    color="#f59e0b"
                    onChange={(v) => onUpdateLight(light.id, { intensity: v })}
                  />
                  <LightSlider
                    label="색온"
                    value={light.colorTemp}
                    min={2700}
                    max={6500}
                    step={100}
                    displayValue={`${light.colorTemp}K`}
                    color={colorTempToHex(light.colorTemp)}
                    onChange={(v) => onUpdateLight(light.id, { colorTemp: v })}
                  />
                </div>
              )}
            </div>
          ))}

          {/* 라이트 추가 버튼 (3개 미만일 때만) */}
          {lights.length < 3 && (
            <div className="flex gap-1">
              {!lights.some((l) => l.role === 'fill') && (
                <button
                  onClick={() => onAddLight('fill')}
                  className="flex-1 px-2 py-1 text-[10px] text-blue-400 border border-blue-500/20 rounded hover:bg-blue-500/10 cursor-pointer transition-colors"
                >
                  + 필라이트
                </button>
              )}
              {!lights.some((l) => l.role === 'back') && (
                <button
                  onClick={() => onAddLight('back')}
                  className="flex-1 px-2 py-1 text-[10px] text-purple-400 border border-purple-500/20 rounded hover:bg-purple-500/10 cursor-pointer transition-colors"
                >
                  + 백라이트
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
