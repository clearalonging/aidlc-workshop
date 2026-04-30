import { NextRequest } from 'next/server';
import {
  extractBearerToken,
  authenticate,
  authenticateAdmin,
  authenticateTable,
} from '../auth-middleware';
import { createAdminToken, createTableToken } from '@/lib/auth/jwt';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';

// 환경 변수 설정
process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long';
process.env.JWT_ADMIN_EXPIRES_IN = '16h';
process.env.JWT_TABLE_EXPIRES_IN = '24h';
process.env.BCRYPT_ROUNDS = '10';
process.env.DATABASE_URL = 'file:./test.db';
process.env.NODE_ENV = 'test';

/**
 * 테스트용 NextRequest 생성 헬퍼
 */
function createMockRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader) {
    headers['authorization'] = authHeader;
  }
  return new NextRequest('http://localhost/api/test', { headers });
}

/**
 * 인증 미들웨어 단위 테스트
 */
describe('auth-middleware', () => {
  describe('extractBearerToken', () => {
    it('Bearer 토큰을 올바르게 추출해야 한다', () => {
      const token = 'test-token-value';
      const request = createMockRequest(`Bearer ${token}`);

      const result = extractBearerToken(request);
      expect(result).toBe(token);
    });

    it('Authorization 헤더가 없으면 null을 반환해야 한다', () => {
      const request = createMockRequest();
      expect(extractBearerToken(request)).toBeNull();
    });

    it('Bearer 형식이 아니면 null을 반환해야 한다', () => {
      const request = createMockRequest('Basic dXNlcjpwYXNz');
      expect(extractBearerToken(request)).toBeNull();
    });
  });

  describe('authenticate', () => {
    it('유효한 토큰으로 인증 성공 시 페이로드를 반환해야 한다', () => {
      const token = createAdminToken(1, 'store-001');
      const request = createMockRequest(`Bearer ${token}`);

      const payload = authenticate(request);
      expect(payload.sub).toBe(1);
      expect(payload.role).toBe('ADMIN');
    });

    it('토큰이 없으면 UnauthorizedError를 throw해야 한다', () => {
      const request = createMockRequest();
      expect(() => authenticate(request)).toThrow(UnauthorizedError);
    });

    it('유효하지 않은 토큰은 UnauthorizedError를 throw해야 한다', () => {
      const request = createMockRequest('Bearer invalid.token.here');
      expect(() => authenticate(request)).toThrow(UnauthorizedError);
    });
  });

  describe('authenticateAdmin', () => {
    it('관리자 토큰으로 인증 성공해야 한다', () => {
      const token = createAdminToken(1, 'store-001');
      const request = createMockRequest(`Bearer ${token}`);

      const payload = authenticateAdmin(request);
      expect(payload.role).toBe('ADMIN');
    });

    it('테이블 토큰으로 관리자 인증 시 ForbiddenError를 throw해야 한다', () => {
      const token = createTableToken(1, 'store-001', 3);
      const request = createMockRequest(`Bearer ${token}`);

      expect(() => authenticateAdmin(request)).toThrow(ForbiddenError);
    });
  });

  describe('authenticateTable', () => {
    it('테이블 토큰으로 인증 성공해야 한다', () => {
      const token = createTableToken(1, 'store-001', 3);
      const request = createMockRequest(`Bearer ${token}`);

      const payload = authenticateTable(request);
      expect(payload.role).toBe('TABLE');
      expect(payload.tableNumber).toBe(3);
    });

    it('관리자 토큰으로 테이블 인증 시 ForbiddenError를 throw해야 한다', () => {
      const token = createAdminToken(1, 'store-001');
      const request = createMockRequest(`Bearer ${token}`);

      expect(() => authenticateTable(request)).toThrow(ForbiddenError);
    });
  });
});
