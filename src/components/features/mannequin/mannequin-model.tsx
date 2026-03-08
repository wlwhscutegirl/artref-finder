'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import { usePoseStore, type JointId } from '@/stores/pose-store';
import { useAnatomyStore } from '@/stores/anatomy-store';
import {
  getBoneAnatomyColor,
  getJointAnatomyColor,
  MUSCLE_COLOR_MAP,
  BONE_MUSCLE_MAP,
  JOINT_MUSCLE_MAP,
  type BoneKey,
} from '@/lib/anatomy-data';

// ============================================
// 체형별 비율 파라미터
// 남성: 어깨 넓음, 골반 좁음, 175cm 기준
// 여성: 어깨 좁음, 골반 넓음, 165cm 기준
// ============================================
const BODY_PARAMS = {
  male: {
    scale: 1.0,
    // 넓은 어깨, 좁은 골반 (역삼각형 V체형)
    shoulderWidth: 0.26,
    chestWidth: 0.17,
    chestDepth: 0.11,
    waistWidth: 0.12,
    pelvisWidth: 0.12,
    hipSpread: 0.095,
    armDeltaX: -0.04,
    headY: 1.75,
    // 굵은 사지 (근육질)
    upperArmRadius: 0.046,
    forearmRadius: 0.037,
    thighRadius: 0.068,
    calfRadius: 0.046,
    // 성별 전용 파라미터
    neckRadius: 0.038,      // 두꺼운 목
    neckHeight: 0.07,        // 짧은 목
    headScale: 0.098,        // 약간 큰 머리
    headAspect: 1.1,         // 세로 비율 (낮을수록 넓적)
    jawWidth: 0.8,           // 넓은 각진 턱
    jawDrop: 0.5,            // 턱 돌출 (낮을수록 각짐)
    handScale: 1.1,          // 큰 손
    footScale: 1.1,          // 큰 발
    clavicleThick: 0.017,    // 두꺼운 쇄골
  },
  female: {
    scale: 0.94,
    // 좁은 어깨, 넓은 골반 (모래시계 체형)
    shoulderWidth: 0.19,
    chestWidth: 0.12,
    chestDepth: 0.085,
    waistWidth: 0.085,
    pelvisWidth: 0.16,
    hipSpread: 0.125,
    armDeltaX: -0.035,
    headY: 1.75,
    // 가는 사지
    upperArmRadius: 0.032,
    forearmRadius: 0.026,
    thighRadius: 0.054,
    calfRadius: 0.034,
    // 성별 전용 파라미터
    neckRadius: 0.028,       // 가는 목
    neckHeight: 0.09,        // 긴 목
    headScale: 0.088,        // 약간 작은 머리
    headAspect: 1.2,         // 세로 비율 (달걀형)
    jawWidth: 0.55,          // 좁고 둥근 턱
    jawDrop: 0.35,           // 턱 돌출 적음 (둥글게)
    handScale: 0.85,         // 작은 손
    footScale: 0.85,         // 작은 발
    clavicleThick: 0.012,    // 가는 쇄골
  },
  neutral: {
    scale: 1.0,
    shoulderWidth: 0.22,
    chestWidth: 0.14,
    chestDepth: 0.095,
    waistWidth: 0.105,
    pelvisWidth: 0.13,
    hipSpread: 0.10,
    armDeltaX: -0.04,
    headY: 1.75,
    upperArmRadius: 0.040,
    forearmRadius: 0.032,
    thighRadius: 0.060,
    calfRadius: 0.040,
    neckRadius: 0.032,
    neckHeight: 0.08,
    headScale: 0.093,
    headAspect: 1.15,
    jawWidth: 0.7,
    jawDrop: 0.45,
    handScale: 1.0,
    footScale: 1.0,
    clavicleThick: 0.015,
  },
} as const;

// ============================================
// 피규어 마네킹 색상 (중성 그레이 톤)
// ============================================
const COLORS = {
  body: '#c0b8b0',           // 몸통/사지 (웜 그레이)
  joint: '#a09890',          // 관절 구 (다크 웜 그레이)
  jointSelected: '#e879f9',  // 선택된 관절 (보라)
  jointGap: '#706860',       // 관절 갭 링 (어두운 그레이)
  head: '#c8c0b8',           // 머리 (약간 밝은 톤)
};

// ============================================
// 피규어 마네킹 재질 속성 (매끄러운 플라스틱/레진)
// ============================================
const BODY_MATERIAL = {
  roughness: 0.35,
  metalness: 0.02,
  clearcoat: 0.3,
  clearcoatRoughness: 0.4,
};

const JOINT_MATERIAL = {
  roughness: 0.5,
  metalness: 0.05,
};

// ============================================
// 테이퍼드 사지 지오메트리 생성기
// Lathe 지오메트리로 근육 느낌의 부드러운 테이퍼 표현
// ============================================
function useTaperedLimbGeometry(
  topRadius: number,
  midRadius: number,
  bottomRadius: number,
  height: number,
  segments: number = 24,
) {
  return useMemo(() => {
    // 프로필 커브: 위 → 중간(불룩) → 아래
    const points: THREE.Vector2[] = [];
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // 코사인 보간으로 자연스러운 근육 곡선
      let r: number;
      if (t < 0.5) {
        const localT = t / 0.5;
        r = topRadius + (midRadius - topRadius) * (0.5 - 0.5 * Math.cos(Math.PI * localT));
      } else {
        const localT = (t - 0.5) / 0.5;
        r = midRadius + (bottomRadius - midRadius) * (0.5 - 0.5 * Math.cos(Math.PI * localT));
      }
      const y = (0.5 - t) * height;
      points.push(new THREE.Vector2(r, y));
    }
    return new THREE.LatheGeometry(points, segments);
  }, [topRadius, midRadius, bottomRadius, height, segments]);
}

// ============================================
// 토르소 지오메트리 (어깨→허리 테이퍼)
// ============================================
function useTorsoGeometry(
  topWidth: number,
  topDepth: number,
  bottomWidth: number,
  bottomDepth: number,
  height: number,
) {
  return useMemo(() => {
    // 상자를 기반으로 위/아래 크기가 다른 형태
    const shape = new THREE.Shape();
    // BufferGeometry로 직접 구성 대신, 단순하게 커스텀 박스 사용
    const geo = new THREE.BoxGeometry(1, height, 1, 4, 8, 4);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = (y / height) + 0.5; // 0(아래)~1(위)
      // 부드러운 보간
      const smooth = 0.5 - 0.5 * Math.cos(Math.PI * t);
      const w = bottomWidth + (topWidth - bottomWidth) * smooth;
      const d = bottomDepth + (topDepth - bottomDepth) * smooth;
      pos.setX(i, pos.getX(i) * w * 2);
      pos.setZ(i, pos.getZ(i) * d * 2);
    }
    geo.computeVertexNormals();
    return geo;
  }, [topWidth, topDepth, bottomWidth, bottomDepth, height]);
}

// ============================================
// 시각 메쉬 컴포넌트 — 피규어 마네킹 스타일
// ============================================

/** 테이퍼드 사지 (근육 느낌의 Lathe 지오메트리) */
function TaperedLimb({ position, topR, midR, bottomR, height, anatomyColor, dimmed }: {
  position: [number, number, number];
  topR: number;
  midR: number;
  bottomR: number;
  height: number;
  anatomyColor?: string;
  dimmed?: boolean;
}) {
  const geometry = useTaperedLimbGeometry(topR, midR, bottomR, height);
  const color = anatomyColor || COLORS.body;
  return (
    <mesh position={position} geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        color={color}
        {...BODY_MATERIAL}
        transparent={dimmed}
        opacity={dimmed ? 0.25 : 1}
      />
    </mesh>
  );
}

/** 관절 갭 링 (볼조인트 사이의 어두운 홈) */
function JointGapRing({ position, radius, anatomyColor, dimmed }: {
  position: [number, number, number];
  radius: number;
  anatomyColor?: string;
  dimmed?: boolean;
}) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, radius * 0.12, 8, 24]} />
      <meshStandardMaterial
        color={anatomyColor || COLORS.jointGap}
        roughness={0.8}
        transparent={dimmed}
        opacity={dimmed ? 0.15 : 1}
      />
    </mesh>
  );
}

/** 토르소 세그먼트 (어깨→허리 테이퍼) */
function TorsoSegment({ position, topW, topD, bottomW, bottomD, height, anatomyColor, dimmed }: {
  position: [number, number, number];
  topW: number;
  topD: number;
  bottomW: number;
  bottomD: number;
  height: number;
  anatomyColor?: string;
  dimmed?: boolean;
}) {
  const geometry = useTorsoGeometry(topW, topD, bottomW, bottomD, height);
  const color = anatomyColor || COLORS.body;
  return (
    <mesh position={position} geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        color={color}
        {...BODY_MATERIAL}
        transparent={dimmed}
        opacity={dimmed ? 0.25 : 1}
      />
    </mesh>
  );
}

/** 마네킹 머리 (체형별 달걀형/각진형) */
function MannequinHead({ headScale, headAspect, jawWidth, jawDrop, anatomyColor, dimmed }: {
  headScale: number;
  headAspect: number;
  jawWidth: number;
  jawDrop: number;
  anatomyColor?: string;
  dimmed?: boolean;
}) {
  const color = anatomyColor || COLORS.head;
  return (
    <group>
      {/* 두개골 (headAspect로 세로 비율 조절) */}
      <mesh castShadow receiveShadow scale={[1, headAspect, 0.95]}>
        <sphereGeometry args={[headScale, 32, 32]} />
        <meshPhysicalMaterial
          color={color}
          {...BODY_MATERIAL}
          transparent={dimmed}
          opacity={dimmed ? 0.25 : 1}
        />
      </mesh>
      {/* 턱 힌트 (jawWidth: 넓으면 각진, jawDrop: 낮으면 각진) */}
      <mesh position={[0, -headScale * 0.8, 0.025]} castShadow scale={[jawWidth, jawDrop, 0.55]}>
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshPhysicalMaterial
          color={color}
          {...BODY_MATERIAL}
          transparent={dimmed}
          opacity={dimmed ? 0.25 : 1}
        />
      </mesh>
      {/* 목 연결부 갭 링 */}
      <JointGapRing position={[0, -headScale * 1.05, 0]} radius={0.045} dimmed={dimmed} />
    </group>
  );
}

/** 마네킹 손 (체형별 크기) */
function MannequinHand({ handScale = 1.0, anatomyColor, dimmed }: {
  handScale?: number;
  anatomyColor?: string;
  dimmed?: boolean;
}) {
  const color = anatomyColor || COLORS.body;
  const s = handScale;
  return (
    <group scale={[s, s, s]}>
      {/* 손바닥 */}
      <mesh position={[0, -0.04, 0]} castShadow>
        <boxGeometry args={[0.05, 0.07, 0.025]} />
        <meshPhysicalMaterial
          color={color}
          {...BODY_MATERIAL}
          transparent={dimmed}
          opacity={dimmed ? 0.25 : 1}
        />
      </mesh>
      {/* 손가락 힌트 (합쳐진 블록) */}
      <mesh position={[0, -0.095, 0]} castShadow>
        <boxGeometry args={[0.045, 0.045, 0.02]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.4}
          transparent={dimmed}
          opacity={dimmed ? 0.25 : 1}
        />
      </mesh>
    </group>
  );
}

/** 마네킹 발 (체형별 크기) */
function MannequinFoot({ footScale = 1.0, anatomyColor, dimmed }: {
  footScale?: number;
  anatomyColor?: string;
  dimmed?: boolean;
}) {
  const color = anatomyColor || COLORS.body;
  const s = footScale;
  return (
    <group scale={[s, s, s]}>
      {/* 발등 */}
      <mesh position={[0, -0.015, 0.04]} castShadow>
        <boxGeometry args={[0.065, 0.04, 0.13]} />
        <meshPhysicalMaterial
          color={color}
          {...BODY_MATERIAL}
          transparent={dimmed}
          opacity={dimmed ? 0.25 : 1}
        />
      </mesh>
      {/* 발 앞부분 (둥글게) */}
      <mesh position={[0, -0.015, 0.1]} castShadow>
        <sphereGeometry args={[0.032, 12, 8]} />
        <meshPhysicalMaterial
          color={color}
          {...BODY_MATERIAL}
          transparent={dimmed}
          opacity={dimmed ? 0.25 : 1}
        />
      </mesh>
    </group>
  );
}

/** 여성 흉부 힌트 (해부학적으로 절제된 표현) */
function FemaleBustHint({ anatomyColor, dimmed }: {
  anatomyColor?: string;
  dimmed?: boolean;
}) {
  const color = anatomyColor || COLORS.body;
  return (
    <group position={[0, 0.02, 0.06]}>
      {/* 좌측 */}
      <mesh position={[-0.05, 0, 0]} castShadow scale={[1, 0.85, 0.7]}>
        <sphereGeometry args={[0.042, 16, 16]} />
        <meshPhysicalMaterial
          color={color}
          {...BODY_MATERIAL}
          transparent={dimmed}
          opacity={dimmed ? 0.25 : 1}
        />
      </mesh>
      {/* 우측 */}
      <mesh position={[0.05, 0, 0]} castShadow scale={[1, 0.85, 0.7]}>
        <sphereGeometry args={[0.042, 16, 16]} />
        <meshPhysicalMaterial
          color={color}
          {...BODY_MATERIAL}
          transparent={dimmed}
          opacity={dimmed ? 0.25 : 1}
        />
      </mesh>
    </group>
  );
}

/** 남성 흉근 힌트 (넓고 납작한 가슴판) */
function MalePecHint({ anatomyColor, dimmed }: {
  anatomyColor?: string;
  dimmed?: boolean;
}) {
  const color = anatomyColor || COLORS.body;
  return (
    <group position={[0, 0.04, 0.065]}>
      {/* 좌측 흉근 */}
      <mesh position={[-0.055, 0, 0]} castShadow scale={[1.2, 0.7, 0.4]}>
        <sphereGeometry args={[0.045, 16, 12]} />
        <meshPhysicalMaterial
          color={color}
          {...BODY_MATERIAL}
          transparent={dimmed}
          opacity={dimmed ? 0.25 : 1}
        />
      </mesh>
      {/* 우측 흉근 */}
      <mesh position={[0.055, 0, 0]} castShadow scale={[1.2, 0.7, 0.4]}>
        <sphereGeometry args={[0.045, 16, 12]} />
        <meshPhysicalMaterial
          color={color}
          {...BODY_MATERIAL}
          transparent={dimmed}
          opacity={dimmed ? 0.25 : 1}
        />
      </mesh>
    </group>
  );
}

/**
 * 클릭 가능한 관절 구 (볼조인트 스타일)
 * 투명 히트박스(2배 크기) + 시각적 볼조인트
 * 선택 시 보라색 하이라이트 + emissive 효과
 */
function JointSphere({ id, position, radius, selected, onClick, hitboxMultiplier = 2.5, anatomyColor, anatomyDimmed }: {
  id: JointId;
  position: [number, number, number];
  radius: number;
  selected: boolean;
  onClick: (id: JointId) => void;
  /** 히트박스 배율 (모바일/태블릿: 3.5, 데스크탑: 2.5) */
  hitboxMultiplier?: number;
  /** 해부학 모드 활성 시 근육 그룹 색상 */
  anatomyColor?: string;
  /** 해부학 모드에서 선택되지 않은 근육 → 반투명 처리 */
  anatomyDimmed?: boolean;
}) {
  // 터치 피드백: 탭 시 관절 구 스케일 펄스 애니메이션
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef(1);
  const targetScaleRef = useRef(1);

  // 매 프레임 스케일 보간 (터치 피드백 애니메이션)
  useFrame(() => {
    scaleRef.current += (targetScaleRef.current - scaleRef.current) * 0.2;
    if (groupRef.current) {
      groupRef.current.scale.setScalar(scaleRef.current);
    }
    // 확대 후 원래 크기로 복귀
    if (targetScaleRef.current > 1 && scaleRef.current > 1.15) {
      targetScaleRef.current = 1;
    }
  });

  // 클릭/탭 시 스케일 펄스 트리거
  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    targetScaleRef.current = 1.25; // 25% 확대 후 자동 복귀
    onClick(id);
  }, [id, onClick]);

  const jointColor = selected ? COLORS.jointSelected : (anatomyColor || COLORS.joint);

  return (
    <group position={position} ref={groupRef}>
      {/* 투명 히트박스 (클릭 영역 확대, 터치 기기에서 더 크게) */}
      <mesh
        onClick={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = ''; }}
      >
        <sphereGeometry args={[radius * hitboxMultiplier, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* 볼조인트 구 */}
      <mesh castShadow>
        <sphereGeometry args={[radius, 24, 24]} />
        <meshPhysicalMaterial
          color={jointColor}
          roughness={JOINT_MATERIAL.roughness}
          metalness={JOINT_MATERIAL.metalness}
          emissive={selected ? '#7c3aed' : '#000000'}
          emissiveIntensity={selected ? 0.4 : 0}
          clearcoat={0.2}
          clearcoatRoughness={0.5}
          transparent={anatomyDimmed}
          opacity={anatomyDimmed ? 0.25 : 1}
        />
      </mesh>
    </group>
  );
}

// ============================================
// 메인 마네킹 컴포넌트 (피규어 관절 마네킹)
// ============================================
interface MannequinProps {
  /** 체형 타입 */
  bodyType?: 'male' | 'female' | null;
  /** 히트박스 배율 (모바일: 3.5, 데스크탑: 2.5) */
  hitboxScale?: number;
}

export function Mannequin({ bodyType = null, hitboxScale = 2.5 }: MannequinProps) {
  const {
    joints,
    selectedJoint,
    selectJoint,
    setJointRotation,
    setDragging,
  } = usePoseStore();

  // 해부학 오버레이 상태 (다중 근육 선택 지원)
  const isAnatomyMode = useAnatomyStore((s) => s.isAnatomyMode);
  const selectedMuscles = useAnatomyStore((s) => s.selectedMuscles);

  /**
   * 해부학 모드에서 Bone 색상/dimmed 계산 헬퍼
   * @param boneKey 뼈 식별 키
   * @returns { anatomyColor, dimmed } 또는 빈 객체
   */
  const boneAnatomy = (boneKey: BoneKey) => {
    if (!isAnatomyMode) return {};
    const muscleId = BONE_MUSCLE_MAP[boneKey];
    const anatomyColor = getBoneAnatomyColor(boneKey);
    const dimmed = selectedMuscles.size > 0 && !selectedMuscles.has(muscleId);
    return { anatomyColor, dimmed };
  };

  /**
   * 해부학 모드에서 Joint 색상/dimmed 계산 헬퍼
   * @param jointId 관절 ID
   * @returns 색상 객체 또는 undefined
   */
  const jointAnatomy = (jointId: JointId) => {
    if (!isAnatomyMode) return {};
    const muscleId = JOINT_MUSCLE_MAP[jointId];
    const color = getJointAnatomyColor(jointId);
    const dimmed = selectedMuscles.size > 0 && !selectedMuscles.has(muscleId);
    return { anatomyColor: color, anatomyDimmed: dimmed };
  };

  const p = BODY_PARAMS[bodyType || 'neutral'];

  // 관절 그룹 ref 레지스트리 (TransformControls 연결용)
  const jointRefs = useRef<Record<string, THREE.Group | null>>({});
  const setRef = useCallback(
    (id: string) => (r: THREE.Group | null) => { jointRefs.current[id] = r; },
    []
  );

  // TransformControls 대상 오브젝트 (선택된 관절 그룹)
  const [gizmoTarget, setGizmoTarget] = useState<THREE.Group | null>(null);
  const transformRef = useRef<any>(null);

  // 선택된 관절이 변경되면 기즈모 타겟 업데이트
  useEffect(() => {
    const timer = setTimeout(() => {
      const target = selectedJoint ? jointRefs.current[selectedJoint] ?? null : null;
      setGizmoTarget(target);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedJoint]);

  // TransformControls 이벤트 리스너 (드래그 상태 + 회전값 동기화)
  useEffect(() => {
    const tc = transformRef.current;
    if (!tc) return;

    const onDragChanged = (e: { value: boolean }) => {
      setDragging(e.value);
    };

    const onObjectChange = () => {
      const joint = usePoseStore.getState().selectedJoint;
      if (!joint || !jointRefs.current[joint]) return;
      const r = jointRefs.current[joint]!.rotation;
      setJointRotation(joint, [r.x, r.y, r.z]);
    };

    tc.addEventListener('dragging-changed', onDragChanged);
    tc.addEventListener('objectChange', onObjectChange);
    return () => {
      tc.removeEventListener('dragging-changed', onDragChanged);
      tc.removeEventListener('objectChange', onObjectChange);
    };
  }, [gizmoTarget, setDragging, setJointRotation]);

  // 관절 클릭 핸들러
  const handleJointClick = useCallback((id: JointId) => {
    selectJoint(id);
  }, [selectJoint]);

  // 선택 여부 확인 헬퍼
  const isSel = (id: JointId) => selectedJoint === id;

  return (
    <group>
      {/* 빈 곳 클릭 시 관절 선택 해제 */}
      <mesh
        position={[0, 0.9, 0]}
        onClick={() => selectJoint(null)}
        visible={false}
      >
        <sphereGeometry args={[2, 8, 8]} />
      </mesh>

      <group scale={p.scale}>
        {/* ── 골반 (Root) ── */}
        <group position={[0, 0.9, 0]}>
          <group ref={setRef('pelvis')} rotation={joints.pelvis}>
            <JointSphere id="pelvis" position={[0, 0, 0]} radius={0.045} selected={isSel('pelvis')} onClick={handleJointClick} hitboxMultiplier={hitboxScale} {...jointAnatomy('pelvis')} />
            {/* 골반 블록 (넓은 세그먼트) */}
            <TorsoSegment
              position={[0, 0, 0]}
              topW={p.waistWidth} topD={0.06}
              bottomW={p.pelvisWidth} bottomD={0.08}
              height={0.12}
              {...boneAnatomy('pelvis')}
            />
            {/* 골반-척추 갭 링 */}
            <JointGapRing position={[0, 0.07, 0]} radius={0.07} {...boneAnatomy('pelvis')} />

            {/* ── 척추 ── */}
            <group position={[0, 0.15, 0]}>
              <group ref={setRef('spine')} rotation={joints.spine}>
                <JointSphere id="spine" position={[0, 0, 0]} radius={0.038} selected={isSel('spine')} onClick={handleJointClick} hitboxMultiplier={hitboxScale} {...jointAnatomy('spine')} />
                {/* 복부 세그먼트 (허리 잘록) */}
                <TorsoSegment
                  position={[0, 0.06, 0]}
                  topW={p.waistWidth * 0.95} topD={0.065}
                  bottomW={p.waistWidth} bottomD={0.06}
                  height={0.14}
                  {...boneAnatomy('spine')}
                />
                {/* 척추-흉부 갭 링 */}
                <JointGapRing position={[0, 0.15, 0]} radius={0.065} {...boneAnatomy('spine')} />

                {/* ── 흉부 ── */}
                <group position={[0, 0.3, 0]}>
                  <group ref={setRef('chest')} rotation={joints.chest}>
                    <JointSphere id="chest" position={[0, 0, 0]} radius={0.042} selected={isSel('chest')} onClick={handleJointClick} hitboxMultiplier={hitboxScale} {...jointAnatomy('chest')} />
                    {/* 흉곽 (위가 넓고 아래가 좁은 역삼각형) */}
                    <TorsoSegment
                      position={[0, 0.04, 0]}
                      topW={p.chestWidth} topD={p.chestDepth}
                      bottomW={p.waistWidth * 1.05} bottomD={0.07}
                      height={0.22}
                      {...boneAnatomy('chest')}
                    />
                    {/* 쇄골 라인 힌트 */}
                    <mesh position={[0, 0.13, 0.02]} castShadow>
                      <capsuleGeometry args={[p.clavicleThick, p.shoulderWidth * 1.6, 6, 12]} />
                      <meshPhysicalMaterial
                        color={boneAnatomy('chest').anatomyColor || COLORS.body}
                        {...BODY_MATERIAL}
                        transparent={boneAnatomy('chest').dimmed}
                        opacity={boneAnatomy('chest').dimmed ? 0.25 : 1}
                      />
                    </mesh>
                    {/* 성별 전용 흉부 디테일 */}
                    {bodyType === 'female' && <FemaleBustHint {...boneAnatomy('chest')} />}
                    {bodyType === 'male' && <MalePecHint {...boneAnatomy('chest')} />}

                    {/* ── 목 ── */}
                    <group position={[0, 0.22, 0]}>
                      <JointGapRing position={[0, -0.01, 0]} radius={0.04} {...boneAnatomy('neck')} />
                      <group ref={setRef('neck')} rotation={joints.neck}>
                        <JointSphere id="neck" position={[0, 0, 0]} radius={0.028} selected={isSel('neck')} onClick={handleJointClick} hitboxMultiplier={hitboxScale} {...jointAnatomy('neck')} />
                        {/* 목 실린더 (체형별 굵기/길이) */}
                        <TaperedLimb
                          position={[0, p.neckHeight / 2, 0]}
                          topR={p.neckRadius * 0.85} midR={p.neckRadius} bottomR={p.neckRadius * 1.1}
                          height={p.neckHeight}
                          {...boneAnatomy('neck')}
                        />

                        {/* ── 머리 ── */}
                        <group position={[0, p.neckHeight + 0.04, 0]}>
                          <group ref={setRef('head')} rotation={joints.head}>
                            <JointSphere id="head" position={[0, 0.04, 0]} radius={0.12} selected={isSel('head')} onClick={handleJointClick} hitboxMultiplier={hitboxScale} {...jointAnatomy('head')} />
                            <MannequinHead headScale={p.headScale} headAspect={p.headAspect} jawWidth={p.jawWidth} jawDrop={p.jawDrop} {...boneAnatomy('neck')} />
                          </group>
                        </group>
                      </group>
                    </group>

                    {/* ── 왼쪽 팔 체인 ── */}
                    <group position={[-p.shoulderWidth, 0.13, 0]}>
                      <JointGapRing position={[0, 0, 0]} radius={0.038} {...boneAnatomy('leftUpperArm')} />
                      <group ref={setRef('leftShoulder')} rotation={joints.leftShoulder}>
                        <JointSphere id="leftShoulder" position={[0, 0, 0]} radius={0.048} selected={isSel('leftShoulder')} onClick={handleJointClick} hitboxMultiplier={hitboxScale} {...jointAnatomy('leftShoulder')} />
                        {/* 상완 (테이퍼드 — 어깨 쪽 굵고 팔꿈치 쪽 좁음) */}
                        <TaperedLimb
                          position={[p.armDeltaX / 2, -0.17, 0]}
                          topR={p.upperArmRadius * 1.1} midR={p.upperArmRadius * 1.15} bottomR={p.upperArmRadius * 0.85}
                          height={0.28}
                          {...boneAnatomy('leftUpperArm')}
                        />
                        {/* 팔꿈치 갭 링 */}
                        <JointGapRing position={[p.armDeltaX, -0.32, 0]} radius={0.03} {...boneAnatomy('leftUpperArm')} />

                        {/* ── 왼쪽 팔꿈치 ── */}
                        <group position={[p.armDeltaX, -0.34, 0]}>
                          <group ref={setRef('leftElbow')} rotation={joints.leftElbow}>
                            <JointSphere id="leftElbow" position={[0, 0, 0]} radius={0.036} selected={isSel('leftElbow')} onClick={handleJointClick} hitboxMultiplier={hitboxScale} {...jointAnatomy('leftElbow')} />
                            {/* 전완 (테이퍼드) */}
                            <TaperedLimb
                              position={[0, -0.15, 0]}
                              topR={p.forearmRadius * 1.05} midR={p.forearmRadius * 1.1} bottomR={p.forearmRadius * 0.75}
                              height={0.25}
                              {...boneAnatomy('leftForearm')}
                            />
                            {/* 손목 갭 링 */}
                            <JointGapRing position={[0, -0.28, 0]} radius={0.022} {...boneAnatomy('leftForearm')} />

                            {/* ── 왼쪽 손목 ── */}
                            <group position={[0, -0.30, 0]}>
                              <group ref={setRef('leftWrist')} rotation={joints.leftWrist}>
                                <JointSphere id="leftWrist" position={[0, 0, 0]} radius={0.028} selected={isSel('leftWrist')} onClick={handleJointClick} hitboxMultiplier={hitboxScale} {...jointAnatomy('leftWrist')} />
                                <MannequinHand handScale={p.handScale} {...boneAnatomy('leftForearm')} />
                              </group>
                            </group>
                          </group>
                        </group>
                      </group>
                    </group>

                    {/* ── 오른쪽 팔 체인 ── */}
                    <group position={[p.shoulderWidth, 0.13, 0]}>
                      <JointGapRing position={[0, 0, 0]} radius={0.038} {...boneAnatomy('rightUpperArm')} />
                      <group ref={setRef('rightShoulder')} rotation={joints.rightShoulder}>
                        <JointSphere id="rightShoulder" position={[0, 0, 0]} radius={0.048} selected={isSel('rightShoulder')} onClick={handleJointClick} hitboxMultiplier={hitboxScale} {...jointAnatomy('rightShoulder')} />
                        <TaperedLimb
                          position={[-p.armDeltaX / 2, -0.17, 0]}
                          topR={p.upperArmRadius * 1.1} midR={p.upperArmRadius * 1.15} bottomR={p.upperArmRadius * 0.85}
                          height={0.28}
                          {...boneAnatomy('rightUpperArm')}
                        />
                        <JointGapRing position={[-p.armDeltaX, -0.32, 0]} radius={0.03} {...boneAnatomy('rightUpperArm')} />

                        <group position={[-p.armDeltaX, -0.34, 0]}>
                          <group ref={setRef('rightElbow')} rotation={joints.rightElbow}>
                            <JointSphere id="rightElbow" position={[0, 0, 0]} radius={0.036} selected={isSel('rightElbow')} onClick={handleJointClick} hitboxMultiplier={hitboxScale} {...jointAnatomy('rightElbow')} />
                            <TaperedLimb
                              position={[0, -0.15, 0]}
                              topR={p.forearmRadius * 1.05} midR={p.forearmRadius * 1.1} bottomR={p.forearmRadius * 0.75}
                              height={0.25}
                              {...boneAnatomy('rightForearm')}
                            />
                            <JointGapRing position={[0, -0.28, 0]} radius={0.022} {...boneAnatomy('rightForearm')} />

                            <group position={[0, -0.30, 0]}>
                              <group ref={setRef('rightWrist')} rotation={joints.rightWrist}>
                                <JointSphere id="rightWrist" position={[0, 0, 0]} radius={0.028} selected={isSel('rightWrist')} onClick={handleJointClick} hitboxMultiplier={hitboxScale} {...jointAnatomy('rightWrist')} />
                                <MannequinHand handScale={p.handScale} {...boneAnatomy('rightForearm')} />
                              </group>
                            </group>
                          </group>
                        </group>
                      </group>
                    </group>
                  </group>
                </group>
              </group>
            </group>

            {/* ── 왼쪽 다리 체인 ── */}
            <group position={[-p.hipSpread, -0.05, 0]}>
              <JointGapRing position={[0, 0, 0]} radius={0.042} {...boneAnatomy('leftThigh')} />
              <group ref={setRef('leftHip')} rotation={joints.leftHip}>
                <JointSphere id="leftHip" position={[0, 0, 0]} radius={0.052} selected={isSel('leftHip')} onClick={handleJointClick} hitboxMultiplier={hitboxScale} {...jointAnatomy('leftHip')} />
                {/* 허벅지 (위 굵고 아래 좁은 테이퍼드) */}
                <TaperedLimb
                  position={[0, -0.21, 0]}
                  topR={p.thighRadius * 1.1} midR={p.thighRadius * 1.15} bottomR={p.thighRadius * 0.75}
                  height={0.36}
                  {...boneAnatomy('leftThigh')}
                />
                {/* 무릎 갭 링 */}
                <JointGapRing position={[0, -0.40, 0]} radius={0.035} {...boneAnatomy('leftThigh')} />

                {/* ── 왼쪽 무릎 ── */}
                <group position={[0, -0.42, 0]}>
                  <group ref={setRef('leftKnee')} rotation={joints.leftKnee}>
                    <JointSphere id="leftKnee" position={[0, 0, 0]} radius={0.042} selected={isSel('leftKnee')} onClick={handleJointClick} hitboxMultiplier={hitboxScale} {...jointAnatomy('leftKnee')} />
                    {/* 종아리 (위 굵고 발목 쪽 좁음) */}
                    <TaperedLimb
                      position={[0, -0.19, 0]}
                      topR={p.calfRadius * 1.05} midR={p.calfRadius * 1.15} bottomR={p.calfRadius * 0.6}
                      height={0.34}
                      {...boneAnatomy('leftCalf')}
                    />
                    {/* 발목 갭 링 */}
                    <JointGapRing position={[0, -0.37, 0]} radius={0.025} {...boneAnatomy('leftCalf')} />

                    {/* ── 왼쪽 발목 ── */}
                    <group position={[0, -0.39, 0]}>
                      <group ref={setRef('leftAnkle')} rotation={joints.leftAnkle}>
                        <JointSphere id="leftAnkle" position={[0, 0, 0]} radius={0.03} selected={isSel('leftAnkle')} onClick={handleJointClick} hitboxMultiplier={hitboxScale} {...jointAnatomy('leftAnkle')} />
                        <MannequinFoot footScale={p.footScale} {...boneAnatomy('leftFoot')} />
                      </group>
                    </group>
                  </group>
                </group>
              </group>
            </group>

            {/* ── 오른쪽 다리 체인 ── */}
            <group position={[p.hipSpread, -0.05, 0]}>
              <JointGapRing position={[0, 0, 0]} radius={0.042} {...boneAnatomy('rightThigh')} />
              <group ref={setRef('rightHip')} rotation={joints.rightHip}>
                <JointSphere id="rightHip" position={[0, 0, 0]} radius={0.052} selected={isSel('rightHip')} onClick={handleJointClick} hitboxMultiplier={hitboxScale} {...jointAnatomy('rightHip')} />
                <TaperedLimb
                  position={[0, -0.21, 0]}
                  topR={p.thighRadius * 1.1} midR={p.thighRadius * 1.15} bottomR={p.thighRadius * 0.75}
                  height={0.36}
                  {...boneAnatomy('rightThigh')}
                />
                <JointGapRing position={[0, -0.40, 0]} radius={0.035} {...boneAnatomy('rightThigh')} />

                <group position={[0, -0.42, 0]}>
                  <group ref={setRef('rightKnee')} rotation={joints.rightKnee}>
                    <JointSphere id="rightKnee" position={[0, 0, 0]} radius={0.042} selected={isSel('rightKnee')} onClick={handleJointClick} hitboxMultiplier={hitboxScale} {...jointAnatomy('rightKnee')} />
                    <TaperedLimb
                      position={[0, -0.19, 0]}
                      topR={p.calfRadius * 1.05} midR={p.calfRadius * 1.15} bottomR={p.calfRadius * 0.6}
                      height={0.34}
                      {...boneAnatomy('rightCalf')}
                    />
                    <JointGapRing position={[0, -0.37, 0]} radius={0.025} {...boneAnatomy('rightCalf')} />

                    <group position={[0, -0.39, 0]}>
                      <group ref={setRef('rightAnkle')} rotation={joints.rightAnkle}>
                        <JointSphere id="rightAnkle" position={[0, 0, 0]} radius={0.03} selected={isSel('rightAnkle')} onClick={handleJointClick} hitboxMultiplier={hitboxScale} {...jointAnatomy('rightAnkle')} />
                        <MannequinFoot footScale={p.footScale} {...boneAnatomy('rightFoot')} />
                      </group>
                    </group>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* ========== 3축 회전 기즈모 ========== */}
      {gizmoTarget && (
        <TransformControls
          ref={transformRef}
          object={gizmoTarget}
          mode="rotate"
          space="local"
          size={0.5}
        />
      )}
    </group>
  );
}
