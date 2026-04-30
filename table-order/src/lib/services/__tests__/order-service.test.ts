import { createOrder, getOrdersBySession } from '../order-service';
import { BadRequestError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

// 환경 변수 설정
process.env.NODE_ENV = 'test';

// Prisma 모킹
jest.mock('@/lib/prisma', () => ({
  prisma: {
    menuItem: { findMany: jest.fn() },
    tableSession: { findFirst: jest.fn(), create: jest.fn() },
    order: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    table: { findUnique: jest.fn() },
  },
}));

// SSE Manager 모킹
jest.mock('@/lib/sse/sse-manager', () => ({
  sseManager: { broadcast: jest.fn() },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

/**
 * OrderService 단위 테스트
 * CS-09: 주문 확정
 * CS-12: 현재 세션 주문 내역 조회
 */
describe('OrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const tableId = 1;
    const storeId = 'store-001';
    const items = [
      { menuItemId: 1, quantity: 2 },
      { menuItemId: 2, quantity: 1 },
    ];

    it('유효한 메뉴로 주문을 생성해야 한다', async () => {
      // 메뉴 조회 모킹
      (mockPrisma.menuItem.findMany as jest.Mock).mockResolvedValue([
        { id: 1, name: '불고기 덮밥', price: 12000, storeId, isAvailable: true },
        { id: 2, name: '콜라', price: 2000, storeId, isAvailable: true },
      ]);

      // 활성 세션 모킹
      (mockPrisma.tableSession.findFirst as jest.Mock).mockResolvedValue({
        id: 'session-001',
        tableId,
        completedAt: null,
      });

      // 주문 번호 생성용 (마지막 주문 없음)
      (mockPrisma.order.findFirst as jest.Mock).mockResolvedValue(null);

      // 주문 생성 모킹
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

      // 테이블 정보 모킹
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
      // 메뉴 1개만 존재 (2개 요청했지만)
      (mockPrisma.menuItem.findMany as jest.Mock).mockResolvedValue([
        { id: 1, name: '불고기 덮밥', price: 12000, storeId, isAvailable: true },
      ]);

      await expect(createOrder(tableId, storeId, items)).rejects.toThrow(
        BadRequestError,
      );
    });

    it('활성 세션이 없으면 새 세션을 생성해야 한다', async () => {
      (mockPrisma.menuItem.findMany as jest.Mock).mockResolvedValue([
        { id: 1, name: '불고기 덮밥', price: 12000, storeId, isAvailable: true },
      ]);

      // 활성 세션 없음
      (mockPrisma.tableSession.findFirst as jest.Mock).mockResolvedValue(null);

      // 새 세션 생성
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

      const result = await createOrder(tableId, storeId, [
        { menuItemId: 1, quantity: 1 },
      ]);

      expect(mockPrisma.tableSession.create).toHaveBeenCalledWith({
        data: { tableId },
      });
      expect(result.orderNumber).toBeDefined();
    });
  });

  describe('getOrdersBySession', () => {
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

      const result = await getOrdersBySession(1);

      expect(result).toHaveLength(2);
      expect(result[0].orderNumber).toBe('ORD-20260430-0001');
      expect(result[1].orderNumber).toBe('ORD-20260430-0002');
    });

    it('활성 세션이 없으면 빈 배열을 반환해야 한다', async () => {
      (mockPrisma.tableSession.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await getOrdersBySession(1);

      expect(result).toHaveLength(0);
    });
  });
});
