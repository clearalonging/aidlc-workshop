# 테이블오더 서비스 - 컴포넌트 의존성

---

## 1. 의존성 매트릭스

| 컴포넌트 | 의존 대상 | 의존 유형 |
|----------|----------|----------|
| CustomerUI | AuthAPI, MenuAPI, OrderAPI | HTTP (API 호출) |
| AdminUI | AuthAPI, MenuAPI, OrderAPI, TableAPI | HTTP (API 호출), SSE |
| AuthAPI | AuthService, Middleware | 직접 호출 |
| MenuAPI | MenuService, Middleware | 직접 호출 |
| OrderAPI | OrderService, SSEManager, Middleware | 직접 호출 |
| TableAPI | TableService, Middleware | 직접 호출 |
| AuthService | Database (Prisma) | 직접 호출 |
| MenuService | Database (Prisma) | 직접 호출 |
| OrderService | Database (Prisma), MenuService, SSEManager | 직접 호출 |
| TableService | Database (Prisma), AuthService, SSEManager | 직접 호출 |
| SSEManager | - (독립) | - |
| Middleware | AuthService (토큰 검증) | 직접 호출 |

---

## 2. 레이어 의존성 규칙

```
+-------------------+
| Presentation      |  CustomerUI, AdminUI
| (Next.js Pages)   |
+--------+----------+
         | HTTP / SSE
+--------v----------+
| API Layer         |  AuthAPI, MenuAPI, OrderAPI, TableAPI
| (Route Handlers)  |
+--------+----------+
         | Direct Call
+--------v----------+
| Service Layer     |  AuthService, MenuService, OrderService, TableService
| (Business Logic)  |  SSEManager
+--------+----------+
         | Direct Call
+--------v----------+
| Data Access       |  Prisma ORM
| (Database)        |  SQLite
+-------------------+
```

**규칙:**
- 상위 레이어는 하위 레이어만 호출 가능 (단방향)
- 같은 레이어 내 서비스 간 호출 허용 (OrderService → MenuService)
- Presentation → API: HTTP 요청만 사용
- API → Service: 직접 함수 호출
- Service → Data Access: Prisma Client 사용

---

## 3. 통신 패턴

| 패턴 | 사용처 | 설명 |
|------|--------|------|
| **Request-Response** | 모든 REST API | 동기 HTTP 요청/응답 |
| **Server-Sent Events** | 주문 실시간 모니터링 | 서버→클라이언트 단방향 스트림 |
| **Local Storage** | 장바구니, 테이블 인증 정보 | 클라이언트 측 영속 저장 |
| **JWT Bearer Token** | 인증된 API 요청 | Authorization 헤더 |

---

## 4. 데이터 흐름

### 고객 주문 데이터 흐름
```
고객 장바구니 (localStorage)
  → POST /api/orders (OrderAPI)
    → OrderService.createOrder()
      → MenuService.getMenuById() (검증)
      → Prisma (저장)
      → SSEManager.broadcast() (실시간 알림)
        → AdminUI (대시보드 업데이트)
```

### 관리자 인증 데이터 흐름
```
관리자 로그인 폼 (AdminUI)
  → POST /api/auth/admin/login (AuthAPI)
    → AuthService.loginAdmin()
      → Prisma (사용자 조회)
      → bcrypt (비밀번호 검증)
      → JWT (토큰 생성)
    → 응답: { token, expiresAt }
  → localStorage (토큰 저장)
  → 이후 요청: Authorization: Bearer {token}
```
