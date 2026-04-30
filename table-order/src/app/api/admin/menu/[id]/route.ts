import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/middleware/auth-middleware';
import { handleApiError } from '@/lib/middleware/error-handler';
import { validateBody } from '@/lib/middleware/validate-body';
import { updateMenuItemSchema } from '@/lib/validators/common-schemas';
import { MenuService } from '@/lib/services/menu-service';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/admin/menu/[id] — 메뉴 상세 조회 (AS-15)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const payload = authenticateAdmin(request);
    const menuId = Number(params.id);

    const menu = await MenuService.getMenuById(menuId, payload.storeId);

    return NextResponse.json({ success: true, data: menu }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/admin/menu/[id] — 메뉴 수정 (AS-12)
 * SECURITY-05: Zod partial 입력 검증
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const payload = authenticateAdmin(request);
    const menuId = Number(params.id);
    const validation = await validateBody(request, updateMenuItemSchema);
    if (!validation.success) {
      return validation.response;
    }

    const menu = await MenuService.updateMenu(menuId, payload.storeId, validation.data);

    return NextResponse.json({ success: true, data: menu }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/menu/[id] — 메뉴 삭제 (AS-13)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const payload = authenticateAdmin(request);
    const menuId = Number(params.id);

    await MenuService.deleteMenu(menuId, payload.storeId);

    return NextResponse.json(
      { success: true, message: '메뉴가 삭제되었습니다.' },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
