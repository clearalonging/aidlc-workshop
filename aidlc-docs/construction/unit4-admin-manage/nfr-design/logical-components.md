# Unit 4 (Admin Manage) - Logical Components

> Unit 4는 별도의 인프라 컴포넌트를 추가하지 않습니다.
> Unit 1 Foundation에서 제공하는 논리적 컴포넌트를 그대로 활용합니다.

---

## 1. 컴포넌트 구성도 (Unit 4 관점)

```
┌─────────────────────────────────────────────────────────┐
│                    AdminUI (Browser)                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ MenuListPage │ │  MenuForm    │ │ MenuDeleteConfirm│ │
│  │ (목록+필터)  │ │ (등록/수정)  │ │ (삭제 확인)      │ │
│  └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘ │
│         │                │                   │           │
│         └────────────────┼───────────────────┘           │
│                          │ fetch API                     │
└──────────────────────────┼───────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────┐
│              Next.js API Route Handlers                   │
│  ┌───────────────────────┼─────────────────────────────┐ │
│  │         Middleware Pipeline (Unit 1 제공)            │ │
│  │  Rate Limiter → Auth → Validation → Handler         │ │
│  └───────────────────────┼─────────────────────────────┘ │
│                          │                               │
│  ┌───────────────────────┼─────────────────────────────┐ │
│  │              MenuService (Unit 4 구현)               │ │
│  │  getMenusByCategory | createMenu | updateMenu       │ │
│  │  deleteMenu | swapMenuOrder | updateMenuOrder       │ │
│  └───────────────────────┼─────────────────────────────┘ │
│                          │                               │
│  ┌───────────────────────┼─────────────────────────────┐ │
│  │           Prisma Client (Unit 1 제공)               │ │
│  │              SQLite Database                         │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │           pino Logger (Unit 1 제공)                 │ │
│  │         감사 로그 (INFO 레벨)                       │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 2. 논리적 컴포넌트 목록

### 2.1 Unit 4 구현 컴포넌트

| 컴포넌트 | 위치 | 책임 |
|---------|------|------|
| **MenuService** | `src/lib/services/menu-service.ts` | 메뉴 CRUD, 순서 관리, 페이지네이션 |
| **Menu API Routes** | `src/app/api/admin/menu/` | HTTP 요청 처리, 인증, 검증 |
| **MenuListPage** | `src/app/(admin)/menu-manage/page.tsx` | 메뉴 목록 UI |
| **MenuForm Pages** | `src/app/(admin)/menu-manage/new/`, `[id]/edit/` | 등록/수정 UI |
| **Menu Components** | `src/components/admin/menu/` | 재사용 UI 컴포넌트 |

### 2.2 Unit 1 재사용 컴포넌트

| 컴포넌트 | 위치 | Unit 4 사용 방식 |
|---------|------|----------------|
| **Auth Middleware** | `src/lib/middleware/auth-middleware.ts` | `authenticateAdmin()` 호출 |
| **Error Handler** | `src/lib/middleware/error-handler.ts` | `withErrorHandler()` 래핑 |
| **Validate Body** | `src/lib/middleware/validate-body.ts` | `validateBody()`, `validateQuery()` 호출 |
| **Prisma Client** | `src/lib/prisma.ts` | DB 접근 |
| **Logger** | `src/lib/logger/index.ts` | 감사 로그 기록 |
| **Error Classes** | `src/lib/errors.ts` | `NotFoundError`, `BadRequestError` 등 |
| **Zod Schemas** | `src/lib/validators/common-schemas.ts` | `menuItemSchema`, `menuOrderSchema` 등 |
| **Types** | `src/types/index.ts` | `ApiResponse`, `TokenPayload` 등 |

---

## 3. 데이터 흐름

### 메뉴 등록 흐름
```
Browser → POST /api/admin/menu
  → Rate Limiter (200/min)
  → authenticateAdmin() → TokenPayload { sub, role, storeId }
  → validateBody(menuItemSchema) → { name, price, categoryId, ... }
  → MenuService.createMenu(storeId, data)
    → Category 존재 확인 (Prisma)
    → MenuItem 생성 (Prisma)
    → 감사 로그 기록 (pino)
  → 201 Created { success: true, data: MenuItem }
```

### 메뉴 목록 조회 흐름 (페이지네이션)
```
Browser → GET /api/admin/menu?categoryId=1&page=1&limit=20
  → Rate Limiter (200/min)
  → authenticateAdmin()
  → validateQuery(paginationSchema + categoryId)
  → MenuService.getMenusByCategory(storeId, categoryId, page, limit)
    → Promise.all([findMany + count]) (Prisma)
  → 200 OK { success: true, data: { items, total, page, limit, totalPages } }
```

### 메뉴 순서 변경 흐름 (Swap)
```
Browser → PATCH /api/admin/menu/[id]/order
  → Rate Limiter (200/min)
  → authenticateAdmin()
  → validateBody({ direction: 'up' | 'down' })
  → MenuService.swapMenuOrder(storeId, menuId, direction)
    → $transaction:
      → 현재 메뉴 조회
      → 인접 메뉴 찾기
      → sortOrder 교환
    → 감사 로그 기록
  → 200 OK { success: true, message: "메뉴 순서가 변경되었습니다." }
```

---

## 4. 추가 인프라 컴포넌트

**없음** — Unit 4는 추가 인프라 컴포넌트(캐시, 큐, 외부 서비스 등)를 필요로 하지 않습니다.

- 캐시: 불필요 (단일 매장, 메뉴 수 제한적, 1초 이내 응답 가능)
- 메시지 큐: 불필요 (동기 CRUD 처리)
- 외부 서비스: 불필요 (이미지는 외부 URL 직접 입력)
- SSE: 불필요 (메뉴 관리는 실시간 통신 불필요)
