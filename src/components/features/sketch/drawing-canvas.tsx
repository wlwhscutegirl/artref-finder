'use client';

// ============================================
// 드로잉 캔버스 (Phase 7)
// HTML5 Canvas 기반 자유 드로잉 + Undo/Redo
// 포인터 이벤트로 마우스+터치 통합 지원
// ============================================

import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

export type DrawingTool = 'pen' | 'eraser';

/** 캔버스 외부 제어용 핸들 */
export interface DrawingCanvasHandle {
  /** 캔버스 dataURL 반환 */
  toDataURL: () => string;
  /** 캔버스 전체 지우기 */
  clear: () => void;
  /** Undo */
  undo: () => void;
  /** Redo */
  redo: () => void;
  /** Undo 가능 여부 */
  canUndo: boolean;
  /** Redo 가능 여부 */
  canRedo: boolean;
}

interface DrawingCanvasProps {
  /** 캔버스 크기 (기본 512) */
  size?: number;
  /** 현재 도구 */
  tool?: DrawingTool;
  /** 선 굵기 (1~20) */
  lineWidth?: number;
  /** 선 색상 (hex) */
  color?: string;
  /** 배경 이미지 (업로드된 스케치) */
  backgroundImage?: string | null;
  /** 캔버스 내용 변경 시 콜백 */
  onChange?: (dataUrl: string) => void;
}

/** 히스토리 최대 크기 */
const MAX_HISTORY = 50;

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  function DrawingCanvas(
    {
      size = 512,
      tool = 'pen',
      lineWidth = 3,
      color = '#ffffff',
      backgroundImage = null,
      onChange,
    },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);

    // Undo/Redo 히스토리
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // 캔버스 초기화
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 배경 설정 (흰색 또는 업로드 이미지)
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, size, size);

      if (backgroundImage) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // 이미지를 캔버스에 맞춰 그리기
          const scale = Math.min(size / img.width, size / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (size - w) / 2;
          const y = (size - h) / 2;
          ctx.drawImage(img, x, y, w, h);
          saveToHistory();
        };
        img.src = backgroundImage;
      } else {
        saveToHistory();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [backgroundImage, size]);

    // 히스토리에 현재 상태 저장
    const saveToHistory = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, size, size);

      setHistory((prev) => {
        // 현재 인덱스 이후 히스토리 잘라내기 (Redo 분기 제거)
        const trimmed = prev.slice(0, historyIndex + 1);
        const next = [...trimmed, imageData];
        // 최대 크기 제한
        if (next.length > MAX_HISTORY) next.shift();
        return next;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
    }, [historyIndex, size]);

    // Undo
    const undo = useCallback(() => {
      if (historyIndex <= 0) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const newIndex = historyIndex - 1;
      ctx.putImageData(history[newIndex], 0, 0);
      setHistoryIndex(newIndex);
      onChange?.(canvas.toDataURL());
    }, [historyIndex, history, onChange]);

    // Redo
    const redo = useCallback(() => {
      if (historyIndex >= history.length - 1) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const newIndex = historyIndex + 1;
      ctx.putImageData(history[newIndex], 0, 0);
      setHistoryIndex(newIndex);
      onChange?.(canvas.toDataURL());
    }, [historyIndex, history, onChange]);

    // 전체 지우기
    const clear = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, size, size);
      saveToHistory();
      onChange?.(canvas.toDataURL());
    }, [size, saveToHistory, onChange]);

    // 외부 핸들 노출
    useImperativeHandle(ref, () => ({
      toDataURL: () => canvasRef.current?.toDataURL() || '',
      clear,
      undo,
      redo,
      canUndo: historyIndex > 0,
      canRedo: historyIndex < history.length - 1,
    }), [clear, undo, redo, historyIndex, history.length]);

    // 키보드 단축키 (Ctrl+Z / Ctrl+Y)
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault();
          undo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
          e.preventDefault();
          redo();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    // === 드로잉 이벤트 핸들러 ===

    // 캔버스 좌표 계산 (CSS 크기 ↔ 실제 크기 보정)
    const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = size / rect.width;
      const scaleY = size / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      isDrawingRef.current = true;
      canvas.setPointerCapture(e.pointerId);

      const { x, y } = getCanvasPoint(e);

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
      }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { x, y } = getCanvasPoint(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const handlePointerUp = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.globalCompositeOperation = 'source-over';
      saveToHistory();
      onChange?.(canvas.toDataURL());
    };

    return (
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="w-full aspect-square rounded-lg cursor-crosshair bg-gray-100 border border-gray-300"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    );
  }
);
