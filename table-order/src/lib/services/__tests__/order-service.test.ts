import {
  createOrder,
  getCustomerOrdersBySession,
  updateOrderStatus,
  deleteOrder,
  getOrdersBySession,
} from '../order-service';
import { NotFoundError, BadRequestError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { sseManager } from '@/lib/sse/sse-manager';
import type { OrderStatus } from '@/types';

// 환경 변수 설정
process.env.NODE_ENV = 'test';

// Prisma 모킹
jest.mock('@/lib/prisma', () => ({
  prisma: {
    menuItem: { findMany: jest.fn() },
    tableSession: { findFirst: jest.fn(), create: jest.fn() },
    order: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    table: { findUnique: jest.fn() },
  },
}));

// SSE Manager 모킹
jest.mock('@/lib/sse/sse-manager', () => ({
  sseManager: { broadcast: jest.fn() },
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
  status: 'PENDING' as OrderStatus,
  totalAmount: 9000,
  tableId: 1,
  sessionId: 'session-uuid-1',
  createdAt: new Date('2026-04-30T10:00:00Z'),
  updatedAt: new Date('2026-04-30T10:00:00Z'),
  orderItems: [mockOrderItem],
  table: { tableNumber: 1, storeId: 'store-001' },
};

// ─── 고객용 함수 테스트 (Unit 2: Customer Order) ──────────────────────────────

describe('createOrder (고객용)', () => {
  const tableId = 1;
  const storeId = 'store-001';
  const items = [
    { menuItemId: 1, quantity: 2 },
    { menuItemId: 2, quantity: 1 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('유효한 메뉴로 주문을 생성해야 한다', async () => {
    (mockPrisma.menuItem.findMany as jest.Mock).mockResolvedValue([
      { id: 1, name: '불고기 덮밥', price: 12000, storeId, isAvailable: true },
      { id: 2, name: '콜라', price: 2000, storeId, isAvailable: true },
    ]);

    (mockPrisma.tableSession.findFirst as jest.Mock).mockResolvedValue({
      id: 'session-001',
      tableId,
      completedAt: null,
    });

    (mockPrisma.order.findFirst as jest.Mock).mockResolvedValue(null);

    (mockPrisma.order.create as jest.Mock).mockResolvedValue({
      id: 1,
      orderNumber: 'ORD-20260430-0001',
      tableId,
      sessionId: 'session-001',
      status: 'PENDING',
      totalAmount: 26000,
      createdAt: new Date('2026-04-30T10:00:00Z'),
      orderItems: [
        { id: 1, menuItemName: '불고기 덮밥', unitPrice: 12000, quantity: 2 },
        { id: 2, menuItemName: '콜라', unitPrice: 2000, quantity: 1 },
      ],
    });

    (mockPrisma.table.findUnique as jest.Mock).mockResolvedValue({
      id: tableId,
      tableNumber: 3,
    });

    const result = await createOrder(tableId, storeId, items);

    expect(result.orderNumber).toBe('ORD-20260430-0001');
    expect(result.totalAmount).toBe(26000);
    expect(result.status).toBe('PENDING');
    expect(result.orderItems).toHaveLength(2);
  });

  it('유효하지 않은 메뉴가 포함되면 BadRequestError를 throw해야 한다', async () => {
    (mockPrisma.menuItem.findMany as jest.Mock).mockResolvedValue([
      { id: 1, name: '불고기 덮밥', price: 12000, storeId, isAvailable: true },
    ]);

    await expect(createOrder(tableId, storeId, items)).rejects.toThrow(BadRequestError);
  });

  it('활성 세션이 없으면 새 세션을 생성해야 한다', async () => {
    (mockPrisma.menuItem.findMany as jest.Mock).mockResolvedValue([
      { id: 1, name: '불고기 덮밥', price: 12000, storeId, isAvailable: true },
    ]);

    (mockPrisma.tableSession.findFirst as jest.Mock).mockResolvedValue(null);

    (mockPrisma.tableSession.create as jest.Mock).mockResolvedValue({
      id: 'new-session-001',
      tableId,
    });

    (mockPrisma.order.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.order.create as jest.Mock).mockResolvedValue({
      id: 1,
      orderNumber: 'ORD-20260430-0001',
      tableId,
      sessionId: 'new-session-001',
      status: 'PENDING',
      totalAmount: 12000,
      createdAt: new Date(),
      orderItems: [
        { id: 1, menuItemName: '불고기 덮밥', unitPrice: 12000, quantity: 1 },
      ],
    });

    (mockPrisma.table.findUnique as jest.Mock).mockResolvedValue({
      id: tableId,
      tableNumber: 1,
    });

    const result = await createOrder(tableId, storeId, [{ menuItemId: 1, quantity: 1 }]);

    expect(mockPrisma.tableSession.create).toHaveBeenCalledWith({ data: { tableId } });
    expect(result.orderNumber).toBeDefined();
  });
});

describe('getCustomerOrdersBySession (고객용)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('활성 세션의 주문 목록을 반환해야 한다', async () => {
    (mockPrisma.tableSession.findFirst as jest.Mock).mockResolvedValue({
      id: 'session-001',
      tableId: 1,
      completedAt: null,
    });

    (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        orderNumber: 'ORD-20260430-0001',
        status: 'PENDING',
        totalAmount: 12000,
        createdAt: new Date('2026-04-30T10:00:00Z'),
        orderItems: [
          { id: 1, menuItemName: '불고기 덮밥', unitPrice: 12000, quantity: 1 },
        ],
      },
      {
        id: 2,
        orderNumber: 'ORD-20260430-0002',
        status: 'PREPARING',
        totalAmount: 5000,
        createdAt: new Date('2026-04-30T10:30:00Z'),
        orderItems: [
          { id: 2, menuItemName: '콜라', unitPrice: 2000, quantity: 1 },
          { id: 3, menuItemName: '감자튀김', unitPrice: 3000, quantity: 1 },
        ],
      },
    ]);

    const result = await getCustomerOrdersBySession(1);

    expect(result).toHaveLength(2);
    expect(result[0].orderNumber).toBe('ORD-20260430-0001');
    expect(result[1].orderNumber).toBe('ORD-20260430-0002');
  });

  it('활성 세션이 없으면 빈 배열을 반환해야 한다', async () => {
    (mockPrisma.tableSession.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await getCustomerOrdersBySession(1);

    expect(result).toHaveLength(0);
  });
});

// ─── 관리자용 함수 테스트 (Unit 3: Admin Monitor) ────────────────────────────

describe('updateOrderStatus (관리자용)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('PENDING → PREPARING 상태 변경에 성공한다', async () => {
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
    (mockPrisma.order.update as jest.Mock).mockResolvedValue({
      ...mockOrder,
      status: 'PREPARING',
      updatedAt: new Date(),
    });

    const result = await updateOrderStatus(1, 'PREPARING');

    expect(result.status).toBe('PREPARING');
    expect(mockSseManager.broadcast).toHaveBeenCalledWith(
      'order-status-changed',
      expect.objectContaining({
        orderId: 1,
        previousStatus: 'PENDING',
        newStatus: 'PREPARING',
      }),
    );
  });

  it('PREPARING → COMPLETED 상태 변경에 성공한다', async () => {
    const preparingOrder = { ...mockOrder, status: 'PREPARING' as OrderStatus };
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(preparingOrder);
    (mockPrisma.order.update as jest.Mock).mockResolvedValue({
      ...preparingOrder,
      status: 'COMPLETED',
      updatedAt: new Date(),
    });

    const result = await updateOrderStatus(1, 'COMPLETED');

    expect(result.status).toBe('COMPLETED');
  });

  it('COMPLETED 상태에서 변경 시도 시 BadRequestError를 던진다', async () => {
    const completedOrder = { ...mockOrder, status: 'COMPLETED' as OrderStatus };
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(completedOrder);

    await expect(updateOrderStatus(1, 'PENDING')).rejects.toThrow(BadRequestError);
  });

  it('역방향 전이(PREPARING → PENDING) 시 BadRequestError를 던진다', async () => {
    const preparingOrder = { ...mockOrder, status: 'PREPARING' as OrderStatus };
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(preparingOrder);

    await expect(updateOrderStatus(1, 'PENDING')).rejects.toThrow(BadRequestError);
  });

  it('동일 상태로 변경 시도 시 BadRequestError를 던진다', async () => {
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

    await expect(updateOrderStatus(1, 'PENDING')).rejects.toThrow(BadRequestError);
  });

  it('존재하지 않는 주문이면 NotFoundError를 던진다', async () => {
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(updateOrderStatus(999, 'PREPARING')).rejects.toThrow(NotFoundError);
  });
});

describe('deleteOrder (관리자용)', () => {
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

describe('getOrdersBySession (관리자용)', () => {
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
