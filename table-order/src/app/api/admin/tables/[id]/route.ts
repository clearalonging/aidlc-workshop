import { NextRequest, NextResponse } from 'next/server';
import { getTableWithCurrentOrders } from '@/lib/services/table-service';
import { authenticateAdmin } from '@/lib/middleware/auth-middleware';
import { handleApiError } from '@/lib/middleware/error-handler';

/**
 * GET /api/admin/tables/[id]
 * 특정 테이블 상세 조회 (관리자 전용)
 * AS-04: 주문 상세 보기
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

    const table = await getTableWithCurrentOrders(tableId);

    return NextResponse.json(
      { success: true, data: table },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
