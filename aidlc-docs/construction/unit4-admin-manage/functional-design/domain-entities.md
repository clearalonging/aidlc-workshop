# Unit 4 (Admin Manage) - 도메인 엔티티

> Unit 4는 Unit 1 (Foundation)에서 정의된 기존 엔티티를 사용합니다.
> 새로운 엔티티를 추가하지 않으며, 기존 엔티티에 대한 CRUD 오퍼레이션을 수행합니다.

---

## 1. 사용 엔티티 (Unit 1에서 정의됨)

### MenuItem (메뉴 항목) — 주요 대상

| 필드 | 타입 | 제약 | Unit 4 사용 |
|------|------|------|:----------:|
| `id` | Int | PK, Auto Increment | 조회/수정/삭제 키 |
| `storeId` | String | FK → Store | 매장 필터링 |
| `categoryId` | Int | FK → Category | 카테고리 연결 |
| `name` | String | NOT NULL, max 100자 | CRUD |
| `price` | Int | NOT NULL, 100~1,000,000 | CRUD |
| `description` | String | NULL, max 500자 | CRUD |
| `imageUrl` | String | NULL, URL 형식, max 2000자 | CRUD |
| `sortOrder` | Int | NOT NULL, DEFAULT 0, min 0 | 순서 관리 |
| `isAvailable` | Boolean | NOT NULL, DEFAULT true | 조회 필터 |
| `createdAt` | DateTime | NOT NULL | 조회 |
| `updatedAt` | DateTime | NOT NULL | 조회 |

**Unit 4 오퍼레이션**: Create, Read, Update, Delete, Sort Order 변경

---

### Category (카테고리) — 참조 대상

| 필드 | 타입 | 제약 | Unit 4 사용 |
|------|------|------|:----------:|
| `id` | Int | PK, Auto Increment | 메뉴 필터링 키 |
| `storeId` | String | FK → Store | 매장 필터링 |
| `name` | String | NOT NULL | 카테고리명 표시 |
| `sortOrder` | Int | NOT NULL, DEFAULT 0 | 카테고리 정렬 |

**Unit 4 오퍼레이션**: Read Only (카테고리 목록 조회, 메뉴 등록/수정 시 선택)

> **결정사항 (Q1: A)**: 카테고리 CRUD는 Unit 4 범위에 포함하지 않음. 기존 카테고리 목록에서만 선택 가능. 카테고리 관리는 추후 별도 기능으로 추가.

---

### OrderItem (주문 항목) — 간접 참조

| 필드 | 타입 | Unit 4 관련 |
|------|------|:----------:|
| `menuItemId` | Int | FK → MenuItem |
| `menuItemName` | String | 스냅샷 (삭제 후에도 보존) |
| `unitPrice` | Int | 스냅샷 (삭제 후에도 보존) |

**Unit 4 관련**: 메뉴 삭제 시 OrderItem의 `menuItemName`, `unitPrice`는 스냅샷으로 보존되므로 물리적 삭제 가능.

> **결정사항 (Q2: A)**: 메뉴 삭제는 물리적 삭제 (DB에서 완전 삭제). OrderItem에 스냅샷이 있으므로 주문 내역 무결성 유지.

---

## 2. 엔티티 관계 (Unit 4 관점)

```
Store (1) ──→ (N) Category ──→ (N) MenuItem
                                      │
                                      └──→ (N) OrderItem (스냅샷 보존)
```

- Unit 4는 `MenuItem`에 대한 전체 CRUD 수행
- `Category`는 읽기 전용 참조
- `OrderItem`은 메뉴 삭제 시 cascade 처리 불필요 (스냅샷 보존)

---

## 3. 데이터 검증 규칙 (Unit 4 적용)

| 필드 | 검증 규칙 | 에러 메시지 |
|------|----------|-----------|
| `name` | 필수, 1~100자 | "메뉴명을 입력해 주세요." / "메뉴명은 100자 이내로 입력해 주세요." |
| `price` | 필수, 정수, 100~1,000,000 | "가격은 100원 이상이어야 합니다." / "가격은 1,000,000원 이하여야 합니다." |
| `categoryId` | 필수, 양의 정수, 존재하는 카테고리 | "카테고리를 선택해 주세요." / "존재하지 않는 카테고리입니다." |
| `description` | 선택, 최대 500자 | "설명은 500자 이내로 입력해 주세요." |
| `imageUrl` | 선택, URL 형식, 최대 2000자, 빈 문자열 허용 | "올바른 URL 형식이 아닙니다." |
| `sortOrder` | 정수, 0 이상 | "순서 값은 0 이상이어야 합니다." |
