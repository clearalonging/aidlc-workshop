import { z } from 'zod';

/**
 * 인증 관련 Zod 검증 스키마
 * SECURITY-05: 입력 검증
 */

export const adminLoginSchema = z.object({
  storeId: z
    .string()
    .min(1, '매장 식별자를 입력해 주세요.')
    .max(100, '매장 식별자가 너무 깁니다.'),
  username: z
    .string()
    .min(1, '사용자명을 입력해 주세요.')
    .max(50, '사용자명이 너무 깁니다.')
    .regex(/^[a-zA-Z0-9_]+$/, '사용자명은 영문, 숫자, 밑줄만 사용 가능합니다.'),
  password: z
    .string()
    .min(1, '비밀번호를 입력해 주세요.')
    .max(100, '비밀번호가 너무 깁니다.'),
});

export const tableLoginSchema = z.object({
  storeId: z
    .string()
    .min(1, '매장 식별자를 입력해 주세요.')
    .max(100, '매장 식별자가 너무 깁니다.'),
  tableNumber: z
    .number()
    .int('테이블 번호는 정수여야 합니다.')
    .positive('테이블 번호는 양수여야 합니다.'),
  password: z
    .string()
    .min(1, '비밀번호를 입력해 주세요.')
    .max(100, '비밀번호가 너무 깁니다.'),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type TableLoginInput = z.infer<typeof tableLoginSchema>;
