# Unit 4 (Admin Manage) - 비즈니스 규칙

---

## 1. 메뉴 등록 규칙

### BR-MENU-01: 메뉴 등록
- **입력**: `name`, `price`, `categoryId`, `description?`, `imageUrl?`, `sortOrder?`
- **검증 순서**:
  1. 관리자 인증 확인 (JWT, role: ADMIN)
  2. 입력값 검증 (Zod 스키마)
     - `name`: 필수, 1~100자
     - `price`: 필수, 정수, 100 ≤ price ≤ 1,000,000
     - `categoryId`: 필수, 양의 정수
     - `description`: 선택, 최대 500자
     - `imageUrl`: 선택, URL 형식, 최대 2000자 (빈 문자열 허용 → null 변환)
     - `sortOrder`: 선택, 정수, 0 이상, 기본값 0
  3. `categoryId`로 Category 존재 확인 (동일 storeId)
  4. 메뉴 생성 (storeId는 인증된 관리자의 storeId 사용)
- **성공**: 201 Created + 생성된 MenuItem 반환
- **실패**:
  - 인증 실패: 401 Unauthorized
  - 검증 실패: 400 Bad Request + 필드별 에러
  - 카테고리 미존재: 400 Bad Request "존재하지 않는 카테고리입니다."

### BR-MENU-02: 메뉴명 중복 허용
- 동일 카테고리 내 메뉴명 중복을 허용함 (제약 없음)
- 이유: 매장 운영 유연성 (예: "스페셜 메뉴" 등 동일명 가능)

---

## 2. 메뉴 수정 규칙

### BR-MENU-03: 메뉴 수정
- **입력**: `menuId` (path param), 수정할 필드들 (partial update)
- **검증 순서**:
  1. 관리자 인증 확인
  2. `menuId`로 MenuItem 존재 확인 (동일 storeId)
  3. 입력값 검증 (partial — 제공된 필드만 검증)
  4. `categoryId` 변경 시 Category 존재 확인
  5. 메뉴 업데이트
- **성공**: 200 OK + 수정된 MenuItem 반환
- **실패**:
  - 메뉴 미존재: 404 Not Found
  - 검증 실패: 400 Bad Request
  - 카테고리 미존재: 400 Bad Request

### BR-MENU-04: Partial Update 규칙
- 수정 요청에 포함된 필드만 업데이트
- 포함되지 않은 필드는 기존 값 유지
- `imageUrl`이 빈 문자열("")로 전달되면 null로 변환 (이미지 제거)

---

## 3. 메뉴 삭제 규칙

### BR-MENU-05: 메뉴 삭제 (물리적 삭제)
- **입력**: `menuId` (path param)
- **검증 순서**:
  1. 관리자 인증 확인
  2. `menuId`로 MenuItem 존재 확인 (동일 storeId)
  3. DB에서 물리적 삭제 실행
- **성공**: 200 OK + 삭제 확인 메시지
- **실패**:
  - 메뉴 미존재: 404 Not Found

> **결정사항 (Q2: A)**: 물리적 삭제 수행. OrderItem의 `menuItemName`, `unitPrice`는 주문 시점 스냅샷이므로 메뉴 삭제 후에도 주문 내역 무결성 유지.

### BR-MENU-06: 삭제 시 외래 키 처리
- Prisma 스키마에서 OrderItem → MenuItem 관계의 onDelete 동작 확인 필요
- OrderItem에는 `menuItemName`, `unitPrice` 스냅샷이 있으므로 참조 무결성 처리:
  - 방법: MenuItem 삭제 시 관련 OrderItem의 `menuItemId`를 null로 설정하거나, 삭제 전 OrderItem 참조 해제
  - 또는 Prisma 스키마에서 OrderItem.menuItemId를 optional로 변경하여 SET NULL 처리

---

## 4. 메뉴 노출 순서 규칙

### BR-MENU-07: 노출 순서 변경
- **입력**: `items: { id: number, sortOrder: number }[]`
- **검증 순서**:
  1. 관리자 인증 확인
  2. 입력값 검증 (배열, 각 항목에 id와 sortOrder)
  3. 모든 menuId가 동일 storeId에 속하는지 확인
  4. 트랜잭션으로 일괄 업데이트
- **성공**: 200 OK + 업데이트 확인
- **실패**:
  - 검증 실패: 400 Bad Request
  - 메뉴 미존재: 400 Bad Request

### BR-MENU-08: 순서 값 규칙
- `sortOrder`는 0 이상의 정수
- 값이 작을수록 상단에 표시
- 동일 `sortOrder` 값이 있을 경우 `id` 오름차순으로 정렬 (보조 정렬)
- 카테고리 내에서 독립적으로 순서 관리

### BR-MENU-09: 위/아래 화살표 순서 변경 로직
- **위로 이동**: 현재 메뉴의 sortOrder와 바로 위 메뉴의 sortOrder를 교환 (swap)
- **아래로 이동**: 현재 메뉴의 sortOrder와 바로 아래 메뉴의 sortOrder를 교환 (swap)
- 최상단 메뉴의 위로 이동, 최하단 메뉴의 아래로 이동은 무시 (no-op)

---

## 5. 메뉴 조회 규칙 (관리자용)

### BR-MENU-10: 카테고리별 메뉴 조회 (관리자)
- **입력**: `categoryId?` (query param, 선택)
- **검증 순서**:
  1. 관리자 인증 확인
  2. `categoryId` 제공 시 해당 카테고리 메뉴만 필터링
  3. `categoryId` 미제공 시 전체 메뉴 조회 (카테고리별 그룹화)
- **정렬**: 카테고리 sortOrder → 메뉴 sortOrder → 메뉴 id
- **성공**: 200 OK + 카테고리별 메뉴 목록 반환
- **반환 데이터**: 카테고리 정보 포함 (카테고리명, 메뉴 수)

### BR-MENU-11: 관리자 메뉴 조회 vs 고객 메뉴 조회
- 관리자 조회: `isAvailable` 상관없이 모든 메뉴 표시
- 고객 조회 (Unit 2): `isAvailable = true`인 메뉴만 표시
- 관리자 조회에는 `createdAt`, `updatedAt` 포함

---

## 6. 접근 제어 규칙

### BR-MENU-12: 관리자 전용 접근
- 모든 메뉴 관리 API는 `role: ADMIN` 인증 필수
- `storeId` 기반 데이터 격리 (관리자의 storeId에 속한 메뉴만 접근 가능)
- SECURITY-08: Object-level authorization — menuId로 접근 시 storeId 일치 확인

### BR-MENU-13: CORS 및 보안
- 관리자 API는 인증된 요청만 허용
- 모든 입력은 Zod 스키마로 검증 (SECURITY-05)
- 에러 응답에 내부 정보 노출 금지 (SECURITY-09)
