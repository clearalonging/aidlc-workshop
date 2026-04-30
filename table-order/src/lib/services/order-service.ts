import { OrderStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sseManager } from '@/lib/sse/sse-manager';
import { NotFoundError, BadRequestError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { OrderItemSummary, OrderSummary } from './table-service';

/**
 * OrderService - 주문 상태 변경 및 삭제 서비스
 * Unit 3 (Admin Monitor) 담당
 * AS-05: 주문 상태 변경
 * AS-08: 주문 삭제
 */

// 상태 전이 규칙: 역방향 전이 불가
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus | null> = {
  [OrderStatus.PENDING]: OrderStatus.PREPARING,
  [OrderStatus.PREPARING]: OrderStatus.COMPLETED,
  [OrderStatus.COMPLETED]: null,
};

// ─── 응답 타입 ────────────────────────────────────────────────────────────────

export interface OrderDetail extends OrderSummary {
  tableId: number;
  sessionId: string;
}

// ─── 서비스 함수 ──────────────────────────────────────────────────────────────

/**
 * 주문 상태를 다음 단계로 변경합니다.
 * 상태 전이: PENDING → PREPARING → COMPLETED (역방향 불가)
 * AS-05: 주문 상태 변경
 */
export async function updateOrderStatus(
  orderId: number,
  newStatus: OrderStatus,
): Promise<OrderDetail> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        select: {
          id: true,
          menuItemName: true,
          unitPrice: true,
          quantity: true,
        },
      },
      table: { select: { tableNumber: true, storeId: true } },
    },
  });

  if (!order) {
    throw new NotFoundError('주문');
  }

  // 상태 전이 유효성 검증
  const allowedNext = STATUS_TRANSITIONS[order.status];
  if (allowedNext !== newStatus) {
    if (order.status === newStatus) {
      throw new BadRequestError(`이미 ${newStatus} 상태입니다.`);
    }
    throw new BadRequestError(
      `${order.status} 상태에서 ${newStatus}(으)로 변경할 수 없습니다.`,
    );
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
    include: {
      orderItems: {
        select: {
          id: true,
          menuItemName: true,
          unitPrice: true,
          quantity: true,
        },
      },
    },
  });

  logger.info(
    { orderId, previousStatus: order.status, newStatus },
    'Order status updated',
  );

  // SSE 이벤트 발행 (BR-SSE-02)
  sseManager.broadcast('order-status-changed', {
    orderId,
    tableId: order.tableId,
    tableNumber: order.table.tableNumber,
    previousStatus: order.status,
    newStatus,
    updatedAt: updated.updatedAt.toISOString(),
  });

  const items: OrderItemSummary[] = updated.orderItems;

  return {
    id: updated.id,
    orderNumber: updated.orderNumber,
    status: updated.status as import('@/types').OrderStatus,
    totalAmount: updated.totalAmount,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    items,
    tableId: order.tableId,
    sessionId: order.sessionId,
  };
}

/**
 * 주문을 삭제합니다.
 * AS-08: 주문 삭제
 */
export async function deleteOrder(orderId: number): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      table: { select: { tableNumber: true } },
    },
  });

  if (!order) {
    throw new NotFoundError('주문');
  }

  // OrderItem은 onDelete: Cascade로 자동 삭제
  await prisma.order.delete({ where: { id: orderId } });

  logger.info({ orderId, tableId: order.tableId }, 'Order deleted');

  // SSE 이벤트 발행 (BR-SSE-02)
  sseManager.broadcast('order-deleted', {
    orderId,
    tableId: order.tableId,
    tableNumber: order.table.tableNumber,
    deletedAt: new Date().toISOString(),
  });
}

/**
 * 세션별 주문 목록을 조회합니다.
 */
export async function getOrdersBySession(
  sessionId: string,
): Promise<OrderDetail[]> {
  const orders = await prisma.order.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    include: {
      orderItems: {
        select: {
          id: true,
          menuItemName: true,
          unitPrice: true,
          quantity: true,
        },
      },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status as import('@/types').OrderStatus,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.orderItems,
    tableId: order.tableId,
    sessionId: order.sessionId,
  }));
}
