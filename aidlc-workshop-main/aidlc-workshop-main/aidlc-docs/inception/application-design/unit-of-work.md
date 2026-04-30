# 테이블오더 서비스 - Unit of Work 정의

## 팀 구성
- **개발 인원**: 3명
- **배포 단위**: 1개 (Next.js 풀스택 모놀리식)
- **논리적 유닛**: 4개 (Foundation 1개 + 기능 유닛 3개)

## 개발 전략
Unit 1 (Foundation)을 3명이 함께 먼저 완료한 후, Unit 2/3/4를 각 1명씩 병렬로 개발합니다.

```
Phase 1 (공동):  Unit 1 (Foundation) ── 3명 공동 ──→
Phase 2 (병렬):   Dev A: Unit 2 (Customer Order) ──→
                  Dev B: Unit 3 (Admin Monitor)  ──→  Build and Test
                  Dev C: Unit 4 (Admin Manage)   ──→
```

---

## Unit 1: Foundation (기반 시스템)

### 담당: 3명 공동 작업 (Phase 1)

### 목적
프로젝트 초기 셋업, 데이터베이스 스키마, 인증 시스템, 공통 미들웨어 등 나머지 3개 유닛이 의존하는 기반 시스템을 구축합니다.

### 책임 범위
| 영역 | 상세 |
|------|------|
| **프로젝트 셋업** | Next.js 프로젝트 초기화, TypeScript 설정, 디렉토리 구조, 의존성 설치 |
| **데이터베이스** | Prisma 스키마 정의 (전체 엔티티), 마이그레이션, 시드 데이터 (관리자 계정) |
| **인증 시스템** | AuthService (bcrypt, JWT), 테이블 로그인 API, 관리자 로그인 API |
| **공통 미들웨어** | 인증 미들웨어, 입력 검증 (Zod), Rate Limiting, 보안 헤더, 에러 핸들링, 로깅 |
| **SSE 기반** | SSEManager 구현 (연결 관리, 브로드캐스트) |
| **타입 정의** | 공통 TypeScript 타입, API 요청/응답 타입, Zod 검증 스키마 |
| **공유 UI** | 공통 레이아웃, 공유 UI 컴포넌트 (버튼, 모달, 토스트 등) |

### 산출물
- Next.js 프로젝트 구조
- `prisma/schema.prisma`, `prisma/seed.ts`
- `src/lib/auth/` (AuthService, JWT)
- `src/lib/middleware/` (인증, 검증, Rate Limiting, 보안 헤더, 에러 핸들링)
- `src/lib/sse/` (SSEManager)
- `src/lib/logger/` (구조화된 로깅)
- `src/lib/validators/` (Zod 스키마)
- `src/types/` (공통 타입)
- `src/app/api/auth/` (인증 API)
- `src/components/shared/` (공통 UI 컴포넌트)
- 단위 테스트: AuthService, Middleware, SSEManager

### 관련 스토리: CS-01, AS-01, AS-02

---

## Unit 2: Customer Order (고객 주문)

### 담당: Developer A (Phase 2)

### 목적
고객이 테이블에서 메뉴를 탐색하고, 장바구니에 담고, 주문하고, 주문 내역을 확인하는 전체 고객 경험을 구현합니다.

### 책임 범위
| 영역 | 상세 |
|------|------|
| **고객 UI** | 테이블 자동 로그인 화면, 메뉴 목록/상세 화면, 장바구니 화면, 주문 확정/결과 화면, 주문 내역 화면 |
| **메뉴 조회 API** | 카테고리별 메뉴 목록 API, 메뉴 상세 API |
| **장바구니** | 클라이언트 측 장바구니 관리 (localStorage), 수량 조절, 총 금액 계산 |
| **주문 API** | 주문 생성 API, 현재 세션 주문 조회 API |
| **서비스 로직** | MenuService (조회), OrderService (생성/조회) |

### 산출물
- `src/app/(customer)/` (고객용 페이지 전체)
- `src/components/customer/` (고객용 UI 컴포넌트)
- `src/lib/services/menu-service.ts` (메뉴 조회 로직)
- `src/lib/services/order-service.ts` (주문 생성/조회 로직)
- `src/app/api/menu/` (메뉴 조회 API)
- `src/app/api/orders/` (주문 생성/조회 API)
- `src/lib/cart/` (장바구니 유틸리티)
- 단위 테스트: OrderService (생성/조회), MenuService (조회), 장바구니 로직

### 의존성: Unit 1 (Foundation)
### 관련 스토리: CS-02 ~ CS-13 (12개)
### 예상 작업량: ★★★★☆

---

## Unit 3: Admin Monitor (관리자 주문 모니터링)

### 담당: Developer B (Phase 2)

### 목적
관리자가 실시간으로 주문을 모니터링하고, 주문 상태를 변경하며, 테이블 세션을 관리하는 기능을 구현합니다.

### 책임 범위
| 영역 | 상세 |
|------|------|
| **관리자 로그인 UI** | 관리자 로그인 화면 |
| **실시간 대시보드** | 테이블별 그리드 레이아웃, SSE 연결 (EventSource), 신규 주문 시각적 강조 |
| **주문 관리** | 주문 상세 보기 모달, 주문 상태 변경 (대기중→준비중→완료), 주문 삭제 (확인 팝업) |
| **테이블 세션 관리** | 테이블 초기 설정, 이용 완료 처리, 과거 주문 내역 조회 |
| **서비스 로직** | TableService, OrderService (상태 변경/삭제/SSE) |
| **API** | SSE 스트림 API, 주문 상태 변경/삭제 API, 테이블 설정/완료/이력 API |

### 산출물
- `src/app/(admin)/login/` (관리자 로그인)
- `src/app/(admin)/dashboard/` (실시간 대시보드)
- `src/app/(admin)/tables/` (테이블 관리)
- `src/components/admin/dashboard/` (대시보드 컴포넌트)
- `src/components/admin/tables/` (테이블 관리 컴포넌트)
- `src/lib/services/table-service.ts` (테이블/세션 관리)
- `src/lib/services/order-service.ts` (상태 변경/삭제 — Unit 2와 공유)
- `src/app/api/orders/stream/` (SSE 스트림)
- `src/app/api/orders/[id]/status/` (상태 변경)
- `src/app/api/orders/[id]/` (삭제)
- `src/app/api/admin/tables/` (테이블 관리 API)
- 단위 테스트: TableService, OrderService (상태 변경/삭제)

### 의존성: Unit 1 (Foundation)
### 관련 스토리: AS-03 ~ AS-10 (8개)
### 예상 작업량: ★★★★★

---

## Unit 4: Admin Manage (관리자 메뉴 관리)

### 담당: Developer C (Phase 2)

### 목적
관리자가 메뉴를 등록/수정/삭제하고 노출 순서를 조정하는 메뉴 관리 기능을 구현합니다.

### 책임 범위
| 영역 | 상세 |
|------|------|
| **메뉴 관리 UI** | 메뉴 목록 화면 (카테고리별), 메뉴 등록 폼, 메뉴 수정 폼, 삭제 확인 팝업, 노출 순서 조정 UI |
| **메뉴 CRUD API** | 메뉴 등록/수정/삭제 API, 노출 순서 변경 API, 카테고리별 조회 API (관리자용) |
| **서비스 로직** | MenuService (CRUD, 순서 관리, 데이터 검증) |
| **데이터 검증** | 필수 필드 검증, 가격 범위 검증 |

### 산출물
- `src/app/(admin)/menu-manage/` (메뉴 관리 페이지)
- `src/components/admin/menu/` (메뉴 관리 컴포넌트)
- `src/lib/services/menu-service.ts` (메뉴 CRUD — Unit 2와 공유)
- `src/app/api/admin/menu/` (메뉴 관리 API)
- 단위 테스트: MenuService (CRUD, 검증)

### 의존성: Unit 1 (Foundation)
### 관련 스토리: AS-11 ~ AS-15 (5개)
### 예상 작업량: ★★★☆☆

---

## 개발자 할당 요약

| Phase | 개발자 | 유닛 | 핵심 역할 | 스토리 | 작업량 |
|-------|--------|------|----------|:------:|:------:|
| **Phase 1** | 3명 공동 | Unit 1 — Foundation | 프로젝트 셋업, DB, 인증, 미들웨어, SSE | 3개 | ★★★☆☆ |
| **Phase 2** | Developer A | Unit 2 — Customer Order | 고객 UI, 메뉴 조회, 장바구니, 주문 | 12개 | ★★★★☆ |
| **Phase 2** | Developer B | Unit 3 — Admin Monitor | 대시보드, 주문 관리, 테이블 관리 | 8개 | ★★★★★ |
| **Phase 2** | Developer C | Unit 4 — Admin Manage | 메뉴 CRUD, 순서 관리 | 5개 | ★★★☆☆ |

> Developer C는 Unit 4 완료 후 Unit 2 또는 Unit 3의 보조 작업에 투입 가능합니다.

---

## 코드 조직 구조

```
table-order/
+-- src/
|   +-- app/
|   |   +-- (customer)/          # Unit 2: Developer A
|   |   |   +-- page.tsx
|   |   |   +-- cart/
|   |   |   +-- orders/
|   |   |   +-- login/
|   |   +-- (admin)/
|   |   |   +-- login/           # Unit 3: Developer B
|   |   |   +-- dashboard/       # Unit 3: Developer B
|   |   |   +-- tables/          # Unit 3: Developer B
|   |   |   +-- menu-manage/     # Unit 4: Developer C
|   |   +-- api/
|   |       +-- auth/            # Unit 1: 공동
|   |       +-- menu/            # Unit 2 (조회) + Unit 4 (CRUD)
|   |       +-- orders/          # Unit 2 (생성/조회) + Unit 3 (상태/삭제/SSE)
|   |       +-- admin/
|   |           +-- tables/      # Unit 3: Developer B
|   |           +-- menu/        # Unit 4: Developer C
|   +-- components/
|   |   +-- customer/            # Unit 2: Developer A
|   |   +-- admin/
|   |   |   +-- dashboard/       # Unit 3: Developer B
|   |   |   +-- tables/          # Unit 3: Developer B
|   |   |   +-- menu/            # Unit 4: Developer C
|   |   +-- shared/              # Unit 1: 공동
|   +-- lib/
|   |   +-- auth/                # Unit 1: 공동
|   |   +-- middleware/          # Unit 1: 공동
|   |   +-- sse/                 # Unit 1: 공동
|   |   +-- logger/              # Unit 1: 공동
|   |   +-- validators/          # Unit 1: 공동
|   |   +-- services/            # Unit 2 + Unit 3 + Unit 4 (공유)
|   |   +-- cart/                # Unit 2: Developer A
|   +-- types/                   # Unit 1: 공동
+-- prisma/                      # Unit 1: 공동
+-- tests/
