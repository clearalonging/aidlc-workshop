import jwt from 'jsonwebtoken';
import { env } from '@/lib/env';
import type { TokenPayload, UserRole } from '@/types';
import { UnauthorizedError } from '@/lib/errors';

/**
 * JWT 토큰 생성 및 검증 유틸리티
 * SECURITY-12: JWT 토큰 기반 세션 관리
 * SECURITY-08: 서버 사이드 토큰 검증
 */

interface CreateTokenOptions {
  sub: number;
  role: UserRole;
  storeId: string;
  tableNumber?: number;
  expiresIn: string;
}

/**
 * JWT 토큰을 생성합니다.
 */
export function createToken(options: CreateTokenOptions): string {
  const { sub, role, storeId, tableNumber, expiresIn } = options;

  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    sub,
    role,
    storeId,
    ...(tableNumber !== undefined && { tableNumber }),
  };

  return jwt.sign(payload, env.JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

/**
 * JWT 토큰을 검증하고 페이로드를 반환합니다.
 * SECURITY-08: 모든 요청에서 서버 사이드 토큰 검증
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('토큰이 만료되었습니다.');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('유효하지 않은 토큰입니다.');
    }
    throw new UnauthorizedError('토큰 검증에 실패했습니다.');
  }
}

/**
 * 관리자 JWT 토큰을 생성합니다. (16시간 만료)
 */
export function createAdminToken(adminId: number, storeId: string): string {
  return createToken({
    sub: adminId,
    role: 'ADMIN',
    storeId,
    expiresIn: env.JWT_ADMIN_EXPIRES_IN,
  });
}

/**
 * 테이블 JWT 토큰을 생성합니다. (24시간 만료)
 */
export function createTableToken(
  tableId: number,
  storeId: string,
  tableNumber: number,
): string {
  return createToken({
    sub: tableId,
    role: 'TABLE',
    storeId,
    tableNumber,
    expiresIn: env.JWT_TABLE_EXPIRES_IN,
  });
}
