import { NextRequest, NextResponse } from 'next/server';
import {
  getAllTablesWithCurrentOrders,
  setupTable,
} from '@/lib/services/table-service';
import { authenticateAdmin } from '@/lib/middleware/auth-middleware';
import { validateBody } from '@/lib/middleware/validate-body';
import { handleApiError } from '@/lib/middleware/error-handler';
import { setupTableSchema } from '@/lib/validators/common-schemas';

/**
 * GET /api/admin/tables
 * 전체 테이블 + 현재 주문 조회 (관리자 전용)
 * AS-03: 실시간 주문 목록 확인 (초기 데이터 로드)
 * SECURITY-08: 관리자 인증 필요
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = authenticateAdmin(request);

    const tables = await getAllTablesWithCurrentOrders(payload.storeId);

    return NextResponse.json(
      { success: true, data: tables },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/tables
 * 테이블 초기 설정 (관리자 전용)
 * AS-07: 테이블 초기 설정
 * SECURITY-08: 관리자 인증 필요
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = authenticateAdmin(request);

    // 입력 검증 (SECURITY-05)
    const validation = await validateBody(request, setupTableSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { tableNumber, password } = validation.data;
    const table = await setupTable(payload.storeId, tableNumber, password);

    return NextResponse.json(
      {
        success: true,
        data: table,
        message: `테이블 ${tableNumber}번이 설정되었습니다.`,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
