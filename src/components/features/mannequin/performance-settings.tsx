'use client';

// ============================================
// 성능 설정 패널
// 품질 프리셋 선택 + 개별 설정 토글
// 렌더 모드 전환 (3D / 2D)
// ============================================

import { usePerfStore, type RenderMode } from '@/stores/perf-store';
import type { DeviceGrade } from '@/lib/device-detector';

/** 품질 등급 UI 정보 */
const QUALITY_INFO: Record<DeviceGrade, { label: string; desc: string; color: string }> = {
  high: { label: '고품질', desc: '그림자 + HDRI + 고해상도', color: 'text-emerald-400' },
  medium: { label: '중간', desc: '그림자 + HDRI (해상도 축소)', color: 'text-amber-400' },
  low: { label: '성능 우선', desc: '그림자/HDRI 비활성 + 2D 모드', color: 'text-red-400' },
};

interface PerformanceSettingsProps {
  /** 현재 FPS (3D 모드에서만 유의미) */
  currentFps?: number;
  /** 접기 상태 */
  collapsed?: boolean;
}

export function PerformanceSettings({ currentFps, collapsed = false }: PerformanceSettingsProps) {
  const qualityLevel = usePerfStore((s) => s.qualityLevel);
  const renderMode = usePerfStore((s) => s.renderMode);
  const shadows = usePerfStore((s) => s.shadows);
  const hdri = usePerfStore((s) => s.hdri);
  const dpr = usePerfStore((s) => s.dpr);
  const autoDowngrade = usePerfStore((s) => s.autoDowngrade);
  const detectedGrade = usePerfStore((s) => s.detectedGrade);

  const setQuality = usePerfStore((s) => s.setQuality);
  const setRenderMode = usePerfStore((s) => s.setRenderMode);
  const toggleShadows = usePerfStore((s) => s.toggleShadows);
  const toggleHdri = usePerfStore((s) => s.toggleHdri);
  const setDpr = usePerfStore((s) => s.setDpr);
  const toggleAutoDowngrade = usePerfStore((s) => s.toggleAutoDowngrade);

  if (collapsed) return null;

  return (
    <div className="space-y-2">
      {/* 감지된 등급 표시 */}
      {detectedGrade && (
        <div className="flex items-center gap-2 text-[10px] text-neutral-500">
          <span>감지된 등급:</span>
          <span className={QUALITY_INFO[detectedGrade].color}>
            {QUALITY_INFO[detectedGrade].label}
          </span>
          {currentFps !== undefined && renderMode === '3d' && (
            <span className="ml-auto tabular-nums">
              {currentFps} FPS
            </span>
          )}
        </div>
      )}

      {/* 품질 프리셋 선택 (Auto + High/Medium/Low) */}
      <div className="flex gap-1">
        {/* Auto 버튼: 감지된 등급으로 복원 */}
        <button
          onClick={() => {
            if (detectedGrade) setQuality(detectedGrade);
          }}
          title="감지된 등급으로 자동 설정"
          className={`flex-1 px-2 py-1.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
            detectedGrade && qualityLevel === detectedGrade
              ? 'bg-orange-600 text-white'
              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
          }`}
        >
          자동
        </button>
        {(['high', 'medium', 'low'] as DeviceGrade[]).map((level) => {
          const info = QUALITY_INFO[level];
          const isActive = qualityLevel === level && (!detectedGrade || qualityLevel !== detectedGrade);
          return (
            <button
              key={level}
              onClick={() => setQuality(level)}
              title={info.desc}
              className={`flex-1 px-2 py-1.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-orange-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {info.label}
            </button>
          );
        })}
      </div>

      {/* 렌더 모드 토글 */}
      <div className="flex gap-1">
        {(['3d', '2d'] as RenderMode[]).map((mode) => {
          const isActive = renderMode === mode;
          return (
            <button
              key={mode}
              onClick={() => setRenderMode(mode)}
              className={`flex-1 px-2 py-1.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-orange-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {mode === '3d' ? '3D 뷰어' : '2D 뷰어'}
            </button>
          );
        })}
      </div>

      {/* 개별 설정 (3D 모드에서만 표시) */}
      {renderMode === '3d' && (
        <div className="space-y-1.5 pt-1 border-t border-neutral-800">
          {/* 그림자 토글 */}
          <label className="flex items-center justify-between text-[10px] cursor-pointer">
            <span className="text-neutral-400">그림자</span>
            <button
              onClick={toggleShadows}
              className={`w-8 h-4 rounded-full transition-colors ${
                shadows ? 'bg-orange-600' : 'bg-neutral-700'
              }`}
            >
              <div
                className={`w-3 h-3 bg-white rounded-full transition-transform mx-0.5 ${
                  shadows ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </label>

          {/* HDRI 토글 */}
          <label className="flex items-center justify-between text-[10px] cursor-pointer">
            <span className="text-neutral-400">HDRI 환경맵</span>
            <button
              onClick={toggleHdri}
              className={`w-8 h-4 rounded-full transition-colors ${
                hdri ? 'bg-orange-600' : 'bg-neutral-700'
              }`}
            >
              <div
                className={`w-3 h-3 bg-white rounded-full transition-transform mx-0.5 ${
                  hdri ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </label>

          {/* DPR 슬라이더 */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-neutral-400">해상도 (DPR)</span>
            <div className="flex items-center gap-1">
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.25"
                value={dpr}
                onChange={(e) => setDpr(parseFloat(e.target.value))}
                className="w-16 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <span className="text-neutral-500 w-6 text-right tabular-nums">{dpr}x</span>
            </div>
          </div>

          {/* 자동 다운그레이드 토글 */}
          <label className="flex items-center justify-between text-[10px] cursor-pointer">
            <span className="text-neutral-400">자동 품질 조절</span>
            <button
              onClick={toggleAutoDowngrade}
              className={`w-8 h-4 rounded-full transition-colors ${
                autoDowngrade ? 'bg-orange-600' : 'bg-neutral-700'
              }`}
            >
              <div
                className={`w-3 h-3 bg-white rounded-full transition-transform mx-0.5 ${
                  autoDowngrade ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </div>
      )}
    </div>
  );
}
