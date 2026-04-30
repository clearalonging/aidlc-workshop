# 테이블오더 서비스 - Application Design (통합 문서)

---

## 1. 시스템 아키텍처 개요

Next.js 풀스택 모놀리식 아키텍처로, 4개 레이어로 구성됩니다:

| 레이어 | 구성 요소 | 기술 |
|--------|----------|------|
| **Presentation** | CustomerUI, AdminUI | Next.js App Router, React |
| **API** | AuthAPI, MenuAPI, OrderAPI, TableAPI | Next.js Route Handlers |
| **Service** | AuthService, MenuService, OrderService, TableService, SSEManager | TypeScript |
| **Data Access** | Prisma ORM | SQLite |

---

## 2. 컴포넌트 구성

### Presentation Layer (2개)
- **CustomerUI** (`/customer/*`): 고객 주문 인터페이스 — 메뉴 탐색, 장바구니, 주문, 내역 조회
- **AdminUI** (`/admin/*`): 관리자 운영 인터페이스 — 대시보드, 테이블 관리, 메뉴 관리

### API Layer (4개)
- **AuthAPI** (`/api/auth/*`): 테이블/관리자 인증, JWT 발급
- **MenuAPI** (`/api/menu/*`): 메뉴 CRUD, 카테고리별 조회
- **OrderAPI** (`/api/orders/*`): 주문 생성/조회/상태변경/삭제, SSE 스트림
- **TableAPI** (`/api/tables/*`): 테이블 설정, 이용 완료, 이력 조회

### Service Layer (5개)
- **AuthService**: 인증 로직 (bcrypt, JWT, 로그인 시도 제한)
- **MenuService**: 메뉴 CRUD 및 검증
- **OrderService**: 주문 생성/상태 관리, SSE 이벤트 발행
- **TableService**: 테이블 설정, 세션 라이프사이클, 이력 관리
- **SSEManager**: Server-Sent Events 연결 관리 및 브로드캐스트

### Common/Shared (3개)
- **Middleware**: 인증, 검증, Rate Limiting, 보안 헤더, 에러 핸들링, 로깅
- **Types**: TypeScript 타입 정의
- **Database**: Prisma 스키마, 마이그레이션, 시드 데이터

---

## 3. 핵심 서비스 상호작용

### 주문 생성 플로우
```
CustomerUI → OrderAPI → authMiddleware → OrderService
                                            +-> MenuService (메뉴 유효성)
                                            +-> Database (주문 저장)
                                            +-> SSEManager (실시간 알림)
                                                  +-> AdminUI (SSE 수신)
```

### 테이블 이용 완료 플로우
```
AdminUI → TableAPI → authMiddleware → TableService
                                        +-> Database (주문 이력 이동)
                                        +-> Database (세션 종료, 리셋)
                                        +-> SSEManager (실시간 알림)
```

### SSE 실시간 스트림
```
AdminUI → OrderAPI(/stream) → SSEManager.addClient()
OrderService/TableService → SSEManager.broadcast() → AdminUI
```

---

## 4. 의존성 규칙

- **단방향 의존성**: 상위 레이어 → 하위 레이어만 허용
- **같은 레이어 호출**: Service 간 호출 허용 (OrderService → MenuService)
- **통신 패턴**: REST (Request-Response), SSE (Server→Client 단방향), localStorage (클라이언트)
- **인증**: JWT Bearer Token (Authorization 헤더)

---

## 5. 보안 설계 원칙 (SECURITY-11 준수)

- **관심사 분리**: 인증(AuthService), 권한(Middleware), 비즈니스 로직(각 Service) 분리
- **심층 방어**: 입력 검증 + 인증 + 권한 확인 다중 레이어
- **Rate Limiting**: 공개 API 엔드포인트에 적용
- **오용 시나리오**: 로그인 brute-force 공격 → 시도 횟수 제한으로 방어

---

## 상세 문서 참조
- 컴포넌트 정의: `components.md`
- 메서드 시그니처: `component-methods.md`
- 서비스 오케스트레이션: `services.md`
- 의존성 관계: `component-dependency.md`
