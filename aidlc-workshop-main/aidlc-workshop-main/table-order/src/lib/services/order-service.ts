import { prisma } from '@/lib/prisma';
import { NotFoundError, BadRequestError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { sseManager } from '@/lib/sse/sse-manager';
import type { OrderItemInput } from '@/types';

/**
 * 주문 서비스 (생성/조회)
 * Unit 2: Customer Order
 * CS-09, CS-10, CS-11, CS-12, CS-13 관련
 */

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

/**
 * 주문 번호 생성
 * 형식: ORD-{YYYYMMDD}-{4자리 순번}
 */
async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ORD-${dateStr}-`;

  // 오늘 날짜의 마지막 주문 번호 조회
  const lastOrder = await prisma.order.findFirst({
    where: {
      orderNumber: { startsWith: prefix },
    },
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
  // 활성 세션 확인
  const activeSession = await prisma.tableSession.findFirst({
    where: { tableId, completedAt: null },
  });

  if (activeSession) {
    return activeSession.id;
  }

  // 새 세션 생성
  const newSession = await prisma.tableSession.create({
    data: { tableId },
  });

  logger.info({ tableId, sessionId: newSession.id }, 'New table session created');
  return newSession.id;
}

/**
 * 주문 생성
 * CS-09: 주문 확정
 */
export async function createOrder(
  tableId: number,
  storeId: string,
  items: OrderItemInput[],
): Promise<OrderWithItems> {
  // 1. 메뉴 유효성 검증
  const menuItemIds = items.map((item) => item.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: menuItemIds },
      storeId,
      isAvailable: true,
    },
  });

  if (menuItems.length !== menuItemIds.length) {
    const foundIds = menuItems.map((m) => m.id);
    const invalidIds = menuItemIds.filter((id) => !foundIds.includes(id));
    throw new BadRequestError(
      `유효하지 않은 메뉴가 포함되어 있습니다. (ID: ${invalidIds.join(', ')})`,
    );
  }

  // 2. 세션 확인/생성
  const sessionId = await getOrCreateSession(tableId);

  // 3. 주문 번호 생성
  const orderNumber = await generateOrderNumber();

  // 4. 금액 계산 및 주문 항목 준비
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

  // 5. 트랜잭션으로 주문 저장
  const order = await prisma.order.create({
    data: {
      orderNumber,
      tableId,
      sessionId,
      totalAmount,
      orderItems: {
        create: orderItemsData,
      },
    },
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
    { orderId: order.id, orderNumber, tableId, sessionId, totalAmount },
    'Order created',
  );

  // 6. SSE 브로드캐스트 (관리자 대시보드 실시간 업데이트)
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
 * 현재 세션 주문 내역 조회
 * CS-12: 현재 세션 주문 내역 조회
 * CS-13: 주문 상태 확인
 */
export async function getOrdersBySession(tableId: number): Promise<OrderWithItems[]> {
  // 활성 세션 조회
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
    status: order.status,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    orderItems: order.orderItems,
  }));
}
