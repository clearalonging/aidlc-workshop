import { MenuService } from '../menu-service';
import { prisma } from '@/lib/prisma';
import { NotFoundError, BadRequestError } from '@/lib/errors';

/**
 * MenuService 단위 테스트
 * TDD: 이 테스트를 패스하는 것이 구현 완료의 목표입니다.
 *
 * 스토리 커버리지:
 * - AS-11: 메뉴 등록 (createMenu)
 * - AS-12: 메뉴 수정 (updateMenu)
 * - AS-13: 메뉴 삭제 (deleteMenu)
 * - AS-14: 메뉴 노출 순서 조정 (swapMenuOrder, updateMenuOrder)
 * - AS-15: 카테고리별 메뉴 조회 (getMenusByCategory, getMenuById)
 */

// Prisma 모킹
jest.mock('@/lib/prisma', () => ({
  prisma: {
    category: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    menuItem: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// 로거 모킹
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnValue({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
  createRequestLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const STORE_ID = 'test-store-id';

const mockCategory = {
  id: 1,
  storeId: STORE_ID,
  name: '찌개류',
  sortOrder: 0,
};

const mockMenuItem = {
  id: 1,
  storeId: STORE_ID,
  categoryId: 1,
  name: '김치찌개',
  price: 9000,
  description: '매콤한 김치찌개',
  imageUrl: 'https://example.com/kimchi.jpg',
  sortOrder: 0,
  isAvailable: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  category: mockCategory,
};

describe('MenuService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── AS-15: 카테고리별 메뉴 조회 ─────────────────────────────

  describe('getMenusByCategory', () => {
    it('전체 카테고리 메뉴를 조회한다', async () => {
      const mockCategories = [
        { ...mockCategory, menuItems: [mockMenuItem], _count: { menuItems: 1 } },
      ];
      (mockPrisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

      const result = await MenuService.getMenusByCategory(STORE_ID);

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { storeId: STORE_ID },
          orderBy: { sortOrder: 'asc' },
        }),
      );
      expect(result).toEqual(mockCategories);
    });

    it('특정 카테고리 메뉴만 조회한다', async () => {
      const mockCategories = [
        { ...mockCategory, menuItems: [mockMenuItem], _count: { menuItems: 1 } },
      ];
      (mockPrisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

      const result = await MenuService.getMenusByCategory(STORE_ID, 1);

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { storeId: STORE_ID, id: 1 },
        }),
      );
      expect(result).toEqual(mockCategories);
    });

    it('메뉴가 없으면 빈 배열을 반환한다', async () => {
      (mockPrisma.category.findMany as jest.Mock).mockResolvedValue([]);

      const result = await MenuService.getMenusByCategory(STORE_ID);

      expect(result).toEqual([]);
    });
  });

  describe('getMenuById', () => {
    it('메뉴 상세를 조회한다', async () => {
      (mockPrisma.menuItem.findFirst as jest.Mock).mockResolvedValue(mockMenuItem);

      const result = await MenuService.getMenuById(1, STORE_ID);

      expect(mockPrisma.menuItem.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1, storeId: STORE_ID },
        }),
      );
      expect(result).toEqual(mockMenuItem);
    });

    it('존재하지 않는 메뉴 조회 시 NotFoundError를 던진다', async () => {
      (mockPrisma.menuItem.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(MenuService.getMenuById(999, STORE_ID)).rejects.toThrow(NotFoundError);
    });
  });

  // ─── AS-11: 메뉴 등록 ────────────────────────────────────────

  describe('createMenu', () => {
    const createInput = {
      name: '된장찌개',
      price: 8000,
      categoryId: 1,
      description: '구수한 된장찌개',
      imageUrl: 'https://example.com/doenjang.jpg',
    };

    it('메뉴를 성공적으로 등록한다', async () => {
      (mockPrisma.category.findFirst as jest.Mock).mockResolvedValue(mockCategory);
      (mockPrisma.menuItem.aggregate as jest.Mock).mockResolvedValue({ _max: { sortOrder: 2 } });
      (mockPrisma.menuItem.create as jest.Mock).mockResolvedValue({
        ...mockMenuItem,
        ...createInput,
        id: 2,
        sortOrder: 3,
      });

      const result = await MenuService.createMenu(STORE_ID, createInput);

      expect(mockPrisma.category.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1, storeId: STORE_ID },
        }),
      );
      expect(mockPrisma.menuItem.create).toHaveBeenCalled();
      expect(result.name).toBe('된장찌개');
    });

    it('존재하지 않는 카테고리로 등록 시 BadRequestError를 던진다', async () => {
      (mockPrisma.category.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(MenuService.createMenu(STORE_ID, createInput)).rejects.toThrow(BadRequestError);
    });

    it('imageUrl이 빈 문자열이면 null로 변환한다', async () => {
      (mockPrisma.category.findFirst as jest.Mock).mockResolvedValue(mockCategory);
      (mockPrisma.menuItem.aggregate as jest.Mock).mockResolvedValue({ _max: { sortOrder: 0 } });
      (mockPrisma.menuItem.create as jest.Mock).mockResolvedValue({
        ...mockMenuItem,
        imageUrl: null,
      });

      await MenuService.createMenu(STORE_ID, { ...createInput, imageUrl: '' });

      expect(mockPrisma.menuItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ imageUrl: null }),
        }),
      );
    });

    it('sortOrder 미제공 시 카테고리 내 최대값 + 1을 할당한다', async () => {
      (mockPrisma.category.findFirst as jest.Mock).mockResolvedValue(mockCategory);
      (mockPrisma.menuItem.aggregate as jest.Mock).mockResolvedValue({ _max: { sortOrder: 5 } });
      (mockPrisma.menuItem.create as jest.Mock).mockResolvedValue({
        ...mockMenuItem,
        sortOrder: 6,
      });

      await MenuService.createMenu(STORE_ID, createInput);

      expect(mockPrisma.menuItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sortOrder: 6 }),
        }),
      );
    });
  });

  // ─── AS-12: 메뉴 수정 ────────────────────────────────────────

  describe('updateMenu', () => {
    it('메뉴를 성공적으로 수정한다', async () => {
      (mockPrisma.menuItem.findFirst as jest.Mock).mockResolvedValue(mockMenuItem);
      (mockPrisma.menuItem.update as jest.Mock).mockResolvedValue({
        ...mockMenuItem,
        price: 10000,
      });

      const result = await MenuService.updateMenu(1, STORE_ID, { price: 10000 });

      expect(mockPrisma.menuItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ price: 10000 }),
        }),
      );
      expect(result.price).toBe(10000);
    });

    it('존재하지 않는 메뉴 수정 시 NotFoundError를 던진다', async () => {
      (mockPrisma.menuItem.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(MenuService.updateMenu(999, STORE_ID, { price: 10000 })).rejects.toThrow(
        NotFoundError,
      );
    });

    it('카테고리 변경 시 새 카테고리 존재를 확인한다', async () => {
      (mockPrisma.menuItem.findFirst as jest.Mock).mockResolvedValue(mockMenuItem);
      (mockPrisma.category.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        MenuService.updateMenu(1, STORE_ID, { categoryId: 999 }),
      ).rejects.toThrow(BadRequestError);
    });

    it('imageUrl이 빈 문자열이면 null로 변환한다', async () => {
      (mockPrisma.menuItem.findFirst as jest.Mock).mockResolvedValue(mockMenuItem);
      (mockPrisma.menuItem.update as jest.Mock).mockResolvedValue({
        ...mockMenuItem,
        imageUrl: null,
      });

      await MenuService.updateMenu(1, STORE_ID, { imageUrl: '' });

      expect(mockPrisma.menuItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ imageUrl: null }),
        }),
      );
    });

    it('제공된 필드만 업데이트한다 (partial update)', async () => {
      (mockPrisma.menuItem.findFirst as jest.Mock).mockResolvedValue(mockMenuItem);
      (mockPrisma.menuItem.update as jest.Mock).mockResolvedValue({
        ...mockMenuItem,
        description: '새로운 설명',
      });

      await MenuService.updateMenu(1, STORE_ID, { description: '새로운 설명' });

      expect(mockPrisma.menuItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ description: '새로운 설명' }),
        }),
      );
    });
  });

  // ─── AS-13: 메뉴 삭제 ────────────────────────────────────────

  describe('deleteMenu', () => {
    it('메뉴를 성공적으로 삭제한다', async () => {
      (mockPrisma.menuItem.findFirst as jest.Mock).mockResolvedValue(mockMenuItem);
      (mockPrisma.menuItem.delete as jest.Mock).mockResolvedValue(mockMenuItem);

      await MenuService.deleteMenu(1, STORE_ID);

      expect(mockPrisma.menuItem.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });

    it('존재하지 않는 메뉴 삭제 시 NotFoundError를 던진다', async () => {
      (mockPrisma.menuItem.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(MenuService.deleteMenu(999, STORE_ID)).rejects.toThrow(NotFoundError);
    });
  });

  // ─── AS-14: 메뉴 노출 순서 조정 ──────────────────────────────

  describe('swapMenuOrder', () => {
    const menuA = { ...mockMenuItem, id: 1, sortOrder: 0 };
    const menuB = { ...mockMenuItem, id: 2, sortOrder: 1, name: '된장찌개' };

    it('메뉴를 아래로 이동한다 (swap)', async () => {
      const txMock = {
        menuItem: {
          findFirst: jest.fn()
            .mockResolvedValueOnce(menuA)   // 현재 메뉴
            .mockResolvedValueOnce(menuB),  // 인접 메뉴 (아래)
          update: jest.fn().mockResolvedValue({}),
        },
      };
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(txMock));

      await MenuService.swapMenuOrder(STORE_ID, 1, 'down');

      expect(txMock.menuItem.update).toHaveBeenCalledTimes(2);
    });

    it('메뉴를 위로 이동한다 (swap)', async () => {
      const txMock = {
        menuItem: {
          findFirst: jest.fn()
            .mockResolvedValueOnce(menuB)   // 현재 메뉴 (sortOrder: 1)
            .mockResolvedValueOnce(menuA),  // 인접 메뉴 (위, sortOrder: 0)
          update: jest.fn().mockResolvedValue({}),
        },
      };
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(txMock));

      await MenuService.swapMenuOrder(STORE_ID, 2, 'up');

      expect(txMock.menuItem.update).toHaveBeenCalledTimes(2);
    });

    it('최상단 메뉴의 위로 이동은 no-op이다', async () => {
      const txMock = {
        menuItem: {
          findFirst: jest.fn()
            .mockResolvedValueOnce(menuA)   // 현재 메뉴 (최상단)
            .mockResolvedValueOnce(null),   // 인접 메뉴 없음
          update: jest.fn(),
        },
      };
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(txMock));

      await MenuService.swapMenuOrder(STORE_ID, 1, 'up');

      expect(txMock.menuItem.update).not.toHaveBeenCalled();
    });

    it('존재하지 않는 메뉴의 순서 변경 시 NotFoundError를 던진다', async () => {
      const txMock = {
        menuItem: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(txMock));

      await expect(MenuService.swapMenuOrder(STORE_ID, 999, 'up')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateMenuOrder', () => {
    it('여러 메뉴의 순서를 일괄 변경한다', async () => {
      const items = [
        { id: 1, sortOrder: 2 },
        { id: 2, sortOrder: 0 },
        { id: 3, sortOrder: 1 },
      ];
      const txMock = {
        menuItem: {
          count: jest.fn().mockResolvedValue(3),
          update: jest.fn().mockResolvedValue({}),
        },
      };
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(txMock));

      await MenuService.updateMenuOrder(STORE_ID, items);

      expect(txMock.menuItem.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: [1, 2, 3] }, storeId: STORE_ID },
        }),
      );
      expect(txMock.menuItem.update).toHaveBeenCalledTimes(3);
    });

    it('존재하지 않는 메뉴가 포함되면 BadRequestError를 던진다', async () => {
      const items = [{ id: 1, sortOrder: 0 }, { id: 999, sortOrder: 1 }];
      const txMock = {
        menuItem: {
          count: jest.fn().mockResolvedValue(1), // 2개 중 1개만 존재
        },
      };
      (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => fn(txMock));

      await expect(MenuService.updateMenuOrder(STORE_ID, items)).rejects.toThrow(BadRequestError);
    });
  });
});
