'use client';

// ============================================
// 포즈 오버레이: 이미지 위에 관절점 + 뼈대선 표시
// SVG 기반, 신뢰도에 따라 색상 변화
// ============================================

import { BONE_CONNECTIONS } from '@/lib/landmark-mapping';
import type { ArtRefJointPosition } from '@/lib/landmark-mapping';

interface PoseOverlayProps {
  /** 17개 관절 좌표 */
  joints: ArtRefJointPosition[];
  /** 표시 영역 크기 */
  width: number;
  height: number;
}

/** 신뢰도에 따른 색상 반환 */
function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.7) return '#8b5cf6'; // 보라 (높음)
  if (confidence >= 0.5) return '#eab308'; // 노랑 (중간)
  return '#ef4444';                         // 빨강 (낮음)
}

/**
 * 관절 좌표를 SVG 픽셀 좌표로 변환
 * ArtRef 월드 좌표 → 이미지 비율 좌표 → SVG 좌표
 */
function jointToSvg(
  joint: ArtRefJointPosition,
  width: number,
  height: number
): { sx: number; sy: number } {
  // 월드 좌표를 0~1 범위로 역변환
  const nx = joint.x / 2.0 + 0.5;   // COORD_SCALE=2.0 기준
  const ny = 1 - (joint.y / 2.0);    // y 재반전
  return {
    sx: nx * width,
    sy: ny * height,
  };
}

export function PoseOverlay({ joints, width, height }: PoseOverlayProps) {
  if (joints.length !== 17) return null;

  // 관절 맵 (ID로 빠른 접근)
  const jointMap = new Map(joints.map((j) => [j.jointId, j]));

  return (
    <svg
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none"
      style={{ width, height }}
    >
      {/* 뼈대 연결선 */}
      {BONE_CONNECTIONS.map(([fromId, toId]) => {
        const from = jointMap.get(fromId);
        const to = jointMap.get(toId);
        if (!from || !to) return null;

        const { sx: x1, sy: y1 } = jointToSvg(from, width, height);
        const { sx: x2, sy: y2 } = jointToSvg(to, width, height);
        const avgConf = (from.confidence + to.confidence) / 2;

        return (
          <line
            key={`${fromId}-${toId}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={getConfidenceColor(avgConf)}
            strokeWidth={2}
            strokeOpacity={0.7}
          />
        );
      })}

      {/* 관절 점 */}
      {joints.map((joint) => {
        const { sx, sy } = jointToSvg(joint, width, height);
        const color = getConfidenceColor(joint.confidence);

        return (
          <circle
            key={joint.jointId}
            cx={sx}
            cy={sy}
            r={4}
            fill={color}
            stroke="white"
            strokeWidth={1.5}
            opacity={joint.confidence < 0.3 ? 0.3 : 0.9}
          />
        );
      })}
    </svg>
  );
}
