import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';
import type { UserRole, TokenPayload } from '@/types';

/**
 * JWT 인증 미들웨어 (Route Handler용)
 * SECURITY-08: 애플리케이션 레벨 접근 제어
 * SECURITY-12: 모든 요청에서 서버 사이드 토큰 검증
 */

/**
 * Authorization 헤더에서 Bearer 토큰을 추출합니다.
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * 요청에서 인증된 사용자 정보를 추출합니다.
 * 인증 실패 시 에러를 throw합니다.
 */
export function authenticate(request: NextRequest): TokenPayload {
  const token = extractBearerToken(request);
  if (!token) {
    throw new UnauthorizedError('인증 토큰이 필요합니다.');
  }
  return verifyToken(token);
}

/**
 * 특정 역할을 요구하는 인증 검증
 */
export function authenticateWithRole(
  request: NextRequest,
  requiredRole: UserRole,
): TokenPayload {
  const payload = authenticate(request);
  if (payload.role !== requiredRole) {
    throw new ForbiddenError('접근 권한이 없습니다.');
  }
  return payload;
}

/**
 * 관리자 인증 검증
 */
export function authenticateAdmin(request: NextRequest): TokenPayload {
  return authenticateWithRole(request, 'ADMIN');
}

/**
 * 테이블 인증 검증
 */
export function authenticateTable(request: NextRequest): TokenPayload {
  return authenticateWithRole(request, 'TABLE');
}

/**
 * Route Handler에서 인증 에러를 NextResponse로 변환하는 헬퍼
 */
export function handleAuthError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 401 },
    );
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 403 },
    );
  }
  return NextResponse.json(
    { success: false, message: '서버 오류가 발생했습니다.' },
    { status: 500 },
  );
}
