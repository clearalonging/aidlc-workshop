import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/services/order-service';
import { authenticateAdmin } from '@/lib/middleware/auth-middleware';
import { validateBody } from '@/lib/middleware/validate-body';
import { handleApiError } from '@/lib/middleware/error-handler';
import { updateOrderStatusSchema } from '@/lib/validators/common-schemas';
import { OrderStatus } from '@prisma/client';

/**
 * PATCH /api/orders/[id]/status
 * 주문 상태 변경 (관리자 전용)
 * AS-05: 주문 상태 변경
 * SECURITY-08: 관리자 인증 필요
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    // 관리자 인증 (SECURITY-08)
    authenticateAdmin(request);

    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId) || orderId <= 0) {
      return NextResponse.json(
        { success: false, message: '올바른 주문 ID가 아닙니다.' },
        { status: 400 },
      );
    }

    // 입력 검증 (SECURITY-05)
    const validation = await validateBody(request, updateOrderStatusSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { status } = validation.data;
    const updated = await updateOrderStatus(orderId, status as OrderStatus);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: updated.id,
          orderNumber: updated.orderNumber,
          status: updated.status,
          updatedAt: updated.updatedAt,
        },
        message: '주문 상태가 변경되었습니다.',
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
