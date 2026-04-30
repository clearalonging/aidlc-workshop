import { NextRequest, NextResponse } from 'next/server';
import { sseManager } from '@/lib/sse/sse-manager';
import { authenticateAdmin } from '@/lib/middleware/auth-middleware';
import { handleApiError } from '@/lib/middleware/error-handler';
import { randomUUID } from 'crypto';

/**
 * GET /api/orders/stream
 * 실시간 주문 SSE 스트림 (관리자 전용)
 * AS-03: 실시간 주문 목록 확인
 * AS-06: 신규 주문 시각적 알림
 * BR-SSE-01: SSE 연결 관리
 * SECURITY-08: 관리자 인증 필요
 */
export async function GET(request: NextRequest): Promise<NextResponse | Response> {
  try {
    // 관리자 인증 (SECURITY-08)
    authenticateAdmin(request);

    const clientId = randomUUID();
    const stream = sseManager.createStream(clientId);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Nginx 버퍼링 비활성화
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
