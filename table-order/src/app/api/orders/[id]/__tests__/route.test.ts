/**
 * DELETE /api/orders/[id] 단위 테스트
 * AS-08: 주문 삭제
 */

import { DELETE } from '../route';
import { authenticateAdmin } from '@/lib/middleware/auth-middleware';
import { deleteOrder } from '@/lib/services/order-service';
import { NotFoundError, UnauthorizedError } from '@/lib/errors';

jest.mock('@/lib/middleware/auth-middleware', () => ({
  authenticateAdmin: jest.fn(),
}));

jest.mock('@/lib/services/order-service', () => ({
  deleteOrder: jest.fn(),
}));

const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>;
const mockDeleteOrder = deleteOrder as jest.MockedFunction<typeof deleteOrder>;

const adminPayload = {
  sub: 1,
  role: 'ADMIN' as const,
  storeId: 'store-001',
  iat: 0,
  exp: 9999999999,
};

function createMockRequest() {
  return {
    headers: { get: () => 'Bearer valid-token' },
    nextUrl: { searchParams: new URLSearchParams() },
  } as unknown as import('next/server').NextRequest;
}

function createParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('DELETE /api/orders/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('주문을 삭제하고 200을 반환한다', async () => {
    mockAuthenticateAdmin.mockReturnValue(adminPayload);
    mockDeleteOrder.mockResolvedValue(undefined);

    const response = await DELETE(createMockRequest(), createParams('1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDeleteOrder).toHaveBeenCalledWith(1);
  });

  it('잘못된 주문 ID이면 400을 반환한다', async () => {
    mockAuthenticateAdmin.mockReturnValue(adminPayload);

    const response = await DELETE(createMockRequest(), createParams('abc'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('존재하지 않는 주문이면 404를 반환한다', async () => {
    mockAuthenticateAdmin.mockReturnValue(adminPayload);
    mockDeleteOrder.mockRejectedValue(new NotFoundError('주문'));

    const response = await DELETE(createMockRequest(), createParams('999'));

    expect(response.status).toBe(404);
  });

  it('인증 실패 시 401을 반환한다', async () => {
    mockAuthenticateAdmin.mockImplementation(() => {
      throw new UnauthorizedError();
    });

    const response = await DELETE(createMockRequest(), createParams('1'));

    expect(response.status).toBe(401);
  });
});
