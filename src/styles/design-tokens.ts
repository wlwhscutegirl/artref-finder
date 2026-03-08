/**
 * ArtRef Finder 디자인 토큰
 *
 * 목적: 앱 전반에서 사용되는 색상, 타이포, 간격, 반경, 그림자를
 *       단일 출처(Single Source of Truth)로 관리한다.
 *
 * 사용법:
 *   import { tokens } from '@/styles/design-tokens';
 *   // Tailwind 클래스 문자열로 참조
 *   <div className={tokens.color.surface.panel}>...</div>
 *
 * 주의:
 *   - 현재 다크 테마 전용 (라이트 모드는 Phase 후속 작업)
 *   - 기존 컴포넌트 코드를 직접 수정하지 않는다.
 *     새 컴포넌트 작성 시 이 토큰을 참조하도록 한다.
 *   - Tailwind CSS 4 기준으로 클래스명을 정의한다.
 */

// ============================================================
// 1. 색상 팔레트 (Color Palette)
// ============================================================

/**
 * 브랜드 컬러 (Primary — orange)
 * button.tsx: bg-orange-600, hover:bg-orange-500
 * mode-tabs.tsx: bg-orange-600 (active)
 * tag.tsx: bg-orange-600 (selected)
 * search-filters.tsx: bg-orange-600 (selected category/tag)
 * input.tsx: focus:border-orange-500, focus:ring-orange-500
 */
export const colorPrimary = {
  /** 포인트: 주요 버튼, 활성 탭, 선택된 태그 */
  default: 'bg-orange-600',
  hover: 'hover:bg-orange-500',
  /** 텍스트 강조: 링크, 선택된 항목 레이블 */
  text: 'text-orange-400',
  textHover: 'hover:text-orange-300',
  /** 연한 배경: 뱃지, 칩, 배경 강조 */
  subtle: 'bg-orange-500/10',
  /** 테두리 */
  border: 'border-orange-500',
  borderSubtle: 'border-orange-500/20',
  /** 포커스 링 */
  ring: 'focus:ring-orange-500',
  ringSubtle: 'focus:ring-orange-500/50',
} as const;

/**
 * 보조 브랜드 컬러 (Secondary — amber)
 * page.tsx: 드로잉 모드 카드 hover:border-amber-500/50
 * joint-slider-panel.tsx: bg-amber-500 (관절 선택 표시 점)
 * pricing/page.tsx: Pro 플랜 그라디언트 to-amber-600
 */
export const colorSecondary = {
  default: 'bg-amber-500',
  hover: 'hover:bg-amber-400',
  text: 'text-amber-400',
  textHover: 'hover:text-amber-600',
  subtle: 'bg-amber-500/10',
  border: 'border-amber-500',
  borderSubtle: 'border-amber-500/50',
} as const;

/**
 * 그라디언트 (Gradient)
 * 브랜드 로고, CTA 버튼, Pro 플랜 배지 등 핵심 강조 요소에 사용
 */
export const colorGradient = {
  /** 브랜드 시그니처 그라디언트 (orange → amber) */
  brand: 'bg-gradient-to-r from-orange-600 to-amber-600',
  brandHover: 'hover:from-orange-500 hover:to-amber-500',
  /** 히어로 텍스트용 그라디언트 (orange → amber → pink) */
  heroText: 'bg-gradient-to-r from-orange-400 via-amber-400 to-pink-400',
  /** 로고 아이콘 그라디언트 */
  logo: 'bg-gradient-to-br from-orange-500 to-amber-500',
} as const;

/**
 * 배경 색상 (Surface)
 * globals.css: --background: #0a0a0a (neutral-950 계열)
 * pricing/page.tsx: bg-white
 * 컴포넌트들: bg-gray-50, bg-orange-50, bg-orange-50/50
 */
export const colorSurface = {
  /** 최하위 앱 배경 (body) */
  base: 'bg-white',
  /** 페이지 레이아웃 배경 */
  page: 'bg-gray-50',
  /** 카드, 패널 배경 */
  panel: 'bg-gray-50',
  /** 약간 밝은 패널 (모달, 팝오버 등) */
  elevated: 'bg-orange-50',
  /** 반투명 오버레이 배경 (Nav, 슬라이더 패널 등) */
  overlay: 'bg-white/90',
  /** 미묘한 섹션 구분 */
  subtle: 'bg-orange-50/50',
} as const;

/**
 * 텍스트 색상 (Text)
 * globals.css: --foreground: #ededed
 * 기존 컴포넌트: text-gray-900, text-gray-700~600 계열
 */
export const colorText = {
  /** 최우선 텍스트 (제목, 중요 내용) */
  primary: 'text-gray-900',
  /** 일반 본문 텍스트 */
  default: 'text-gray-700',
  /** 보조 텍스트 (설명, 레이블) */
  secondary: 'text-gray-600',
  /** 약한 텍스트 (힌트, placeholder) */
  muted: 'text-gray-500',
  /** 비활성, 비중요 정보 */
  disabled: 'text-gray-400',
  /** 거의 보이지 않는 텍스트 (가이드, 경고 없는 안내) */
  faint: 'text-gray-300',
  /** 입력 placeholder */
  placeholder: 'placeholder-gray-400',
} as const;

/**
 * 테두리 색상 (Border)
 * 기존 컴포넌트: border-gray-300, border-gray-200
 */
export const colorBorder = {
  /** 기본 테두리 */
  default: 'border-gray-300',
  /** 약한 테두리 (섹션 구분선 등) */
  subtle: 'border-gray-200',
  /** 강조 테두리 (hover 상태) */
  emphasis: 'border-gray-400',
} as const;

/**
 * 상태 색상 (Status)
 * button.tsx: danger = bg-red-600
 * input.tsx: error = border-red-500, text-red-400
 * upgrade-banner.tsx: warning = amber-500, error = red-500
 * search-filters.tsx: success = emerald-600 (교육 모드)
 * pricing/page.tsx: success check = text-green-400
 */
export const colorStatus = {
  /** 에러 / 위험 */
  error: {
    bg: 'bg-red-600',
    bgSubtle: 'bg-red-500/10',
    text: 'text-red-400',
    textStrong: 'text-red-300',
    border: 'border-red-500',
    borderSubtle: 'border-red-500/30',
    hover: 'hover:bg-red-500',
  },
  /** 경고 */
  warning: {
    bg: 'bg-amber-600',
    bgSubtle: 'bg-amber-500/10',
    text: 'text-amber-400',
    textStrong: 'text-amber-600',
    border: 'border-amber-500',
    borderSubtle: 'border-amber-500/20',
    hover: 'hover:bg-amber-500',
  },
  /** 성공 / 완료 */
  success: {
    bg: 'bg-emerald-600',
    bgSubtle: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    textStrong: 'text-emerald-300',
    border: 'border-emerald-500',
  },
  /** 정보 */
  info: {
    bg: 'bg-blue-600',
    bgSubtle: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500',
  },
} as const;

/**
 * 3D 축 색상 (Axis Colors)
 * joint-slider-panel.tsx: X=red, Y=green, Z=blue
 * 3D 뷰어 관련 컴포넌트 전용
 */
export const colorAxis = {
  x: { text: 'text-red-400', bg: 'bg-red-500' },
  y: { text: 'text-green-400', bg: 'bg-green-500' },
  z: { text: 'text-blue-400', bg: 'bg-blue-500' },
} as const;

// ============================================================
// 2. 타이포그래피 스케일 (Typography Scale)
// ============================================================

/**
 * 헤딩 (Heading)
 * page.tsx: text-4xl sm:text-6xl font-bold (h1)
 * pricing/page.tsx: text-3xl font-bold (h1), text-lg font-bold (h2 카드)
 * 기타: text-xl font-semibold/bold, text-2xl font-bold
 */
export const typographyHeading = {
  /** 랜딩 히어로 제목 */
  hero: 'text-4xl sm:text-6xl font-bold leading-tight',
  /** 페이지 제목 */
  h1: 'text-3xl font-bold',
  /** 섹션 제목 */
  h2: 'text-2xl font-bold',
  /** 카드/패널 제목 */
  h3: 'text-xl font-semibold',
  /** 서브섹션 제목 */
  h4: 'text-lg font-semibold',
} as const;

/**
 * 본문 (Body)
 * 기존 컴포넌트: text-sm (기본), text-base (버튼 lg)
 */
export const typographyBody = {
  /** 큰 본문 (히어로 설명) */
  lg: 'text-lg leading-relaxed',
  /** 기본 본문 */
  default: 'text-sm leading-relaxed',
  /** 작은 본문 */
  sm: 'text-xs leading-relaxed',
} as const;

/**
 * 캡션 / 보조 텍스트 (Caption)
 * 기존 컴포넌트: text-[10px], text-[11px], text-xs
 */
export const typographyCaption = {
  /** 일반 캡션 */
  default: 'text-xs',
  /** 작은 캡션 (안내문구, 취소선 가격) */
  sm: 'text-[11px]',
  /** 매우 작은 캡션 (뱃지 내부, 힌트) */
  xs: 'text-[10px]',
} as const;

/**
 * 레이블 (Label)
 * input.tsx: text-sm font-medium
 * search-filters.tsx: text-xs font-medium uppercase tracking-wider (섹션 레이블)
 */
export const typographyLabel = {
  /** 입력 필드 레이블 */
  input: 'text-sm font-medium',
  /** 섹션 필터 레이블 */
  section: 'text-xs font-medium uppercase tracking-wider',
  /** 버튼/탭 레이블 */
  button: 'text-sm font-medium',
  /** 태그/뱃지 레이블 */
  badge: 'text-xs font-medium',
} as const;

// ============================================================
// 3. 간격 스케일 (Spacing Scale)
// ============================================================

/**
 * 컴포넌트 내부 패딩 (Component Padding)
 * button.tsx: px-3 py-1.5 (sm), px-4 py-2 (md), px-6 py-3 (lg)
 * input.tsx: px-3 py-2
 * tag.tsx: px-2.5 py-1
 */
export const spacingPadding = {
  /** 버튼/뱃지 소형 */
  btnSm: 'px-3 py-1.5',
  /** 버튼 중형 (기본) */
  btnMd: 'px-4 py-2',
  /** 버튼 대형 */
  btnLg: 'px-6 py-3',
  /** 태그/칩 */
  tag: 'px-2.5 py-1',
  /** 소형 태그 */
  tagSm: 'px-2 py-0.5',
  /** 입력 필드 */
  input: 'px-3 py-2',
  /** 카드 패딩 */
  card: 'p-8',
  /** 카드 패딩 (소형) */
  cardSm: 'p-5',
  /** 패널 패딩 */
  panel: 'p-3',
  /** 팝오버/툴팁 */
  tooltip: 'px-2.5 py-1.5',
} as const;

/**
 * 레이아웃 간격 (Layout Spacing)
 * 컴포넌트 사이 gap, margin 등
 */
export const spacingLayout = {
  /** 인라인 요소 간 좁은 간격 (아이콘-텍스트) */
  xs: 'gap-1',
  /** 태그, 뱃지 사이 간격 */
  sm: 'gap-1.5',
  /** 일반 요소 간 간격 */
  md: 'gap-2',
  /** 컴포넌트 간 간격 */
  lg: 'gap-3',
  /** 섹션 간 간격 */
  xl: 'gap-4',
  /** 카드 그리드 간격 */
  '2xl': 'gap-6',
} as const;

// ============================================================
// 4. 반경 스케일 (Border Radius Scale)
// ============================================================

/**
 * border-radius 스케일
 * button.tsx: rounded-lg
 * tag.tsx, badge: rounded-full
 * card (page.tsx): rounded-2xl
 * logo icon: rounded-xl
 * input.tsx: rounded-lg
 * resizable-panel.tsx 핸들: rounded-full
 */
export const radius = {
  /** 소형 UI (툴팁, 코드블록 등) */
  sm: 'rounded',
  /** 기본 (버튼, 입력, 필터 버튼) */
  default: 'rounded-lg',
  /** 카드 내부 아이콘 배경 */
  md: 'rounded-xl',
  /** 카드, 모달 */
  lg: 'rounded-2xl',
  /** 태그, 뱃지, 칩 */
  full: 'rounded-full',
} as const;

// ============================================================
// 5. 그림자 스케일 (Shadow Scale)
// ============================================================

/**
 * 그림자
 * 다크 테마에서는 그림자보다 테두리로 깊이를 표현하는 경우가 많음.
 * 팝오버/툴팁에는 shadow-lg 사용 (search-filters.tsx 툴팁)
 */
export const shadow = {
  /** 기본 요소 (카드 등) */
  sm: 'shadow-sm',
  /** 일반 패널 */
  default: 'shadow-md',
  /** 팝오버, 드롭다운, 모달 */
  lg: 'shadow-lg',
  /** 글로우 효과 (브랜드 강조) */
  glow: 'shadow-orange-500/20',
} as const;

// ============================================================
// 6. 트랜지션 (Transition)
// ============================================================

/**
 * 트랜지션 설정
 * 모든 interactive 요소에 duration-150 적용 (button.tsx, input.tsx 등)
 */
export const transition = {
  /** 기본 색상 전환 */
  colors: 'transition-colors duration-150',
  /** 변환 포함 전환 (hover 스케일 등) */
  all: 'transition-all',
  /** 변환 전용 */
  transform: 'transition-transform duration-150',
} as const;

// ============================================================
// 7. 복합 토큰 (Composite Tokens)
// ============================================================
// 자주 함께 쓰이는 토큰 조합을 미리 정의한 편의 객체.
// 컴포넌트 개발 시 복합 토큰을 우선 참조한다.

/**
 * 버튼 변형 (Button Variants)
 * button.tsx 의 variants 객체를 토큰으로 추출
 */
export const buttonVariants = {
  /** 주요 액션 (Submit, CTA 등) */
  primary: 'bg-orange-600 hover:bg-orange-700 text-white',
  /** 보조 액션 */
  secondary: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200',
  /** 고스트 (아이콘 버튼, 인라인 액션) */
  ghost: 'bg-transparent hover:bg-orange-50 text-gray-600',
  /** 위험 / 삭제 */
  danger: 'bg-red-600 hover:bg-red-500 text-white',
  /** 브랜드 그라디언트 CTA */
  gradient: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white',
} as const;

/**
 * 버튼 사이즈 (Button Sizes)
 * button.tsx 의 sizes 객체를 토큰으로 추출
 */
export const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
} as const;

/**
 * 카드 스타일 (Card Styles)
 * page.tsx: 피처 카드, 모드 카드 패턴
 */
export const cardStyles = {
  /** 기본 카드 */
  default: 'rounded-2xl bg-gray-50 border border-gray-200',
  /** 호버 시 보라 테두리 강조 */
  primaryHover: 'hover:border-orange-500/50',
  /** 호버 시 푸샤 테두리 강조 */
  secondaryHover: 'hover:border-amber-500/50',
  /** 강조 카드 (Pro 플랜 등) */
  highlighted: 'bg-white/90 ring-1 ring-orange-500/20',
} as const;

/**
 * 입력 필드 스타일 (Input Styles)
 * input.tsx 에서 추출
 */
export const inputStyles = {
  base: 'w-full px-3 py-2 rounded-lg text-sm bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors duration-150',
  error: 'border-red-500',
} as const;

/**
 * 태그/칩 스타일 (Tag/Chip Styles)
 * tag.tsx, search-filters.tsx 에서 추출
 */
export const tagStyles = {
  base: 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-150',
  default: 'bg-orange-50 text-gray-600 hover:bg-orange-100',
  selected: 'bg-orange-600 text-white',
  secondarySelected: 'bg-amber-500/10 text-amber-400',
} as const;

/**
 * 섹션 레이블 스타일 (Section Label Styles)
 * search-filters.tsx 의 섹션 헤더 패턴
 */
export const sectionLabelStyles = {
  base: 'text-xs font-medium text-gray-500 uppercase tracking-wider',
} as const;

// ============================================================
// 8. 통합 토큰 객체 (Unified Token Object)
// ============================================================
// 위 토큰들을 하나의 객체로 묶어 편리하게 접근할 수 있도록 한다.

export const tokens = {
  color: {
    primary: colorPrimary,
    secondary: colorSecondary,
    gradient: colorGradient,
    surface: colorSurface,
    text: colorText,
    border: colorBorder,
    status: colorStatus,
    axis: colorAxis,
  },
  typography: {
    heading: typographyHeading,
    body: typographyBody,
    caption: typographyCaption,
    label: typographyLabel,
  },
  spacing: {
    padding: spacingPadding,
    layout: spacingLayout,
  },
  radius,
  shadow,
  transition,
  composite: {
    buttonVariants,
    buttonSizes,
    cardStyles,
    inputStyles,
    tagStyles,
    sectionLabel: sectionLabelStyles,
  },
} as const;

export default tokens;
