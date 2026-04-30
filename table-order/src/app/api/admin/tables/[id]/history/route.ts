import { NextRequest, NextResponse } from 'next/server';
import { getTableHistory } from '@/lib/services/table-service';
import { authenticateAdmin } from '@/lib/middleware/auth-middleware';
import { validateQuery } from '@/lib/middleware/validate-body';
import { handleApiError } from '@/lib/middleware/error-handler';
import { tableHistoryQuerySchema } from '@/lib/validators/admin-schemas';

/**
 * GET /api/admin/tables/[id]/history
 * 테이블 과거 주문 내역 조회 (관리자 전용)
 * AS-10: 과거 주문 내역 조회
 * SECURITY-08: 관리자 인증 필요
 */
export async function GET(
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

    // 쿼리 파라미터 검증 (SECURITY-05)
    const queryValidation = validateQuery(
      request.nextUrl.searchParams,
      tableHistoryQuerySchema,
    );
    if (!queryValidation.success) {
      return queryValidation.response;
    }

    const { dateFrom, dateTo } = queryValidation.data;
    const history = await getTableHistory(
      tableId,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );

    return NextResponse.json(
      { success: true, data: history },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
