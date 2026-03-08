'use client';

/**
 * ArtRef Finder 디자인 시스템 문서화 컴포넌트
 *
 * 목적: 개발자가 디자인 토큰과 컴포넌트 변형을 한눈에 확인할 수 있는
 *       인터랙티브 참고 페이지.
 *       프로덕션 빌드에 포함되지만 개발/내부 경로(/design-system)에서만 접근한다.
 *
 * 사용법:
 *   import { DesignSystemDocs } from '@/components/ui/design-system';
 *   // /app/design-system/page.tsx 에서 렌더링
 */

import { tokens } from '@/styles/design-tokens';

// ============================================================
// 내부 유틸: 섹션 래퍼
// ============================================================

/** 각 문서 섹션을 감싸는 래퍼 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      {/* 섹션 제목 */}
      <h2 className="text-xl font-bold mb-1 text-gray-900">{title}</h2>
      <div className="w-full h-px bg-gray-100 mb-6" />
      {children}
    </section>
  );
}

/** 서브섹션 래퍼 */
function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      {/* 서브섹션 제목 */}
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

/** 토큰 레이블을 함께 표시하는 색상 칩 */
function ColorChip({
  label,
  colorClass,
  textClass = 'text-gray-900',
  borderClass,
}: {
  label: string;
  colorClass: string;
  textClass?: string;
  borderClass?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
      {/* 색상 미리보기 사각형 */}
      <div
        className={`w-16 h-16 rounded-xl ${colorClass} ${borderClass ?? ''} flex items-end justify-end`}
      />
      {/* 토큰명 */}
      <span className="text-[10px] text-gray-400 text-center leading-tight">{label}</span>
    </div>
  );
}

// ============================================================
// 1. 색상 팔레트 섹션
// ============================================================

function ColorPaletteSection() {
  return (
    <Section title="Color Palette">
      {/* Primary */}
      <SubSection title="Primary (Violet)">
        <div className="flex flex-wrap gap-4">
          <ColorChip label="primary.default" colorClass="bg-orange-600" />
          <ColorChip label="primary.hover" colorClass="bg-orange-500" />
          <ColorChip label="primary.subtle" colorClass="bg-orange-500/10 border border-orange-500/20" />
          <ColorChip label="ring" colorClass="bg-transparent border-2 border-orange-500" />
        </div>
      </SubSection>

      {/* Secondary */}
      <SubSection title="Secondary (Fuchsia)">
        <div className="flex flex-wrap gap-4">
          <ColorChip label="secondary.default" colorClass="bg-amber-500" />
          <ColorChip label="secondary.subtle" colorClass="bg-amber-500/10 border border-amber-500/50" />
        </div>
      </SubSection>

      {/* Gradient */}
      <SubSection title="Gradient">
        <div className="flex flex-wrap gap-4">
          <ColorChip label="gradient.brand" colorClass="bg-gradient-to-r from-orange-600 to-amber-600" />
          <ColorChip label="gradient.heroText" colorClass="bg-gradient-to-r from-orange-400 via-amber-400 to-pink-400" />
          <ColorChip label="gradient.logo" colorClass="bg-gradient-to-br from-orange-500 to-amber-500" />
        </div>
      </SubSection>

      {/* Surface */}
      <SubSection title="Surface (Background)">
        <div className="flex flex-wrap gap-4">
          <ColorChip label="surface.base" colorClass="bg-white border border-gray-300" />
          <ColorChip label="surface.page / panel" colorClass="bg-gray-50 border border-gray-300" />
          <ColorChip label="surface.elevated" colorClass="bg-gray-100 border border-gray-300" />
          <ColorChip label="surface.overlay" colorClass="bg-white/90 border border-gray-300" />
          <ColorChip label="surface.subtle" colorClass="bg-gray-100/50 border border-gray-300" />
        </div>
      </SubSection>

      {/* Text */}
      <SubSection title="Text">
        <div className="space-y-2">
          {[
            { label: 'text.primary', cls: 'text-gray-900', sample: '최우선 텍스트 (제목, 강조)' },
            { label: 'text.default', cls: 'text-gray-700', sample: '일반 본문 텍스트' },
            { label: 'text.secondary', cls: 'text-gray-600', sample: '보조 텍스트 (설명, 레이블)' },
            { label: 'text.muted', cls: 'text-gray-500', sample: '약한 텍스트 (힌트, 부연)' },
            { label: 'text.disabled', cls: 'text-gray-400', sample: '비활성 텍스트' },
            { label: 'text.faint', cls: 'text-gray-300', sample: '매우 약한 텍스트 (안내)' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-4">
              {/* 토큰 키 */}
              <span className="w-36 text-[11px] text-gray-300 font-mono flex-shrink-0">{item.label}</span>
              {/* 샘플 텍스트 */}
              <span className={`text-sm ${item.cls}`}>{item.sample}</span>
            </div>
          ))}
        </div>
      </SubSection>

      {/* Status */}
      <SubSection title="Status Colors">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* 에러 */}
          <div className={`p-3 rounded-lg ${tokens.color.status.error.bgSubtle} ${tokens.color.status.error.border} border`}>
            <p className={`text-xs font-semibold ${tokens.color.status.error.textStrong}`}>Error</p>
            <p className={`text-[11px] mt-0.5 ${tokens.color.status.error.text}`}>에러 / 위험 / 삭제</p>
          </div>
          {/* 경고 */}
          <div className={`p-3 rounded-lg ${tokens.color.status.warning.bgSubtle} ${tokens.color.status.warning.border} border`}>
            <p className={`text-xs font-semibold ${tokens.color.status.warning.textStrong}`}>Warning</p>
            <p className={`text-[11px] mt-0.5 ${tokens.color.status.warning.text}`}>경고 / 제한 근접</p>
          </div>
          {/* 성공 */}
          <div className={`p-3 rounded-lg ${tokens.color.status.success.bgSubtle} ${tokens.color.status.success.border} border`}>
            <p className={`text-xs font-semibold ${tokens.color.status.success.textStrong}`}>Success</p>
            <p className={`text-[11px] mt-0.5 ${tokens.color.status.success.text}`}>성공 / 완료</p>
          </div>
          {/* 정보 */}
          <div className={`p-3 rounded-lg ${tokens.color.status.info.bgSubtle} ${tokens.color.status.info.border} border`}>
            <p className={`text-xs font-semibold text-blue-300`}>Info</p>
            <p className={`text-[11px] mt-0.5 ${tokens.color.status.info.text}`}>정보 / 안내</p>
          </div>
        </div>
      </SubSection>

      {/* 3D Axis */}
      <SubSection title="3D Axis Colors (Three.js 뷰어 전용)">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className={`text-sm ${tokens.color.axis.x.text}`}>X축 (Roll)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className={`text-sm ${tokens.color.axis.y.text}`}>Y축 (Pitch)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className={`text-sm ${tokens.color.axis.z.text}`}>Z축 (Yaw)</span>
          </div>
        </div>
      </SubSection>
    </Section>
  );
}

// ============================================================
// 2. 타이포그래피 섹션
// ============================================================

function TypographySection() {
  return (
    <Section title="Typography">
      {/* 헤딩 */}
      <SubSection title="Heading Scale">
        <div className="space-y-4">
          <div>
            <span className="text-[10px] text-gray-300 font-mono block mb-1">heading.hero</span>
            <p className="text-4xl font-bold leading-tight text-gray-900">포즈, 조명, 앵글</p>
          </div>
          <div>
            <span className="text-[10px] text-gray-300 font-mono block mb-1">heading.h1</span>
            <p className="text-3xl font-bold text-gray-900">페이지 제목</p>
          </div>
          <div>
            <span className="text-[10px] text-gray-300 font-mono block mb-1">heading.h2</span>
            <p className="text-2xl font-bold text-gray-900">섹션 제목</p>
          </div>
          <div>
            <span className="text-[10px] text-gray-300 font-mono block mb-1">heading.h3</span>
            <p className="text-xl font-semibold text-gray-900">카드/패널 제목</p>
          </div>
          <div>
            <span className="text-[10px] text-gray-300 font-mono block mb-1">heading.h4</span>
            <p className="text-lg font-semibold text-gray-900">서브섹션 제목</p>
          </div>
        </div>
      </SubSection>

      {/* 본문 */}
      <SubSection title="Body Scale">
        <div className="space-y-3">
          <div>
            <span className="text-[10px] text-gray-300 font-mono block mb-0.5">body.lg</span>
            <p className="text-lg leading-relaxed text-gray-500">
              핀터레스트에서 끝없이 스크롤하지 마세요.
            </p>
          </div>
          <div>
            <span className="text-[10px] text-gray-300 font-mono block mb-0.5">body.default</span>
            <p className="text-sm leading-relaxed text-gray-500">
              3D 마네킹으로 원하는 포즈를 잡고, 조명 방향을 설정하면 정확히 일치하는 실사 레퍼런스를 찾아줍니다.
            </p>
          </div>
          <div>
            <span className="text-[10px] text-gray-300 font-mono block mb-0.5">body.sm</span>
            <p className="text-xs leading-relaxed text-gray-500">
              초보자 / 빠른 검색이 필요할 때 추천
            </p>
          </div>
        </div>
      </SubSection>

      {/* 캡션 */}
      <SubSection title="Caption & Label">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-gray-300 font-mono w-36">label.section</span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-gray-300 font-mono w-36">label.input</span>
            <span className="text-sm font-medium text-gray-600">이메일</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-gray-300 font-mono w-36">caption.default</span>
            <span className="text-xs text-gray-400">결제 시스템은 준비 중입니다</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-gray-300 font-mono w-36">caption.xs</span>
            <span className="text-[10px] text-gray-300">그림에 익숙한 중급+ 아티스트 추천</span>
          </div>
        </div>
      </SubSection>
    </Section>
  );
}

// ============================================================
// 3. 버튼 변형 섹션
// ============================================================

function ButtonSection() {
  return (
    <Section title="Button Variants">
      <SubSection title="Variants x Sizes">
        {/* 변형 행 */}
        {(
          [
            { label: 'primary', cls: tokens.composite.buttonVariants.primary },
            { label: 'secondary', cls: tokens.composite.buttonVariants.secondary },
            { label: 'ghost', cls: tokens.composite.buttonVariants.ghost },
            { label: 'danger', cls: tokens.composite.buttonVariants.danger },
            { label: 'gradient', cls: tokens.composite.buttonVariants.gradient },
          ] as const
        ).map((variant) => (
          <div key={variant.label} className="flex items-center gap-4 mb-4">
            {/* 변형 레이블 */}
            <span className="text-[11px] text-gray-300 font-mono w-20 flex-shrink-0">{variant.label}</span>
            {/* 사이즈별 버튼 */}
            <div className="flex items-center gap-3">
              <button
                className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 focus:outline-none disabled:opacity-50 ${variant.cls} px-3 py-1.5 text-sm`}
              >
                Small
              </button>
              <button
                className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 focus:outline-none disabled:opacity-50 ${variant.cls} px-4 py-2 text-sm`}
              >
                Medium
              </button>
              <button
                className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 focus:outline-none disabled:opacity-50 ${variant.cls} px-6 py-3 text-base`}
              >
                Large
              </button>
              {/* 비활성 상태 */}
              <button
                disabled
                className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${variant.cls} px-4 py-2 text-sm`}
              >
                Disabled
              </button>
            </div>
          </div>
        ))}
      </SubSection>
    </Section>
  );
}

// ============================================================
// 4. 태그/뱃지 섹션
// ============================================================

function TagSection() {
  return (
    <Section title="Tags & Badges">
      <SubSection title="Tag Variants">
        <div className="flex flex-wrap gap-2">
          {/* 기본 태그 */}
          <span className={`${tokens.composite.tagStyles.base} ${tokens.composite.tagStyles.default}`}>
            #가죽
          </span>
          {/* 선택된 태그 */}
          <span className={`${tokens.composite.tagStyles.base} ${tokens.composite.tagStyles.selected}`}>
            #근육
          </span>
          {/* Secondary 선택 태그 */}
          <span className={`${tokens.composite.tagStyles.base} ${tokens.composite.tagStyles.secondarySelected}`}>
            #스케치
          </span>
          {/* 제거 가능한 태그 */}
          <span className={`${tokens.composite.tagStyles.base} ${tokens.composite.tagStyles.selected}`}>
            #비단
            <button className="ml-0.5 hover:text-orange-200">&times;</button>
          </span>
        </div>
      </SubSection>

      <SubSection title="Filter Chip (Category)">
        <div className="flex flex-wrap gap-2">
          {/* 선택된 필터 */}
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-600 text-white transition-colors">
            전체
          </button>
          {/* 기본 필터 */}
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
            인물
          </button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
            자연
          </button>
        </div>
      </SubSection>

      <SubSection title="Status Badge">
        <div className="flex flex-wrap gap-2">
          {/* 브랜드 뱃지 */}
          <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-orange-600 to-amber-600 text-white">
            추천
          </span>
          {/* 경고 뱃지 */}
          <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            학생 인증
          </span>
          {/* 정보 칩 */}
          <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded-full text-xs">
            포즈 매칭
          </span>
          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full text-xs">
            스케치 검색
          </span>
        </div>
      </SubSection>
    </Section>
  );
}

// ============================================================
// 5. 입력 필드 섹션
// ============================================================

function InputSection() {
  return (
    <Section title="Input Fields">
      <SubSection title="Text Input">
        <div className="space-y-4 max-w-sm">
          {/* 기본 입력 */}
          <div>
            <span className="text-[10px] text-gray-300 font-mono block mb-2">default</span>
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">이메일</label>
              <input
                readOnly
                value=""
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-lg text-sm bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors duration-150"
              />
            </div>
          </div>

          {/* 에러 상태 */}
          <div>
            <span className="text-[10px] text-gray-300 font-mono block mb-2">error state</span>
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">비밀번호</label>
              <input
                readOnly
                value="wrongpassword"
                className="w-full px-3 py-2 rounded-lg text-sm bg-gray-50 border border-red-500 text-gray-900 placeholder-gray-400 focus:outline-none transition-colors duration-150"
              />
              <p className="mt-1 text-sm text-red-400">이메일 또는 비밀번호가 올바르지 않습니다.</p>
            </div>
          </div>
        </div>
      </SubSection>
    </Section>
  );
}

// ============================================================
// 6. 카드 섹션
// ============================================================

function CardSection() {
  return (
    <Section title="Cards">
      <SubSection title="Feature Card">
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
          {/* 기본 카드 */}
          <div className="p-8 rounded-2xl bg-gray-50 border border-gray-200 hover:border-orange-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-2xl mb-4">
              🦾
            </div>
            <h3 className="text-xl font-semibold mb-2">3D 포즈 매칭</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              웹에서 3D 마네킹의 관절을 직접 조작하세요.
            </p>
          </div>

          {/* 강조 카드 */}
          <div className="p-8 rounded-2xl bg-gray-50 border border-gray-200 hover:border-amber-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-2xl mb-4">
              ✏️
            </div>
            <h3 className="text-xl font-semibold mb-2 hover:text-amber-400 transition-colors">
              드로잉 모드
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              원하는 포즈를 직접 그리거나 스케치를 업로드하세요.
            </p>
          </div>
        </div>
      </SubSection>

      <SubSection title="Panel / Tool Panel">
        <div className="p-3 bg-white/90 border border-gray-200 rounded-lg space-y-2 max-w-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-semibold text-amber-300">왼쪽 어깨</span>
          </div>
          <p className="text-xs text-gray-400">관절 슬라이더 패널 패턴</p>
        </div>
      </SubSection>
    </Section>
  );
}

// ============================================================
// 7. 간격 & 반경 섹션
// ============================================================

function SpacingRadiusSection() {
  return (
    <Section title="Spacing & Border Radius">
      <SubSection title="Border Radius Scale">
        <div className="flex flex-wrap gap-6 items-end">
          {[
            { label: 'sm\nrounded', cls: 'rounded' },
            { label: 'default\nrounded-lg', cls: 'rounded-lg' },
            { label: 'md\nrounded-xl', cls: 'rounded-xl' },
            { label: 'lg\nrounded-2xl', cls: 'rounded-2xl' },
            { label: 'full\nrounded-full', cls: 'rounded-full' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              {/* 반경 시각화 */}
              <div
                className={`w-16 h-16 bg-orange-600/30 border border-orange-500/50 ${item.cls}`}
              />
              {/* 레이블 */}
              <span className="text-[10px] text-gray-300 text-center whitespace-pre-line font-mono">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </SubSection>
    </Section>
  );
}

// ============================================================
// 8. 상태 배너 섹션
// ============================================================

function StatusBannerSection() {
  return (
    <Section title="Status Banners">
      <SubSection title="Alert / Notification Patterns">
        <div className="space-y-3 max-w-md">
          {/* 에러 배너 */}
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-sm font-semibold text-red-300">오늘 무료 검색 한도에 도달했습니다</p>
            <p className="text-xs text-red-400/80 mt-0.5">무제한 검색 + 고급 필터가 ₩4,900/월!</p>
          </div>

          {/* 경고 배너 */}
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-xs font-medium text-amber-300">오늘 검색 5회 남았습니다</p>
            <p className="text-[10px] text-amber-400/70 mt-0.5">무제한 검색 + 고급 필터가 ₩4,900/월!</p>
          </div>

          {/* 정보 인라인 */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            아티스트를 위한 레퍼런스 검색 엔진
          </div>

          {/* 에러 인라인 (로그인 폼) */}
          <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">
            이메일 또는 비밀번호가 올바르지 않습니다.
          </p>
        </div>
      </SubSection>
    </Section>
  );
}

// ============================================================
// 9. 브랜드 로고 마크 섹션
// ============================================================

function BrandSection() {
  return (
    <Section title="Brand">
      <SubSection title="Logo Mark Sizes">
        <div className="flex items-end gap-6">
          {/* 소형 */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-[10px] font-bold text-white">
              A
            </div>
            <span className="text-[10px] text-gray-300">24px (Nav compact)</span>
          </div>
          {/* 중형 */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-sm font-bold text-white">
              A
            </div>
            <span className="text-[10px] text-gray-300">32px (Nav default)</span>
          </div>
          {/* 대형 */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-lg font-bold text-white">
              A
            </div>
            <span className="text-[10px] text-gray-300">40px (Auth)</span>
          </div>
        </div>
      </SubSection>

      <SubSection title="Gradient Text (Hero)">
        <h1 className="text-4xl font-bold">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-pink-400">
            포즈, 조명, 앵글
          </span>
        </h1>
      </SubSection>
    </Section>
  );
}

// ============================================================
// 메인 DesignSystemDocs 컴포넌트
// ============================================================

/**
 * 디자인 시스템 전체 문서화 컴포넌트
 *
 * 사용 예시:
 *   // src/app/design-system/page.tsx
 *   import { DesignSystemDocs } from '@/components/ui/design-system';
 *   export default function DesignSystemPage() {
 *     return <DesignSystemDocs />;
 *   }
 */
export function DesignSystemDocs() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 브랜드 로고 */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-sm font-bold text-white">
              A
            </div>
            <div>
              <span className="font-semibold">ArtRef</span>
              <span className="ml-2 text-xs text-gray-400">Design System</span>
            </div>
          </div>
          {/* 버전 뱃지 */}
          <span className="text-[10px] text-gray-300 font-mono">
            Phase 5 — Dark Theme Only
          </span>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* 소개 */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-3">Design System</h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xl">
            ArtRef Finder의 디자인 토큰과 컴포넌트 가이드라인.
            모든 토큰은 <code className="text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded text-xs font-mono">src/styles/design-tokens.ts</code>에 정의되어 있습니다.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs font-mono">Tailwind CSS 4</span>
            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs font-mono">Dark Theme</span>
            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs font-mono">TypeScript</span>
          </div>
        </div>

        {/* 섹션들 */}
        <ColorPaletteSection />
        <TypographySection />
        <ButtonSection />
        <TagSection />
        <InputSection />
        <CardSection />
        <SpacingRadiusSection />
        <StatusBannerSection />
        <BrandSection />
      </main>
    </div>
  );
}
