/**
 * OrderService 단위 테스트
 * AS-05: 주문 상태 변경
 * AS-08: 주문 삭제
 */

import {
  updateOrderStatus,
  deleteOrder,
  getOrdersBySession,
} from '../order-service';
import { prisma } from '@/lib/prisma';
import { sseManager } from '@/lib/sse/sse-manager';
import { NotFoundError, BadRequestError } from '@/lib/errors';
import { OrderStatus } from '@prisma/client';

// Prisma 모킹
jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// SSEManager 모킹
jest.mock('@/lib/sse/sse-manager', () => ({
  sseManager: {
    broadcast: jest.fn(),
  },
}));

// logger 모킹
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockSseManager = sseManager as jest.Mocked<typeof sseManager>;

// 공통 픽스처
const mockOrderItem = {
  id: 1,
  menuItemName: '아메리카노',
  unitPrice: 4500,
  quantity: 2,
};

const mockOrder = {
  id: 1,
  orderNumber: 'ORD-20260430-0001',
  status: OrderStatus.PENDING,
  totalAmount: 9000,
  tableId: 1,
  sessionId: 'session-uuid-1',
  createdAt: new Date('2026-04-30T10:00:00Z'),
  updatedAt: new Date('2026-04-30T10:00:00Z'),
  orderItems: [mockOrderItem],
  table: { tableNumber: 1, storeId: 'store-001' },
};

// ─── updateOrderStatus ────────────────────────────────────────────────────────

describe('updateOrderStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  it('PENDING → PREPARING 상태 변경에 성공한다', async () => {
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
    (mockPrisma.order.update as jest.Mock).mockResolvedValue({
      ...mockOrder,
      status: OrderStatus.PREPARING,
      updatedAt: new Date(),
    });

    const result = await updateOrderStatus(1, OrderStatus.PREPARING);

    expect(result.status).toBe(OrderStatus.PREPARING);
    expect(mockSseManager.broadcast).toHaveBeenCalledWith(
      'order-status-changed',
      expect.objectContaining({
        orderId: 1,
        previousStatus: OrderStatus.PENDING,
        newStatus: OrderStatus.PREPARING,
      }),
    );
  });

  it('PREPARING → COMPLETED 상태 변경에 성공한다', async () => {
    const preparingOrder = { ...mockOrder, status: OrderStatus.PREPARING };
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(preparingOrder);
    (mockPrisma.order.update as jest.Mock).mockResolvedValue({
      ...preparingOrder,
      status: OrderStatus.COMPLETED,
      updatedAt: new Date(),
    });

    const result = await updateOrderStatus(1, OrderStatus.COMPLETED);

    expect(result.status).toBe(OrderStatus.COMPLETED);
  });

  it('COMPLETED 상태에서 변경 시도 시 BadRequestError를 던진다', async () => {
    const completedOrder = { ...mockOrder, status: OrderStatus.COMPLETED };
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(completedOrder);

    await expect(
      updateOrderStatus(1, OrderStatus.PENDING),
    ).rejects.toThrow(BadRequestError);
  });

  it('역방향 전이(PREPARING → PENDING) 시 BadRequestError를 던진다', async () => {
    const preparingOrder = { ...mockOrder, status: OrderStatus.PREPARING };
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(preparingOrder);

    await expect(
      updateOrderStatus(1, OrderStatus.PENDING),
    ).rejects.toThrow(BadRequestError);
  });

  it('동일 상태로 변경 시도 시 BadRequestError를 던진다', async () => {
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

    await expect(
      updateOrderStatus(1, OrderStatus.PENDING),
    ).rejects.toThrow(BadRequestError);
  });

  it('존재하지 않는 주문이면 NotFoundError를 던진다', async () => {
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(updateOrderStatus(999, OrderStatus.PREPARING)).rejects.toThrow(
      NotFoundError,
    );
  });
});

// ─── deleteOrder ──────────────────────────────────────────────────────────────

describe('deleteOrder', () => {
  beforeEach(() => jest.clearAllMocks());

  it('주문을 삭제하고 SSE 이벤트를 발행한다', async () => {
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
    (mockPrisma.order.delete as jest.Mock).mockResolvedValue(mockOrder);

    await deleteOrder(1);

    expect(mockPrisma.order.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(mockSseManager.broadcast).toHaveBeenCalledWith(
      'order-deleted',
      expect.objectContaining({
        orderId: 1,
        tableId: 1,
      }),
    );
  });

  it('존재하지 않는 주문이면 NotFoundError를 던진다', async () => {
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(deleteOrder(999)).rejects.toThrow(NotFoundError);
  });
});

// ─── getOrdersBySession ───────────────────────────────────────────────────────

describe('getOrdersBySession', () => {
  beforeEach(() => jest.clearAllMocks());

  it('세션별 주문 목록을 반환한다', async () => {
    (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([mockOrder]);

    const result = await getOrdersBySession('session-uuid-1');

    expect(result).toHaveLength(1);
    expect(result[0].sessionId).toBe('session-uuid-1');
    expect(result[0].items).toHaveLength(1);
  });

  it('주문이 없으면 빈 배열을 반환한다', async () => {
    (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getOrdersBySession('empty-session');

    expect(result).toHaveLength(0);
  });
});
