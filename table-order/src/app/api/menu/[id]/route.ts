import { NextRequest, NextResponse } from 'next/server';
import { authenticateTable } from '@/lib/middleware/auth-middleware';
import { handleApiError } from '@/lib/middleware/error-handler';
import { getMenuById } from '@/lib/services/menu-service';

/**
 * GET /api/menu/:id
 * 메뉴 상세 조회 API
 * CS-03: 메뉴 상세 정보 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    authenticateTable(request);

    const menuId = parseInt(params.id, 10);
    if (isNaN(menuId) || menuId <= 0) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 메뉴 ID입니다.' },
        { status: 400 },
      );
    }

    const menuItem = await getMenuById(menuId);

    return NextResponse.json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
