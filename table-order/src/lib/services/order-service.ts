import { prisma } from '@/lib/prisma';
import { sseManager } from '@/lib/sse/sse-manager';
import { NotFoundError, BadRequestError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { OrderItemInput, OrderStatus } from '@/types';
import type { OrderItemSummary, OrderSummary } from './table-service';

// ─── 상태 전이 규칙 ───────────────────────────────────────────────────────────

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus | null> = {
  PENDING: 'PREPARING',
  PREPARING: 'COMPLETED',
  COMPLETED: null,
};

// ─── 고객용 타입 (Unit 2: Customer Order) ────────────────────────────────────

export interface OrderWithItems {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
  orderItems: {
    id: number;
    menuItemName: string;
    unitPrice: number;
    quantity: number;
  }[];
}

// ─── 관리자용 타입 (Unit 3: Admin Monitor) ───────────────────────────────────

export interface OrderDetail extends OrderSummary {
  tableId: number;
  sessionId: string;
}

// ─── 내부 헬퍼 함수 ───────────────────────────────────────────────────────────

/**
 * 주문 번호 생성
 * 형식: ORD-{YYYYMMDD}-{4자리 순번}
 */
async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ORD-${dateStr}-`;

  const lastOrder = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: 'desc' },
    select: { orderNumber: true },
  });

  let sequence = 1;
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.orderNumber.slice(-4), 10);
    sequence = lastSeq + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`;
}

/**
 * 활성 세션 조회 또는 새 세션 생성
 * BR-SESSION-01: 첫 주문 시 세션 자동 시작
 */
async function getOrCreateSession(tableId: number): Promise<string> {
  const activeSession = await prisma.tableSession.findFirst({
    where: { tableId, completedAt: null },
  });

  if (activeSession) {
    return activeSession.id;
  }

  const newSession = await prisma.tableSession.create({
    data: { tableId },
  });

  logger.info({ tableId, sessionId: newSession.id }, 'New table session created');
  return newSession.id;
}

// ─── 고객용 함수 (Unit 2: Customer Order) ────────────────────────────────────

/**
 * 주문 생성 (CS-09)
 */
export async function createOrder(
  tableId: number,
  storeId: string,
  items: OrderItemInput[],
): Promise<OrderWithItems> {
  const menuItemIds = items.map((item) => item.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds }, storeId, isAvailable: true },
  });

  if (menuItems.length !== menuItemIds.length) {
    const foundIds = menuItems.map((m) => m.id);
    const invalidIds = menuItemIds.filter((id) => !foundIds.includes(id));
    throw new BadRequestError(
      `유효하지 않은 메뉴가 포함되어 있습니다. (ID: ${invalidIds.join(', ')})`,
    );
  }

  const sessionId = await getOrCreateSession(tableId);
  const orderNumber = await generateOrderNumber();

  const menuMap = new Map(menuItems.map((m) => [m.id, m]));
  let totalAmount = 0;
  const orderItemsData = items.map((item) => {
    const menu = menuMap.get(item.menuItemId)!;
    const subtotal = menu.price * item.quantity;
    totalAmount += subtotal;
    return {
      menuItemId: menu.id,
      menuItemName: menu.name,
      unitPrice: menu.price,
      quantity: item.quantity,
    };
  });

  const order = await prisma.order.create({
    data: {
      orderNumber,
      tableId,
      sessionId,
      totalAmount,
      orderItems: { create: orderItemsData },
    },
    include: {
      orderItems: {
        select: { id: true, menuItemName: true, unitPrice: true, quantity: true },
      },
    },
  });

  logger.info(
    { orderId: order.id, orderNumber, tableId, sessionId, totalAmount },
    'Order created',
  );

  const table = await prisma.table.findUnique({
    where: { id: tableId },
    select: { tableNumber: true },
  });

  sseManager.broadcast('new-order', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    tableId,
    tableNumber: table?.tableNumber,
    totalAmount: order.totalAmount,
    items: order.orderItems,
    createdAt: order.createdAt.toISOString(),
  });

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    orderItems: order.orderItems,
  };
}

/**
 * 현재 세션 주문 내역 조회 (CS-12, CS-13)
 */
export async function getCustomerOrdersBySession(tableId: number): Promise<OrderWithItems[]> {
  const activeSession = await prisma.tableSession.findFirst({
    where: { tableId, completedAt: null },
  });

  if (!activeSession) {
    return [];
  }

  const orders = await prisma.order.findMany({
    where: { sessionId: activeSession.id },
    orderBy: { createdAt: 'asc' },
    include: {
      orderItems: {
        select: { id: true, menuItemName: true, unitPrice: true, quantity: true },
      },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    orderItems: order.orderItems,
  }));
}

// ─── 관리자용 함수 (Unit 3: Admin Monitor) ───────────────────────────────────

/**
 * 주문 상태를 다음 단계로 변경합니다. (AS-05)
 * 상태 전이: PENDING → PREPARING → COMPLETED (역방향 불가)
 */
export async function updateOrderStatus(
  orderId: number,
  newStatus: OrderStatus,
): Promise<OrderDetail> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        select: { id: true, menuItemName: true, unitPrice: true, quantity: true },
      },
      table: { select: { tableNumber: true, storeId: true } },
    },
  });

  if (!order) {
    throw new NotFoundError('주문');
  }

  const allowedNext = STATUS_TRANSITIONS[order.status as OrderStatus];
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
        select: { id: true, menuItemName: true, unitPrice: true, quantity: true },
      },
    },
  });

  logger.info(
    { orderId, previousStatus: order.status, newStatus },
    'Order status updated',
  );

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
    status: updated.status as OrderStatus,
    totalAmount: updated.totalAmount,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    items,
    tableId: order.tableId,
    sessionId: order.sessionId,
  };
}

/**
 * 주문 삭제 (AS-08)
 */
export async function deleteOrder(orderId: number): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { table: { select: { tableNumber: true } } },
  });

  if (!order) {
    throw new NotFoundError('주문');
  }

  await prisma.order.delete({ where: { id: orderId } });

  logger.info({ orderId, tableId: order.tableId }, 'Order deleted');

  sseManager.broadcast('order-deleted', {
    orderId,
    tableId: order.tableId,
    tableNumber: order.table.tableNumber,
    deletedAt: new Date().toISOString(),
  });
}

/**
 * 세션별 주문 목록 조회 (관리자용)
 */
export async function getOrdersBySession(sessionId: string): Promise<OrderDetail[]> {
  const orders = await prisma.order.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    include: {
      orderItems: {
        select: { id: true, menuItemName: true, unitPrice: true, quantity: true },
      },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status as OrderStatus,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.orderItems,
    tableId: order.tableId,
    sessionId: order.sessionId,
  }));
}
