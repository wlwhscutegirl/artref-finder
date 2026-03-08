'use client';

// ============================================
// 스케치 도구 바 (Phase 7)
// 펜/지우개 전환, 선 굵기, 색상 선택, Undo/Redo, 전체 지우기
// ============================================

import { type DrawingTool } from './drawing-canvas';

interface SketchToolbarProps {
  /** 현재 도구 */
  tool: DrawingTool;
  /** 선 굵기 */
  lineWidth: number;
  /** 선 색상 */
  color: string;
  /** Undo 가능 여부 */
  canUndo: boolean;
  /** Redo 가능 여부 */
  canRedo: boolean;
  /** 도구 변경 콜백 */
  onToolChange: (tool: DrawingTool) => void;
  /** 선 굵기 변경 콜백 */
  onLineWidthChange: (width: number) => void;
  /** 색상 변경 콜백 */
  onColorChange: (color: string) => void;
  /** Undo 콜백 */
  onUndo: () => void;
  /** Redo 콜백 */
  onRedo: () => void;
  /** 전체 지우기 콜백 */
  onClear: () => void;
}

/** 프리셋 색상 목록 */
const PRESET_COLORS = [
  '#ffffff', // 흰색
  '#ef4444', // 빨강
  '#f97316', // 주황
  '#eab308', // 노랑
  '#22c55e', // 초록
  '#3b82f6', // 파랑
  '#8b5cf6', // 보라
  '#000000', // 검정
];

export function SketchToolbar({
  tool,
  lineWidth,
  color,
  canUndo,
  canRedo,
  onToolChange,
  onLineWidthChange,
  onColorChange,
  onUndo,
  onRedo,
  onClear,
}: SketchToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-neutral-800/80 rounded-lg border border-neutral-700">
      {/* 도구 선택: 펜 / 지우개 */}
      <div className="flex items-center bg-neutral-900 rounded-md p-0.5">
        <button
          onClick={() => onToolChange('pen')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            tool === 'pen'
              ? 'bg-fuchsia-600 text-white'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="펜 도구"
        >
          🖊️ 펜
        </button>
        <button
          onClick={() => onToolChange('eraser')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            tool === 'eraser'
              ? 'bg-fuchsia-600 text-white'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="지우개 도구"
        >
          ◻ 지우개
        </button>
      </div>

      {/* 구분선 */}
      <div className="w-px h-6 bg-neutral-700" />

      {/* 선 굵기 슬라이더 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-neutral-500">굵기</span>
        <input
          type="range"
          min={1}
          max={20}
          value={lineWidth}
          onChange={(e) => onLineWidthChange(Number(e.target.value))}
          className="w-20 h-1 accent-fuchsia-500"
        />
        <span className="text-xs text-neutral-400 w-6 text-center">{lineWidth}</span>
      </div>

      {/* 구분선 */}
      <div className="w-px h-6 bg-neutral-700" />

      {/* 색상 선택 */}
      <div className="flex items-center gap-1">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onColorChange(c)}
            className={`w-5 h-5 rounded-full border-2 transition-transform ${
              color === c ? 'border-fuchsia-400 scale-125' : 'border-neutral-600'
            }`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>

      {/* 구분선 */}
      <div className="w-px h-6 bg-neutral-700" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="px-2 py-1 text-xs rounded hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="되돌리기 (Ctrl+Z)"
        >
          ↩
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="px-2 py-1 text-xs rounded hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="다시 실행 (Ctrl+Y)"
        >
          ↪
        </button>
      </div>

      {/* 전체 지우기 */}
      <button
        onClick={onClear}
        className="px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors"
        title="캔버스 전체 지우기"
      >
        🗑 지우기
      </button>
    </div>
  );
}
