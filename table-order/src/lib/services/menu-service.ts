import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * 메뉴 서비스 (조회)
 * Unit 2: Customer Order
 * CS-02, CS-03, CS-04 관련
 */

export interface MenuWithCategory {
  id: number;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  categoryId: number;
  category: {
    id: number;
    name: string;
  };
}

export interface CategoryWithMenus {
  id: number;
  name: string;
  sortOrder: number;
  menuItems: {
    id: number;
    name: string;
    price: number;
    description: string | null;
    imageUrl: string | null;
    sortOrder: number;
  }[];
}

/**
 * 카테고리별 메뉴 목록 조회
 * 판매 가능한 메뉴만 반환, sortOrder 기준 정렬
 */
export async function getMenusByCategory(storeId: string): Promise<CategoryWithMenus[]> {
  const categories = await prisma.category.findMany({
    where: { storeId },
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

  logger.debug({ storeId, categoryCount: categories.length }, 'Menu categories fetched');
  return categories;
}

/**
 * 메뉴 상세 조회
 * 판매 가능한 메뉴만 조회 가능
 */
export async function getMenuById(menuId: number): Promise<MenuWithCategory> {
  const menuItem = await prisma.menuItem.findFirst({
    where: { id: menuId, isAvailable: true },
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
  });

  if (!menuItem) {
    throw new NotFoundError('메뉴');
  }

  return {
    id: menuItem.id,
    name: menuItem.name,
    price: menuItem.price,
    description: menuItem.description,
    imageUrl: menuItem.imageUrl,
    sortOrder: menuItem.sortOrder,
    categoryId: menuItem.categoryId,
    category: menuItem.category,
  };
}
