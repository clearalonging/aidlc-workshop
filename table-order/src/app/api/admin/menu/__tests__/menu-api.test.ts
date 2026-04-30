import { NextRequest } from 'next/server';
import { MenuService } from '@/lib/services/menu-service';
import { NotFoundError, BadRequestError } from '@/lib/errors';

/**
 * Admin Menu API Route Handlers 단위 테스트
 * TDD: 이 테스트를 패스하는 것이 API 구현 완료의 목표입니다.
 *
 * 스토리 커버리지:
 * - AS-11: POST /api/admin/menu (메뉴 등록)
 * - AS-12: PUT /api/admin/menu/[id] (메뉴 수정)
 * - AS-13: DELETE /api/admin/menu/[id] (메뉴 삭제)
 * - AS-14: PATCH /api/admin/menu/order, PATCH /api/admin/menu/[id]/order (순서 변경)
 * - AS-15: GET /api/admin/menu (카테고리별 조회)
 */

// MenuService 모킹
jest.mock('@/lib/services/menu-service');

// Prisma 모킹 (모듈 로드 시 초기화 방지)
jest.mock('@/lib/prisma', () => ({
  prisma: {},
}));

// Auth 미들웨어 모킹
jest.mock('@/lib/middleware/auth-middleware', () => ({
  authenticateAdmin: jest.fn().mockReturnValue({
    sub: 1,
    role: 'ADMIN',
    storeId: 'test-store-id',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }),
}));

// 로거 모킹
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  createRequestLogger: jest.fn().mockReturnValue({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(),
  }),
}));

const mockMenuService = MenuService as jest.Mocked<typeof MenuService>;

const STORE_ID = 'test-store-id';

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
  category: { id: 1, name: '찌개류' },
};

function createRequest(method: string, url: string, body?: unknown): NextRequest {
  const init: RequestInit = { method, headers: { authorization: 'Bearer test-token' } };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { ...init.headers, 'content-type': 'application/json' } as HeadersInit;
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

// 동적 import로 route handler 로드 (모킹 후)
let menuRouteHandlers: { GET: Function; POST: Function };
let menuIdRouteHandlers: { GET: Function; PUT: Function; DELETE: Function };
let menuOrderRouteHandlers: { PATCH: Function };
let menuIdOrderRouteHandlers: { PATCH: Function };

beforeAll(async () => {
  menuRouteHandlers = await import('../route');
  menuIdRouteHandlers = await import('../[id]/route');
  menuOrderRouteHandlers = await import('../order/route');
  menuIdOrderRouteHandlers = await import('../[id]/order/route');
});

describe('GET /api/admin/menu', () => {
  it('카테고리별 메뉴 목록을 반환한다 (200)', async () => {
    const mockCategories = [
      { id: 1, name: '찌개류', sortOrder: 0, menuItems: [mockMenuItem], _count: { menuItems: 1 } },
    ];
    mockMenuService.getMenusByCategory.mockResolvedValue(mockCategories as any);

    const request = createRequest('GET', 'http://localhost:3000/api/admin/menu');
    const response = await menuRouteHandlers.GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
  });
});

describe('POST /api/admin/menu', () => {
  it('메뉴를 등록하고 201을 반환한다', async () => {
    mockMenuService.createMenu.mockResolvedValue(mockMenuItem as any);

    const request = createRequest('POST', 'http://localhost:3000/api/admin/menu', {
      name: '김치찌개',
      price: 9000,
      categoryId: 1,
    });
    const response = await menuRouteHandlers.POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('김치찌개');
  });

  it('필수 필드 누락 시 400을 반환한다', async () => {
    const request = createRequest('POST', 'http://localhost:3000/api/admin/menu', {
      name: '',
      price: 9000,
      categoryId: 1,
    });
    const response = await menuRouteHandlers.POST(request);

    expect(response.status).toBe(400);
  });

  it('존재하지 않는 카테고리로 등록 시 400을 반환한다', async () => {
    mockMenuService.createMenu.mockRejectedValue(
      new BadRequestError('존재하지 않는 카테고리입니다.'),
    );

    const request = createRequest('POST', 'http://localhost:3000/api/admin/menu', {
      name: '김치찌개',
      price: 9000,
      categoryId: 999,
    });
    const response = await menuRouteHandlers.POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain('카테고리');
  });
});

describe('GET /api/admin/menu/[id]', () => {
  it('메뉴 상세를 반환한다 (200)', async () => {
    mockMenuService.getMenuById.mockResolvedValue(mockMenuItem as any);

    const request = createRequest('GET', 'http://localhost:3000/api/admin/menu/1');
    const response = await menuIdRouteHandlers.GET(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(1);
  });

  it('존재하지 않는 메뉴 조회 시 404를 반환한다', async () => {
    mockMenuService.getMenuById.mockRejectedValue(new NotFoundError('메뉴'));

    const request = createRequest('GET', 'http://localhost:3000/api/admin/menu/999');
    const response = await menuIdRouteHandlers.GET(request, { params: { id: '999' } });

    expect(response.status).toBe(404);
  });
});

describe('PUT /api/admin/menu/[id]', () => {
  it('메뉴를 수정하고 200을 반환한다', async () => {
    mockMenuService.updateMenu.mockResolvedValue({ ...mockMenuItem, price: 10000 } as any);

    const request = createRequest('PUT', 'http://localhost:3000/api/admin/menu/1', {
      price: 10000,
    });
    const response = await menuIdRouteHandlers.PUT(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe('DELETE /api/admin/menu/[id]', () => {
  it('메뉴를 삭제하고 200을 반환한다', async () => {
    mockMenuService.deleteMenu.mockResolvedValue(undefined);

    const request = createRequest('DELETE', 'http://localhost:3000/api/admin/menu/1');
    const response = await menuIdRouteHandlers.DELETE(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('삭제');
  });
});

describe('PATCH /api/admin/menu/order', () => {
  it('메뉴 순서를 일괄 변경하고 200을 반환한다', async () => {
    mockMenuService.updateMenuOrder.mockResolvedValue(undefined);

    const request = createRequest('PATCH', 'http://localhost:3000/api/admin/menu/order', {
      items: [
        { id: 1, sortOrder: 2 },
        { id: 2, sortOrder: 0 },
      ],
    });
    const response = await menuOrderRouteHandlers.PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe('PATCH /api/admin/menu/[id]/order', () => {
  it('메뉴를 위로 이동하고 200을 반환한다', async () => {
    mockMenuService.swapMenuOrder.mockResolvedValue(undefined);

    const request = createRequest('PATCH', 'http://localhost:3000/api/admin/menu/1/order', {
      direction: 'up',
    });
    const response = await menuIdOrderRouteHandlers.PATCH(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('잘못된 direction 값이면 400을 반환한다', async () => {
    const request = createRequest('PATCH', 'http://localhost:3000/api/admin/menu/1/order', {
      direction: 'left',
    });
    const response = await menuIdOrderRouteHandlers.PATCH(request, { params: { id: '1' } });

    expect(response.status).toBe(400);
  });
});
