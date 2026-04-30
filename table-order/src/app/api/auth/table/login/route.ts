import { NextRequest, NextResponse } from 'next/server';
import { loginTable } from '@/lib/auth/auth-service';
import { validateBody } from '@/lib/middleware/validate-body';
import { handleApiError } from '@/lib/middleware/error-handler';
import { tableLoginSchema } from '@/lib/validators/auth-schemas';

/**
 * POST /api/auth/table/login
 * 테이블 태블릿 로그인 API
 * CS-01: 테이블 자동 로그인
 * SECURITY-12: 인증 및 자격증명 관리
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 입력 검증 (SECURITY-05)
    const validation = await validateBody(request, tableLoginSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { storeId, tableNumber, password } = validation.data;

    // 테이블 로그인
    const result = await loginTable(storeId, tableNumber, password);

    return NextResponse.json(
      {
        success: true,
        data: {
          token: result.token,
          expiresIn: result.expiresIn,
          tableId: result.tableId,
          tableNumber: result.tableNumber,
        },
        message: '로그인에 성공했습니다.',
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
