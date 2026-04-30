# 테이블오더 서비스 - Unit of Work Story Map

---

## 1. 스토리-유닛 매핑

### Unit 1: Foundation (3명 공동)

| Story ID | 스토리 | 관련 이유 |
|----------|--------|----------|
| CS-01 | 테이블 자동 로그인 | AuthService, 테이블 로그인 API |
| AS-01 | 관리자 로그인 | AuthService, 관리자 로그인 API |
| AS-02 | 관리자 세션 유지 및 자동 로그아웃 | JWT 토큰 만료, 세션 관리 |

**스토리 수**: 3개

---

### Unit 2: Customer Order (Developer A)

| Story ID | 스토리 | 관련 이유 |
|----------|--------|----------|
| CS-02 | 카테고리별 메뉴 목록 조회 | 메뉴 조회 API, 고객 UI |
| CS-03 | 메뉴 상세 정보 조회 | 메뉴 상세 API, 고객 UI |
| CS-04 | 카테고리 간 빠른 이동 | 고객 UI 네비게이션 |
| CS-05 | 장바구니에 메뉴 추가 | 장바구니 로직, 고객 UI |
| CS-06 | 장바구니 수량 조절 | 장바구니 로직, 고객 UI |
| CS-07 | 장바구니 항목 삭제 및 비우기 | 장바구니 로직, 고객 UI |
| CS-08 | 장바구니 로컬 저장 | localStorage 관리 |
| CS-09 | 주문 확정 | 주문 생성 API, 고객 UI |
| CS-10 | 주문 성공 후 처리 | 주문 결과 UI, 리다이렉트 |
| CS-11 | 주문 실패 처리 | 에러 처리 UI |
| CS-12 | 현재 세션 주문 내역 조회 | 주문 조회 API, 고객 UI |
| CS-13 | 주문 상태 확인 | 주문 상태 표시 UI |

**스토리 수**: 12개

---

### Unit 3: Admin Monitor (Developer B)

| Story ID | 스토리 | 관련 이유 |
|----------|--------|----------|
| AS-03 | 실시간 주문 목록 확인 | SSE 연결, 대시보드 UI |
| AS-04 | 주문 상세 보기 | 주문 상세 모달 UI |
| AS-05 | 주문 상태 변경 | 상태 변경 API, UI |
| AS-06 | 신규 주문 시각적 알림 | SSE 이벤트 수신, 애니메이션 |
| AS-07 | 테이블 초기 설정 | 테이블 설정 API, UI |
| AS-08 | 주문 삭제 | 주문 삭제 API, 확인 팝업 UI |
| AS-09 | 테이블 이용 완료 처리 | 이용 완료 API, 세션 관리 UI |
| AS-10 | 과거 주문 내역 조회 | 이력 조회 API, UI |

**스토리 수**: 8개

---

### Unit 4: Admin Manage (Developer C)

| Story ID | 스토리 | 관련 이유 |
|----------|--------|----------|
| AS-11 | 메뉴 등록 | 메뉴 등록 API, 폼 UI |
| AS-12 | 메뉴 수정 | 메뉴 수정 API, 폼 UI |
| AS-13 | 메뉴 삭제 | 메뉴 삭제 API, 확인 팝업 UI |
| AS-14 | 메뉴 노출 순서 조정 | 순서 변경 API, UI |
| AS-15 | 카테고리별 메뉴 조회 (관리자) | 메뉴 관리 조회 UI |

**스토리 수**: 5개

---

## 2. 매핑 검증

### 전체 스토리 커버리지

| 유닛 | 담당 | 스토리 수 | 스토리 ID |
|------|------|:---------:|----------|
| Unit 1 (Foundation) | 3명 공동 | 3 | CS-01, AS-01, AS-02 |
| Unit 2 (Customer Order) | Developer A | 12 | CS-02 ~ CS-13 |
| Unit 3 (Admin Monitor) | Developer B | 8 | AS-03 ~ AS-10 |
| Unit 4 (Admin Manage) | Developer C | 5 | AS-11 ~ AS-15 |
| **합계** | | **28** | |

### 미할당 스토리: **없음** ✅
- 고객 스토리 13개: 전체 할당 (CS-01 → Unit 1, CS-02~CS-13 → Unit 2)
- 관리자 스토리 15개: 전체 할당 (AS-01~AS-02 → Unit 1, AS-03~AS-10 → Unit 3, AS-11~AS-15 → Unit 4)

### 작업량 균형 (Phase 2 기준)

| 개발자 | 유닛 | 스토리 수 | 복잡도 | 비고 |
|--------|------|:---------:|:------:|------|
| Developer A | Unit 2 (Customer Order) | 12 | ★★★★☆ | 고객 UI + 장바구니 + 주문 |
| Developer B | Unit 3 (Admin Monitor) | 8 | ★★★★★ | SSE 실시간, 세션 관리 (높은 기술 복잡도) |
| Developer C | Unit 4 (Admin Manage) | 5 | ★★★☆☆ | 메뉴 CRUD (상대적으로 단순) |

> Developer C는 Unit 4 조기 완료 후 Unit 2 또는 Unit 3 보조 투입 가능
