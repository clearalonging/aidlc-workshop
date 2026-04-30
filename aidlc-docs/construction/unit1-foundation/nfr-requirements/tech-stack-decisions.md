# Unit 1 (Foundation) - 기술 스택 결정

---

## 1. 핵심 기술 스택

| 영역 | 기술 | 버전 | 선택 이유 |
|------|------|------|----------|
| **프레임워크** | Next.js | 14.x (App Router) | 풀스택, SSR/API Routes 통합 |
| **언어** | TypeScript | 5.x | 타입 안전성, 개발 생산성 |
| **ORM** | Prisma | 5.x | SQLite 지원, 타입 안전 쿼리, 마이그레이션 |
| **데이터베이스** | SQLite | 3.x | 단일 매장, 경량, 설치 불필요 |
| **인증** | jsonwebtoken | 9.x | JWT 생성/검증 |
| **비밀번호 해싱** | bcryptjs | 2.x | bcrypt 구현 (순수 JS, 설치 용이) |
| **입력 검증** | Zod | 3.x | TypeScript 통합, 런타임 검증 |
| **로깅** | pino | 8.x | 구조화된 JSON 로깅, 고성능 |
| **Rate Limiting** | @upstash/ratelimit 또는 in-memory | - | 단순 구현 (단일 서버) |
| **테스트** | Jest + ts-jest | - | TypeScript 단위 테스트 |
| **코드 품질** | ESLint + Prettier | - | 코드 스타일 일관성 |

---

## 2. 환경 변수 목록

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `DATABASE_URL` | SQLite DB 파일 경로 | `file:./dev.db` |
| `JWT_SECRET` | JWT 서명 Secret (최소 32자) | `your-secret-key-min-32-chars` |
| `JWT_ADMIN_EXPIRES_IN` | 관리자 토큰 만료 | `16h` |
| `JWT_TABLE_EXPIRES_IN` | 테이블 토큰 만료 | `24h` |
| `BCRYPT_ROUNDS` | bcrypt cost factor | `12` |
| `RATE_LIMIT_LOGIN` | 로그인 Rate Limit (분당) | `10` |
| `RATE_LIMIT_API` | 일반 API Rate Limit (분당) | `100` |
| `NODE_ENV` | 실행 환경 | `development` / `production` |
| `NEXT_PUBLIC_APP_URL` | 앱 URL (CORS 설정용) | `http://localhost:3000` |

---

## 3. 프로젝트 의존성

### dependencies
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "@prisma/client": "^5.0.0",
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.3",
  "zod": "^3.0.0",
  "pino": "^8.0.0",
  "pino-pretty": "^10.0.0"
}
```

### devDependencies
```json
{
  "typescript": "^5.0.0",
  "prisma": "^5.0.0",
  "@types/node": "^20.0.0",
  "@types/react": "^18.0.0",
  "@types/jsonwebtoken": "^9.0.0",
  "@types/bcryptjs": "^2.4.0",
  "jest": "^29.0.0",
  "ts-jest": "^29.0.0",
  "@types/jest": "^29.0.0",
  "eslint": "^8.0.0",
  "eslint-config-next": "^14.0.0",
  "prettier": "^3.0.0"
}
```

---

## 4. SECURITY 규칙 준수 현황

| SECURITY 규칙 | 상태 | 구현 방법 |
|--------------|:----:|----------|
| SECURITY-01 (암호화) | ✅ | SQLite 파일 시스템 암호화 (배포 시 OS 레벨), TLS (HTTPS) |
| SECURITY-02 (접근 로깅) | N/A | 로드 밸런서/API 게이트웨이 없음 (단일 서버) |
| SECURITY-03 (앱 로깅) | ✅ | pino 구조화 로깅, requestId 포함 |
| SECURITY-04 (HTTP 헤더) | ✅ | Next.js 미들웨어로 보안 헤더 설정 |
| SECURITY-05 (입력 검증) | ✅ | Zod 스키마 검증, Prisma 파라미터화 쿼리 |
| SECURITY-06 (최소 권한) | N/A | 클라우드 IAM 없음 (로컬 SQLite) |
| SECURITY-07 (네트워크) | N/A | 배포 환경 미정 |
| SECURITY-08 (접근 제어) | ✅ | JWT 미들웨어, 역할 기반 접근 제어 |
| SECURITY-09 (보안 강화) | ✅ | 기본 자격증명 변경, 에러 정보 노출 방지 |
| SECURITY-10 (공급망) | ✅ | package-lock.json, 공식 레지스트리 |
| SECURITY-11 (보안 설계) | ✅ | AuthService 분리, Rate Limiting, 오용 시나리오 고려 |
| SECURITY-12 (인증 관리) | ✅ | bcrypt, JWT, Brute-force 방지, 세션 만료 |
| SECURITY-13 (무결성) | ✅ | Prisma 타입 안전 쿼리, 감사 로그 |
| SECURITY-14 (알림/모니터링) | 부분 | 로그 기반 (알림 시스템 미구현, 배포 환경 미정) |
| SECURITY-15 (예외 처리) | ✅ | 글로벌 에러 핸들러, try/catch, fail-closed |
