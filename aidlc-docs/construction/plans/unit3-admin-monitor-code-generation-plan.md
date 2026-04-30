# Unit 3 (Admin Monitor) - 코드 생성 계획

## 유닛 컨텍스트

### 담당 개발자
- **Developer B** (Phase 2 병렬 개발)

### 목적
관리자가 실시간으로 주문을 모니터링하고, 주문 상태를 변경하며, 테이블 세션을 관리하는 기능을 구현합니다.

### 구현 스토리
| Story ID | 스토리 | 우선순위 |
|----------|--------|---------|
| AS-03 | 실시간 주문 목록 확인 | 높음 |
| AS-04 | 주문 상세 보기 | 높음 |
| AS-05 | 주문 상태 변경 | 높음 |
| AS-06 | 신규 주문 시각적 알림 | 높음 |
| AS-07 | 테이블 초기 설정 | 중간 |
| AS-08 | 주문 삭제 | 중간 |
| AS-09 | 테이블 이용 완료 처리 | 높음 |
| AS-10 | 과거 주문 내역 조회 | 중간 |

### 의존성
- **Unit 1 (Foundation)**: Prisma 스키마, AuthService, SSEManager, Middleware, Types, Shared UI

### 코드 위치
- **Application Code**: `table-order/` (workspace root)
- **Documentation**: `aidlc-docs/construction/unit3-admin-monitor/code/`

---

## 코드 생성 계획

### Step 1: 서비스 레이어 - TableService 생성
- [x] `table-order/src/lib/services/table-service.ts` 생성
  - `getTableWithCurrentOrders(tableId)`: 테이블 + 현재 세션 주문 조회
  - `getAllTablesWithCurrentOrders(storeId)`: 전체 테이블 + 현재 주문 조회 (대시보드용)
  - `setupTable(storeId, tableNumber, password)`: 테이블 초기 설정 (비밀번호 해시 저장)
  - `completeTableSession(tableId)`: 이용 완료 처리 (트랜잭션: 세션 종료)
  - `getTableHistory(tableId, dateFrom?, dateTo?)`: 과거 주문 내역 조회
- [ ] 스토리 매핑: AS-07, AS-09, AS-10

### Step 2: 서비스 레이어 - OrderService (상태 변경/삭제) 생성
- [x] `table-order/src/lib/services/order-service.ts` 생성
  - `updateOrderStatus(orderId, newStatus)`: 주문 상태 변경 (PENDING→PREPARING→COMPLETED)
  - `deleteOrder(orderId)`: 주문 삭제
  - `getOrdersBySession(sessionId)`: 세션별 주문 조회
- [ ] SSE 이벤트 발행 통합 (sseManager.broadcast)
- [ ] 스토리 매핑: AS-05, AS-08

### Step 3: 서비스 레이어 단위 테스트
- [x] `table-order/src/lib/services/__tests__/table-service.test.ts` 생성
  - `getAllTablesWithCurrentOrders` 테스트
  - `setupTable` 테스트 (성공, 중복 테이블 번호)
  - `completeTableSession` 테스트 (트랜잭션 검증)
  - `getTableHistory` 테스트 (날짜 필터링 포함)
- [x] `table-order/src/lib/services/__tests__/order-service.test.ts` 생성
  - `updateOrderStatus` 테스트 (유효 전이, 역방향 전이 거부)
  - `deleteOrder` 테스트
  - `getOrdersBySession` 테스트

### Step 4: 서비스 레이어 코드 요약
- [x] `aidlc-docs/construction/unit3-admin-monitor/code/service-layer-summary.md` 생성

### Step 5: API 레이어 - SSE 스트림 엔드포인트
- [x] `table-order/src/app/api/orders/stream/route.ts` 생성
- [x] 스토리 매핑: AS-03, AS-06

### Step 6: API 레이어 - 주문 상태 변경/삭제 엔드포인트
- [x] `table-order/src/app/api/orders/[id]/status/route.ts` 생성
- [x] `table-order/src/app/api/orders/[id]/route.ts` 생성
- [x] 스토리 매핑: AS-05, AS-08

### Step 7: API 레이어 - 테이블 관리 엔드포인트
- [x] `table-order/src/app/api/admin/tables/route.ts` 생성
- [x] `table-order/src/app/api/admin/tables/[id]/route.ts` 생성
- [x] `table-order/src/app/api/admin/tables/[id]/complete/route.ts` 생성
- [x] `table-order/src/app/api/admin/tables/[id]/history/route.ts` 생성
- [x] 스토리 매핑: AS-07, AS-09, AS-10

### Step 8: API 레이어 단위 테스트
- [x] `table-order/src/app/api/orders/stream/__tests__/route.test.ts` 생성
- [x] `table-order/src/app/api/orders/[id]/status/__tests__/route.test.ts` 생성
- [x] `table-order/src/app/api/orders/[id]/__tests__/route.test.ts` 생성
- [x] `table-order/src/app/api/admin/tables/__tests__/route.test.ts` 생성
- [x] `table-order/src/app/api/admin/tables/[id]/complete/__tests__/route.test.ts` 생성

### Step 9: API 레이어 코드 요약
- [x] `aidlc-docs/construction/unit3-admin-monitor/code/api-layer-summary.md` 생성

### Step 10: Zod 검증 스키마 추가
- [x] `table-order/src/lib/validators/admin-schemas.ts` 생성

### Step 11: 관리자 로그인 UI 페이지
- [x] `table-order/src/app/(admin)/login/page.tsx` 생성
- [x] 스토리 매핑: AS-01 (Unit 1 API 사용)

### Step 12: 관리자 대시보드 UI 페이지
- [x] `table-order/src/app/(admin)/dashboard/page.tsx` 생성
- [x] 스토리 매핑: AS-03, AS-06

### Step 13: 관리자 테이블 관리 UI 페이지
- [x] `table-order/src/app/(admin)/tables/page.tsx` 생성
- [x] 스토리 매핑: AS-07, AS-09, AS-10

### Step 14: 관리자 UI 컴포넌트 - 대시보드
- [x] `table-order/src/components/admin/dashboard/TableCard.tsx` 생성
- [x] `table-order/src/components/admin/dashboard/OrderDetailModal.tsx` 생성
- [x] `table-order/src/components/admin/dashboard/DashboardGrid.tsx` 생성
- [x] 스토리 매핑: AS-03, AS-04, AS-05, AS-06, AS-08

### Step 15: 관리자 UI 컴포넌트 - 테이블 관리
- [x] `table-order/src/components/admin/tables/TableSetupForm.tsx` 생성
- [x] `table-order/src/components/admin/tables/TableHistoryModal.tsx` 생성
- [x] 스토리 매핑: AS-07, AS-09, AS-10

### Step 16: 프론트엔드 컴포넌트 단위 테스트
- [x] `table-order/src/components/admin/dashboard/__tests__/TableCard.test.tsx` 생성
- [x] `table-order/src/components/admin/dashboard/__tests__/OrderDetailModal.test.tsx` 생성
- [x] `table-order/src/components/admin/tables/__tests__/TableSetupForm.test.tsx` 생성

### Step 17: 프론트엔드 컴포넌트 코드 요약
- [x] `aidlc-docs/construction/unit3-admin-monitor/code/frontend-summary.md` 생성

### Step 18: 전체 코드 요약 문서
- [x] `aidlc-docs/construction/unit3-admin-monitor/code/code-summary.md` 생성

---

## 스토리 추적성

| Story ID | 구현 Step | 상태 |
|----------|----------|------|
| AS-03 | Step 5, 12, 14 | [x] |
| AS-04 | Step 14 | [x] |
| AS-05 | Step 2, 6, 14 | [x] |
| AS-06 | Step 5, 12, 14 | [x] |
| AS-07 | Step 1, 7, 13, 15 | [x] |
| AS-08 | Step 2, 6, 14 | [x] |
| AS-09 | Step 1, 7, 13 | [x] |
| AS-10 | Step 1, 7, 13, 15 | [x] |

---

## SECURITY 규칙 준수 계획

| 규칙 | 적용 방법 |
|------|----------|
| SECURITY-03 | pino 로거 사용, requestId 포함 |
| SECURITY-05 | Zod 스키마로 모든 API 입력 검증 |
| SECURITY-08 | authenticateAdmin() 미들웨어 모든 관리자 API에 적용 |
| SECURITY-09 | Prisma ORM 파라미터화 쿼리 |
| SECURITY-11 | 관심사 분리 (Service/API/UI 레이어) |
| SECURITY-15 | try/catch, 에러 핸들러, Fail-Closed 패턴 |

---

## 총 단계 수
- **총 18개 Step**
- **생성 파일 수**: 약 35개 (서비스 2개, API 8개, UI 페이지 3개, 컴포넌트 5개, 테스트 11개, 문서 4개, 스키마 1개)
