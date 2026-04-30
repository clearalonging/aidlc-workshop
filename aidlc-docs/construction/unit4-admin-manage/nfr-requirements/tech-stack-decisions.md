# Unit 4 (Admin Manage) - Tech Stack Decisions

> Unit 4는 Unit 1 Foundation에서 결정된 기술 스택을 **그대로 사용**합니다.
> 이 문서는 Unit 4 고유의 기술 결정 사항만 기록합니다.

---

## 1. Unit 1 기술 스택 재사용 (변경 없음)

| 영역 | 기술 | 버전 | Unit 4 사용 |
|------|------|------|:----------:|
| 프레임워크 | Next.js (App Router) | 14.x | ✅ |
| 언어 | TypeScript | 5.x | ✅ |
| ORM | Prisma | 5.x | ✅ |
| 데이터베이스 | SQLite | 3.x | ✅ |
| 입력 검증 | Zod | 3.x | ✅ |
| 로깅 | pino | 9.x | ✅ |
| 테스트 | Jest + ts-jest | 29.x | ✅ |
| 코드 품질 | ESLint + Prettier | - | ✅ |

---

## 2. Unit 4 고유 기술 결정

### 2.1 추가 의존성: 없음
- Unit 4는 새로운 npm 패키지를 추가하지 않음
- 모든 기능은 기존 의존성으로 구현 가능
- 순서 변경 UI: 위/아래 화살표 버튼 (외부 라이브러리 불필요)

### 2.2 페이지네이션 구현
- **방식**: 서버 사이드 페이지네이션 (Prisma `skip`/`take`)
- **기본값**: 페이지당 20개
- **최대값**: 페이지당 100개
- **쿼리 파라미터**: `?page=1&limit=20&categoryId=1`
- **기존 스키마 활용**: `paginationSchema` (common-schemas.ts)

### 2.3 Rate Limiting 설정
- **메뉴 관리 API**: 분당 200회 (관리자 전용 완화)
- **구현**: Unit 1의 Rate Limiter 설정값 조정
- **적용 범위**: `/api/admin/menu/*` 경로

### 2.4 감사 로깅 구현
- **방식**: pino 로거 INFO 레벨
- **별도 테이블**: 불필요 (로그 파일 기반)
- **로그 형식**:
```json
{
  "level": "INFO",
  "requestId": "uuid",
  "message": "Menu created",
  "context": {
    "adminId": 1,
    "menuId": 5,
    "action": "CREATE",
    "menuName": "김치찌개"
  }
}
```

---

## 3. 프론트엔드 기술 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| 라우팅 | Next.js App Router | 기존 구조 유지 |
| 상태 관리 | React useState/useEffect | 단순 CRUD, 외부 라이브러리 불필요 |
| 폼 관리 | 직접 구현 (useState) | 폼 수가 적고 단순 |
| API 호출 | fetch API | 기존 패턴 유지, 추가 라이브러리 불필요 |
| 스타일링 | CSS Modules 또는 Tailwind (기존 프로젝트 설정 따름) | 기존 구조 유지 |

---

## 4. SECURITY 규칙 준수 현황 (Unit 4)

| SECURITY 규칙 | 상태 | Unit 4 구현 방법 |
|--------------|:----:|----------------|
| SECURITY-01 (암호화) | ✅ | Unit 1 설정 재사용 (SQLite, TLS) |
| SECURITY-02 (접근 로깅) | N/A | 네트워크 중간자 없음 |
| SECURITY-03 (앱 로깅) | ✅ | pino 로거, requestId, 민감 정보 제외 |
| SECURITY-04 (HTTP 헤더) | ✅ | Unit 1 미들웨어 자동 적용 |
| SECURITY-05 (입력 검증) | ✅ | Zod 스키마, Prisma 파라미터화 쿼리 |
| SECURITY-06 (최소 권한) | N/A | 클라우드 IAM 없음 |
| SECURITY-07 (네트워크) | N/A | 배포 환경 미정 |
| SECURITY-08 (접근 제어) | ✅ | authenticateAdmin, storeId 기반 object-level auth |
| SECURITY-09 (보안 강화) | ✅ | withErrorHandler, 에러 정보 노출 방지 |
| SECURITY-10 (공급망) | ✅ | 추가 의존성 없음, 기존 lock 파일 유지 |
| SECURITY-11 (보안 설계) | ✅ | MenuService 분리, Rate Limiting, 입력 검증 계층화 |
| SECURITY-12 (인증 관리) | ✅ | Unit 1 인증 시스템 재사용 |
| SECURITY-13 (무결성) | ✅ | Prisma 타입 안전 쿼리, 감사 로그 |
| SECURITY-14 (알림/모니터링) | 부분 | 로그 기반 (Unit 1과 동일) |
| SECURITY-15 (예외 처리) | ✅ | withErrorHandler, try/catch, fail-closed |
