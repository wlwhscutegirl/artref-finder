// ============================================
// 작가 대시보드 페이지 (Phase 3 Step 4)
// 최근 검색, 인기 태그, 사용 통계 표시
// ============================================

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { STORAGE_KEYS } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth-store';
import { useSearchHistory } from '@/hooks/useSearchHistory';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { recentSearches, popularTags, stats, clearHistory } = useSearchHistory();

  // 저장된 포즈 수 (localStorage에서 가져오기)
  const savedPoseCount = useMemo(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SAVED_POSES);
      if (!raw) return 0;
      return JSON.parse(raw).length;
    } catch {
      return 0;
    }
  }, []);

  // 컬렉션 수 (localStorage에서 가져오기)
  const collectionCount = useMemo(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      if (!raw) return 0;
      return JSON.parse(raw).length;
    } catch {
      return 0;
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* 헤더 */}
      <header className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          {/* 로고 컴포넌트 (h-12 헤더용 size=28) */}
          <Link href="/search" className="flex items-center">
            <Logo size={28} />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className="text-xs text-gray-500 hover:text-gray-600 transition-colors"
            >
              검색
            </Link>
            <Link
              href="/collections"
              className="text-xs text-gray-500 hover:text-gray-600 transition-colors"
            >
              컬렉션
            </Link>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* 제목 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            {isAuthenticated && user ? `${user.name}님의 대시보드` : '대시보드'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            검색 활동과 사용 통계를 확인하세요
          </p>
        </div>

        {/* 통계 카드 4열 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard
            label="총 검색 수"
            value={stats.totalSearches}
            icon="🔍"
            color="from-orange-500/20 to-orange-600/10"
          />
          <StatCard
            label="오늘 검색"
            value={stats.todaySearches}
            icon="📅"
            color="from-blue-500/20 to-blue-600/10"
          />
          <StatCard
            label="저장된 포즈"
            value={savedPoseCount}
            icon="🎭"
            color="from-amber-500/20 to-amber-600/10"
          />
          <StatCard
            label="컬렉션"
            value={collectionCount}
            icon="📁"
            color="from-orange-500/20 to-orange-600/10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 인기 태그 Top 10 */}
          <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold mb-3">자주 사용한 태그 Top 10</h2>
            {popularTags.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                아직 검색 기록이 없어요
              </p>
            ) : (
              <div className="space-y-1.5">
                {popularTags.map((item, index) => {
                  // 최대값 기준 비율 (바 차트용)
                  const maxCount = popularTags[0]?.count || 1;
                  const ratio = (item.count / maxCount) * 100;

                  return (
                    <div key={item.tag} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-4 text-right">
                        {index + 1}
                      </span>
                      <div className="flex-1 relative">
                        {/* 바 차트 배경 */}
                        <div
                          className="absolute inset-y-0 left-0 bg-orange-500/10 rounded"
                          style={{ width: `${ratio}%` }}
                        />
                        <div className="relative flex items-center justify-between px-2 py-1">
                          <Link
                            href={`/search?tag=${encodeURIComponent(item.tag)}`}
                            className="text-xs text-gray-600 hover:text-orange-300 transition-colors"
                          >
                            #{item.tag}
                          </Link>
                          <span className="text-xs text-gray-400">{item.count}회</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 최근 검색 목록 */}
          <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">최근 검색</h2>
              {recentSearches.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-400 hover:text-red-400 cursor-pointer transition-colors"
                >
                  전체 삭제
                </button>
              )}
            </div>
            {recentSearches.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                아직 검색 기록이 없어요
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
                {recentSearches.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/search?tags=${encodeURIComponent(entry.tags.join(','))}`}
                    className="block p-2 rounded-lg bg-orange-50/30 hover:bg-orange-50/60 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.slice(0, 5).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300"
                          >
                            #{tag}
                          </span>
                        ))}
                        {entry.tags.length > 5 && (
                          <span className="text-xs text-gray-400">
                            +{entry.tags.length - 5}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-300 shrink-0 ml-2">
                        {entry.resultCount}건
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{formatTimestamp(entry.timestamp)}</span>
                      {entry.poseMatchUsed && (
                        <span className="text-orange-400/60">포즈매칭</span>
                      )}
                      {entry.category && (
                        <span className="text-orange-400/60">{entry.category}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 추가 통계 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">사용한 고유 태그</p>
            <p className="text-xl font-bold text-orange-400">{stats.uniqueTagsUsed}</p>
          </div>
          <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">평균 검색 결과</p>
            <p className="text-xl font-bold text-orange-400">{stats.avgResultCount}건</p>
          </div>
          <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">현재 플랜</p>
            <p className="text-xl font-bold text-orange-400 capitalize">
              {user?.plan || 'Free'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

/** 통계 카드 컴포넌트 */
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${color} border border-gray-200 rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

/** 타임스탬프 포맷 (상대 시간) */
function formatTimestamp(ts: number): string {
  const now = Date.now();
  const diff = now - ts;

  // 1분 미만
  if (diff < 60 * 1000) return '방금 전';
  // 1시간 미만
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}분 전`;
  // 24시간 미만
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}시간 전`;
  // 7일 미만
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}일 전`;

  // 그 이상은 날짜 표시
  const date = new Date(ts);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
