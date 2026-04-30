import { createAdminToken, createTableToken, verifyToken } from '../jwt';
import { UnauthorizedError } from '@/lib/errors';

// 테스트용 환경 변수 설정
process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long';
process.env.JWT_ADMIN_EXPIRES_IN = '16h';
process.env.JWT_TABLE_EXPIRES_IN = '24h';
process.env.BCRYPT_ROUNDS = '10';
process.env.DATABASE_URL = 'file:./test.db';
process.env.NODE_ENV = 'test';

/**
 * JWT 유틸리티 단위 테스트
 */
describe('JWT utilities', () => {
  describe('createAdminToken', () => {
    it('관리자 토큰을 생성해야 한다', () => {
      const token = createAdminToken(1, 'store-001');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT 형식
    });

    it('생성된 토큰에 올바른 페이로드가 포함되어야 한다', () => {
      const adminId = 1;
      const storeId = 'store-001';
      const token = createAdminToken(adminId, storeId);
      const payload = verifyToken(token);

      expect(payload.sub).toBe(adminId);
      expect(payload.role).toBe('ADMIN');
      expect(payload.storeId).toBe(storeId);
      expect(payload.tableNumber).toBeUndefined();
    });
  });

  describe('createTableToken', () => {
    it('테이블 토큰을 생성해야 한다', () => {
      const token = createTableToken(1, 'store-001', 3);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('생성된 토큰에 테이블 번호가 포함되어야 한다', () => {
      const tableId = 1;
      const storeId = 'store-001';
      const tableNumber = 3;
      const token = createTableToken(tableId, storeId, tableNumber);
      const payload = verifyToken(token);

      expect(payload.sub).toBe(tableId);
      expect(payload.role).toBe('TABLE');
      expect(payload.storeId).toBe(storeId);
      expect(payload.tableNumber).toBe(tableNumber);
    });
  });

  describe('verifyToken', () => {
    it('유효한 토큰을 검증해야 한다', () => {
      const token = createAdminToken(1, 'store-001');
      const payload = verifyToken(token);

      expect(payload).toBeDefined();
      expect(payload.sub).toBe(1);
    });

    it('잘못된 토큰은 UnauthorizedError를 throw해야 한다', () => {
      expect(() => verifyToken('invalid.token.here')).toThrow(UnauthorizedError);
    });

    it('변조된 토큰은 UnauthorizedError를 throw해야 한다', () => {
      const token = createAdminToken(1, 'store-001');
      const tamperedToken = token.slice(0, -5) + 'xxxxx';

      expect(() => verifyToken(tamperedToken)).toThrow(UnauthorizedError);
    });
  });
});
