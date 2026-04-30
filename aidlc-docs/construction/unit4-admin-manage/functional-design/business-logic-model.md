# Unit 4 (Admin Manage) - 비즈니스 로직 모델

---

## 1. MenuService (메뉴 관리 서비스)

### 1.1 서비스 개요
- **위치**: `src/lib/services/menu-service.ts`
- **책임**: 메뉴 CRUD, 순서 관리, 데이터 검증
- **의존성**: Prisma Client, AppError 클래스
- **공유**: Unit 2 (Customer Order)에서 조회 메서드 공유

### 1.2 메서드 상세

#### `getMenusByCategory(storeId: string, categoryId?: number)`
```
입력: storeId (관리자 토큰에서 추출), categoryId (선택)
처리:
  1. categoryId 제공 시 → 해당 카테고리 메뉴만 조회
  2. categoryId 미제공 시 → 전체 카테고리 + 메뉴 조회
  3. 정렬: Category.sortOrder ASC → MenuItem.sortOrder ASC → MenuItem.id ASC
  4. 카테고리 정보 포함 (name, menuItem count)
출력: Category[] (with MenuItem[])
에러: 없음 (빈 배열 반환 가능)
```

#### `getMenuById(menuId: number, storeId: string)`
```
입력: menuId, storeId
처리:
  1. menuId + storeId로 MenuItem 조회
  2. 카테고리 정보 포함 (include category)
출력: MenuItem (with Category)
에러: NotFoundError("메뉴") — 미존재 시
```

#### `createMenu(storeId: string, data: CreateMenuInput)`
```
입력: storeId, { name, price, categoryId, description?, imageUrl?, sortOrder? }
처리:
  1. categoryId로 Category 존재 확인 (storeId 일치)
  2. imageUrl이 빈 문자열이면 null로 변환
  3. sortOrder 미제공 시 해당 카테고리 내 최대 sortOrder + 1 할당
  4. MenuItem 생성 (storeId 자동 설정)
출력: 생성된 MenuItem
에러:
  - BadRequestError("존재하지 않는 카테고리입니다.") — 카테고리 미존재
```

#### `updateMenu(menuId: number, storeId: string, data: UpdateMenuInput)`
```
입력: menuId, storeId, { name?, price?, categoryId?, description?, imageUrl?, sortOrder? }
처리:
  1. menuId + storeId로 MenuItem 존재 확인
  2. categoryId 변경 시 새 Category 존재 확인
  3. imageUrl이 빈 문자열이면 null로 변환
  4. 제공된 필드만 업데이트 (partial update)
출력: 수정된 MenuItem
에러:
  - NotFoundError("메뉴") — 메뉴 미존재
  - BadRequestError("존재하지 않는 카테고리입니다.") — 카테고리 미존재
```

#### `deleteMenu(menuId: number, storeId: string)`
```
입력: menuId, storeId
처리:
  1. menuId + storeId로 MenuItem 존재 확인
  2. 물리적 삭제 실행
출력: void
에러:
  - NotFoundError("메뉴") — 메뉴 미존재
참고: OrderItem의 menuItemName, unitPrice는 스냅샷이므로 주문 내역 무결성 유지
```

#### `updateMenuOrder(storeId: string, items: { id: number, sortOrder: number }[])`
```
입력: storeId, items 배열
처리:
  1. 모든 menuId가 storeId에 속하는지 확인
  2. 트랜잭션으로 일괄 sortOrder 업데이트
출력: void
에러:
  - BadRequestError("존재하지 않는 메뉴가 포함되어 있습니다.") — 메뉴 미존재
```

#### `swapMenuOrder(storeId: string, menuId: number, direction: 'up' | 'down')`
```
입력: storeId, menuId, direction
처리:
  1. menuId로 현재 메뉴 조회 (storeId 확인)
  2. 같은 카테고리 내에서 인접 메뉴 찾기:
     - 'up': sortOrder가 현재보다 작은 메뉴 중 가장 큰 것
     - 'down': sortOrder가 현재보다 큰 메뉴 중 가장 작은 것
  3. 인접 메뉴가 없으면 no-op (최상단/최하단)
  4. 두 메뉴의 sortOrder 교환 (swap) — 트랜잭션
출력: void
에러:
  - NotFoundError("메뉴") — 메뉴 미존재
```

---

## 2. API 레이어 (Route Handlers)

### 2.1 엔드포인트 매핑

| HTTP Method | 경로 | 핸들러 | 스토리 |
|-------------|------|--------|--------|
| GET | `/api/admin/menu` | 카테고리별 메뉴 조회 | AS-15 |
| GET | `/api/admin/menu/[id]` | 메뉴 상세 조회 | AS-15 |
| POST | `/api/admin/menu` | 메뉴 등록 | AS-11 |
| PUT | `/api/admin/menu/[id]` | 메뉴 수정 | AS-12 |
| DELETE | `/api/admin/menu/[id]` | 메뉴 삭제 | AS-13 |
| PATCH | `/api/admin/menu/order` | 메뉴 노출 순서 변경 | AS-14 |
| PATCH | `/api/admin/menu/[id]/order` | 메뉴 순서 위/아래 이동 | AS-14 |

### 2.2 API 요청/응답 형식

#### POST /api/admin/menu (메뉴 등록)
```
Request Body:
{
  "name": "김치찌개",
  "price": 9000,
  "categoryId": 1,
  "description": "매콤한 김치찌개",
  "imageUrl": "https://example.com/kimchi.jpg"
}

Response (201):
{
  "success": true,
  "data": {
    "id": 1,
    "name": "김치찌개",
    "price": 9000,
    "categoryId": 1,
    "description": "매콤한 김치찌개",
    "imageUrl": "https://example.com/kimchi.jpg",
    "sortOrder": 0,
    "isAvailable": true,
    "createdAt": "2026-04-30T10:00:00Z",
    "updatedAt": "2026-04-30T10:00:00Z",
    "category": { "id": 1, "name": "찌개류" }
  }
}
```

#### PUT /api/admin/menu/[id] (메뉴 수정)
```
Request Body (partial):
{
  "price": 10000,
  "description": "더 매콤한 김치찌개"
}

Response (200):
{
  "success": true,
  "data": { ... updated MenuItem ... }
}
```

#### DELETE /api/admin/menu/[id] (메뉴 삭제)
```
Response (200):
{
  "success": true,
  "message": "메뉴가 삭제되었습니다."
}
```

#### PATCH /api/admin/menu/order (일괄 순서 변경)
```
Request Body:
{
  "items": [
    { "id": 1, "sortOrder": 0 },
    { "id": 2, "sortOrder": 1 },
    { "id": 3, "sortOrder": 2 }
  ]
}

Response (200):
{
  "success": true,
  "message": "메뉴 순서가 변경되었습니다."
}
```

#### PATCH /api/admin/menu/[id]/order (단일 메뉴 순서 이동)
```
Request Body:
{
  "direction": "up" | "down"
}

Response (200):
{
  "success": true,
  "message": "메뉴 순서가 변경되었습니다."
}
```

#### GET /api/admin/menu (카테고리별 메뉴 조회)
```
Query Params: ?categoryId=1 (선택)

Response (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "찌개류",
      "sortOrder": 0,
      "menuItems": [
        {
          "id": 1,
          "name": "김치찌개",
          "price": 9000,
          "description": "매콤한 김치찌개",
          "imageUrl": "https://example.com/kimchi.jpg",
          "sortOrder": 0,
          "isAvailable": true,
          "createdAt": "...",
          "updatedAt": "..."
        }
      ],
      "_count": { "menuItems": 1 }
    }
  ]
}
```

---

## 3. 서비스 상호작용 플로우

### 메뉴 등록 플로우
```
AdminUI (메뉴 등록 페이지)
  → POST /api/admin/menu
    → authenticateAdmin(request)
    → validateBody(request, menuItemSchema)
    → MenuService.createMenu(storeId, data)
      → Category 존재 확인
      → MenuItem 생성
    → 201 Created 응답
  → 메뉴 목록 페이지로 리다이렉트
```

### 메뉴 수정 플로우
```
AdminUI (메뉴 수정 페이지)
  → PUT /api/admin/menu/[id]
    → authenticateAdmin(request)
    → validateBody(request, updateMenuItemSchema)
    → MenuService.updateMenu(menuId, storeId, data)
      → MenuItem 존재 확인
      → Category 존재 확인 (변경 시)
      → MenuItem 업데이트
    → 200 OK 응답
  → 메뉴 목록 페이지로 리다이렉트
```

### 메뉴 삭제 플로우
```
AdminUI (메뉴 목록 페이지)
  → 삭제 버튼 클릭 → 확인 팝업 표시
  → 확인 시 DELETE /api/admin/menu/[id]
    → authenticateAdmin(request)
    → MenuService.deleteMenu(menuId, storeId)
      → MenuItem 존재 확인
      → 물리적 삭제
    → 200 OK 응답
  → 메뉴 목록 새로고침
```

### 메뉴 순서 변경 플로우
```
AdminUI (메뉴 목록 페이지)
  → 위/아래 화살표 클릭
  → PATCH /api/admin/menu/[id]/order
    → authenticateAdmin(request)
    → validateBody(request, { direction })
    → MenuService.swapMenuOrder(storeId, menuId, direction)
      → 현재 메뉴 조회
      → 인접 메뉴 찾기
      → sortOrder 교환 (트랜잭션)
    → 200 OK 응답
  → 메뉴 목록 새로고침
```
