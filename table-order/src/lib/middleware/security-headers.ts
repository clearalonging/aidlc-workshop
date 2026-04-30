import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * HTTP 보안 헤더 미들웨어
 * SECURITY-04: 웹 애플리케이션 HTTP 보안 헤더
 */
export function applySecurityHeaders(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Content-Security-Policy
  // 개발 환경: Next.js HMR, 인라인 스크립트 허용
  // 프로덕션: 엄격한 CSP
  const scriptSrc = isDevelopment
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self'";
  const connectSrc = isDevelopment
    ? "connect-src 'self' ws: wss:"
    : "connect-src 'self'";

  response.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; ${scriptSrc}; ${connectSrc}`,
  );

  // Strict-Transport-Security (HSTS)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains',
  );

  // X-Content-Type-Options
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options
  response.headers.set('X-Frame-Options', 'DENY');

  // Referrer-Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );

  return response;
}
