import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { env } from '@/lib/env';

/**
 * 인메모리 Rate Limiter
 * SECURITY-11: 공개 엔드포인트 Rate Limiting
 * 단일 서버 환경에 적합한 인메모리 구현
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// 인메모리 저장소 (단일 서버 환경)
const rateLimitStore = new Map<string, RateLimitEntry>();

// 만료된 엔트리 정리 (메모리 누수 방지)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // 1분마다 정리

/**
 * Rate Limit 확인
 */
function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetAt < now) {
    // 새 윈도우 시작
    const resetAt = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * 로그인 엔드포인트 Rate Limiter (분당 10회)
 */
export function applyLoginRateLimit(
  request: NextRequest,
): NextResponse | null {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const identifier = `login:${ip}`;
  const windowMs = 60 * 1000; // 1분
  const result = checkRateLimit(identifier, env.RATE_LIMIT_LOGIN, windowMs);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      {
        success: false,
        message: `요청 횟수를 초과했습니다. ${retryAfter}초 후 다시 시도해 주세요.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(env.RATE_LIMIT_LOGIN),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        },
      },
    );
  }

  return null;
}

/**
 * 일반 API Rate Limiter (분당 100회)
 */
export function applyApiRateLimit(request: NextRequest): NextResponse | null {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const identifier = `api:${ip}`;
  const windowMs = 60 * 1000; // 1분
  const result = checkRateLimit(identifier, env.RATE_LIMIT_API, windowMs);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      {
        success: false,
        message: '요청 횟수를 초과했습니다.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(env.RATE_LIMIT_API),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  return null;
}
