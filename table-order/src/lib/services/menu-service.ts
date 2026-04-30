import { prisma } from '@/lib/prisma';
import { NotFoundError, BadRequestError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { MenuItemInput, UpdateMenuItemInput } from '@/lib/validators/common-schemas';

// ─── 고객용 타입 ──────────────────────────────────────────────────────────────

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

// ─── 고객용 함수 (Unit 2: Customer Order) ────────────────────────────────────

/**
 * 카테고리별 메뉴 목록 조회 (CS-02, CS-03, CS-04)
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
 * 메뉴 상세 조회 (CS-03)
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

// ─── 관리자용 클래스 (Unit 1: Admin Menu Management) ─────────────────────────

/**
 * MenuService - 메뉴 관리 비즈니스 로직
 *
 * 스토리: AS-11 (등록), AS-12 (수정), AS-13 (삭제), AS-14 (순서), AS-15 (조회)
 * SECURITY-08: storeId 기반 object-level authorization
 * SECURITY-05: Prisma 파라미터화 쿼리
 * SECURITY-03: 감사 로깅 (pino INFO)
 */
export class MenuService {
  /**
   * 카테고리별 메뉴 목록 조회 (AS-15)
   * 카테고리 정보와 함께 메뉴를 반환합니다.
   */
  static async getMenusByCategory(storeId: string, categoryId?: number) {
    const where: Record<string, unknown> = { storeId };
    if (categoryId) {
      where.id = categoryId;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        menuItems: {
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          include: { category: true },
        },
        _count: { select: { menuItems: true } },
      },
    });

    return categories;
  }

  /**
   * 메뉴 상세 조회 (AS-15)
   */
  static async getMenuById(menuId: number, storeId: string) {
    const menu = await prisma.menuItem.findFirst({
      where: { id: menuId, storeId },
      include: { category: true },
    });

    if (!menu) {
      throw new NotFoundError('메뉴');
    }

    return menu;
  }

  /**
   * 메뉴 등록 (AS-11)
   * SECURITY-08: storeId로 카테고리 소유권 확인
   */
  static async createMenu(storeId: string, data: MenuItemInput) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, storeId },
    });
    if (!category) {
      throw new BadRequestError('존재하지 않는 카테고리입니다.');
    }

    const imageUrl = data.imageUrl === '' ? null : (data.imageUrl ?? null);

    let sortOrder = data.sortOrder ?? 0;
    if (!data.sortOrder && data.sortOrder !== 0) {
      const maxSort = await prisma.menuItem.aggregate({
        where: { categoryId: data.categoryId, storeId },
        _max: { sortOrder: true },
      });
      sortOrder = (maxSort._max.sortOrder ?? -1) + 1;
    }

    const menu = await prisma.menuItem.create({
      data: {
        storeId,
        categoryId: data.categoryId,
        name: data.name,
        price: data.price,
        description: data.description ?? null,
        imageUrl,
        sortOrder,
      },
      include: { category: true },
    });

    logger.info(
      { action: 'CREATE', entity: 'MenuItem', menuId: menu.id, menuName: menu.name },
      'Menu created',
    );

    return menu;
  }

  /**
   * 메뉴 수정 (AS-12)
   * Partial update — 제공된 필드만 업데이트
   */
  static async updateMenu(menuId: number, storeId: string, data: UpdateMenuItemInput) {
    const existing = await prisma.menuItem.findFirst({
      where: { id: menuId, storeId },
    });
    if (!existing) {
      throw new NotFoundError('메뉴');
    }

    if (data.categoryId !== undefined) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, storeId },
      });
      if (!category) {
        throw new BadRequestError('존재하지 않는 카테고리입니다.');
      }
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.imageUrl === '') {
      updateData.imageUrl = null;
    }

    const menu = await prisma.menuItem.update({
      where: { id: menuId },
      data: updateData,
      include: { category: true },
    });

    logger.info(
      { action: 'UPDATE', entity: 'MenuItem', menuId: menu.id, menuName: menu.name },
      'Menu updated',
    );

    return menu;
  }

  /**
   * 메뉴 삭제 (AS-13)
   * 물리적 삭제 — OrderItem 스냅샷으로 주문 내역 무결성 유지
   */
  static async deleteMenu(menuId: number, storeId: string) {
    const existing = await prisma.menuItem.findFirst({
      where: { id: menuId, storeId },
    });
    if (!existing) {
      throw new NotFoundError('메뉴');
    }

    await prisma.menuItem.delete({ where: { id: menuId } });

    logger.info(
      { action: 'DELETE', entity: 'MenuItem', menuId, menuName: existing.name },
      'Menu deleted',
    );
  }

  /**
   * 메뉴 순서 위/아래 이동 (AS-14)
   * 같은 카테고리 내 인접 메뉴와 sortOrder 교환 (swap)
   */
  static async swapMenuOrder(storeId: string, menuId: number, direction: 'up' | 'down') {
    await prisma.$transaction(async (tx) => {
      const current = await tx.menuItem.findFirst({
        where: { id: menuId, storeId },
      });
      if (!current) {
        throw new NotFoundError('메뉴');
      }

      // 같은 카테고리 내 모든 메뉴를 정렬 순서대로 가져옴
      const allItems = await tx.menuItem.findMany({
        where: { storeId, categoryId: current.categoryId },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      });

      const currentIndex = allItems.findIndex((item) => item.id === current.id);
      if (currentIndex === -1) return;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= allItems.length) return;

      const adjacent = allItems[targetIndex];

      // sortOrder 교환 (같은 값이면 id 기반으로 강제 교환)
      const currentSort = current.sortOrder;
      const adjacentSort = adjacent.sortOrder;

      if (currentSort === adjacentSort) {
        // 같은 sortOrder인 경우: 강제로 다른 값 할당
        await tx.menuItem.update({
          where: { id: current.id },
          data: { sortOrder: adjacentSort + (direction === 'up' ? -1 : 1) },
        });
      } else {
        await tx.menuItem.update({
          where: { id: current.id },
          data: { sortOrder: adjacentSort },
        });
        await tx.menuItem.update({
          where: { id: adjacent.id },
          data: { sortOrder: currentSort },
        });
      }
    });

    logger.info(
      { action: 'REORDER', entity: 'MenuItem', menuId, direction },
      'Menu reordered',
    );
  }

  /**
   * 메뉴 순서 일괄 변경 (AS-14)
   * 트랜잭션으로 원자적 실행
   */
  static async updateMenuOrder(storeId: string, items: { id: number; sortOrder: number }[]) {
    await prisma.$transaction(async (tx) => {
      const menuIds = items.map((item) => item.id);
      const existingCount = await tx.menuItem.count({
        where: { id: { in: menuIds }, storeId },
      });
      if (existingCount !== menuIds.length) {
        throw new BadRequestError('존재하지 않는 메뉴가 포함되어 있습니다.');
      }

      for (const item of items) {
        await tx.menuItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        });
      }
    });

    logger.info(
      { action: 'REORDER_BULK', entity: 'MenuItem', count: items.length },
      'Menu order updated in bulk',
    );
  }
}
