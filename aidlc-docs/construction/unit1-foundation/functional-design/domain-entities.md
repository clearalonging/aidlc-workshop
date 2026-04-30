# Unit 1 (Foundation) - 도메인 엔티티

---

## 1. Store (매장)

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | String | PK, UUID | 매장 식별자 |
| `name` | String | NOT NULL | 매장명 |
| `createdAt` | DateTime | NOT NULL | 생성 시각 |

**비즈니스 규칙:**
- 단일 매장 시스템 — 시드 데이터로 1개 레코드 생성
- `id`는 테이블 로그인 시 매장 식별자로 사용

---

## 2. Admin (관리자)

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | Int | PK, Auto Increment | 관리자 ID |
| `storeId` | String | FK → Store | 소속 매장 |
| `username` | String | NOT NULL, UNIQUE | 사용자명 |
| `passwordHash` | String | NOT NULL | bcrypt 해시 |
| `createdAt` | DateTime | NOT NULL | 생성 시각 |

**비즈니스 규칙:**
- 시드 데이터로 1개 계정 생성 (추가 계정 생성 기능 없음)
- `passwordHash`는 bcrypt (cost factor 12) 사용
- `username`은 매장 내 유일

---

## 3. Table (테이블)

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | Int | PK, Auto Increment | 테이블 ID |
| `storeId` | String | FK → Store | 소속 매장 |
| `tableNumber` | Int | NOT NULL | 테이블 번호 |
| `passwordHash` | String | NOT NULL | 테이블 비밀번호 해시 |
| `createdAt` | DateTime | NOT NULL | 생성 시각 |
| `updatedAt` | DateTime | NOT NULL | 수정 시각 |

**비즈니스 규칙:**
- `tableNumber`는 매장 내 유일
- 비밀번호는 bcrypt 해시로 저장

---

## 4. TableSession (테이블 세션)

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | String | PK, UUID | 세션 ID |
| `tableId` | Int | FK → Table | 테이블 |
| `startedAt` | DateTime | NOT NULL | 세션 시작 시각 |
| `completedAt` | DateTime | NULL | 이용 완료 시각 (NULL = 활성) |

**비즈니스 규칙:**
- 테이블당 활성 세션은 최대 1개 (`completedAt IS NULL`)
- 첫 주문 생성 시 세션 자동 시작
- 이용 완료 처리 시 `completedAt` 설정

---

## 5. Category (카테고리)

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | Int | PK, Auto Increment | 카테고리 ID |
| `storeId` | String | FK → Store | 소속 매장 |
| `name` | String | NOT NULL | 카테고리명 |
| `sortOrder` | Int | NOT NULL, DEFAULT 0 | 노출 순서 |

---

## 6. MenuItem (메뉴 항목)

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | Int | PK, Auto Increment | 메뉴 ID |
| `storeId` | String | FK → Store | 소속 매장 |
| `categoryId` | Int | FK → Category | 카테고리 |
| `name` | String | NOT NULL | 메뉴명 |
| `price` | Int | NOT NULL, > 0 | 가격 (원 단위) |
| `description` | String | NULL | 메뉴 설명 |
| `imageUrl` | String | NULL | 이미지 URL |
| `sortOrder` | Int | NOT NULL, DEFAULT 0 | 노출 순서 |
| `isAvailable` | Boolean | NOT NULL, DEFAULT true | 판매 가능 여부 |
| `createdAt` | DateTime | NOT NULL | 생성 시각 |
| `updatedAt` | DateTime | NOT NULL | 수정 시각 |

**비즈니스 규칙:**
- `price` > 0 (양수만 허용)
- `name` 최대 100자
- `description` 최대 500자
- `imageUrl` 최대 2000자 (URL 길이 제한)

---

## 7. Order (주문)

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | Int | PK, Auto Increment | 주문 ID |
| `orderNumber` | String | NOT NULL, UNIQUE | 주문 번호 (표시용) |
| `tableId` | Int | FK → Table | 테이블 |
| `sessionId` | String | FK → TableSession | 세션 |
| `status` | Enum | NOT NULL | 주문 상태 |
| `totalAmount` | Int | NOT NULL | 총 금액 (원) |
| `createdAt` | DateTime | NOT NULL | 주문 시각 |
| `updatedAt` | DateTime | NOT NULL | 수정 시각 |

**OrderStatus Enum**: `PENDING` (대기중) | `PREPARING` (준비중) | `COMPLETED` (완료)

**비즈니스 규칙:**
- `orderNumber` 형식: `ORD-{YYYYMMDD}-{4자리 순번}` (예: `ORD-20260430-0001`)
- 상태 전이: `PENDING` → `PREPARING` → `COMPLETED` (역방향 불가)
- `totalAmount` = Σ(OrderItem.unitPrice × OrderItem.quantity)

---

## 8. OrderItem (주문 항목)

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | Int | PK, Auto Increment | 주문 항목 ID |
| `orderId` | Int | FK → Order | 주문 |
| `menuItemId` | Int | FK → MenuItem | 메뉴 |
| `menuItemName` | String | NOT NULL | 주문 시점 메뉴명 (스냅샷) |
| `unitPrice` | Int | NOT NULL | 주문 시점 단가 (스냅샷) |
| `quantity` | Int | NOT NULL, > 0 | 수량 |

**비즈니스 규칙:**
- `menuItemName`, `unitPrice`는 주문 시점 스냅샷 (메뉴 수정 후에도 주문 내역 보존)
- `quantity` ≥ 1

---

## 9. LoginAttempt (로그인 시도 기록)

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | Int | PK, Auto Increment | ID |
| `identifier` | String | NOT NULL | 식별자 (username 또는 IP) |
| `success` | Boolean | NOT NULL | 성공 여부 |
| `attemptedAt` | DateTime | NOT NULL | 시도 시각 |

**비즈니스 규칙:**
- 최근 15분 내 실패 횟수 5회 초과 시 로그인 차단
- 차단 시간: 15분

---

## 엔티티 관계 요약

```
Store (1) ──→ (N) Admin
Store (1) ──→ (N) Table
Store (1) ──→ (N) Category
Store (1) ──→ (N) MenuItem
Table (1) ──→ (N) TableSession
Table (1) ──→ (N) Order
TableSession (1) ──→ (N) Order
Category (1) ──→ (N) MenuItem
Order (1) ──→ (N) OrderItem
MenuItem (1) ──→ (N) OrderItem
```
