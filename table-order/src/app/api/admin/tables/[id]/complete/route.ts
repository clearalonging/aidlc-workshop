import { NextRequest, NextResponse } from 'next/server';
import { completeTableSession } from '@/lib/services/table-service';
import { sseManager } from '@/lib/sse/sse-manager';
import { authenticateAdmin } from '@/lib/middleware/auth-middleware';
import { handleApiError } from '@/lib/middleware/error-handler';

/**
 * POST /api/admin/tables/[id]/complete
 * 테이블 이용 완료 처리 (관리자 전용)
 * AS-09: 테이블 이용 완료 처리
 * BR-SSE-02: table-completed 이벤트 발행
 * SECURITY-08: 관리자 인증 필요
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    authenticateAdmin(request);

    const { id } = await params;
    const tableId = parseInt(id, 10);
    if (isNaN(tableId) || tableId <= 0) {
      return NextResponse.json(
        { success: false, message: '올바른 테이블 ID가 아닙니다.' },
        { status: 400 },
      );
    }

    await completeTableSession(tableId);

    // SSE 이벤트 발행 (BR-SSE-02)
    sseManager.broadcast('table-completed', {
      tableId,
      completedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, message: '이용 완료 처리되었습니다.' },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
