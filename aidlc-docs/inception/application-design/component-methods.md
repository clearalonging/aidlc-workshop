# 테이블오더 서비스 - 컴포넌트 메서드 정의

> **Note**: 상세 비즈니스 규칙은 Functional Design (CONSTRUCTION) 단계에서 정의됩니다.
> 여기서는 메서드 시그니처와 고수준 목적만 정의합니다.

---

## 1. AuthService

| 메서드 | 입력 | 출력 | 목적 |
|--------|------|------|------|
| `loginAdmin(storeId, username, password)` | string, string, string | `{ token: string, expiresAt: Date }` | 관리자 로그인 및 JWT 발급 |
| `loginTable(storeId, tableNumber, password)` | string, number, string | `{ token: string, tableId: number }` | 테이블 태블릿 로그인 |
| `verifyToken(token)` | string | `{ valid: boolean, payload: TokenPayload }` | JWT 토큰 검증 |
| `hashPassword(password)` | string | string | bcrypt 비밀번호 해싱 |
| `comparePassword(password, hash)` | string, string | boolean | 비밀번호 비교 검증 |
| `checkLoginAttempts(identifier)` | string | `{ allowed: boolean, remainingAttempts: number }` | 로그인 시도 횟수 확인 |
| `recordLoginAttempt(identifier, success)` | string, boolean | void | 로그인 시도 기록 |

---

## 2. MenuService

| 메서드 | 입력 | 출력 | 목적 |
|--------|------|------|------|
| `getMenusByCategory(storeId)` | string | `Category[]` (with MenuItems) | 카테고리별 메뉴 목록 조회 |
| `getMenuById(menuId)` | number | `MenuItem` | 메뉴 상세 조회 |
| `createMenu(data)` | `CreateMenuInput` | `MenuItem` | 메뉴 등록 |
| `updateMenu(menuId, data)` | number, `UpdateMenuInput` | `MenuItem` | 메뉴 수정 |
| `deleteMenu(menuId)` | number | void | 메뉴 삭제 |
| `updateMenuOrder(menuIds)` | `{ id: number, sortOrder: number }[]` | void | 메뉴 노출 순서 변경 |
| `validateMenuData(data)` | `CreateMenuInput` | `ValidationResult` | 메뉴 데이터 검증 |

---

## 3. OrderService

| 메서드 | 입력 | 출력 | 목적 |
|--------|------|------|------|
| `createOrder(tableId, sessionId, items)` | number, string, `OrderItemInput[]` | `Order` | 주문 생성 |
| `getOrdersBySession(sessionId)` | string | `Order[]` | 현재 세션 주문 조회 |
| `updateOrderStatus(orderId, status)` | number, `OrderStatus` | `Order` | 주문 상태 변경 |
| `deleteOrder(orderId)` | number | void | 주문 삭제 |
| `getOrderById(orderId)` | number | `Order` | 주문 상세 조회 |
| `calculateOrderTotal(items)` | `OrderItemInput[]` | number | 주문 총 금액 계산 |
| `broadcastOrderEvent(event)` | `OrderEvent` | void | SSE 이벤트 발행 |

---

## 4. TableService

| 메서드 | 입력 | 출력 | 목적 |
|--------|------|------|------|
| `setupTable(tableNumber, password)` | number, string | `Table` | 테이블 초기 설정 |
| `getTables()` | - | `Table[]` | 테이블 목록 조회 |
| `getTableById(tableId)` | number | `Table` | 테이블 상세 조회 |
| `startSession(tableId)` | number | `TableSession` | 테이블 세션 시작 |
| `completeTable(tableId)` | number | void | 테이블 이용 완료 처리 |
| `getOrderHistory(tableId, dateFilter?)` | number, `DateFilter?` | `OrderHistory[]` | 과거 주문 내역 조회 |
| `getActiveSession(tableId)` | number | `TableSession \| null` | 현재 활성 세션 조회 |

---

## 5. SSEManager

| 메서드 | 입력 | 출력 | 목적 |
|--------|------|------|------|
| `addClient(clientId, response)` | string, `ServerResponse` | void | SSE 클라이언트 등록 |
| `removeClient(clientId)` | string | void | SSE 클라이언트 제거 |
| `broadcast(event, data)` | string, any | void | 모든 클라이언트에 이벤트 전송 |
| `getClientCount()` | - | number | 연결된 클라이언트 수 조회 |

---

## 6. Middleware

| 미들웨어 | 목적 |
|----------|------|
| `authMiddleware(requiredRole)` | JWT 토큰 검증 및 역할 확인 |
| `validateBody(schema)` | Zod 스키마 기반 요청 본문 검증 |
| `rateLimiter(config)` | Rate limiting 적용 |
| `securityHeaders()` | HTTP 보안 헤더 설정 |
| `errorHandler(error, req, res)` | 글로벌 에러 핸들링 |
| `requestLogger(req, res)` | 구조화된 요청 로깅 |
