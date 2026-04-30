import { NextRequest, NextResponse } from 'next/server';
import { loginAdmin } from '@/lib/auth/auth-service';
import { validateBody } from '@/lib/middleware/validate-body';
import { handleApiError } from '@/lib/middleware/error-handler';
import { adminLoginSchema } from '@/lib/validators/auth-schemas';

/**
 * POST /api/auth/admin/login
 * 관리자 로그인 API
 * AS-01: 관리자 로그인
 * AS-02: 관리자 세션 유지 및 자동 로그아웃
 * SECURITY-12: 인증 및 자격증명 관리
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 입력 검증 (SECURITY-05)
    const validation = await validateBody(request, adminLoginSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { storeId, username, password } = validation.data;

    // 관리자 로그인
    const result = await loginAdmin(storeId, username, password);

    return NextResponse.json(
      {
        success: true,
        data: {
          token: result.token,
          expiresIn: result.expiresIn,
          adminId: result.adminId,
        },
        message: '로그인에 성공했습니다.',
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
