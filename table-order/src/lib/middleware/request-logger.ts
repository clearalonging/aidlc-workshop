import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * 요청 로깅 미들웨어
 * SECURITY-03: 애플리케이션 레벨 로깅
 */
export function applyRequestLogging(
  request: NextRequest,
  response: NextResponse,
): { response: NextResponse; requestId: string } {
  const requestId =
    (request.headers.get('x-request-id') as string) || randomUUID();

  // 응답 헤더에 requestId 추가
  response.headers.set('x-request-id', requestId);

  // 요청 로깅 (민감 정보 제외)
  logger.info(
    {
      requestId,
      method: request.method,
      url: request.nextUrl.pathname,
      userAgent: request.headers.get('user-agent'),
    },
    'Incoming request',
  );

  return { response, requestId };
}
