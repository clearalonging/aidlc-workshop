# Unit 1 (Foundation) - Code Generation Plan

## 유닛 컨텍스트
- **유닛**: Unit 1 — Foundation
- **담당**: 3명 공동
- **관련 스토리**: CS-01, AS-01, AS-02
- **의존성**: 없음 (다른 유닛의 선행 조건)
- **코드 위치**: 워크스페이스 루트 (Next.js 프로젝트)

## 생성 범위
1. Next.js 프로젝트 초기 구조
2. Prisma 스키마 및 마이그레이션
3. 공통 타입 및 에러 클래스
4. 환경 변수 설정
5. 인증 서비스 (AuthService, JWT, bcrypt)
6. 미들웨어 (인증, 검증, Rate Limiting, 보안 헤더, 에러 핸들링, 로깅)
7. SSEManager
8. 인증 API Route Handlers
9. 단위 테스트 (AuthService, Middleware, SSEManager)
10. 설정 파일 (ESLint, Prettier, Jest, TypeScript)

---

## 실행 계획

### Step 1: 프로젝트 초기 구조 생성
- [x] 1.1 `package.json` 생성
- [x] 1.2 `tsconfig.json` 생성
- [x] 1.3 `next.config.ts` 생성
- [x] 1.4 `.env.example` 생성
- [x] 1.5 `.gitignore` 생성
- [x] 1.6 `eslint.config.mjs` 생성
- [x] 1.7 `jest.config.ts` 생성
- [x] 1.8 `src/app/layout.tsx` 생성 (루트 레이아웃)

### Step 2: Prisma 스키마 및 시드 데이터
- [x] 2.1 `prisma/schema.prisma` 생성 (전체 엔티티)
- [x] 2.2 `prisma/seed.ts` 생성 (관리자 계정, 샘플 데이터)

### Step 3: 공통 기반 코드
- [x] 3.1 `src/types/index.ts` 생성 (공통 타입)
- [x] 3.2 `src/lib/errors.ts` 생성 (커스텀 에러 클래스)
- [x] 3.3 `src/lib/env.ts` 생성 (환경 변수 검증)
- [x] 3.4 `src/lib/prisma.ts` 생성 (Prisma 싱글톤)
- [x] 3.5 `src/lib/logger/index.ts` 생성 (pino 로거)

### Step 4: 인증 서비스
- [x] 4.1 `src/lib/auth/password.ts` 생성 (bcrypt 유틸리티)
- [x] 4.2 `src/lib/auth/jwt.ts` 생성 (JWT 생성/검증)
- [x] 4.3 `src/lib/auth/auth-service.ts` 생성 (AuthService)

### Step 5: 미들웨어
- [x] 5.1 `src/lib/middleware/security-headers.ts` 생성
- [x] 5.2 `src/lib/middleware/request-logger.ts` 생성
- [x] 5.3 `src/lib/middleware/rate-limiter.ts` 생성
- [x] 5.4 `src/lib/middleware/auth-middleware.ts` 생성
- [x] 5.5 `src/lib/middleware/validate-body.ts` 생성
- [x] 5.6 `src/lib/middleware/error-handler.ts` 생성
- [x] 5.7 `src/middleware.ts` 생성 (Next.js 미들웨어 진입점)

### Step 6: SSEManager
- [x] 6.1 `src/lib/sse/sse-manager.ts` 생성

### Step 7: Zod 검증 스키마
- [x] 7.1 `src/lib/validators/auth-schemas.ts` 생성
- [x] 7.2 `src/lib/validators/common-schemas.ts` 생성

### Step 8: 인증 API Route Handlers (CS-01, AS-01, AS-02)
- [x] 8.1 `src/app/api/auth/admin/login/route.ts` 생성
- [x] 8.2 `src/app/api/auth/table/login/route.ts` 생성

### Step 9: 단위 테스트
- [x] 9.1 `src/lib/auth/__tests__/password.test.ts` 생성
- [x] 9.2 `src/lib/auth/__tests__/jwt.test.ts` 생성
- [x] 9.3 `src/lib/auth/__tests__/auth-service.test.ts` 생성
- [x] 9.4 `src/lib/sse/__tests__/sse-manager.test.ts` 생성
- [x] 9.5 `src/lib/middleware/__tests__/auth-middleware.test.ts` 생성

### Step 10: 코드 요약 문서
- [x] 10.1 `aidlc-docs/construction/unit1-foundation/code/code-summary.md` 생성
