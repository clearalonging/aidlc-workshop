import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/middleware/auth-middleware';
import { handleApiError } from '@/lib/middleware/error-handler';
import { validateBody } from '@/lib/middleware/validate-body';
import { menuOrderSchema } from '@/lib/validators/common-schemas';
import { MenuService } from '@/lib/services/menu-service';
import { z } from 'zod';

const bulkOrderSchema = z.object({
  items: menuOrderSchema,
});

/**
 * PATCH /api/admin/menu/order — 메뉴 노출 순서 일괄 변경 (AS-14)
 */
export async function PATCH(request: NextRequest) {
  try {
    const payload = authenticateAdmin(request);
    const validation = await validateBody(request, bulkOrderSchema);
    if (!validation.success) {
      return validation.response;
    }

    await MenuService.updateMenuOrder(payload.storeId, validation.data.items);

    return NextResponse.json(
      { success: true, message: '메뉴 순서가 변경되었습니다.' },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
