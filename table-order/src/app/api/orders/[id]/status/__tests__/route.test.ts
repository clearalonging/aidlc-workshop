/**
 * PATCH /api/orders/[id]/status 단위 테스트
 * AS-05: 주문 상태 변경
 */

import { PATCH } from '../route';
import { authenticateAdmin } from '@/lib/middleware/auth-middleware';
import { updateOrderStatus } from '@/lib/services/order-service';
import { NotFoundError, BadRequestError, UnauthorizedError } from '@/lib/errors';
import { OrderStatus } from '@prisma/client';

jest.mock('@/lib/middleware/auth-middleware', () => ({
  authenticateAdmin: jest.fn(),
}));

jest.mock('@/lib/services/order-service', () => ({
  updateOrderStatus: jest.fn(),
}));

const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>;
const mockUpdateOrderStatus = updateOrderStatus as jest.MockedFunction<typeof updateOrderStatus>;

const adminPayload = {
  sub: 1,
  role: 'ADMIN' as const,
  storeId: 'store-001',
  iat: 0,
  exp: 9999999999,
};

function createMockRequest(body: unknown) {
  return {
    headers: { get: () => 'Bearer valid-token' },
    json: jest.fn().mockResolvedValue(body),
    nextUrl: { searchParams: new URLSearchParams() },
  } as unknown as import('next/server').NextRequest;
}

function createParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('PATCH /api/orders/[id]/status', () => {
  beforeEach(() => jest.clearAllMocks());

  it('주문 상태를 PREPARING으로 변경한다', async () => {
    mockAuthenticateAdmin.mockReturnValue(adminPayload);
    mockUpdateOrderStatus.mockResolvedValue({
      id: 1,
      orderNumber: 'ORD-20260430-0001',
      status: OrderStatus.PREPARING,
      totalAmount: 9000,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
      tableId: 1,
      sessionId: 'session-1',
    });

    const request = createMockRequest({ status: 'PREPARING' });
    const response = await PATCH(request, createParams('1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('PREPARING');
  });

  it('잘못된 주문 ID이면 400을 반환한다', async () => {
    mockAuthenticateAdmin.mockReturnValue(adminPayload);

    const request = createMockRequest({ status: 'PREPARING' });
    const response = await PATCH(request, createParams('invalid'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('존재하지 않는 주문이면 404를 반환한다', async () => {
    mockAuthenticateAdmin.mockReturnValue(adminPayload);
    mockUpdateOrderStatus.mockRejectedValue(new NotFoundError('주문'));

    const request = createMockRequest({ status: 'PREPARING' });
    const response = await PATCH(request, createParams('999'));

    expect(response.status).toBe(404);
  });

  it('잘못된 상태 전이이면 400을 반환한다', async () => {
    mockAuthenticateAdmin.mockReturnValue(adminPayload);
    mockUpdateOrderStatus.mockRejectedValue(
      new BadRequestError('상태 변경 불가'),
    );

    const request = createMockRequest({ status: 'PENDING' });
    const response = await PATCH(request, createParams('1'));

    expect(response.status).toBe(400);
  });

  it('인증 실패 시 401을 반환한다', async () => {
    mockAuthenticateAdmin.mockImplementation(() => {
      throw new UnauthorizedError();
    });

    const request = createMockRequest({ status: 'PREPARING' });
    const response = await PATCH(request, createParams('1'));

    expect(response.status).toBe(401);
  });
});
