import { prisma } from '@/lib/prisma';
import { NotFoundError, BadRequestError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { MenuItemInput, UpdateMenuItemInput } from '@/lib/validators/common-schemas';

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
    // 카테고리 존재 확인
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, storeId },
    });
    if (!category) {
      throw new BadRequestError('존재하지 않는 카테고리입니다.');
    }

    // imageUrl 빈 문자열 → null 변환
    const imageUrl = data.imageUrl === '' ? null : (data.imageUrl ?? null);

    // sortOrder 미제공 시 카테고리 내 최대값 + 1
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
    // 메뉴 존재 확인
    const existing = await prisma.menuItem.findFirst({
      where: { id: menuId, storeId },
    });
    if (!existing) {
      throw new NotFoundError('메뉴');
    }

    // 카테고리 변경 시 존재 확인
    if (data.categoryId !== undefined) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, storeId },
      });
      if (!category) {
        throw new BadRequestError('존재하지 않는 카테고리입니다.');
      }
    }

    // imageUrl 빈 문자열 → null 변환
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
      // 현재 메뉴 조회
      const current = await tx.menuItem.findFirst({
        where: { id: menuId, storeId },
      });
      if (!current) {
        throw new NotFoundError('메뉴');
      }

      // 인접 메뉴 찾기 (같은 카테고리 내)
      const adjacent = await tx.menuItem.findFirst({
        where: {
          storeId,
          categoryId: current.categoryId,
          sortOrder: direction === 'up'
            ? { lt: current.sortOrder }
            : { gt: current.sortOrder },
        },
        orderBy: {
          sortOrder: direction === 'up' ? 'desc' : 'asc',
        },
      });

      // 인접 메뉴 없으면 no-op (최상단/최하단)
      if (!adjacent) return;

      // sortOrder 교환
      await tx.menuItem.update({
        where: { id: current.id },
        data: { sortOrder: adjacent.sortOrder },
      });
      await tx.menuItem.update({
        where: { id: adjacent.id },
        data: { sortOrder: current.sortOrder },
      });
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
      // 모든 menuId가 storeId에 속하는지 확인
      const menuIds = items.map((item) => item.id);
      const existingCount = await tx.menuItem.count({
        where: { id: { in: menuIds }, storeId },
      });
      if (existingCount !== menuIds.length) {
        throw new BadRequestError('존재하지 않는 메뉴가 포함되어 있습니다.');
      }

      // 일괄 업데이트
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
