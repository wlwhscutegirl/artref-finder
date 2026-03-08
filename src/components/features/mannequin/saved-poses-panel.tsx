'use client';

// ============================================
// 포즈 저장/불러오기 패널
// 인증 시 클라우드(bkend.ai), 비인증 시 localStorage
// ============================================

import { useState, useEffect, useCallback } from 'react';
import {
  loadSavedPoses,
  savePose,
  deleteSavedPose,
  type SavedPose,
} from '@/lib/pose-storage';
import {
  loadCloudPoses,
  saveCloudPose,
  deleteCloudPose,
} from '@/lib/cloud-pose-storage';
import { useAuthStore } from '@/stores/auth-store';

interface SavedPosesPanelProps {
  /** 현재 포즈 상태 — 저장용 (관절 회전값 포함) */
  currentPose: {
    posePresetId: string | null;
    handPresetId: string | null;
    cameraPresetId: string | null;
    bodyType: 'male' | 'female' | null;
    isFlipped: boolean;
    tags: string[];
    jointRotations?: Record<string, [number, number, number]>;
  };
  /** 저장된 포즈 불러오기 콜백 */
  onLoad: (pose: SavedPose) => void;
}

/**
 * 포즈 저장/불러오기 패널
 * 인증 시 클라우드 저장, 비인증 시 localStorage
 * 최대 20개 저장, 설계서 §8 구현
 */
export function SavedPosesPanel({ currentPose, onLoad }: SavedPosesPanelProps) {
  const [poses, setPoses] = useState<SavedPose[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [poseName, setPoseName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // 컴포넌트 마운트 시 저장된 포즈 로드 (인증 상태에 따라 분기)
  useEffect(() => {
    const loadPoses = async () => {
      if (isAuthenticated) {
        // 인증 시 클라우드에서 로드
        const cloudPoses = await loadCloudPoses();
        setPoses(cloudPoses);
      } else {
        // 비인증 시 localStorage에서 로드
        setPoses(loadSavedPoses());
      }
    };
    loadPoses();
  }, [isAuthenticated]);

  // 포즈 저장 핸들러 (인증 상태에 따라 분기)
  const handleSave = useCallback(async () => {
    if (!poseName.trim()) return;
    setIsSaving(true);

    try {
      const poseData = {
        name: poseName.trim(),
        ...currentPose,
      };

      let saved: SavedPose;
      if (isAuthenticated) {
        // 클라우드 저장
        saved = await saveCloudPose(poseData);
      } else {
        // localStorage 저장
        saved = savePose(poseData);
      }

      setPoses((prev) => [saved, ...prev].slice(0, 20));
      setPoseName('');
      setShowSaveInput(false);
    } finally {
      setIsSaving(false);
    }
  }, [poseName, currentPose, isAuthenticated]);

  // 포즈 삭제 핸들러 (인증 상태에 따라 분기)
  const handleDelete = useCallback(async (id: string) => {
    if (isAuthenticated) {
      await deleteCloudPose(id);
    } else {
      deleteSavedPose(id);
    }
    setPoses((prev) => prev.filter((p) => p.id !== id));
  }, [isAuthenticated]);

  // 날짜 포맷 (MM/DD HH:mm)
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div>
      {/* 헤더: 접기/펼치기 + 저장 버튼 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-[11px] font-medium text-gray-500 uppercase tracking-wider hover:text-gray-600 cursor-pointer transition-colors"
        >
          <span className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}>
            ▸
          </span>
          저장된 포즈 {poses.length > 0 && `(${poses.length}/20)`}
          {/* 클라우드 저장 표시 */}
          {isAuthenticated && (
            <span className="text-[10px] text-cyan-400 ml-1">cloud</span>
          )}
        </button>

        {/* 현재 포즈 저장 버튼 */}
        <button
          onClick={() => setShowSaveInput(!showSaveInput)}
          className="text-[10px] px-2 py-0.5 bg-orange-600 rounded text-white hover:bg-orange-500 cursor-pointer"
        >
          + 저장
        </button>
      </div>

      {/* 이름 입력 + 저장 확인 */}
      {showSaveInput && (
        <div className="flex gap-1.5 mt-2">
          <input
            type="text"
            value={poseName}
            onChange={(e) => setPoseName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="포즈 이름 입력"
            maxLength={20}
            autoFocus
            className="flex-1 px-2 py-1 bg-orange-50 border border-gray-300 rounded text-[11px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={handleSave}
            disabled={!poseName.trim() || isSaving}
            className="px-2 py-1 bg-orange-600 rounded text-[10px] text-white hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? '...' : '확인'}
          </button>
          <button
            onClick={() => { setShowSaveInput(false); setPoseName(''); }}
            className="px-2 py-1 bg-neutral-700 rounded text-[10px] text-gray-600 hover:bg-orange-200 cursor-pointer"
          >
            취소
          </button>
        </div>
      )}

      {/* 저장된 포즈 목록 */}
      {isOpen && (
        <div className="mt-2 space-y-1 max-h-[30vh] overflow-y-auto">
          {poses.length === 0 ? (
            <p className="text-[10px] text-gray-400 py-2 text-center">
              저장된 포즈가 없습니다
            </p>
          ) : (
            poses.map((pose) => (
              <div
                key={pose.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-orange-50/50 border border-gray-300 hover:border-gray-400 group"
              >
                {/* 불러오기 클릭 영역 */}
                <button
                  onClick={() => onLoad(pose)}
                  className="flex-1 text-left cursor-pointer"
                >
                  <p className="text-[11px] font-medium text-gray-700">
                    {pose.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] text-gray-400">
                      {formatDate(pose.savedAt)}
                    </span>
                    {/* 기즈모 조작 포즈 표시 */}
                    {pose.jointRotations && (
                      <span className="text-[10px] px-1 py-0.5 bg-amber-500/15 rounded text-amber-400">
                        기즈모
                      </span>
                    )}
                    {/* 태그 미리보기 (최대 3개) */}
                    {pose.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1 py-0.5 bg-orange-500/10 rounded text-orange-400"
                      >
                        #{tag}
                      </span>
                    ))}
                    {pose.tags.length > 3 && (
                      <span className="text-[10px] text-gray-400">
                        +{pose.tags.length - 3}
                      </span>
                    )}
                  </div>
                </button>

                {/* 삭제 버튼 */}
                <button
                  onClick={() => handleDelete(pose.id)}
                  className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-400 hover:text-red-400 cursor-pointer transition-opacity px-1"
                  title="삭제"
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
