'use client';

// ============================================
// 관리자 수집 대시보드 (Unsplash + Pexels)
// 검색 쿼리 선택/입력 → 수집 실행 → 진행률 표시
// Rate limit 추적 + 일시정지/재개 지원
// 배치 자동 수집 (30개 쿼리 × 다페이지 × 멀티소스)
// 이미지 마이그레이션 (sample-data → bkend.ai 클라우드)
// ============================================

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { RECOMMENDED_QUERIES, getRateLimitState } from '@/lib/unsplash-client';
import { PEXELS_RECOMMENDED_QUERIES, getPexelsRateLimitState } from '@/lib/pexels-client';
import { migrateImagesToCloud, type MigrationResult } from '@/lib/image-migration';
import type { ImageCategory } from '@/types';

/** 수집 소스 */
type CollectSource = 'unsplash' | 'pexels' | 'both';

/** 수집 작업 상태 */
interface CollectJob {
  query: string;
  page: number;
  source: CollectSource;
  status: 'pending' | 'running' | 'done' | 'error';
  saved: number;
  skipped: number;
  failed: number;
  error?: string;
}

/** 배치 수집 결과 */
interface BatchResult {
  totalRequests: number;
  unsplash: { saved: number; skipped: number; failed: number };
  pexels: { saved: number; skipped: number; failed: number };
  totalSaved: number;
  duration: number;
}

export default function PipelineDashboardPage() {
  // 검색 쿼리 입력
  const [customQuery, setCustomQuery] = useState('');
  // 선택된 카테고리 (자동 분류 오버라이드)
  const [category, setCategory] = useState<ImageCategory | ''>('');
  // 수집 페이지 수 (각 쿼리당 몇 페이지 수집할지)
  const [maxPages, setMaxPages] = useState(3);
  // 수집 소스 선택
  const [source, setSource] = useState<CollectSource>('both');

  // 수집 작업 목록
  const [jobs, setJobs] = useState<CollectJob[]>([]);
  // 전체 진행 상태
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const pauseRef = useRef(false);

  // 배치 자동 수집 상태
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);

  // Rate limit 상태
  const [unsplashRate, setUnsplashRate] = useState(getRateLimitState());
  const [pexelsRate, setPexelsRate] = useState(getPexelsRateLimitState());

  // --- 마이그레이션 상태 ---
  /** 마이그레이션 실행 중 여부 */
  const [migrationRunning, setMigrationRunning] = useState(false);
  /** 마이그레이션 진행률 (0~100) */
  const [migrationProgress, setMigrationProgress] = useState(0);
  /** 현재 처리 중인 이미지 번호 */
  const [migrationCurrent, setMigrationCurrent] = useState(0);
  /** 전체 마이그레이션 대상 수 */
  const [migrationTotal, setMigrationTotal] = useState(0);
  /** 마이그레이션 결과 */
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  /**
   * 단일 수집 작업 실행
   * 선택된 소스에 따라 적절한 API 엔드포인트 호출
   */
  const runCollectJob = useCallback(async (query: string, page: number, jobSource: CollectSource, jobIndex: number) => {
    // 일시정지 체크
    while (pauseRef.current) {
      await new Promise((r) => setTimeout(r, 500));
    }

    setJobs((prev) => prev.map((j, i) =>
      i === jobIndex ? { ...j, status: 'running' } : j
    ));

    try {
      // 소스별 API 엔드포인트 결정
      const endpoint = jobSource === 'pexels'
        ? '/api/pipeline/collect-pexels'
        : '/api/pipeline/collect';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          page,
          perPage: 30,
          ...(category && { category }),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const result = await res.json();

      setJobs((prev) => prev.map((j, i) =>
        i === jobIndex
          ? { ...j, status: 'done', saved: result.saved, skipped: result.skipped, failed: result.failed }
          : j
      ));
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류';
      setJobs((prev) => prev.map((j, i) =>
        i === jobIndex ? { ...j, status: 'error', error: message } : j
      ));
    }

    // Rate limit 갱신
    setUnsplashRate(getRateLimitState());
    setPexelsRate(getPexelsRateLimitState());
  }, [category]);

  /**
   * 수집 시작 (선택된 쿼리들로 작업 목록 생성 후 순차 실행)
   * 'both' 선택 시 각 쿼리를 Unsplash + Pexels 두 번 수집
   */
  const startCollection = useCallback(async (queries: string[]) => {
    const newJobs: CollectJob[] = [];
    const sources: CollectSource[] = source === 'both' ? ['unsplash', 'pexels'] : [source];

    for (const query of queries) {
      for (let page = 1; page <= maxPages; page++) {
        for (const s of sources) {
          newJobs.push({
            query,
            page,
            source: s,
            status: 'pending',
            saved: 0,
            skipped: 0,
            failed: 0,
          });
        }
      }
    }

    setJobs(newJobs);
    setIsRunning(true);
    setIsPaused(false);
    pauseRef.current = false;

    // 순차 실행 (rate limit 보호)
    for (let i = 0; i < newJobs.length; i++) {
      await runCollectJob(newJobs[i].query, newJobs[i].page, newJobs[i].source, i);

      // Rate limit 여유 확보 (2초 간격)
      if (i < newJobs.length - 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    setIsRunning(false);
  }, [maxPages, source, runCollectJob]);

  /**
   * 배치 자동 수집 (서버 사이드)
   * 30개 추천 쿼리 × 여러 페이지를 서버에서 한번에 처리
   */
  const startBatchCollect = useCallback(async () => {
    setBatchRunning(true);
    setBatchResult(null);

    try {
      const res = await fetch('/api/pipeline/batch-collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          pagesPerQuery: maxPages,
          ...(category && { category }),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const result: BatchResult = await res.json();
      setBatchResult(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : '배치 수집 실패';
      setBatchResult({
        totalRequests: 0,
        unsplash: { saved: 0, skipped: 0, failed: 0 },
        pexels: { saved: 0, skipped: 0, failed: 0 },
        totalSaved: 0,
        duration: 0,
      });
      alert(message);
    }

    setBatchRunning(false);
    // Rate limit 갱신
    setUnsplashRate(getRateLimitState());
    setPexelsRate(getPexelsRateLimitState());
  }, [source, maxPages, category]);

  /**
   * 마이그레이션 시작
   * sample-data 이미지를 bkend.ai images 테이블로 업로드
   */
  const handleMigration = useCallback(async () => {
    setMigrationRunning(true);
    setMigrationResult(null);
    setMigrationProgress(0);
    setMigrationCurrent(0);

    try {
      const result = await migrateImagesToCloud((current, total) => {
        // 진행률 업데이트 콜백
        setMigrationCurrent(current);
        setMigrationTotal(total);
        setMigrationProgress(Math.round((current / total) * 100));
      });
      setMigrationResult(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : '마이그레이션 실패';
      setMigrationResult({
        migrated: 0,
        skipped: 0,
        failed: 0,
        errors: [message],
      });
    }

    setMigrationRunning(false);
  }, []);

  // 커스텀 쿼리 수집
  const handleCustomCollect = () => {
    if (!customQuery.trim()) return;
    startCollection([customQuery.trim()]);
  };

  // 추천 쿼리 전체 수집 (클라이언트 사이드)
  const handleBatchCollect = () => {
    // 소스에 맞는 추천 쿼리 사용
    const queries = source === 'pexels'
      ? [...PEXELS_RECOMMENDED_QUERIES]
      : [...RECOMMENDED_QUERIES];
    startCollection(queries);
  };

  // 일시정지/재개
  const togglePause = () => {
    pauseRef.current = !pauseRef.current;
    setIsPaused(pauseRef.current);
  };

  // 진행률 계산
  const completedJobs = jobs.filter((j) => j.status === 'done' || j.status === 'error').length;
  const totalSaved = jobs.reduce((sum, j) => sum + j.saved, 0);
  const totalSkipped = jobs.reduce((sum, j) => sum + j.skipped, 0);
  const progress = jobs.length > 0 ? Math.round((completedJobs / jobs.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-xs font-bold">
                A
              </div>
              <span className="font-semibold text-sm">ArtRef</span>
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">수집 파이프라인</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/extract" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
              벡터 추출
            </Link>
            <Link href="/mannequin" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
              검색
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Rate Limit 상태 (Unsplash + Pexels 병렬 표시) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Unsplash Rate Limit */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-400 mb-1">Unsplash API (50 req/hour)</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-orange-50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    unsplashRate.remaining > 20 ? 'bg-emerald-500' :
                    unsplashRate.remaining > 5 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(unsplashRate.remaining / unsplashRate.limit) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {unsplashRate.remaining}/{unsplashRate.limit}
              </span>
            </div>
          </div>

          {/* Pexels Rate Limit */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-400 mb-1">Pexels API (200 req/hour)</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-orange-50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    pexelsRate.remaining > 80 ? 'bg-emerald-500' :
                    pexelsRate.remaining > 20 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(pexelsRate.remaining / pexelsRate.limit) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {pexelsRate.remaining}/{pexelsRate.limit}
              </span>
            </div>
          </div>
        </div>

        {/* 소스 선택 + 설정 */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">수집 설정</h2>
          <div className="flex flex-wrap gap-4">
            {/* 소스 선택 */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">수집 소스</label>
              <div className="flex gap-1">
                {(['unsplash', 'pexels', 'both'] as CollectSource[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSource(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      source === s
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-50 text-gray-500 hover:bg-orange-100'
                    }`}
                  >
                    {s === 'unsplash' ? 'Unsplash' : s === 'pexels' ? 'Pexels' : 'Both'}
                  </button>
                ))}
              </div>
            </div>

            {/* 카테고리 오버라이드 */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">카테고리 (자동 분류)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ImageCategory | '')}
                className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs"
              >
                <option value="">자동</option>
                <option value="figure">인물</option>
                <option value="landscape">풍경</option>
                <option value="object">오브제</option>
                <option value="fabric">의상/소재</option>
                <option value="anatomy">해부학</option>
                <option value="environment">환경</option>
                <option value="creature">크리처</option>
              </select>
            </div>

            {/* 쿼리당 페이지 수 */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">쿼리당 페이지 수</label>
              <input
                type="number"
                min={1}
                max={10}
                value={maxPages}
                onChange={(e) => setMaxPages(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="w-20 px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* 커스텀 쿼리 입력 */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">검색 쿼리</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="예: person portrait, yoga pose..."
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
              onKeyDown={(e) => e.key === 'Enter' && handleCustomCollect()}
            />
            <button
              onClick={handleCustomCollect}
              disabled={isRunning || batchRunning || !customQuery.trim()}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              수집
            </button>
          </div>
        </div>

        {/* 배치 자동 수집 (서버 사이드 — 30개 쿼리 대량 처리) */}
        <div className="p-5 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">배치 자동 수집</h2>
              <p className="text-xs text-gray-500 mt-1">
                30개 최적화된 쿼리 x {maxPages}페이지 = 최대 {30 * maxPages * 30}장 수집
                {source === 'both' ? ' (Unsplash + Pexels)' : ` (${source})`}
              </p>
            </div>
            <button
              onClick={startBatchCollect}
              disabled={isRunning || batchRunning}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-bold transition-all"
            >
              {batchRunning ? '수집 중...' : '대량 수집 시작'}
            </button>
          </div>

          {/* 배치 진행 표시 */}
          {batchRunning && (
            <div className="flex items-center gap-3 py-2">
              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-orange-300">서버에서 대량 수집 처리 중... (수 분 소요될 수 있습니다)</span>
            </div>
          )}

          {/* 배치 결과 표시 */}
          {batchResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-gray-50/60 rounded-lg text-center">
                <p className="text-2xl font-bold text-emerald-400">{batchResult.totalSaved}</p>
                <p className="text-xs text-gray-400">새로 저장</p>
              </div>
              <div className="p-3 bg-gray-50/60 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-400">{batchResult.totalRequests}</p>
                <p className="text-xs text-gray-400">총 요청</p>
              </div>
              <div className="p-3 bg-gray-50/60 rounded-lg text-center">
                <p className="text-2xl font-bold text-amber-400">
                  {batchResult.unsplash.saved + batchResult.pexels.saved}
                </p>
                <p className="text-xs text-gray-400">
                  U:{batchResult.unsplash.saved} / P:{batchResult.pexels.saved}
                </p>
              </div>
              <div className="p-3 bg-gray-50/60 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-500">
                  {Math.round(batchResult.duration / 1000)}s
                </p>
                <p className="text-xs text-gray-400">소요 시간</p>
              </div>
            </div>
          )}
        </div>

        {/* 추천 쿼리 일괄 수집 (클라이언트 사이드) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">추천 검색 쿼리</h2>
            <button
              onClick={handleBatchCollect}
              disabled={isRunning || batchRunning}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-lg text-xs font-medium transition-colors"
            >
              전체 일괄 수집 ({source === 'pexels' ? PEXELS_RECOMMENDED_QUERIES.length : RECOMMENDED_QUERIES.length}개 x {maxPages}p)
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(source === 'pexels' ? [...PEXELS_RECOMMENDED_QUERIES] : [...RECOMMENDED_QUERIES]).map((query) => (
              <button
                key={query}
                onClick={() => !isRunning && !batchRunning && startCollection([query])}
                disabled={isRunning || batchRunning}
                className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 rounded-lg text-xs transition-colors"
              >
                {query}
              </button>
            ))}
          </div>
        </div>

        {/* 이미지 마이그레이션 섹션 */}
        <div className="p-5 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">이미지 마이그레이션</h2>
              <p className="text-xs text-gray-500 mt-1">
                sample-data의 로컬 이미지를 bkend.ai 클라우드 DB로 업로드합니다.
                중복 이미지는 자동으로 스킵됩니다.
              </p>
            </div>
            <button
              onClick={handleMigration}
              disabled={migrationRunning || isRunning || batchRunning}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-bold transition-all whitespace-nowrap"
            >
              {migrationRunning ? '마이그레이션 중...' : '마이그레이션 시작'}
            </button>
          </div>

          {/* 마이그레이션 진행률 바 */}
          {(migrationRunning || migrationResult) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {migrationRunning
                    ? `처리 중... ${migrationCurrent} / ${migrationTotal}`
                    : '완료'}
                </span>
                <span>{migrationProgress}%</span>
              </div>
              <div className="h-2.5 bg-orange-50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-200"
                  style={{ width: `${migrationProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* 마이그레이션 결과 */}
          {migrationResult && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {/* 업로드 */}
                <div className="p-3 bg-gray-50/60 rounded-lg text-center">
                  <p className="text-2xl font-bold text-emerald-400">{migrationResult.migrated}</p>
                  <p className="text-xs text-gray-400">업로드 완료</p>
                </div>
                {/* 스킵 */}
                <div className="p-3 bg-gray-50/60 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-400">{migrationResult.skipped}</p>
                  <p className="text-xs text-gray-400">중복 스킵</p>
                </div>
                {/* 실패 */}
                <div className="p-3 bg-gray-50/60 rounded-lg text-center">
                  <p className={`text-2xl font-bold ${migrationResult.failed > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {migrationResult.failed}
                  </p>
                  <p className="text-xs text-gray-400">실패</p>
                </div>
              </div>

              {/* 에러 목록 (실패 건 있을 때만 표시) */}
              {migrationResult.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {migrationResult.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg">
                      {err}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 진행률 + 컨트롤 */}
        {jobs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">수집 진행률</h2>
              <div className="flex items-center gap-3">
                {isRunning && (
                  <button
                    onClick={togglePause}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isPaused
                        ? 'bg-emerald-600 hover:bg-emerald-500'
                        : 'bg-amber-600 hover:bg-amber-500'
                    }`}
                  >
                    {isPaused ? '재개' : '일시정지'}
                  </button>
                )}
                <span className="text-sm text-gray-500">
                  저장: {totalSaved} | 중복: {totalSkipped} | 진행: {progress}%
                </span>
              </div>
            </div>

            {/* 프로그레스 바 */}
            <div className="h-3 bg-orange-50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* 작업 목록 */}
            <div className="max-h-80 overflow-y-auto space-y-1">
              {jobs.map((job, i) => (
                <div
                  key={`${job.query}-${job.page}-${job.source}-${i}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                    job.status === 'running' ? 'bg-orange-500/10 border border-orange-500/20' :
                    job.status === 'done' ? 'bg-emerald-500/5' :
                    job.status === 'error' ? 'bg-red-500/10' :
                    'bg-gray-50/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={
                      job.status === 'running' ? 'text-orange-400' :
                      job.status === 'done' ? 'text-emerald-400' :
                      job.status === 'error' ? 'text-red-400' :
                      'text-gray-400'
                    }>
                      {job.status === 'running' ? '~' :
                       job.status === 'done' ? 'v' :
                       job.status === 'error' ? 'x' : '.'}
                    </span>
                    {/* 소스 뱃지 */}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      job.source === 'unsplash' ? 'bg-orange-50 text-gray-500' :
                      'bg-orange-900/30 text-orange-400'
                    }`}>
                      {job.source === 'unsplash' ? 'U' : 'P'}
                    </span>
                    <span className="text-gray-600">{job.query}</span>
                    <span className="text-gray-300">p{job.page}</span>
                  </div>
                  <div className="text-gray-400">
                    {job.status === 'done' && `+${job.saved} / ~${job.skipped}`}
                    {job.status === 'error' && <span className="text-red-400">{job.error}</span>}
                    {job.status === 'running' && <span className="animate-pulse text-orange-400">수집 중...</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
