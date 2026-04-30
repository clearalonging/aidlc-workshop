/**
 * TableService 단위 테스트
 * AS-07: 테이블 초기 설정
 * AS-09: 테이블 이용 완료 처리
 * AS-10: 과거 주문 내역 조회
 */

import {
  getAllTablesWithCurrentOrders,
  getTableWithCurrentOrders,
  setupTable,
  completeTableSession,
  getTableHistory,
} from '../table-service';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { NotFoundError, BadRequestError } from '@/lib/errors';

// Prisma 모킹
jest.mock('@/lib/prisma', () => ({
  prisma: {
    store: { findUnique: jest.fn() },
    table: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    tableSession: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// password 모킹
jest.mock('@/lib/auth/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
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

// 공통 픽스처
const mockStore = { id: 'store-001', name: '테스트 매장' };

const mockOrderItem = {
  id: 1,
  menuItemName: '아메리카노',
  unitPrice: 4500,
  quantity: 2,
};

const mockOrder = {
  id: 1,
  orderNumber: 'ORD-20260430-0001',
  status: 'PENDING' as const,
  totalAmount: 9000,
  createdAt: new Date('2026-04-30T10:00:00Z'),
  updatedAt: new Date('2026-04-30T10:00:00Z'),
  orderItems: [mockOrderItem],
};

const mockActiveSession = {
  id: 'session-uuid-1',
  tableId: 1,
  startedAt: new Date('2026-04-30T09:00:00Z'),
  completedAt: null,
  orders: [mockOrder],
};

const mockTable = {
  id: 1,
  tableNumber: 1,
  storeId: 'store-001',
  passwordHash: 'hashed',
  createdAt: new Date(),
  updatedAt: new Date(),
  sessions: [mockActiveSession],
};

// ─── getAllTablesWithCurrentOrders ────────────────────────────────────────────

describe('getAllTablesWithCurrentOrders', () => {
  beforeEach(() => jest.clearAllMocks());

  it('전체 테이블과 현재 주문을 반환한다', async () => {
    (mockPrisma.table.findMany as jest.Mock).mockResolvedValue([mockTable]);

    const result = await getAllTablesWithCurrentOrders('store-001');

    expect(result).toHaveLength(1);
    expect(result[0].tableNumber).toBe(1);
    expect(result[0].currentOrders).toHaveLength(1);
    expect(result[0].totalAmount).toBe(9000);
    expect(result[0].currentSessionId).toBe('session-uuid-1');
  });

  it('활성 세션이 없는 테이블은 빈 주문 목록을 반환한다', async () => {
    const tableWithNoSession = { ...mockTable, sessions: [] };
    (mockPrisma.table.findMany as jest.Mock).mockResolvedValue([tableWithNoSession]);

    const result = await getAllTablesWithCurrentOrders('store-001');

    expect(result[0].currentOrders).toHaveLength(0);
    expect(result[0].totalAmount).toBe(0);
    expect(result[0].currentSessionId).toBeNull();
  });
});

// ─── getTableWithCurrentOrders ────────────────────────────────────────────────

describe('getTableWithCurrentOrders', () => {
  beforeEach(() => jest.clearAllMocks());

  it('테이블 상세 정보와 현재 주문을 반환한다', async () => {
    (mockPrisma.table.findUnique as jest.Mock).mockResolvedValue(mockTable);

    const result = await getTableWithCurrentOrders(1);

    expect(result.id).toBe(1);
    expect(result.tableNumber).toBe(1);
    expect(result.currentOrders).toHaveLength(1);
  });

  it('존재하지 않는 테이블이면 NotFoundError를 던진다', async () => {
    (mockPrisma.table.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(getTableWithCurrentOrders(999)).rejects.toThrow(NotFoundError);
  });
});

// ─── setupTable ───────────────────────────────────────────────────────────────

describe('setupTable', () => {
  beforeEach(() => jest.clearAllMocks());

  it('신규 테이블을 생성한다', async () => {
    (mockPrisma.store.findUnique as jest.Mock).mockResolvedValue(mockStore);
    (mockPrisma.table.upsert as jest.Mock).mockResolvedValue({
      id: 1,
      tableNumber: 1,
    });

    const result = await setupTable('store-001', 1, '1234');

    expect(hashPassword).toHaveBeenCalledWith('1234');
    expect(mockPrisma.table.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { storeId_tableNumber: { storeId: 'store-001', tableNumber: 1 } },
      }),
    );
    expect(result.tableNumber).toBe(1);
  });

  it('존재하지 않는 매장이면 NotFoundError를 던진다', async () => {
    (mockPrisma.store.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(setupTable('invalid-store', 1, '1234')).rejects.toThrow(
      NotFoundError,
    );
  });
});

// ─── completeTableSession ─────────────────────────────────────────────────────

describe('completeTableSession', () => {
  beforeEach(() => jest.clearAllMocks());

  it('활성 세션을 종료한다', async () => {
    (mockPrisma.table.findUnique as jest.Mock).mockResolvedValue(mockTable);
    (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
      await fn({
        tableSession: { update: jest.fn() },
      });
    });

    await expect(completeTableSession(1)).resolves.toBeUndefined();
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it('존재하지 않는 테이블이면 NotFoundError를 던진다', async () => {
    (mockPrisma.table.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(completeTableSession(999)).rejects.toThrow(NotFoundError);
  });

  it('활성 세션이 없으면 BadRequestError를 던진다', async () => {
    const tableWithNoSession = { ...mockTable, sessions: [] };
    (mockPrisma.table.findUnique as jest.Mock).mockResolvedValue(tableWithNoSession);

    await expect(completeTableSession(1)).rejects.toThrow(BadRequestError);
  });
});

// ─── getTableHistory ──────────────────────────────────────────────────────────

describe('getTableHistory', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockCompletedSession = {
    id: 'session-uuid-completed',
    tableId: 1,
    startedAt: new Date('2026-04-29T09:00:00Z'),
    completedAt: new Date('2026-04-29T12:00:00Z'),
    orders: [mockOrder],
  };

  it('완료된 세션의 과거 주문 내역을 반환한다', async () => {
    (mockPrisma.table.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (mockPrisma.tableSession.findMany as jest.Mock).mockResolvedValue([
      mockCompletedSession,
    ]);

    const result = await getTableHistory(1);

    expect(result).toHaveLength(1);
    expect(result[0].sessionId).toBe('session-uuid-completed');
    expect(result[0].completedAt).toEqual(new Date('2026-04-29T12:00:00Z'));
    expect(result[0].orders).toHaveLength(1);
    expect(result[0].totalAmount).toBe(9000);
  });

  it('날짜 필터를 적용하여 조회한다', async () => {
    (mockPrisma.table.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (mockPrisma.tableSession.findMany as jest.Mock).mockResolvedValue([]);

    const dateFrom = new Date('2026-04-01T00:00:00Z');
    const dateTo = new Date('2026-04-30T23:59:59Z');

    await getTableHistory(1, dateFrom, dateTo);

    expect(mockPrisma.tableSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          completedAt: expect.objectContaining({
            gte: dateFrom,
            lte: dateTo,
          }),
        }),
      }),
    );
  });

  it('존재하지 않는 테이블이면 NotFoundError를 던진다', async () => {
    (mockPrisma.table.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(getTableHistory(999)).rejects.toThrow(NotFoundError);
  });
});
