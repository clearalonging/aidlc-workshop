/**
 * GET/POST /api/admin/tables 단위 테스트
 * AS-03: 실시간 주문 목록 확인 (초기 데이터)
 * AS-07: 테이블 초기 설정
 */

import { GET, POST } from '../route';
import { authenticateAdmin } from '@/lib/middleware/auth-middleware';
import {
  getAllTablesWithCurrentOrders,
  setupTable,
} from '@/lib/services/table-service';
import { UnauthorizedError } from '@/lib/errors';

jest.mock('@/lib/middleware/auth-middleware', () => ({
  authenticateAdmin: jest.fn(),
}));

jest.mock('@/lib/services/table-service', () => ({
  getAllTablesWithCurrentOrders: jest.fn(),
  setupTable: jest.fn(),
}));

const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>;
const mockGetAllTables = getAllTablesWithCurrentOrders as jest.MockedFunction<
  typeof getAllTablesWithCurrentOrders
>;
const mockSetupTable = setupTable as jest.MockedFunction<typeof setupTable>;

const adminPayload = {
  sub: 1,
  role: 'ADMIN' as const,
  storeId: 'store-001',
  iat: 0,
  exp: 9999999999,
};

function createGetRequest() {
  return {
    headers: { get: () => 'Bearer valid-token' },
    nextUrl: { searchParams: new URLSearchParams() },
  } as unknown as import('next/server').NextRequest;
}

function createPostRequest(body: unknown) {
  return {
    headers: { get: () => 'Bearer valid-token' },
    json: jest.fn().mockResolvedValue(body),
    nextUrl: { searchParams: new URLSearchParams() },
  } as unknown as import('next/server').NextRequest;
}

describe('GET /api/admin/tables', () => {
  beforeEach(() => jest.clearAllMocks());

  it('전체 테이블 목록을 반환한다', async () => {
    mockAuthenticateAdmin.mockReturnValue(adminPayload);
    mockGetAllTables.mockResolvedValue([
      {
        id: 1,
        tableNumber: 1,
        storeId: 'store-001',
        currentSessionId: 'session-1',
        currentOrders: [],
        totalAmount: 0,
      },
    ]);

    const response = await GET(createGetRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(mockGetAllTables).toHaveBeenCalledWith('store-001');
  });

  it('인증 실패 시 401을 반환한다', async () => {
    mockAuthenticateAdmin.mockImplementation(() => {
      throw new UnauthorizedError();
    });

    const response = await GET(createGetRequest());
    expect(response.status).toBe(401);
  });
});

describe('POST /api/admin/tables', () => {
  beforeEach(() => jest.clearAllMocks());

  it('테이블을 설정하고 201을 반환한다', async () => {
    mockAuthenticateAdmin.mockReturnValue(adminPayload);
    mockSetupTable.mockResolvedValue({ id: 1, tableNumber: 3 });

    const response = await POST(
      createPostRequest({ tableNumber: 3, password: '1234' }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.tableNumber).toBe(3);
  });

  it('입력 검증 실패 시 400을 반환한다', async () => {
    mockAuthenticateAdmin.mockReturnValue(adminPayload);

    const response = await POST(
      createPostRequest({ tableNumber: -1, password: '12' }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });
});
