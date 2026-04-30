import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z, ZodSchema } from 'zod';

/**
 * 요청 본문 검증 유틸리티 (Zod 기반)
 * SECURITY-05: 모든 API 파라미터 입력 검증
 */

export interface ValidationResult<T> {
  success: true;
  data: T;
}

export interface ValidationFailure {
  success: false;
  response: NextResponse;
}

/**
 * 요청 본문을 Zod 스키마로 검증합니다.
 * 성공 시 파싱된 데이터를, 실패 시 400 응답을 반환합니다.
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
): Promise<ValidationResult<T> | ValidationFailure> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, message: '요청 본문이 올바른 JSON 형식이 아닙니다.' },
        { status: 400 },
      ),
    };
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors as Record<string, string[]>;
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message: '입력값이 올바르지 않습니다.',
          errors,
        },
        { status: 400 },
      ),
    };
  }

  return { success: true, data: result.data };
}

/**
 * 쿼리 파라미터를 Zod 스키마로 검증합니다.
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>,
): ValidationResult<T> | ValidationFailure {
  const params = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(params);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors as Record<string, string[]>;
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message: '쿼리 파라미터가 올바르지 않습니다.',
          errors,
        },
        { status: 400 },
      ),
    };
  }

  return { success: true, data: result.data };
}

// 공통 Zod 스키마
export const positiveIntSchema = z.coerce.number().int().positive();
export const uuidSchema = z.string().uuid();
export const dateStringSchema = z.string().datetime().optional();
