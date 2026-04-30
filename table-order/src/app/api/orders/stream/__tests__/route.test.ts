/**
 * GET /api/orders/stream 단위 테스트
 * AS-03: 실시간 주문 목록 확인
 * AS-06: 신규 주문 시각적 알림
 */

import { GET } from '../route';
import { authenticateAdmin } from '@/lib/middleware/auth-middleware';
import { sseManager } from '@/lib/sse/sse-manager';
import { UnauthorizedError } from '@/lib/errors';

jest.mock('@/lib/middleware/auth-middleware', () => ({
  authenticateAdmin: jest.fn(),
}));

jest.mock('@/lib/sse/sse-manager', () => ({
  sseManager: {
    createStream: jest.fn(),
  },
}));

const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>;
const mockSseManager = sseManager as jest.Mocked<typeof sseManager>;

function createMockRequest(authHeader?: string) {
  return {
    headers: {
      get: (key: string) =>
        key === 'authorization' ? authHeader ?? null : null,
    },
    nextUrl: { searchParams: new URLSearchParams() },
  } as unknown as import('next/server').NextRequest;
}

describe('GET /api/orders/stream', () => {
  beforeEach(() => jest.clearAllMocks());

  it('인증된 관리자에게 SSE 스트림을 반환한다', async () => {
    mockAuthenticateAdmin.mockReturnValue({
      sub: 1,
      role: 'ADMIN',
      storeId: 'store-001',
      iat: 0,
      exp: 9999999999,
    });

    const mockStream = new ReadableStream();
    (mockSseManager.createStream as jest.Mock).mockReturnValue(mockStream);

    const request = createMockRequest('Bearer valid-token');
    const response = await GET(request);

    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(mockSseManager.createStream).toHaveBeenCalled();
  });

  it('인증 실패 시 401을 반환한다', async () => {
    mockAuthenticateAdmin.mockImplementation(() => {
      throw new UnauthorizedError();
    });

    const request = createMockRequest();
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
