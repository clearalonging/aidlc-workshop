import { getMenusByCategory, getMenuById } from '../menu-service';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

// 환경 변수 설정
process.env.NODE_ENV = 'test';

// Prisma 모킹
jest.mock('@/lib/prisma', () => ({
  prisma: {
    category: { findMany: jest.fn() },
    menuItem: { findFirst: jest.fn() },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

/**
 * MenuService 단위 테스트
 * CS-02: 카테고리별 메뉴 목록 조회
 * CS-03: 메뉴 상세 정보 조회
 */
describe('MenuService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMenusByCategory', () => {
    it('카테고리별로 그룹화된 메뉴 목록을 반환해야 한다', async () => {
      const mockCategories = [
        {
          id: 1,
          name: '메인 메뉴',
          sortOrder: 1,
          menuItems: [
            { id: 1, name: '불고기 덮밥', price: 12000, description: '달콤한 불고기', imageUrl: null, sortOrder: 1 },
            { id: 2, name: '제육볶음', price: 13000, description: '매콤한 제육', imageUrl: null, sortOrder: 2 },
          ],
        },
        {
          id: 2,
          name: '음료',
          sortOrder: 2,
          menuItems: [
            { id: 3, name: '콜라', price: 2000, description: '시원한 콜라', imageUrl: null, sortOrder: 1 },
          ],
        },
      ];

      (mockPrisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

      const result = await getMenusByCategory('store-001');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('메인 메뉴');
      expect(result[0].menuItems).toHaveLength(2);
      expect(result[1].name).toBe('음료');
      expect(result[1].menuItems).toHaveLength(1);

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { storeId: 'store-001' },
        orderBy: { sortOrder: 'asc' },
        include: {
          menuItems: {
            where: { isAvailable: true },
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              name: true,
              price: true,
              description: true,
              imageUrl: true,
              sortOrder: true,
            },
          },
        },
      });
    });

    it('카테고리가 없으면 빈 배열을 반환해야 한다', async () => {
      (mockPrisma.category.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getMenusByCategory('store-001');

      expect(result).toHaveLength(0);
    });
  });

  describe('getMenuById', () => {
    it('존재하는 메뉴의 상세 정보를 반환해야 한다', async () => {
      const mockMenu = {
        id: 1,
        name: '불고기 덮밥',
        price: 12000,
        description: '달콤한 불고기와 밥',
        imageUrl: 'https://example.com/bulgogi.jpg',
        sortOrder: 1,
        categoryId: 1,
        category: { id: 1, name: '메인 메뉴' },
      };

      (mockPrisma.menuItem.findFirst as jest.Mock).mockResolvedValue(mockMenu);

      const result = await getMenuById(1);

      expect(result.id).toBe(1);
      expect(result.name).toBe('불고기 덮밥');
      expect(result.price).toBe(12000);
      expect(result.category.name).toBe('메인 메뉴');
    });

    it('존재하지 않는 메뉴는 NotFoundError를 throw해야 한다', async () => {
      (mockPrisma.menuItem.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(getMenuById(999)).rejects.toThrow(NotFoundError);
    });

    it('판매 불가능한 메뉴는 NotFoundError를 throw해야 한다', async () => {
      (mockPrisma.menuItem.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(getMenuById(1)).rejects.toThrow(NotFoundError);

      expect(mockPrisma.menuItem.findFirst).toHaveBeenCalledWith({
        where: { id: 1, isAvailable: true },
        include: {
          category: { select: { id: true, name: true } },
        },
      });
    });
  });
});
