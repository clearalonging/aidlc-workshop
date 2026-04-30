import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * 글로벌 에러 핸들러
 * SECURITY-15: 예외 처리 및 Fail-Safe 기본값
 * SECURITY-09: 에러 정보 노출 방지
 */

/**
 * Route Handler에서 발생한 에러를 처리합니다.
 * 프로덕션 환경에서는 내부 정보를 노출하지 않습니다.
 */
export function handleApiError(
  error: unknown,
  requestId?: string,
): NextResponse {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 알려진 애플리케이션 에러
  if (error instanceof AppError) {
    logger.warn(
      {
        requestId,
        errorCode: error.code,
        statusCode: error.statusCode,
        message: error.message,
      },
      'Application error',
    );

    return NextResponse.json(
      {
        success: false,
        message: error.message,
        code: error.code,
      },
      { status: error.statusCode },
    );
  }

  // 예상치 못한 에러
  const errorMessage =
    error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error(
    {
      requestId,
      error: errorMessage,
      ...(isDevelopment && { stack: errorStack }),
    },
    'Unexpected error',
  );

  // 프로덕션: 일반 메시지만 반환 (SECURITY-09)
  return NextResponse.json(
    {
      success: false,
      message: '서버 오류가 발생했습니다.',
      ...(isDevelopment && { debug: errorMessage }),
    },
    { status: 500 },
  );
}

/**
 * Route Handler를 에러 핸들링으로 감싸는 래퍼
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
