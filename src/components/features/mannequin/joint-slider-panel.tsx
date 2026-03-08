'use client';

// ============================================
// 관절 X/Y/Z 회전 슬라이더 패널
// 선택된 관절의 회전값을 슬라이더로 직접 조작
// 라디안 ↔ 도(degrees) 변환 처리
// ============================================

import { useCallback } from 'react';
import { usePoseStore, JOINT_LABELS, type JointId } from '@/stores/pose-store';

/** 라디안 → 도(degrees) 변환 */
function radToDeg(rad: number): number {
  return Math.round((rad * 180) / Math.PI);
}

/** 도(degrees) → 라디안 변환 */
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 축 라벨 및 색상 */
const AXES = [
  { index: 0, label: 'X', color: 'bg-red-500', textColor: 'text-red-400', trackColor: 'accent-red-500' },
  { index: 1, label: 'Y', color: 'bg-green-500', textColor: 'text-green-400', trackColor: 'accent-green-500' },
  { index: 2, label: 'Z', color: 'bg-blue-500', textColor: 'text-blue-400', trackColor: 'accent-blue-500' },
] as const;

/**
 * 관절 회전 슬라이더 패널
 * 선택된 관절이 있을 때만 표시
 * -180° ~ +180° 범위의 3축 회전 조작
 */
export function JointSliderPanel() {
  const selectedJoint = usePoseStore((s) => s.selectedJoint);
  const joints = usePoseStore((s) => s.joints);
  const setJointRotation = usePoseStore((s) => s.setJointRotation);
  const selectJoint = usePoseStore((s) => s.selectJoint);
  const resetPose = usePoseStore((s) => s.resetPose);

  // 특정 축의 회전값만 변경
  const handleAxisChange = useCallback(
    (joint: JointId, axisIndex: number, degrees: number) => {
      const current = usePoseStore.getState().joints[joint];
      const newRotation: [number, number, number] = [...current];
      newRotation[axisIndex] = degToRad(degrees);
      setJointRotation(joint, newRotation);
    },
    [setJointRotation]
  );

  // 선택된 관절의 현재 회전값 초기화
  const handleResetJoint = useCallback(() => {
    if (!selectedJoint) return;
    setJointRotation(selectedJoint, [0, 0, 0]);
  }, [selectedJoint, setJointRotation]);

  // 관절 미선택 시 미표시
  if (!selectedJoint) return null;

  const rotation = joints[selectedJoint];
  const jointLabel = JOINT_LABELS[selectedJoint];

  return (
    <div className="p-3 bg-white/90 border border-gray-200 rounded-lg space-y-2">
      {/* 헤더: 관절 이름 + 닫기/리셋 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-semibold text-amber-600">
            {jointLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* 이 관절만 초기화 */}
          <button
            onClick={handleResetJoint}
            className="px-1.5 py-0.5 text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
            title="이 관절 회전 초기화"
          >
            리셋
          </button>
          {/* 전체 초기화 */}
          <button
            onClick={resetPose}
            className="px-1.5 py-0.5 text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
            title="전체 포즈 초기화"
          >
            전체 리셋
          </button>
          {/* 관절 선택 해제 */}
          <button
            onClick={() => selectJoint(null)}
            className="px-1.5 py-0.5 text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
            title="관절 선택 해제 (ESC)"
          >
            닫기
          </button>
        </div>
      </div>

      {/* X/Y/Z 슬라이더 */}
      {AXES.map((axis) => {
        const deg = radToDeg(rotation[axis.index]);
        return (
          <div key={axis.label} className="flex items-center gap-2">
            {/* 축 라벨 */}
            <span className={`w-4 text-center text-[10px] font-bold ${axis.textColor}`}>
              {axis.label}
            </span>

            {/* 슬라이더 */}
            <input
              type="range"
              min={-180}
              max={180}
              value={deg}
              onChange={(e) =>
                handleAxisChange(selectedJoint, axis.index, Number(e.target.value))
              }
              className={`flex-1 h-1.5 rounded-full appearance-none bg-neutral-700 cursor-pointer ${axis.trackColor}`}
              style={{ accentColor: axis.label === 'X' ? '#ef4444' : axis.label === 'Y' ? '#22c55e' : '#3b82f6' }}
            />

            {/* 각도 수치 표시 */}
            <span className="w-10 text-right text-[10px] text-gray-500 tabular-nums">
              {deg}°
            </span>
          </div>
        );
      })}
    </div>
  );
}
