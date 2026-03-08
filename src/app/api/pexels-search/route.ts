// ============================================
// Pexels 프록시 검색 API
// 브라우저에서 직접 Pexels API를 호출할 수 없으므로
// Next.js 서버를 프록시로 사용하여 CORS 우회
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { searchPexelsPhotos } from '@/lib/pexels-client';

/**
 * GET /api/pexels-search?query=...&page=1&perPage=15
 * 클라이언트에서 Pexels 이미지를 검색할 때 사용
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('query') || 'person portrait';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '15', 10);

    const result = await searchPexelsPhotos(query, page, Math.min(perPage, 80));

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '검색 실패';
    return NextResponse.json({ error: message, photos: [], total_results: 0 }, { status: 500 });
  }
}
