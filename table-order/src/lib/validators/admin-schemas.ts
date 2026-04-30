import { z } from 'zod';

/**
 * 관리자(Admin Monitor) 관련 Zod 검증 스키마
 * Unit 3 (Admin Monitor)
 * SECURITY-05: 입력 검증
 */

/**
 * 테이블 과거 이력 조회 쿼리 파라미터 스키마
 * AS-10: 과거 주문 내역 조회 (날짜 필터링)
 */
export const tableHistoryQuerySchema = z
  .object({
    dateFrom: z
      .string()
      .datetime({ message: '올바른 날짜 형식이 아닙니다. (ISO 8601)' })
      .optional(),
    dateTo: z
      .string()
      .datetime({ message: '올바른 날짜 형식이 아닙니다. (ISO 8601)' })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.dateFrom && data.dateTo) {
        return new Date(data.dateFrom) <= new Date(data.dateTo);
      }
      return true;
    },
    { message: '시작 날짜는 종료 날짜보다 이전이어야 합니다.' },
  );

export type TableHistoryQueryInput = z.infer<typeof tableHistoryQuerySchema>;
