import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/middleware/auth-middleware';
import { handleApiError } from '@/lib/middleware/error-handler';
import { validateBody } from '@/lib/middleware/validate-body';
import { menuSwapOrderSchema } from '@/lib/validators/common-schemas';
import { MenuService } from '@/lib/services/menu-service';

interface RouteParams {
  params: { id: string };
}

/**
 * PATCH /api/admin/menu/[id]/order — 메뉴 순서 위/아래 이동 (AS-14)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const payload = authenticateAdmin(request);
    const menuId = Number(params.id);
    const validation = await validateBody(request, menuSwapOrderSchema);
    if (!validation.success) {
      return validation.response;
    }

    await MenuService.swapMenuOrder(payload.storeId, menuId, validation.data.direction);

    return NextResponse.json(
      { success: true, message: '메뉴 순서가 변경되었습니다.' },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
