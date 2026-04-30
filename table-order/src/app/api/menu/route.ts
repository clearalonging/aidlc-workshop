import { NextRequest, NextResponse } from 'next/server';
import { authenticateTable } from '@/lib/middleware/auth-middleware';
import { handleApiError } from '@/lib/middleware/error-handler';
import { getMenusByCategory } from '@/lib/services/menu-service';

/**
 * GET /api/menu
 * 카테고리별 메뉴 목록 조회 API
 * CS-02: 카테고리별 메뉴 목록 조회
 * CS-04: 카테고리 간 빠른 이동
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = authenticateTable(request);
    const categories = await getMenusByCategory(user.storeId);

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
