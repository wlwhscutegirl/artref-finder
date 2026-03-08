'use client';

// ============================================
// 모드 전환 탭 (Phase 7)
// 마네킹 모드 ↔ 드로잉 모드 전환
// ============================================

import Link from 'next/link';

interface ModeTabsProps {
  /** 현재 활성 모드 */
  activeMode: 'mannequin' | 'sketch';
}

/** 모드별 SVG 아이콘 */
function MannequinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3" />
      <path d="M12 8v4" />
      <path d="M8 12l4 4 4-4" />
      <path d="M10 20l2-4 2 4" />
    </svg>
  );
}
function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

/** 모드 정의 */
const MODES = [
  { id: 'mannequin' as const, label: '마네킹', href: '/mannequin', Icon: MannequinIcon },
  { id: 'sketch' as const, label: '드로잉', href: '/sketch', Icon: PencilIcon },
];

export function ModeTabs({ activeMode }: ModeTabsProps) {
  return (
    <div className="flex items-center bg-neutral-800/50 rounded-lg p-0.5">
      {MODES.map((mode) => (
        <Link
          key={mode.id}
          href={mode.href}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeMode === mode.id
              ? 'bg-orange-600 text-white'
              : 'text-neutral-400 hover:text-neutral-300'
          }`}
        >
          <mode.Icon className="w-4 h-4" />
          {mode.label}
        </Link>
      ))}
    </div>
  );
}
