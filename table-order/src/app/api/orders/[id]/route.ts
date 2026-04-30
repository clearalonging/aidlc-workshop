import { NextRequest, NextResponse } from 'next/server';
import { deleteOrder } from '@/lib/services/order-service';
import { authenticateAdmin } from '@/lib/middleware/auth-middleware';
import { handleApiError } from '@/lib/middleware/error-handler';

/**
 * DELETE /api/orders/[id]
 * 주문 삭제 (관리자 전용)
 * AS-08: 주문 삭제
 * SECURITY-08: 관리자 인증 필요
 */
export async function DELETE(
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

    await deleteOrder(orderId);

    return NextResponse.json(
      { success: true, message: '주문이 삭제되었습니다.' },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
