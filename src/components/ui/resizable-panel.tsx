'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface ResizablePanelProps {
  left: React.ReactNode;
  right: React.ReactNode;
  /** 좌측 패널 비율 (0~1, 기본 0.6) */
  defaultRatio?: number;
  /** 외부에서 제어하는 비율 (설정 시 자동 애니메이션 전환) */
  controlledRatio?: number;
  minRatio?: number;
  maxRatio?: number;
}

/**
 * 좌우 리사이즈 가능 분할 패널
 * 가운데 핸들을 드래그하여 비율 조절
 * controlledRatio prop으로 외부에서 비율 자동 전환 가능 (레이아웃 자동 축소)
 */
export function ResizablePanel({
  left,
  right,
  defaultRatio = 0.6,
  controlledRatio,
  minRatio = 0.3,
  maxRatio = 0.8,
}: ResizablePanelProps) {
  const [ratio, setRatio] = useState(defaultRatio);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // 외부 controlledRatio 변경 시 부드러운 전환
  useEffect(() => {
    if (controlledRatio === undefined) return;
    // 현재 비율에서 목표 비율로 애니메이션
    const start = ratio;
    const end = controlledRatio;
    if (Math.abs(start - end) < 0.01) return;

    let t = 0;
    const animate = () => {
      t += 0.06;
      if (t >= 1) {
        setRatio(end);
        return;
      }
      // ease-out 보간
      const eased = 1 - Math.pow(1 - t, 3);
      setRatio(start + (end - start) * eased);
      requestAnimationFrame(animate);
    };
    animate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledRatio]);

  // 드래그 시작
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  // 드래그 중 + 드래그 종료 이벤트
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = (e.clientX - rect.left) / rect.width;
      setRatio(Math.min(maxRatio, Math.max(minRatio, newRatio)));
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [minRatio, maxRatio]);

  return (
    <div ref={containerRef} className="flex h-full w-full">
      {/* 좌측 패널 */}
      <div style={{ width: `${ratio * 100}%` }} className="min-w-0 h-full overflow-hidden">
        {left}
      </div>

      {/* 드래그 핸들 */}
      <div
        onMouseDown={handleMouseDown}
        className="w-1.5 flex-shrink-0 bg-neutral-800 hover:bg-orange-500/60 active:bg-orange-500 cursor-col-resize transition-colors relative group"
      >
        {/* 핸들 중앙 인디케이터 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-neutral-600 group-hover:bg-orange-400 transition-colors" />
      </div>

      {/* 우측 패널 */}
      <div style={{ width: `${(1 - ratio) * 100}%` }} className="min-w-0 h-full overflow-hidden">
        {right}
      </div>
    </div>
  );
}
