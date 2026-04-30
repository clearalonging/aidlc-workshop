import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applySecurityHeaders } from '@/lib/middleware/security-headers';
import { applyRequestLogging } from '@/lib/middleware/request-logger';
import { applyLoginRateLimit, applyApiRateLimit } from '@/lib/middleware/rate-limiter';

/**
 * Next.js 미들웨어 진입점
 * SECURITY-04: HTTP 보안 헤더
 * SECURITY-11: Rate Limiting
 * SECURITY-03: 요청 로깅
 */

// 로그인 엔드포인트 경로
const LOGIN_PATHS = [
  '/api/auth/admin/login',
  '/api/auth/table/login',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 기본 응답 생성
  let response = NextResponse.next();

  // 1. 보안 헤더 적용 (SECURITY-04)
  response = applySecurityHeaders(request, response);

  // 2. 요청 로깅 (SECURITY-03)
  const { response: loggedResponse } = applyRequestLogging(request, response);
  response = loggedResponse;

  // 3. Rate Limiting (SECURITY-11)
  if (pathname.startsWith('/api/')) {
    // 로그인 엔드포인트: 더 엄격한 제한
    if (LOGIN_PATHS.some((path) => pathname === path)) {
      const rateLimitResponse = applyLoginRateLimit(request);
      if (rateLimitResponse) return rateLimitResponse;
    } else {
      // 일반 API: 기본 제한
      const rateLimitResponse = applyApiRateLimit(request);
      if (rateLimitResponse) return rateLimitResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    // API 경로와 페이지 경로에 적용 (정적 파일 제외)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
