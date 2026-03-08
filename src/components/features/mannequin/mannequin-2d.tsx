'use client';

// ============================================
// 2D Canvas 폴백 마네킹 뷰어
// 저사양/모바일 기기용 경량 관절 조작 인터페이스
// HTML5 Canvas 2D API로 스틱맨 렌더링
// pose-store 동기화로 3D 모드와 포즈 상태 공유
// ============================================

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { usePoseStore, JOINT_IDS, JOINT_LABELS, type JointId } from '@/stores/pose-store';
import { usePerfStore } from '@/stores/perf-store';

/** 2D 관절 위치 (정면 뷰 기준, 캔버스 비율 좌표) */
interface Joint2D {
  id: JointId;
  /** 부모 관절 ID (null이면 루트) */
  parent: JointId | null;
  /** 기본 위치 (0-1 비율) */
  baseX: number;
  baseY: number;
  /** 관절 반경 (px) */
  radius: number;
}

// ============================================
// 2D 체형 파라미터 — mannequin-model.tsx의 BODY_PARAMS와 비율 동기화
// 3D 좌표를 캔버스 비율(0~1)로 변환
// male: 넓은 어깨(0.26), 좁은 골반(0.12), 굵은 사지, 큰 머리/손발
// female: 좁은 어깨(0.19), 넓은 골반(0.16), 가는 사지, 작은 머리/손발
// ============================================
interface BodyParams2D {
  /** 전체 스케일 (여성 0.94, 남성/중립 1.0) */
  scale: number;
  /** 어깨 너비 (중심에서 한쪽까지, 캔버스 비율) */
  shoulderHalf: number;
  /** 골반(엉덩이) 너비 (중심에서 한쪽까지, 캔버스 비율) */
  hipHalf: number;
  /** 허리 너비 (몸통 그리기용, 캔버스 비율) */
  waistHalf: number;
  /** 상완 굵기 (px 기본) */
  upperArmWidth: number;
  /** 전완 굵기 (px 기본) */
  forearmWidth: number;
  /** 허벅지 굵기 (px 기본) */
  thighWidth: number;
  /** 종아리 굵기 (px 기본) */
  calfWidth: number;
  /** 목 굵기 (px 기본) */
  neckWidth: number;
  /** 목 길이 비율 (Y 오프셋 factor) */
  neckLength: number;
  /** 머리 반경 (px) */
  headRadius: number;
  /** 머리 세로 비율 (1.0 = 정원, >1 = 세로로 길게) */
  headAspect: number;
  /** 턱 너비 비율 (0~1, 낮으면 둥글고 높으면 각짐) */
  jawWidth: number;
  /** 손 스케일 (1.0 기준) */
  handScale: number;
  /** 발 스케일 (1.0 기준) */
  footScale: number;
}

/** 3D BODY_PARAMS 비율을 2D 캔버스 좌표계로 변환한 파라미터 */
const BODY_PARAMS_2D: Record<string, BodyParams2D> = {
  male: {
    scale: 1.0,
    // 3D shoulderWidth 0.26 → 캔버스 비율 0.17 (넓은 어깨)
    shoulderHalf: 0.17,
    // 3D pelvisWidth 0.12 / hipSpread 0.095 → 좁은 골반
    hipHalf: 0.065,
    waistHalf: 0.08,
    // 3D upperArmRadius 0.046 → 굵은 사지 (기본 px 곱)
    upperArmWidth: 8,
    forearmWidth: 6.5,
    thighWidth: 11,
    calfWidth: 8,
    // 두꺼운 목 (3D neckRadius 0.038)
    neckWidth: 6.5,
    neckLength: 0.85,     // 짧은 목 (3D neckHeight 0.07)
    // 큰 머리 (3D headScale 0.098)
    headRadius: 16,
    headAspect: 1.1,       // 약간 세로형 (3D headAspect 1.1)
    jawWidth: 0.8,         // 넓고 각진 턱
    handScale: 1.1,        // 큰 손
    footScale: 1.1,        // 큰 발
  },
  female: {
    scale: 0.94,
    // 3D shoulderWidth 0.19 → 좁은 어깨
    shoulderHalf: 0.125,
    // 3D pelvisWidth 0.16 / hipSpread 0.125 → 넓은 골반
    hipHalf: 0.09,
    // 3D waistWidth 0.085 → 잘록한 허리
    waistHalf: 0.055,
    // 가는 사지 (3D upperArmRadius 0.032)
    upperArmWidth: 5.5,
    forearmWidth: 4.5,
    thighWidth: 9,
    calfWidth: 5.8,
    // 가는 목 (3D neckRadius 0.028)
    neckWidth: 4.5,
    neckLength: 1.15,      // 긴 목 (3D neckHeight 0.09)
    // 작은 머리 (3D headScale 0.088)
    headRadius: 13,
    headAspect: 1.2,       // 달걀형 (3D headAspect 1.2)
    jawWidth: 0.55,        // 좁고 둥근 턱
    handScale: 0.85,       // 작은 손
    footScale: 0.85,       // 작은 발
  },
  neutral: {
    scale: 1.0,
    shoulderHalf: 0.15,
    hipHalf: 0.075,
    waistHalf: 0.07,
    upperArmWidth: 7,
    forearmWidth: 5.5,
    thighWidth: 10,
    calfWidth: 7,
    neckWidth: 5.5,
    neckLength: 1.0,
    headRadius: 14,
    headAspect: 1.15,
    jawWidth: 0.7,
    handScale: 1.0,
    footScale: 1.0,
  },
};

/** 체형에 따라 관절 배치를 동적으로 생성 */
function createJointLayout(bodyType: 'male' | 'female' | null): Joint2D[] {
  const p = BODY_PARAMS_2D[bodyType || 'neutral'];
  const cx = 0.5; // 중심 X

  return [
    { id: 'pelvis', parent: null, baseX: cx, baseY: 0.52, radius: 6 },
    { id: 'spine', parent: 'pelvis', baseX: cx, baseY: 0.45, radius: 5 },
    { id: 'chest', parent: 'spine', baseX: cx, baseY: 0.35, radius: 6 },
    { id: 'neck', parent: 'chest', baseX: cx, baseY: 0.27, radius: Math.round(p.neckWidth * 0.7) },
    { id: 'head', parent: 'neck', baseX: cx, baseY: 0.27 - 0.09 * p.neckLength, radius: p.headRadius },
    // 왼쪽 팔 — 어깨 위치가 체형에 따라 달라짐
    { id: 'leftShoulder', parent: 'chest', baseX: cx - p.shoulderHalf, baseY: 0.30, radius: 7 },
    { id: 'leftElbow', parent: 'leftShoulder', baseX: cx - p.shoulderHalf - 0.08, baseY: 0.45, radius: 5 },
    { id: 'leftWrist', parent: 'leftElbow', baseX: cx - p.shoulderHalf - 0.12, baseY: 0.58, radius: 4 },
    // 오른쪽 팔
    { id: 'rightShoulder', parent: 'chest', baseX: cx + p.shoulderHalf, baseY: 0.30, radius: 7 },
    { id: 'rightElbow', parent: 'rightShoulder', baseX: cx + p.shoulderHalf + 0.08, baseY: 0.45, radius: 5 },
    { id: 'rightWrist', parent: 'rightElbow', baseX: cx + p.shoulderHalf + 0.12, baseY: 0.58, radius: 4 },
    // 왼쪽 다리 — 골반 너비에 따라 달라짐
    { id: 'leftHip', parent: 'pelvis', baseX: cx - p.hipHalf, baseY: 0.55, radius: 7 },
    { id: 'leftKnee', parent: 'leftHip', baseX: cx - p.hipHalf + 0.01, baseY: 0.72, radius: 6 },
    { id: 'leftAnkle', parent: 'leftKnee', baseX: cx - p.hipHalf + 0.01, baseY: 0.88, radius: 4 },
    // 오른쪽 다리
    { id: 'rightHip', parent: 'pelvis', baseX: cx + p.hipHalf, baseY: 0.55, radius: 7 },
    { id: 'rightKnee', parent: 'rightHip', baseX: cx + p.hipHalf - 0.01, baseY: 0.72, radius: 6 },
    { id: 'rightAnkle', parent: 'rightKnee', baseX: cx + p.hipHalf - 0.01, baseY: 0.88, radius: 4 },
  ];
}

/** 뼈 연결 정의 (그리기용) */
const BONES: [JointId, JointId][] = [
  ['pelvis', 'spine'],
  ['spine', 'chest'],
  ['chest', 'neck'],
  ['neck', 'head'],
  ['chest', 'leftShoulder'],
  ['leftShoulder', 'leftElbow'],
  ['leftElbow', 'leftWrist'],
  ['chest', 'rightShoulder'],
  ['rightShoulder', 'rightElbow'],
  ['rightElbow', 'rightWrist'],
  ['pelvis', 'leftHip'],
  ['leftHip', 'leftKnee'],
  ['leftKnee', 'leftAnkle'],
  ['pelvis', 'rightHip'],
  ['rightHip', 'rightKnee'],
  ['rightKnee', 'rightAnkle'],
];

interface Mannequin2DProps {
  className?: string;
  /** 체형 타입 (3D 마네킹과 동기화) */
  bodyType?: 'male' | 'female' | null;
}

export function Mannequin2D({ className = '', bodyType = null }: Mannequin2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 포즈 스토어 연동
  const joints = usePoseStore((s) => s.joints);
  const selectedJoint = usePoseStore((s) => s.selectedJoint);
  const selectJoint = usePoseStore((s) => s.selectJoint);
  const setJointRotation = usePoseStore((s) => s.setJointRotation);

  // 모바일 여부 (히트 영역 확대)
  const isMobile = usePerfStore((s) => s.isMobile);

  // 드래그 상태
  const [dragging, setDragging] = useState<JointId | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; rotation: [number, number, number] } | null>(null);

  // 체형에 따른 관절 레이아웃 (메모이제이션)
  const jointLayout = useMemo(() => createJointLayout(bodyType), [bodyType]);
  // 체형 파라미터 (그리기용)
  const bodyParams = useMemo(() => BODY_PARAMS_2D[bodyType || 'neutral'], [bodyType]);

  // 관절 위치 계산 (회전값 반영)
  const getJointPositions = useCallback(
    (width: number, height: number) => {
      const positions: Record<string, { x: number; y: number }> = {};

      for (const joint of jointLayout) {
        let x = joint.baseX * width;
        let y = joint.baseY * height;

        // 회전값을 2D 위치 오프셋으로 변환 (간소화: Y회전→X이동, X회전→Y이동)
        const rot = joints[joint.id];
        if (rot && joint.parent) {
          const parentPos = positions[joint.parent];
          if (parentPos) {
            // 부모 기준 상대 위치에 회전 적용
            const dx = x - parentPos.x;
            const dy = y - parentPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // 기본 각도 + 회전값 적용
            const baseAngle = Math.atan2(dy, dx);
            // Z축 회전을 주 회전으로 사용, Y축 회전은 좌우 이동
            const adjustedAngle = baseAngle + rot[2] + rot[1] * 0.5;

            x = parentPos.x + Math.cos(adjustedAngle) * dist;
            y = parentPos.y + Math.sin(adjustedAngle) * dist;
          }
        }

        positions[joint.id] = { x, y };
      }

      return positions;
    },
    [joints, jointLayout]
  );

  // 캔버스 그리기
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    // 배경
    ctx.fillStyle = '#171717';
    ctx.fillRect(0, 0, w, h);

    // 바닥 그리드
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    const gridY = h * 0.92;
    ctx.beginPath();
    ctx.moveTo(0, gridY);
    ctx.lineTo(w, gridY);
    ctx.stroke();

    const positions = getJointPositions(w, h);
    const bp = bodyParams;

    // 캔버스 크기에 따른 스케일 팩터 (기준: 400px 높이)
    const sf = h / 400;

    // === 뼈별 굵기 매핑 (체형 파라미터 기반) ===
    const boneWidth: Record<string, number> = {
      'pelvis-spine': bp.waistHalf * w * 0.3,
      'spine-chest': bp.waistHalf * w * 0.28,
      'chest-neck': bp.neckWidth * sf,
      'neck-head': bp.neckWidth * sf * 0.85,
      'chest-leftShoulder': bp.upperArmWidth * sf * 0.9,
      'leftShoulder-leftElbow': bp.upperArmWidth * sf,
      'leftElbow-leftWrist': bp.forearmWidth * sf,
      'chest-rightShoulder': bp.upperArmWidth * sf * 0.9,
      'rightShoulder-rightElbow': bp.upperArmWidth * sf,
      'rightElbow-rightWrist': bp.forearmWidth * sf,
      'pelvis-leftHip': bp.thighWidth * sf * 0.8,
      'leftHip-leftKnee': bp.thighWidth * sf,
      'leftKnee-leftAnkle': bp.calfWidth * sf,
      'pelvis-rightHip': bp.thighWidth * sf * 0.8,
      'rightHip-rightKnee': bp.thighWidth * sf,
      'rightKnee-rightAnkle': bp.calfWidth * sf,
    };

    // === 몸통 실루엣 그리기 (어깨→허리→골반 곡선) ===
    const drawTorsoSilhouette = () => {
      const lShoulder = positions['leftShoulder'];
      const rShoulder = positions['rightShoulder'];
      const spine = positions['spine'];
      const lHip = positions['leftHip'];
      const rHip = positions['rightHip'];
      if (!lShoulder || !rShoulder || !spine || !lHip || !rHip) return;

      // 허리 잘록 포인트 계산
      const waistY = spine.y;
      const waistOffsetX = bp.waistHalf * w;

      ctx.fillStyle = '#2d2640';
      ctx.beginPath();
      // 왼쪽 어깨 → 왼쪽 허리 → 왼쪽 골반 (부드러운 곡선)
      ctx.moveTo(lShoulder.x, lShoulder.y);
      ctx.quadraticCurveTo(
        0.5 * w - waistOffsetX, waistY,
        lHip.x, lHip.y,
      );
      // 오른쪽 골반 → 오른쪽 허리 → 오른쪽 어깨
      ctx.lineTo(rHip.x, rHip.y);
      ctx.quadraticCurveTo(
        0.5 * w + waistOffsetX, waistY,
        rShoulder.x, rShoulder.y,
      );
      ctx.closePath();
      ctx.fill();
    };
    drawTorsoSilhouette();

    // === 뼈 그리기 (체형별 굵기 적용) ===
    ctx.lineCap = 'round';
    for (const [fromId, toId] of BONES) {
      const from = positions[fromId];
      const to = positions[toId];
      if (!from || !to) continue;

      const key = `${fromId}-${toId}`;
      const width = boneWidth[key] ?? 3 * sf;

      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = Math.max(width, 1.5);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }

    // === 머리 그리기 (체형별 크기/비율) ===
    const headPos = positions['head'];
    if (headPos) {
      const hr = bp.headRadius * sf * (isMobile ? 1.3 : 1);
      const aspect = bp.headAspect;

      // 두개골 (타원형)
      ctx.fillStyle = '#3d3555';
      ctx.beginPath();
      ctx.ellipse(headPos.x, headPos.y, hr, hr * aspect, 0, 0, Math.PI * 2);
      ctx.fill();

      // 턱 힌트 (jawWidth로 너비 조절)
      const jawY = headPos.y + hr * aspect * 0.65;
      const jawW = hr * bp.jawWidth;
      ctx.beginPath();
      ctx.ellipse(headPos.x, jawY, jawW, hr * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // === 손 그리기 (체형별 크기) ===
    const drawHand = (wristId: JointId) => {
      const wristPos = positions[wristId];
      if (!wristPos) return;
      const hs = bp.handScale * sf * 4;
      ctx.fillStyle = '#a78bfa';
      ctx.beginPath();
      ctx.ellipse(wristPos.x, wristPos.y + hs * 1.2, hs * 0.7, hs, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    drawHand('leftWrist');
    drawHand('rightWrist');

    // === 발 그리기 (체형별 크기) ===
    const drawFoot = (ankleId: JointId) => {
      const anklePos = positions[ankleId];
      if (!anklePos) return;
      const fs = bp.footScale * sf * 5;
      ctx.fillStyle = '#a78bfa';
      ctx.beginPath();
      ctx.ellipse(anklePos.x + fs * 0.2, anklePos.y + fs * 0.3, fs * 1.0, fs * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    drawFoot('leftAnkle');
    drawFoot('rightAnkle');

    // === 관절 그리기 ===
    for (const joint of jointLayout) {
      const pos = positions[joint.id];
      if (!pos) continue;

      // 머리는 위에서 별도로 그렸으므로 관절 원 건너뜀
      if (joint.id === 'head') continue;

      const isSelected = selectedJoint === joint.id;
      const isDragged = dragging === joint.id;
      const radius = joint.radius * sf * (isMobile ? 1.5 : 1);

      // 관절 원
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected || isDragged ? '#e879f9' : '#8b5cf6';
      ctx.fill();

      // 선택된 관절 하이라이트 링
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 4 * sf, 0, Math.PI * 2);
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // 체형 + 2D 모드 표시
    const typeLabel = bodyType === 'male' ? '남성' : bodyType === 'female' ? '여성' : '중립';
    ctx.fillStyle = '#525252';
    ctx.font = `${10 * sf}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`2D 모드 (${typeLabel}) | 관절을 드래그하여 포즈 변경`, 8, h - 8);
  }, [getJointPositions, selectedJoint, dragging, isMobile, jointLayout, bodyParams, bodyType]);

  // 리사이즈 + 리드로
  useEffect(() => {
    draw();
    const observer = new ResizeObserver(() => draw());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [draw]);

  // 포인터 이벤트: 관절 히트 테스트
  const getHitJoint = useCallback(
    (clientX: number, clientY: number): JointId | null => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return null;

      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const w = rect.width;
      const h = rect.height;
      const positions = getJointPositions(w, h);

      // 히트 영역: 모바일 40px, 데스크탑 20px
      const hitRadius = isMobile ? 40 : 20;

      // 역순으로 탐색 (위에 그려진 관절 우선)
      for (let i = jointLayout.length - 1; i >= 0; i--) {
        const joint = jointLayout[i];
        const pos = positions[joint.id];
        if (!pos) continue;

        const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        if (dist <= hitRadius) return joint.id;
      }

      return null;
    },
    [getJointPositions, isMobile, jointLayout]
  );

  // 포인터 다운: 관절 선택 또는 드래그 시작
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const jointId = getHitJoint(e.clientX, e.clientY);
      if (jointId) {
        selectJoint(jointId);
        setDragging(jointId);
        dragStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          rotation: [...joints[jointId]],
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } else {
        selectJoint(null);
      }
    },
    [getHitJoint, selectJoint, joints]
  );

  // 포인터 이동: 드래그로 회전값 변경
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !dragStartRef.current) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      // 드래그 거리 → 회전값 (0.01 rad/px)
      const sensitivity = 0.01;
      const newRotation: [number, number, number] = [
        dragStartRef.current.rotation[0] + dy * sensitivity,  // X축: 상하 드래그
        dragStartRef.current.rotation[1] + dx * sensitivity,  // Y축: 좌우 드래그
        dragStartRef.current.rotation[2],                      // Z축: 유지
      ];

      setJointRotation(dragging, newRotation);
    },
    [dragging, setJointRotation]
  );

  // 포인터 업: 드래그 종료
  const handlePointerUp = useCallback(() => {
    setDragging(null);
    dragStartRef.current = null;
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative rounded-xl overflow-hidden bg-gray-50 border border-gray-200 ${className}`}
    >
      <div className="aspect-[4/5] w-full">
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      {/* 선택된 관절 표시 */}
      {selectedJoint && (
        <div className="absolute top-3 right-3 px-2 py-1 bg-amber-600/80 backdrop-blur-sm rounded text-[10px] font-medium text-white">
          {JOINT_LABELS[selectedJoint]}
        </div>
      )}

      {/* 2D 모드 배지 */}
      <div className="absolute top-3 left-3 px-2 py-1 bg-amber-600/80 backdrop-blur-sm rounded text-[10px] font-medium text-white">
        2D 모드
      </div>

      {/* 안내 */}
      <div className="absolute bottom-3 left-3 text-[10px] text-gray-400">
        관절 드래그: 포즈 변경 | 클릭: 선택
      </div>
    </div>
  );
}
