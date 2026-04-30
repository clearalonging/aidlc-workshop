# Unit 3 (Admin Monitor) - 서비스 레이어 코드 요약

## 생성된 파일

| 파일 | 설명 |
|------|------|
| `src/lib/services/table-service.ts` | 테이블 및 세션 관리 서비스 |
| `src/lib/services/order-service.ts` | 주문 상태 변경 및 삭제 서비스 |
| `src/lib/services/__tests__/table-service.test.ts` | TableService 단위 테스트 |
| `src/lib/services/__tests__/order-service.test.ts` | OrderService 단위 테스트 |

## TableService 주요 함수

| 함수 | 스토리 | 설명 |
|------|--------|------|
| `getAllTablesWithCurrentOrders(storeId)` | AS-03 | 전체 테이블 + 현재 세션 주문 조회 |
| `getTableWithCurrentOrders(tableId)` | AS-04 | 특정 테이블 상세 + 현재 주문 조회 |
| `setupTable(storeId, tableNumber, password)` | AS-07 | 테이블 초기 설정 (upsert) |
| `completeTableSession(tableId)` | AS-09 | 이용 완료 처리 (트랜잭션) |
| `getTableHistory(tableId, dateFrom?, dateTo?)` | AS-10 | 과거 주문 내역 조회 |

## OrderService 주요 함수

| 함수 | 스토리 | 설명 |
|------|--------|------|
| `updateOrderStatus(orderId, newStatus)` | AS-05 | 주문 상태 변경 + SSE 발행 |
| `deleteOrder(orderId)` | AS-08 | 주문 삭제 + SSE 발행 |
| `getOrdersBySession(sessionId)` | - | 세션별 주문 조회 |

## 비즈니스 규칙 준수

- **상태 전이**: PENDING → PREPARING → COMPLETED (역방향 불가)
- **트랜잭션**: 이용 완료 처리는 Prisma $transaction으로 원자적 실행
- **SSE 이벤트**: 상태 변경/삭제/이용 완료 시 자동 브로드캐스트
- **에러 처리**: NotFoundError, BadRequestError 적절히 사용
