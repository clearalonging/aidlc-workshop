import { z } from 'zod';

/**
 * 공통 Zod 검증 스키마
 * SECURITY-05: 입력 검증
 */

// 양의 정수 ID
export const idSchema = z.coerce.number().int().positive();

// UUID
export const uuidSchema = z.string().uuid();

// 날짜 필터
export const dateFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// 페이지네이션
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// 메뉴 관련
export const menuItemSchema = z.object({
  categoryId: z.number().int().positive('카테고리를 선택해 주세요.'),
  name: z
    .string()
    .min(1, '메뉴명을 입력해 주세요.')
    .max(100, '메뉴명은 100자 이내로 입력해 주세요.'),
  price: z
    .number()
    .int('가격은 정수여야 합니다.')
    .min(100, '가격은 100원 이상이어야 합니다.')
    .max(1000000, '가격은 1,000,000원 이하여야 합니다.'),
  description: z.string().max(500, '설명은 500자 이내로 입력해 주세요.').optional(),
  imageUrl: z.string().url('올바른 URL 형식이 아닙니다.').max(2000).optional().or(z.literal('')),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateMenuItemSchema = menuItemSchema.partial();

export const menuOrderSchema = z.array(
  z.object({
    id: z.number().int().positive(),
    sortOrder: z.number().int().min(0),
  }),
);

// 주문 관련
export const orderItemInputSchema = z.object({
  menuItemId: z.number().int().positive('메뉴를 선택해 주세요.'),
  quantity: z
    .number()
    .int('수량은 정수여야 합니다.')
    .positive('수량은 1 이상이어야 합니다.'),
});

export const createOrderSchema = z.object({
  items: z
    .array(orderItemInputSchema)
    .min(1, '주문 항목이 없습니다.'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PREPARING', 'COMPLETED'], {
    errorMap: () => ({ message: '올바른 주문 상태가 아닙니다.' }),
  }),
});

// 테이블 관련
export const setupTableSchema = z.object({
  tableNumber: z
    .number()
    .int('테이블 번호는 정수여야 합니다.')
    .positive('테이블 번호는 양수여야 합니다.'),
  password: z
    .string()
    .min(4, '비밀번호는 4자 이상이어야 합니다.')
    .max(20, '비밀번호는 20자 이내여야 합니다.'),
});

export type DateFilterInput = z.infer<typeof dateFilterSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type MenuItemInput = z.infer<typeof menuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type SetupTableInput = z.infer<typeof setupTableSchema>;

// 메뉴 순서 이동 (위/아래)
export const menuSwapOrderSchema = z.object({
  direction: z.enum(['up', 'down'], {
    errorMap: () => ({ message: '방향은 up 또는 down이어야 합니다.' }),
  }),
});

// 관리자 메뉴 조회 쿼리
export const adminMenuQuerySchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type MenuSwapOrderInput = z.infer<typeof menuSwapOrderSchema>;
export type AdminMenuQueryInput = z.infer<typeof adminMenuQuerySchema>;
