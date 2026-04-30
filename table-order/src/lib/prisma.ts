import { PrismaClient } from '@prisma/client';

/**
 * Prisma 클라이언트 싱글톤
 * Next.js 개발 환경에서 핫 리로드 시 다중 인스턴스 생성 방지
 * SECURITY-15: 리소스 정리 패턴
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
