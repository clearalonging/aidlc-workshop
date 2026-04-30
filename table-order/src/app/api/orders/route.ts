import { NextRequest, NextResponse } from 'next/server';
import { authenticateTable } from '@/lib/middleware/auth-middleware';
import { validateBody } from '@/lib/middleware/validate-body';
import { handleApiError } from '@/lib/middleware/error-handler';
import { createOrderSchema } from '@/lib/validators/common-schemas';
import { createOrder, getOrdersBySession } from '@/lib/services/order-service';

/**
 * POST /api/orders
 * 주문 생성 API
 * CS-09: 주문 확정
 * CS-10: 주문 성공 후 처리
 * CS-11: 주문 실패 처리
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = authenticateTable(request);

    // 입력 검증
    const validation = await validateBody(request, createOrderSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { items } = validation.data;

    // 주문 생성
    const order = await createOrder(user.sub, user.storeId, items);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt.toISOString(),
          items: order.orderItems,
        },
        message: '주문이 완료되었습니다.',
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/orders
 * 현재 세션 주문 내역 조회 API
 * CS-12: 현재 세션 주문 내역 조회
 * CS-13: 주문 상태 확인
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = authenticateTable(request);

    const orders = await getOrdersBySession(user.sub);

    return NextResponse.json({
      success: true,
      data: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt.toISOString(),
        items: order.orderItems,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
