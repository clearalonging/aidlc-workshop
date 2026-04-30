import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { NotFoundError, ConflictError, BadRequestError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { OrderStatus } from '@/types';

/**
 * TableService - 테이블 및 세션 관리 서비스
 * Unit 3 (Admin Monitor) 담당
 * AS-07: 테이블 초기 설정
 * AS-09: 테이블 이용 완료 처리
 * AS-10: 과거 주문 내역 조회
 */

// ─── 응답 타입 ────────────────────────────────────────────────────────────────

export interface OrderItemSummary {
  id: number;
  menuItemName: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemSummary[];
}

export interface TableWithOrders {
  id: number;
  tableNumber: number;
  storeId: string;
  currentSessionId: string | null;
  currentOrders: OrderSummary[];
  totalAmount: number;
}

export interface TableHistorySession {
  sessionId: string;
  startedAt: Date;
  completedAt: Date;
  orders: OrderSummary[];
  totalAmount: number;
}

// ─── 서비스 함수 ──────────────────────────────────────────────────────────────

/**
 * 전체 테이블 목록과 현재 세션 주문을 조회합니다. (대시보드용)
 * AS-03: 실시간 주문 목록 확인
 */
export async function getAllTablesWithCurrentOrders(
  storeId: string,
): Promise<TableWithOrders[]> {
  const tables = await prisma.table.findMany({
    where: { storeId },
    orderBy: { tableNumber: 'asc' },
    include: {
      sessions: {
        where: { completedAt: null },
        take: 1,
        include: {
          orders: {
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
          },
        },
      },
    },
  });

  return tables.map((table) => {
    const activeSession = table.sessions[0] ?? null;
    const currentOrders: OrderSummary[] = activeSession
      ? activeSession.orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status as OrderStatus,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          items: order.orderItems,
        }))
      : [];

    const totalAmount = currentOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );

    return {
      id: table.id,
      tableNumber: table.tableNumber,
      storeId: table.storeId,
      currentSessionId: activeSession?.id ?? null,
      currentOrders,
      totalAmount,
    };
  });
}

/**
 * 특정 테이블의 상세 정보와 현재 세션 주문을 조회합니다.
 * AS-04: 주문 상세 보기
 */
export async function getTableWithCurrentOrders(
  tableId: number,
): Promise<TableWithOrders> {
  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: {
      sessions: {
        where: { completedAt: null },
        take: 1,
        include: {
          orders: {
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
          },
        },
      },
    },
  });

  if (!table) {
    throw new NotFoundError('테이블');
  }

  const activeSession = table.sessions[0] ?? null;
  const currentOrders: OrderSummary[] = activeSession
    ? activeSession.orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status as OrderStatus,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.orderItems,
      }))
    : [];

  const totalAmount = currentOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0,
  );

  return {
    id: table.id,
    tableNumber: table.tableNumber,
    storeId: table.storeId,
    currentSessionId: activeSession?.id ?? null,
    currentOrders,
    totalAmount,
  };
}

/**
 * 테이블을 초기 설정합니다. (신규 등록 또는 비밀번호 재설정)
 * AS-07: 테이블 초기 설정
 */
export async function setupTable(
  storeId: string,
  tableNumber: number,
  password: string,
): Promise<{ id: number; tableNumber: number }> {
  // 매장 존재 확인
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    throw new NotFoundError('매장');
  }

  const passwordHash = await hashPassword(password);

  // upsert: 이미 존재하면 비밀번호 업데이트, 없으면 신규 생성
  const table = await prisma.table.upsert({
    where: { storeId_tableNumber: { storeId, tableNumber } },
    update: { passwordHash, updatedAt: new Date() },
    create: { storeId, tableNumber, passwordHash },
    select: { id: true, tableNumber: true },
  });

  logger.info({ storeId, tableNumber, tableId: table.id }, 'Table setup completed');

  return table;
}

/**
 * 테이블 이용 완료 처리를 수행합니다.
 * 활성 세션을 종료하고 새 고객을 위한 상태로 리셋합니다.
 * AS-09: 테이블 이용 완료 처리
 * REL-01: 트랜잭션 일관성
 */
export async function completeTableSession(tableId: number): Promise<void> {
  // 테이블 존재 확인
  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: {
      sessions: {
        where: { completedAt: null },
        take: 1,
      },
    },
  });

  if (!table) {
    throw new NotFoundError('테이블');
  }

  const activeSession = table.sessions[0];
  if (!activeSession) {
    throw new BadRequestError('현재 활성 세션이 없습니다.');
  }

  // 트랜잭션으로 세션 종료 (REL-01)
  await prisma.$transaction(async (tx) => {
    await tx.tableSession.update({
      where: { id: activeSession.id },
      data: { completedAt: new Date() },
    });
  });

  logger.info(
    { tableId, sessionId: activeSession.id },
    'Table session completed',
  );
}

/**
 * 테이블의 과거 주문 내역을 조회합니다. (완료된 세션만)
 * AS-10: 과거 주문 내역 조회
 */
export async function getTableHistory(
  tableId: number,
  dateFrom?: Date,
  dateTo?: Date,
): Promise<TableHistorySession[]> {
  // 테이블 존재 확인
  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table) {
    throw new NotFoundError('테이블');
  }

  const sessions = await prisma.tableSession.findMany({
    where: {
      tableId,
      completedAt: {
        not: null,
        ...(dateFrom && { gte: dateFrom }),
        ...(dateTo && { lte: dateTo }),
      },
    },
    orderBy: { completedAt: 'desc' },
    include: {
      orders: {
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
      },
    },
  });

  return sessions.map((session) => {
    const orders: OrderSummary[] = session.orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status as OrderStatus,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.orderItems,
    }));

    const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      sessionId: session.id,
      startedAt: session.startedAt,
      completedAt: session.completedAt!,
      orders,
      totalAmount,
    };
  });
}
