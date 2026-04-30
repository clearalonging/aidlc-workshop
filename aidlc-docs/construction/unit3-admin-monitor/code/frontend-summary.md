# Unit 3 (Admin Monitor) - 프론트엔드 코드 요약

## 생성된 페이지 파일

| 파일 | 스토리 | 설명 |
|------|--------|------|
| `src/app/(admin)/login/page.tsx` | AS-01 | 관리자 로그인 페이지 |
| `src/app/(admin)/dashboard/page.tsx` | AS-03, AS-06 | 실시간 대시보드 (SSE EventSource) |
| `src/app/(admin)/tables/page.tsx` | AS-07, AS-09, AS-10 | 테이블 관리 페이지 |

## 생성된 컴포넌트 파일

| 파일 | 스토리 | 설명 |
|------|--------|------|
| `src/components/admin/dashboard/TableCard.tsx` | AS-03, AS-06 | 테이블 카드 (신규 주문 강조) |
| `src/components/admin/dashboard/DashboardGrid.tsx` | AS-03 | 테이블 그리드 레이아웃 |
| `src/components/admin/dashboard/OrderDetailModal.tsx` | AS-04, AS-05, AS-08 | 주문 상세/상태 변경/삭제 모달 |
| `src/components/admin/tables/TableSetupForm.tsx` | AS-07 | 테이블 설정 폼 모달 |
| `src/components/admin/tables/TableHistoryModal.tsx` | AS-10 | 과거 주문 내역 모달 |

## 단위 테스트 파일

| 파일 | 커버리지 대상 |
|------|-------------|
| `src/components/admin/dashboard/__tests__/TableCard.test.tsx` | 렌더링, NEW 배지, 클릭 이벤트 |
| `src/components/admin/dashboard/__tests__/OrderDetailModal.test.tsx` | 모달 열기/닫기, 상태 변경, 삭제 확인 |
| `src/components/admin/tables/__tests__/TableSetupForm.test.tsx` | 폼 제출, 유효성 검사 |

## 접근성 및 자동화 친화적 설계

- 모든 인터랙티브 요소에 `data-testid` 속성 포함
- `aria-label` 속성으로 스크린 리더 지원
- `role="alert"`, `role="status"` 적절히 사용
- 폼 요소에 `label` + `htmlFor` 연결
