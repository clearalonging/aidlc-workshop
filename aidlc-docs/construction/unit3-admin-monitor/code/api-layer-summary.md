# Unit 3 (Admin Monitor) - API 레이어 코드 요약

## 생성된 API 파일

| 파일 | HTTP 메서드 | 스토리 | 설명 |
|------|------------|--------|------|
| `src/app/api/orders/stream/route.ts` | GET | AS-03, AS-06 | SSE 스트림 (관리자 전용) |
| `src/app/api/orders/[id]/status/route.ts` | PATCH | AS-05 | 주문 상태 변경 |
| `src/app/api/orders/[id]/route.ts` | DELETE | AS-08 | 주문 삭제 |
| `src/app/api/admin/tables/route.ts` | GET, POST | AS-03, AS-07 | 테이블 목록/설정 |
| `src/app/api/admin/tables/[id]/route.ts` | GET | AS-04 | 테이블 상세 조회 |
| `src/app/api/admin/tables/[id]/complete/route.ts` | POST | AS-09 | 이용 완료 처리 |
| `src/app/api/admin/tables/[id]/history/route.ts` | GET | AS-10 | 과거 주문 내역 |

## 단위 테스트 파일

| 파일 | 커버리지 대상 |
|------|-------------|
| `src/app/api/orders/stream/__tests__/route.test.ts` | SSE 연결, 인증 |
| `src/app/api/orders/[id]/status/__tests__/route.test.ts` | 상태 변경, 유효성 검사 |
| `src/app/api/orders/[id]/__tests__/route.test.ts` | 주문 삭제, 에러 처리 |
| `src/app/api/admin/tables/__tests__/route.test.ts` | 테이블 목록, 설정 |
| `src/app/api/admin/tables/[id]/complete/__tests__/route.test.ts` | 이용 완료, SSE 발행 |

## 보안 패턴

- 모든 엔드포인트: `authenticateAdmin()` 적용 (SECURITY-08)
- 모든 입력: Zod 스키마 검증 (SECURITY-05)
- 에러 처리: `handleApiError()` 통일 (SECURITY-15)
