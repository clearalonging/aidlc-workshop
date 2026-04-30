# Unit 1 (Foundation) - 논리적 컴포넌트

---

## 1. 컴포넌트 구성

```
src/lib/
+-- auth/
|   +-- auth-service.ts       # 인증 비즈니스 로직
|   +-- jwt.ts                # JWT 생성/검증 유틸리티
|   +-- password.ts           # bcrypt 해싱/비교
+-- middleware/
|   +-- auth-middleware.ts    # JWT 검증 미들웨어
|   +-- validate-body.ts      # Zod 입력 검증 미들웨어
|   +-- rate-limiter.ts       # Rate Limiting
|   +-- security-headers.ts   # HTTP 보안 헤더
|   +-- error-handler.ts      # 글로벌 에러 핸들러
|   +-- request-logger.ts     # 요청 로깅 미들웨어
+-- sse/
|   +-- sse-manager.ts        # SSE 연결 관리 및 브로드캐스트
+-- logger/
|   +-- index.ts              # pino 로거 설정
+-- validators/
|   +-- auth-schemas.ts       # 인증 관련 Zod 스키마
|   +-- common-schemas.ts     # 공통 Zod 스키마
+-- prisma.ts                 # Prisma 클라이언트 싱글톤
+-- errors.ts                 # 커스텀 에러 클래스
```

---

## 2. 커스텀 에러 클래스

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code?: string
  ) { super(message); }
}

export class UnauthorizedError extends AppError {
  constructor(message = '인증이 필요합니다.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = '접근 권한이 없습니다.') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource}을(를) 찾을 수 없습니다.`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class TooManyRequestsError extends AppError {
  constructor(public retryAfter: number) {
    super('요청 횟수를 초과했습니다.', 429, 'TOO_MANY_REQUESTS');
  }
}
```

---

## 3. 공통 타입 정의

```typescript
// types/index.ts
export type UserRole = 'ADMIN' | 'TABLE';

export interface TokenPayload {
  sub: number;
  role: UserRole;
  storeId: string;
  tableNumber?: number;  // TABLE role만
  iat: number;
  exp: number;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Next.js Request 타입 확장
declare module 'next/server' {
  interface NextRequest {
    user?: TokenPayload;
    requestId?: string;
  }
}
```

---

## 4. Prisma 스키마 구조

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Store { ... }
model Admin { ... }
model Table { ... }
model TableSession { ... }
model Category { ... }
model MenuItem { ... }
model Order { ... }
model OrderItem { ... }
model LoginAttempt { ... }

enum OrderStatus {
  PENDING
  PREPARING
  COMPLETED
}
```

---

## 5. 환경 변수 검증

```typescript
// lib/env.ts - 시작 시 환경 변수 검증
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_ADMIN_EXPIRES_IN: z.string().default('16h'),
  JWT_TABLE_EXPIRES_IN: z.string().default('24h'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(process.env);
```
