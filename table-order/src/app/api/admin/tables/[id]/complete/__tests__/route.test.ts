/**
 * POST /api/admin/tables/[id]/complete 단위 테스트
 * AS-09: 테이블 이용 완료 처리
 */

import { POST } from '../route';
import { authenticateAdmin } from '@/lib/middleware/auth-middleware';
import { completeTableSession } from '@/lib/services/table-service';
import { sseManager } from '@/lib/sse/sse-manager';
import { NotFoundError, BadRequestError, UnauthorizedError } from '@/lib/errors';

jest.mock('@/lib/middleware/auth-middleware', () => ({
  authenticateAdmin: jest.fn(),
}));

jest.mock('@/lib/services/table-service', () => ({
  completeTableSession: jest.fn(),
}));

jest.mock('@/lib/sse/sse-manager', () => ({
  sseManager: { broadcast: jest.fn() },
}));

const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>;
const mockCompleteSession = completeTableSession as jest.MockedFunction<typeof completeTableSession>;
const mockSseManager = sseManager as jest.Mocked<typeof sseManager>;

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

describe('POST /api/admin/tables/[id]/complete', () => {
  beforeEach(() => jest.clearAllMocks());

  it('이용 완료 처리 후 SSE 이벤트를 발행하고 200을 반환한다', async () => {
    mockAuthenticateAdmin.mockReturnValue(adminPayload);
    mockCompleteSession.mockResolvedValue(undefined);

    const response = await POST(createMockRequest(), createParams('1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockCompleteSession).toHaveBeenCalledWith(1);
    expect(mockSseManager.broadcast).toHaveBeenCalledWith(
      'table-completed',
      expect.objectContaining({ tableId: 1 }),
    );
  });

  it('잘못된 테이블 ID이면 400을 반환한다', async () => {
    mockAuthenticateAdmin.mockReturnValue(adminPayload);

    const response = await POST(createMockRequest(), createParams('abc'));
    expect(response.status).toBe(400);
  });

  it('활성 세션이 없으면 400을 반환한다', async () => {
    mockAuthenticateAdmin.mockReturnValue(adminPayload);
    mockCompleteSession.mockRejectedValue(
      new BadRequestError('현재 활성 세션이 없습니다.'),
    );

    const response = await POST(createMockRequest(), createParams('1'));
    expect(response.status).toBe(400);
  });

  it('존재하지 않는 테이블이면 404를 반환한다', async () => {
    mockAuthenticateAdmin.mockReturnValue(adminPayload);
    mockCompleteSession.mockRejectedValue(new NotFoundError('테이블'));

    const response = await POST(createMockRequest(), createParams('999'));
    expect(response.status).toBe(404);
  });

  it('인증 실패 시 401을 반환한다', async () => {
    mockAuthenticateAdmin.mockImplementation(() => {
      throw new UnauthorizedError();
    });

    const response = await POST(createMockRequest(), createParams('1'));
    expect(response.status).toBe(401);
  });
});
