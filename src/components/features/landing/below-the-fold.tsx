/**
 * 랜딩 페이지 below-the-fold 섹션 (리뉴얼 v2)
 *
 * 성능 최적화: React.lazy + Suspense로 지연 로딩
 *
 * 포함 섹션:
 * 3. 핵심 기능 소개 — 구체적 사용 시나리오 중심
 * 4. 이런 분들에게 추천 — 타겟 유저 명시
 * 5. 가격 비교 — Free / Pro (정직한 표현)
 * 6. 최종 CTA
 * 7. 푸터
 */

import Link from 'next/link';

/** 추천 대상 데이터 — 구체적 페인포인트와 함께 */
const TARGET_USERS = [
  {
    title: '웹툰 작가',
    description: '매 회차 수십 개 포즈가 필요한데, 핀터레스트 뒤지는 시간이 아까운 분',
    accent: 'border-orange-500/30',
  },
  {
    title: '일러스트레이터',
    description: '특정 앵글·조명의 레퍼런스를 찾다가 타협해본 적 있는 분',
    accent: 'border-amber-500/30',
  },
  {
    title: '미대생',
    description: '인체 드로잉 과제에서 다양한 포즈 레퍼런스가 필요한 분',
    accent: 'border-pink-500/30',
  },
  {
    title: '캐릭터 디자이너',
    description: '액션 포즈, 일상 포즈를 정확한 앵글로 확인하고 싶은 분',
    accent: 'border-amber-500/30',
  },
] as const;

/** 핵심 기능 데이터 — 구체적 시나리오 + before/after */
const FEATURES = [
  {
    title: '3D 마네킹으로 포즈 설정',
    before: '핀터레스트에서 "앉은 포즈 측면" 검색 → 스크롤 30분',
    after: '마네킹 관절 드래그 → 원하는 포즈 즉시 완성',
    details: '관절 하나하나 직접 조작하거나, 60개 프리셋 중 골라서 시작하세요.',
    accentBorder: 'hover:border-orange-500/40',
    accentText: 'group-hover:text-orange-300',
    tagColor: 'bg-orange-500/10 text-orange-400',
    tags: ['관절 조작', '60개 프리셋'],
  },
  {
    title: 'AI가 실사 매칭',
    before: '구글에서 비슷한 사진 찾다가 결국 타협',
    after: '마네킹 포즈와 가장 유사한 실사 사진을 AI가 자동 매칭',
    details: '자동 매칭이 포즈 유사도를 계산해서, 가장 가까운 사진부터 보여줍니다.',
    accentBorder: 'hover:border-amber-500/40',
    accentText: 'group-hover:text-amber-600',
    tagColor: 'bg-amber-500/10 text-amber-400',
    tags: ['벡터 검색', '유사도 정렬'],
  },
  {
    title: '조명 · 카메라 앵글까지',
    before: '포즈는 맞는데 조명 방향이 다른 사진만 나옴',
    after: '광원 위치 + 카메라 앵글 설정 → 조건에 맞는 사진만 필터',
    details: '하이앵글, 로우앵글, 광각 구도와 그림자 방향까지 맞는 사진을 찾아줍니다.',
    accentBorder: 'hover:border-pink-500/40',
    accentText: 'group-hover:text-pink-300',
    tagColor: 'bg-pink-500/10 text-pink-400',
    tags: ['광원 조절', '카메라 앵글'],
  },
  {
    title: '컬렉션으로 정리',
    before: '찾아둔 레퍼런스 어디 저장했더라...',
    after: '프로젝트별 컬렉션 + 포즈 프리셋 클라우드 저장',
    details: '마음에 드는 레퍼런스를 컬렉션으로 분류하고, 어디서든 불러오세요.',
    accentBorder: 'hover:border-amber-500/40',
    accentText: 'group-hover:text-amber-600',
    tagColor: 'bg-amber-500/10 text-amber-400',
    tags: ['컬렉션 관리', '클라우드 동기화'],
  },
] as const;

export default function BelowTheFold() {
  return (
    <>
      {/* ====================================================
          3. 핵심 기능 소개 — 구체적 시나리오 중심
          ==================================================== */}
      {/* 모바일에서 섹션 여백 축소 */}
      <section id="features" className="py-12 sm:py-24 px-4 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">

          {/* 섹션 헤더 */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              레퍼런스 찾기, 이렇게 달라집니다
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              포즈를 말로 설명하지 마세요. 직접 만들고, AI가 찾게 하세요.
            </p>
          </div>

          {/* 기능 카드 그리드 */}
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className={`group p-8 rounded-2xl bg-gray-50 border border-gray-200 ${feature.accentBorder} transition-all`}
              >
                {/* 기능 이름 */}
                <h3 className={`text-xl font-semibold mb-4 ${feature.accentText} transition-colors`}>
                  {feature.title}
                </h3>

                {/* Before / After — 구체적 시나리오 */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-gray-300 shrink-0 font-mono text-xs mt-0.5">전</span>
                    <span className="text-gray-400 line-through decoration-neutral-700">{feature.before}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-orange-400 shrink-0 font-mono text-xs mt-0.5">후</span>
                    <span className="text-gray-700">{feature.after}</span>
                  </div>
                </div>

                {/* 상세 설명 */}
                <p className="text-gray-500 text-sm leading-relaxed mb-5">
                  {feature.details}
                </p>

                {/* 태그 */}
                <div className="flex flex-wrap gap-1.5">
                  {feature.tags.map((tag) => (
                    <span key={tag} className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${feature.tagColor}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================
          4. 이런 분들에게 추천 — 타겟 유저 명시
          ==================================================== */}
      <section id="for-who" className="py-12 sm:py-24 px-4 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">

          {/* 섹션 헤더 */}
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">이런 분들이 쓰고 있어요</h2>
            <p className="text-gray-500">
              그림 그리는 사람이라면 누구나, 레퍼런스 찾는 고통을 알고 있습니다
            </p>
          </div>

          {/* 타겟 유저 카드 */}
          <div className="grid sm:grid-cols-2 gap-4">
            {TARGET_USERS.map((user) => (
              <div
                key={user.title}
                className={`p-6 rounded-2xl bg-gray-50/60 border ${user.accent} transition-colors`}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{user.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{user.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================
          5. 가격 비교 섹션 — Free / Pro (정직한 표현)
          ==================================================== */}
      <section id="pricing" className="py-12 sm:py-24 px-4 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">

          {/* 섹션 헤더 */}
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">심플한 가격</h2>
            <p className="text-gray-500">무료로 충분히 써보고, 필요할 때 업그레이드하세요</p>
          </div>

          {/* Free / Pro 2열 비교 */}
          <div className="grid sm:grid-cols-2 gap-5">

            {/* Free 플랜 */}
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-7 flex flex-col">
              {/* 플랜명 */}
              <h3 className="text-lg font-bold text-gray-600 mb-1">Free</h3>
              {/* 가격 */}
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-gray-900">무료</span>
              </div>
              <p className="text-xs text-gray-400 mb-6">기간 제한 없음</p>

              {/* 주요 기능 목록 */}
              <ul className="space-y-2.5 flex-1 mb-7 text-sm">
                {[
                  '일일 검색 100회',
                  '컬렉션 5개',
                  '저장 포즈 10개',
                  '자동 포즈 추출 5회/일',
                  '태그 기반 검색',
                  '포즈 벡터 매칭',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-gray-600">
                    <span className="text-green-400 shrink-0 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
                {[
                  '카메라 앵글 벡터 매칭',
                  '고급 소재/배경 필터',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-gray-300">
                    <span className="shrink-0 mt-0.5">—</span>
                    {item}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/register"
                className="block text-center py-2.5 rounded-xl text-sm font-semibold bg-orange-50 hover:bg-orange-100 text-gray-600 transition-colors"
              >
                무료로 시작하기
              </Link>
            </div>

            {/* Pro 플랜 — 강조 */}
            <div className="relative rounded-2xl bg-white/90 border border-orange-500/60 p-7 flex flex-col ring-1 ring-orange-500/15">
              {/* 추천 뱃지 */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold bg-orange-600 text-white">
                추천
              </div>

              {/* 플랜명 */}
              <h3 className="text-lg font-bold text-orange-400 mb-1">
                Pro
              </h3>
              {/* 가격 */}
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-gray-900">₩9,900</span>
                <span className="text-xs text-gray-400">/월</span>
              </div>
              <p className="text-xs text-gray-400 mb-6">연간 결제 시 ₩7,920/월</p>

              {/* 주요 기능 목록 */}
              <ul className="space-y-2.5 flex-1 mb-7 text-sm">
                {[
                  '일일 검색 무제한',
                  '컬렉션 무제한',
                  '저장 포즈 무제한',
                  '자동 포즈 추출 무제한',
                  '태그 기반 검색',
                  '포즈 벡터 매칭',
                  '카메라 앵글 벡터 매칭',
                  '고급 소재/배경 필터',
                  '우선 지원',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-gray-600">
                    <span className="text-green-400 shrink-0 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/register"
                className="block text-center py-2.5 rounded-xl text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-colors"
              >
                Pro 시작하기
              </Link>
            </div>
          </div>

          {/* 전체 가격 페이지 링크 */}
          <p className="text-center mt-6 text-sm text-gray-400">
            Student · Team 플랜이 궁금하신가요?{' '}
            <Link href="/pricing" className="text-orange-400 hover:text-orange-300 transition-colors underline underline-offset-2">
              전체 가격표 보기
            </Link>
          </p>
        </div>
      </section>

      {/* ====================================================
          6. 최종 CTA 섹션 — 절제된 디자인
          ==================================================== */}
      <section className="py-12 sm:py-24 px-4 border-t border-gray-200">
        <div className="max-w-2xl mx-auto text-center">

          {/* 헤드라인 — 구체적 가치 */}
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 leading-snug">
            레퍼런스 찾는 시간,<br />
            그림에 쓰세요
          </h2>
          <p className="text-gray-500 mb-10 leading-relaxed">
            3D 마네킹 → 자동 매칭 → 실사 레퍼런스.
            <br className="hidden sm:block" />
            가입하고 바로 사용해보세요.
          </p>

          {/* CTA 버튼 — 과도한 그라디언트 shadow 제거 */}
          <Link
            href="/register"
            className="inline-block px-10 py-4 rounded-xl font-semibold text-base bg-orange-600 hover:bg-orange-500 text-white transition-colors"
          >
            무료 계정 만들기
          </Link>

          {/* 부연 설명 */}
          <p className="mt-4 text-xs text-gray-300">신용카드 불필요 · 언제든 해지 가능</p>
        </div>
      </section>

      {/* ====================================================
          7. 푸터
          ==================================================== */}
      <footer className="py-10 px-4 border-t border-gray-200">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          {/* 브랜드 */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-xs font-bold text-white">
              A
            </div>
            <span className="font-medium text-gray-500">ArtRef Finder</span>
          </div>

          {/* 슬로건 */}
          <span className="hidden sm:block">Built for artists, by artists</span>

          {/* 링크 */}
          <div className="flex items-center gap-4 text-xs">
            <Link href="/pricing" className="hover:text-gray-600 transition-colors">가격</Link>
            <a href="mailto:support@artref.app" className="hover:text-gray-600 transition-colors">문의</a>
          </div>
        </div>
      </footer>
    </>
  );
}
