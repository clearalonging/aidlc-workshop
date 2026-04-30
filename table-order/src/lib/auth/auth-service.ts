import { prisma } from '@/lib/prisma';
import { comparePassword, hashPassword } from './password';
import { createAdminToken, createTableToken } from './jwt';
import { UnauthorizedError, TooManyRequestsError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';

/**
 * 인증 서비스
 * SECURITY-12: 인증 및 자격증명 관리
 * SECURITY-11: 보안 설계 원칙 (관심사 분리)
 */

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_BLOCK_MINUTES = 15;

export interface AdminLoginResult {
  token: string;
  expiresIn: string;
  adminId: number;
}

export interface TableLoginResult {
  token: string;
  expiresIn: string;
  tableId: number;
  tableNumber: number;
}

/**
 * 관리자 로그인
 * CS-01, AS-01 관련
 */
export async function loginAdmin(
  storeId: string,
  username: string,
  password: string,
): Promise<AdminLoginResult> {
  // 1. 매장 존재 확인
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    throw new UnauthorizedError('인증 정보가 올바르지 않습니다.');
  }

  // 2. 로그인 시도 횟수 확인 (Brute-force 방지)
  await checkLoginAttempts(username);

  // 3. 관리자 계정 조회
  const admin = await prisma.admin.findUnique({
    where: { storeId_username: { storeId, username } },
  });

  if (!admin) {
    await recordLoginAttempt(username, false);
    throw new UnauthorizedError('인증 정보가 올바르지 않습니다.');
  }

  // 4. 비밀번호 검증
  const isPasswordValid = await comparePassword(password, admin.passwordHash);
  if (!isPasswordValid) {
    await recordLoginAttempt(username, false);
    logger.warn({ username, storeId }, 'Admin login failed: invalid password');
    throw new UnauthorizedError('인증 정보가 올바르지 않습니다.');
  }

  // 5. 로그인 성공 기록
  await recordLoginAttempt(username, true);
  logger.info({ adminId: admin.id, storeId }, 'Admin login successful');

  // 6. JWT 토큰 발급
  const token = createAdminToken(admin.id, storeId);

  return {
    token,
    expiresIn: env.JWT_ADMIN_EXPIRES_IN,
    adminId: admin.id,
  };
}

/**
 * 테이블 로그인 (자동 로그인용)
 * CS-01 관련
 */
export async function loginTable(
  storeId: string,
  tableNumber: number,
  password: string,
): Promise<TableLoginResult> {
  // 1. 매장 존재 확인
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    throw new UnauthorizedError('인증 정보가 올바르지 않습니다.');
  }

  // 2. 테이블 조회
  const table = await prisma.table.findUnique({
    where: { storeId_tableNumber: { storeId, tableNumber } },
  });

  if (!table) {
    throw new UnauthorizedError('인증 정보가 올바르지 않습니다.');
  }

  // 3. 비밀번호 검증
  const isPasswordValid = await comparePassword(password, table.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('인증 정보가 올바르지 않습니다.');
  }

  logger.info({ tableId: table.id, tableNumber, storeId }, 'Table login successful');

  // 4. JWT 토큰 발급
  const token = createTableToken(table.id, storeId, tableNumber);

  return {
    token,
    expiresIn: env.JWT_TABLE_EXPIRES_IN,
    tableId: table.id,
    tableNumber,
  };
}

/**
 * 테이블 비밀번호 설정 (초기 설정 시)
 */
export async function setTablePassword(
  tableId: number,
  newPassword: string,
): Promise<void> {
  const passwordHash = await hashPassword(newPassword);
  await prisma.table.update({
    where: { id: tableId },
    data: { passwordHash },
  });
}

/**
 * 로그인 시도 횟수 확인
 * SECURITY-12: Brute-force 방지
 */
async function checkLoginAttempts(identifier: string): Promise<void> {
  const blockWindowMs = LOGIN_BLOCK_MINUTES * 60 * 1000;
  const since = new Date(Date.now() - blockWindowMs);

  const failedAttempts = await prisma.loginAttempt.count({
    where: {
      identifier,
      success: false,
      attemptedAt: { gte: since },
    },
  });

  if (failedAttempts >= LOGIN_MAX_ATTEMPTS) {
    // 마지막 실패 시도 시각 조회
    const lastAttempt = await prisma.loginAttempt.findFirst({
      where: { identifier, success: false },
      orderBy: { attemptedAt: 'desc' },
    });

    if (lastAttempt) {
      const blockedUntil = new Date(lastAttempt.attemptedAt.getTime() + blockWindowMs);
      const retryAfterSeconds = Math.ceil((blockedUntil.getTime() - Date.now()) / 1000);
      if (retryAfterSeconds > 0) {
        throw new TooManyRequestsError(retryAfterSeconds);
      }
    }
  }
}

/**
 * 로그인 시도 기록
 */
async function recordLoginAttempt(
  identifier: string,
  success: boolean,
): Promise<void> {
  await prisma.loginAttempt.create({
    data: { identifier, success },
  });
}
