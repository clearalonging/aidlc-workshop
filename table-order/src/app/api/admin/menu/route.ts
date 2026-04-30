import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/middleware/auth-middleware';
import { handleApiError } from '@/lib/middleware/error-handler';
import { validateBody } from '@/lib/middleware/validate-body';
import { menuItemSchema } from '@/lib/validators/common-schemas';
import { MenuService } from '@/lib/services/menu-service';

/**
 * GET /api/admin/menu — 카테고리별 메뉴 목록 조회 (AS-15)
 * SECURITY-08: 관리자 인증 필수, storeId 기반 필터링
 */
export async function GET(request: NextRequest) {
  try {
    const payload = authenticateAdmin(request);
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    const categories = await MenuService.getMenusByCategory(
      payload.storeId,
      categoryId ? Number(categoryId) : undefined,
    );

    return NextResponse.json({ success: true, data: categories }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/menu — 메뉴 등록 (AS-11)
 * SECURITY-05: Zod 입력 검증
 * SECURITY-08: 관리자 인증 필수
 */
export async function POST(request: NextRequest) {
  try {
    const payload = authenticateAdmin(request);
    const validation = await validateBody(request, menuItemSchema);
    if (!validation.success) {
      return validation.response;
    }

    const menu = await MenuService.createMenu(payload.storeId, validation.data);

    return NextResponse.json({ success: true, data: menu }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
