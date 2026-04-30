# Unit 1 (Foundation) - 코드 생성 요약

## 생성된 파일 목록

### 프로젝트 설정
| 파일 | 설명 |
|------|------|
| `table-order/package.json` | 의존성 및 스크립트 |
| `table-order/tsconfig.json` | TypeScript 설정 |
| `table-order/next.config.ts` | Next.js 설정 |
| `table-order/.env.example` | 환경 변수 예시 |
| `table-order/.gitignore` | Git 무시 파일 |
| `table-order/eslint.config.mjs` | ESLint 설정 |
| `table-order/jest.config.ts` | Jest 테스트 설정 |

### 앱 기반
| 파일 | 설명 |
|------|------|
| `src/app/layout.tsx` | 루트 레이아웃 |
| `src/app/globals.css` | 전역 스타일 |
| `src/middleware.ts` | Next.js 미들웨어 (보안 헤더, Rate Limiting, 로깅) |

### 데이터베이스
| 파일 | 설명 |
|------|------|
| `prisma/schema.prisma` | Prisma 스키마 (9개 모델) |
| `prisma/seed.ts` | 시드 데이터 (매장, 관리자, 카테고리, 메뉴, 테이블) |

### 공통 기반
| 파일 | 설명 |
|------|------|
| `src/types/index.ts` | 공통 TypeScript 타입 |
| `src/lib/errors.ts` | 커스텀 에러 클래스 (7개) |
| `src/lib/env.ts` | 환경 변수 검증 (Zod) |
| `src/lib/prisma.ts` | Prisma 클라이언트 싱글톤 |
| `src/lib/logger/index.ts` | pino 구조화 로거 |

### 인증 서비스
| 파일 | 설명 |
|------|------|
| `src/lib/auth/password.ts` | bcrypt 해싱/검증 |
| `src/lib/auth/jwt.ts` | JWT 생성/검증 |
| `src/lib/auth/auth-service.ts` | 인증 비즈니스 로직 |

### 미들웨어
| 파일 | 설명 |
|------|------|
| `src/lib/middleware/security-headers.ts` | HTTP 보안 헤더 |
| `src/lib/middleware/request-logger.ts` | 요청 로깅 |
| `src/lib/middleware/rate-limiter.ts` | Rate Limiting (인메모리) |
| `src/lib/middleware/auth-middleware.ts` | JWT 인증 미들웨어 |
| `src/lib/middleware/validate-body.ts` | Zod 입력 검증 |
| `src/lib/middleware/error-handler.ts` | 글로벌 에러 핸들러 |

### SSE
| 파일 | 설명 |
|------|------|
| `src/lib/sse/sse-manager.ts` | SSE 연결 관리 및 브로드캐스트 |

### 검증 스키마
| 파일 | 설명 |
|------|------|
| `src/lib/validators/auth-schemas.ts` | 인증 Zod 스키마 |
| `src/lib/validators/common-schemas.ts` | 공통 Zod 스키마 |

### API Route Handlers
| 파일 | 스토리 | 설명 |
|------|--------|------|
| `src/app/api/auth/admin/login/route.ts` | AS-01, AS-02 | 관리자 로그인 |
| `src/app/api/auth/table/login/route.ts` | CS-01 | 테이블 자동 로그인 |

### 단위 테스트
| 파일 | 커버리지 대상 |
|------|-------------|
| `src/lib/auth/__tests__/password.test.ts` | hashPassword, comparePassword |
| `src/lib/auth/__tests__/jwt.test.ts` | createAdminToken, createTableToken, verifyToken |
| `src/lib/auth/__tests__/auth-service.test.ts` | loginAdmin, loginTable |
| `src/lib/sse/__tests__/sse-manager.test.ts` | SSEManager (addClient, removeClient, broadcast) |
| `src/lib/middleware/__tests__/auth-middleware.test.ts` | extractBearerToken, authenticate, authenticateAdmin, authenticateTable |

## 구현된 스토리
- ✅ CS-01: 테이블 자동 로그인 (테이블 로그인 API)
- ✅ AS-01: 관리자 로그인 (관리자 로그인 API)
- ✅ AS-02: 관리자 세션 유지 및 자동 로그아웃 (JWT 16시간 만료)

## SECURITY 규칙 준수
- SECURITY-03: pino 구조화 로깅, requestId 포함
- SECURITY-04: CSP, HSTS, X-Frame-Options 등 보안 헤더
- SECURITY-05: Zod 스키마 입력 검증, Prisma 파라미터화 쿼리
- SECURITY-08: JWT 미들웨어, 역할 기반 접근 제어
- SECURITY-09: 에러 정보 노출 방지 (프로덕션 일반 메시지)
- SECURITY-11: Rate Limiting, 관심사 분리, Brute-force 방어
- SECURITY-12: bcrypt 해싱, JWT 토큰, 로그인 시도 제한
- SECURITY-15: 글로벌 에러 핸들러, Fail-Closed 패턴
