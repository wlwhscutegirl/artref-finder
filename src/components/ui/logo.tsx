'use client';

/**
 * ArtRef 로고 컴포넌트
 * 'a'를 돋보기 형태로 표현 — 레퍼런스 검색 서비스의 정체성
 * 원형 렌즈 안에 'a' + 대각선 손잡이 → "rtRef" 텍스트
 */

interface LogoProps {
  /** 로고 높이 (px). 너비는 자동 비율 */
  size?: number;
  /** 텍스트 포함 여부 (아이콘만 쓸 때 false) */
  showText?: boolean;
  /** 커스텀 클래스 */
  className?: string;
}

/** 돋보기 'a' 아이콘만 (파비콘, 작은 공간용) */
export function LogoIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ArtRef 로고"
    >
      {/* 돋보기 렌즈 */}
      <circle cx="17" cy="16" r="11" stroke="#ea580c" strokeWidth="3.2" fill="none" />
      {/* 렌즈 안의 'a' */}
      <text
        x="17"
        y="21"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="700"
        fontSize="14"
        fill="#ea580c"
      >
        a
      </text>
      {/* 돋보기 손잡이 */}
      <line x1="25" y1="24" x2="34" y2="35" stroke="#ea580c" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

/** 전체 로고 (아이콘 + "rtRef" 텍스트) */
export function Logo({ size = 32, showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <LogoIcon size={size} />
      {showText && (
        <span
          className="font-bold text-gray-900 tracking-tight"
          style={{ fontSize: size * 0.65 }}
        >
          rtRef
        </span>
      )}
    </div>
  );
}

export default Logo;
