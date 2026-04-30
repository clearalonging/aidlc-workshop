import { OrderStatus } from '@prisma/client';

// ─── 인증 타입 ───────────────────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'TABLE';

export interface TokenPayload {
  sub: number;
  role: UserRole;
  storeId: string;
  tableNumber?: number; // TABLE role 전용
  iat: number;
  exp: number;
}

// ─── API 응답 타입 ────────────────────────────────────────────────────────────

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// ─── 페이지네이션 ─────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── 주문 타입 ────────────────────────────────────────────────────────────────

export { OrderStatus };

export interface OrderItemInput {
  menuItemId: number;
  quantity: number;
}

// ─── SSE 이벤트 타입 ──────────────────────────────────────────────────────────

export type SSEEventType =
  | 'new-order'
  | 'order-status-changed'
  | 'order-deleted'
  | 'table-completed'
  | 'connected';

export interface SSEEvent<T = unknown> {
  event: SSEEventType;
  data: T;
}

// ─── Next.js Request 확장 ─────────────────────────────────────────────────────

declare module 'next/server' {
  interface NextRequest {
    user?: TokenPayload;
    requestId?: string;
  }
}
