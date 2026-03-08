'use client';

import { useRef, useState, useEffect, Suspense, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Mannequin } from './mannequin-model';
import { MultiLightController } from './multi-light-controller';
import { HdriSelector } from './hdri-selector';
import { FpsMonitor } from './fps-monitor';
import { usePoseStore, JOINT_LABELS } from '@/stores/pose-store';
import { useLightStore, colorTempToHex } from '@/stores/light-store';
import { usePerfStore } from '@/stores/perf-store';
import { CAMERA_PRESETS } from '@/lib/pose-presets';
import type { LightDirection } from '@/types';
import type { LightSource } from '@/stores/light-store';

/** drei Environment에서 지원하는 프리셋 타입 */
type DreiPreset = 'studio' | 'forest' | 'apartment' | 'sunset' | 'night' | 'city' | 'dawn' | 'lobby' | 'park' | 'warehouse';

/** HDRI 프리셋 ID → drei Environment preset 매핑 */
const HDRI_PRESET_MAP: Record<string, DreiPreset> = {
  studio: 'studio',
  outdoor: 'forest',
  indoor: 'apartment',
  'golden-hour': 'sunset',
  'blue-hour': 'night',
};

interface MannequinViewerProps {
  /** 광원 변경 콜백 (레거시 호환, light-store 병행) */
  onLightChange?: (light: LightDirection) => void;
  /** 좌우반전 상태 */
  isFlipped?: boolean;
  /** 체형 타입 (남성/여성/중립) */
  bodyType?: 'male' | 'female' | null;
  /** 카메라 위치 (외부 프리셋에서 제어) */
  cameraPosition?: [number, number, number];
  /** 카메라 타겟 (외부 프리셋에서 제어) */
  cameraTarget?: [number, number, number];
  /** 자유 카메라 회전 시 가장 가까운 앵글 태그 콜백 (P1-2) */
  onCameraAngleDetected?: (tags: string[]) => void;
  className?: string;
}

/**
 * 카메라 위치를 부드럽게 이동 + 자유 회전 시 가장 가까운 앵글 자동 감지
 */
function CameraController({
  position,
  target,
  onAngleDetected,
}: {
  position?: [number, number, number];
  target?: [number, number, number];
  onAngleDetected?: (tags: string[]) => void;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const isDragging = usePoseStore((s) => s.isDragging);
  const lastDetectedRef = useRef<string>('');

  // 카메라 프리셋 이동 애니메이션
  useEffect(() => {
    if (!position) return;
    const startPos = camera.position.clone();
    const endPos = new THREE.Vector3(...position);
    let t = 0;

    const animate = () => {
      t += 0.08;
      if (t >= 1) {
        camera.position.copy(endPos);
        if (controlsRef.current && target) {
          controlsRef.current.target.set(...target);
          controlsRef.current.update();
        }
        return;
      }
      camera.position.lerpVectors(startPos, endPos, t);
      if (controlsRef.current && target) {
        controlsRef.current.update();
      }
      requestAnimationFrame(animate);
    };
    animate();
  }, [position, target, camera]);

  // 자유 카메라 회전 시 가장 가까운 프리셋 앵글 자동 감지 (P1-2)
  useFrame(() => {
    if (!onAngleDetected || !controlsRef.current) return;

    const camPos = camera.position;
    let closestId = '';
    let minDist = Infinity;

    // 각 카메라 프리셋과의 거리 계산
    for (const preset of CAMERA_PRESETS) {
      const presetPos = new THREE.Vector3(...preset.position);
      // 방향 벡터만 비교 (거리 무시, 각도만 판별)
      const camDir = camPos.clone().normalize();
      const presetDir = presetPos.clone().normalize();
      const dist = camDir.distanceTo(presetDir);
      if (dist < minDist) {
        minDist = dist;
        closestId = preset.id;
      }
    }

    // 이전 감지와 다를 때만 콜백 호출 (불필요한 리렌더 방지)
    if (closestId !== lastDetectedRef.current) {
      lastDetectedRef.current = closestId;
      const preset = CAMERA_PRESETS.find((p) => p.id === closestId);
      if (preset) {
        onAngleDetected(preset.tags);
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!isDragging}
      minDistance={1.5}
      maxDistance={6}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI / 2 + 0.3}
      target={target ? new THREE.Vector3(...target) : new THREE.Vector3(0, 1, 0)}
    />
  );
}

export function MannequinViewer({
  onLightChange,
  isFlipped = false,
  bodyType = null,
  cameraPosition,
  cameraTarget,
  onCameraAngleDetected,
  className = '',
}: MannequinViewerProps) {
  // 멀티 라이트 스토어 연동
  const lights = useLightStore((s) => s.lights);
  const hdri = useLightStore((s) => s.hdri);
  const addLight = useLightStore((s) => s.addLight);
  const removeLight = useLightStore((s) => s.removeLight);
  const updateLight = useLightStore((s) => s.updateLight);
  const toggleLight = useLightStore((s) => s.toggleLight);
  const hdriPresetChange = useLightStore((s) => s.setHdriPreset);
  const updateHdri = useLightStore((s) => s.updateHdri);
  const toggleHdri = useLightStore((s) => s.toggleHdri);
  const getKeyLightDirection = useLightStore((s) => s.getKeyLightDirection);

  const selectedJoint = usePoseStore((s) => s.selectedJoint);

  // === 성능 스토어 연동 ===
  const perfShadows = usePerfStore((s) => s.shadows);
  const perfHdri = usePerfStore((s) => s.hdri);
  const perfDpr = usePerfStore((s) => s.dpr);
  const perfShadowMapSize = usePerfStore((s) => s.shadowMapSize);
  const perfIsMobile = usePerfStore((s) => s.isMobile);
  const perfIsTablet = usePerfStore((s) => s.isTablet);

  // FPS 표시용 (선택적)
  const [currentFps, setCurrentFps] = useState(0);

  // 키라이트 변경 시 레거시 콜백 호출
  useEffect(() => {
    const keyDir = getKeyLightDirection();
    onLightChange?.(keyDir);
  }, [lights, onLightChange, getKeyLightDirection]);

  // 모바일/태블릿이면 히트박스 3.5배, 데스크탑 2.5배 (터치 UX 개선)
  const hitboxScale = (perfIsMobile || perfIsTablet) ? 3.5 : 2.5;

  return (
    <div className={`relative rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 ${className}`}>
      <div className="aspect-[4/5] w-full">
        <Canvas
          camera={{ position: cameraPosition || [0, 1.5, 3], fov: 50 }}
          shadows={perfShadows}
          dpr={perfDpr}
          /* always: 초기 렌더링 보장 (demand 모드에서 첫 프레임 누락 방지) */
          frameloop="always"
          style={{ touchAction: 'none' }}
        >
          <Suspense fallback={null}>
            {/* FPS 모니터 (자동 다운그레이드 + 외부 표시) */}
            <FpsMonitor onFpsUpdate={setCurrentFps} />

            {/* 멀티 라이트 렌더링 */}
            <ambientLight intensity={0.15} />
            {lights.filter((l) => l.enabled).map((light) => (
              <directionalLight
                key={light.id}
                position={[
                  Math.cos((light.azimuth * Math.PI) / 180) * 3,
                  Math.sin((light.elevation * Math.PI) / 180) * 3 + 2,
                  Math.sin((light.azimuth * Math.PI) / 180) * 3,
                ]}
                intensity={light.intensity}
                color={colorTempToHex(light.colorTemp)}
                castShadow={perfShadows && light.role === 'key'}
                shadow-mapSize={[perfShadowMapSize, perfShadowMapSize]}
              />
            ))}

            {/* 마네킹 (좌우반전 + 체형 + 히트박스 스케일 포함) */}
            <group scale={[isFlipped ? -1 : 1, 1, 1]}>
              <Mannequin bodyType={bodyType} hitboxScale={hitboxScale} />
            </group>

            {/* 바닥 그리드 */}
            <Grid
              args={[10, 10]}
              cellSize={0.5}
              cellThickness={0.5}
              cellColor="#333"
              sectionSize={2}
              sectionThickness={1}
              sectionColor="#555"
              fadeDistance={8}
              position={[0, 0, 0]}
            />

            {/* 카메라 컨트롤 (기즈모 드래그 중 비활성) */}
            <CameraController
              position={cameraPosition}
              target={cameraTarget}
              onAngleDetected={onCameraAngleDetected}
            />

            {/* Phase 5: HDRI 환경맵 조건부 렌더링 — 성능 설정에 따라 비활성 가능 */}
            {perfHdri && hdri.enabled ? (
              <Environment
                preset={HDRI_PRESET_MAP[hdri.preset] || 'studio'}
                environmentRotation={[0, (hdri.rotation * Math.PI) / 180, 0]}
                environmentIntensity={hdri.exposure}
              />
            ) : perfHdri ? (
              <Environment preset="studio" />
            ) : null}
          </Suspense>
        </Canvas>
      </div>

      {/* 멀티 라이트 컨트롤 오버레이 */}
      <div className="absolute top-12 right-2 w-56 max-h-[60%] overflow-y-auto bg-neutral-950/90 backdrop-blur-sm rounded-lg p-2 space-y-2 border border-neutral-800">
        <MultiLightController
          lights={lights}
          onAddLight={addLight}
          onRemoveLight={removeLight}
          onUpdateLight={updateLight}
          onToggleLight={toggleLight}
        />
        <HdriSelector
          hdri={hdri}
          onPresetChange={hdriPresetChange}
          onUpdate={updateHdri}
          onToggle={toggleHdri}
        />
      </div>

      {/* 좌우반전 표시 */}
      {isFlipped && (
        <div className="absolute top-3 left-3 px-2 py-1 bg-violet-600/80 backdrop-blur-sm rounded text-[10px] font-medium text-white">
          반전됨
        </div>
      )}

      {/* 선택된 관절 표시 */}
      {selectedJoint && (
        <div className="absolute top-3 right-3 px-2 py-1 bg-fuchsia-600/80 backdrop-blur-sm rounded text-[10px] font-medium text-white">
          {JOINT_LABELS[selectedJoint]}
        </div>
      )}

      {/* 안내 힌트 (터치 기기와 데스크탑 분기) */}
      <div className="absolute bottom-3 left-3 text-[10px] text-neutral-500">
        {(perfIsMobile || perfIsTablet)
          ? '터치: 회전 | 핀치: 줌 | 관절 탭: 선택'
          : '드래그: 회전 | 관절 클릭: 선택 | ESC: 해제'}
      </div>
    </div>
  );
}
