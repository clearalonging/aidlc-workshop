import { loginAdmin, loginTable } from '../auth-service';
import { UnauthorizedError, TooManyRequestsError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '../password';

// 환경 변수 설정
process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long';
process.env.JWT_ADMIN_EXPIRES_IN = '16h';
process.env.JWT_TABLE_EXPIRES_IN = '24h';
process.env.BCRYPT_ROUNDS = '10';
process.env.DATABASE_URL = 'file:./test.db';
process.env.NODE_ENV = 'test';

// Prisma 모킹
jest.mock('@/lib/prisma', () => ({
  prisma: {
    store: { findUnique: jest.fn() },
    admin: { findUnique: jest.fn() },
    table: { findUnique: jest.fn() },
    loginAttempt: {
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

/**
 * AuthService 단위 테스트
 */
describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loginAdmin', () => {
    const storeId = 'store-001';
    const username = 'admin';
    const password = 'admin1234';

    it('올바른 자격증명으로 로그인 성공 시 토큰을 반환해야 한다', async () => {
      const passwordHash = await hashPassword(password);

      (mockPrisma.store.findUnique as jest.Mock).mockResolvedValue({ id: storeId, name: '테스트 매장' });
      (mockPrisma.loginAttempt.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.admin.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        storeId,
        username,
        passwordHash,
      });
      (mockPrisma.loginAttempt.create as jest.Mock).mockResolvedValue({});

      const result = await loginAdmin(storeId, username, password);

      expect(result.token).toBeDefined();
      expect(result.adminId).toBe(1);
      expect(result.expiresIn).toBe('16h');
    });

    it('존재하지 않는 매장은 UnauthorizedError를 throw해야 한다', async () => {
      (mockPrisma.store.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(loginAdmin(storeId, username, password)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('잘못된 비밀번호는 UnauthorizedError를 throw해야 한다', async () => {
      const passwordHash = await hashPassword('correctPassword');

      (mockPrisma.store.findUnique as jest.Mock).mockResolvedValue({ id: storeId });
      (mockPrisma.loginAttempt.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.admin.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        storeId,
        username,
        passwordHash,
      });
      (mockPrisma.loginAttempt.create as jest.Mock).mockResolvedValue({});

      await expect(loginAdmin(storeId, username, 'wrongPassword')).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('로그인 시도 횟수 초과 시 TooManyRequestsError를 throw해야 한다', async () => {
      (mockPrisma.store.findUnique as jest.Mock).mockResolvedValue({ id: storeId });
      (mockPrisma.loginAttempt.count as jest.Mock).mockResolvedValue(5);
      (mockPrisma.loginAttempt.findFirst as jest.Mock).mockResolvedValue({
        attemptedAt: new Date(Date.now() - 5 * 60 * 1000), // 5분 전
      });

      await expect(loginAdmin(storeId, username, password)).rejects.toThrow(
        TooManyRequestsError,
      );
    });
  });

  describe('loginTable', () => {
    const storeId = 'store-001';
    const tableNumber = 1;
    const password = '1234';

    it('올바른 자격증명으로 테이블 로그인 성공 시 토큰을 반환해야 한다', async () => {
      const passwordHash = await hashPassword(password);

      (mockPrisma.store.findUnique as jest.Mock).mockResolvedValue({ id: storeId });
      (mockPrisma.table.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        storeId,
        tableNumber,
        passwordHash,
      });

      const result = await loginTable(storeId, tableNumber, password);

      expect(result.token).toBeDefined();
      expect(result.tableId).toBe(1);
      expect(result.tableNumber).toBe(tableNumber);
    });

    it('존재하지 않는 테이블은 UnauthorizedError를 throw해야 한다', async () => {
      (mockPrisma.store.findUnique as jest.Mock).mockResolvedValue({ id: storeId });
      (mockPrisma.table.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(loginTable(storeId, tableNumber, password)).rejects.toThrow(
        UnauthorizedError,
      );
    });
  });
});
