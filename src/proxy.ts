import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 인증 필요 경로 목록
const PROTECTED_PATHS = [
  '/collections',
  '/dashboard',
  '/admin',
];

// 인증 완료 시 접근 불필요한 경로 (로그인/회원가입)
const AUTH_PATHS = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 인증 상태를 쿠키로 간접 확인 (UX 가드 용도)
  // ⚠️ 보안 한계: 이 쿠키는 클라이언트에서 설정 가능하므로 우회 가능
  // 실제 보호는 각 페이지의 useAuthStore + bkend 토큰 검증으로 수행
  // 미들웨어는 미인증 사용자를 로그인 페이지로 빠르게 안내하는 UX 가드 역할만 담당
  const authCookie = request.cookies.get('artref-auth-status');
  const isAuthenticated = authCookie?.value === 'true';

  // 보호 경로 접근 시 → 미인증이면 로그인으로 리다이렉트
  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    // 로그인 후 원래 페이지로 돌아가기 위한 redirect 파라미터
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 이미 로그인된 상태에서 로그인/회원가입 접근 시 → 검색 페이지로
  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));

  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL('/search', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // 정적 파일과 API 경로는 proxy에서 제외
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
