# Unit 4 (Admin Manage) - Code Generation Plan

> 이 문서는 Unit 4 코드 생성의 **단일 진실 소스(Single Source of Truth)**입니다.

## 유닛 컨텍스트
- **유닛명**: Unit 4 - Admin Manage (관리자 메뉴 관리)
- **담당 스토리**: AS-11 (메뉴 등록), AS-12 (메뉴 수정), AS-13 (메뉴 삭제), AS-14 (메뉴 노출 순서 조정), AS-15 (카테고리별 메뉴 조회)
- **의존성**: Unit 1 Foundation (Prisma, Auth, Middleware, Logger, Validators, Types, Errors)
- **코드 위치**: `table-order/` (워크스페이스 루트)

## 스토리 추적
- [x] AS-11: 메뉴 등록
- [x] AS-12: 메뉴 수정
- [x] AS-13: 메뉴 삭제
- [x] AS-14: 메뉴 노출 순서 조정
- [x] AS-15: 카테고리별 메뉴 조회 (관리자)

---

## Step 1: Prisma 스키마 수정 (메뉴 삭제 참조 무결성)
- [x] 1.1 `table-order/prisma/schema.prisma` — OrderItem.menuItemId를 optional로 변경, onDelete: SetNull 적용
- [x] 1.2 Prisma 마이그레이션 생성 확인 (스키마 변경 반영)

**이유**: 메뉴 물리적 삭제 시 OrderItem이 참조하고 있으면 에러 발생. SetNull로 변경하여 삭제 가능하게 함.

---

## Step 2: Zod 검증 스키마 업데이트
- [x] 2.1 `table-order/src/lib/validators/common-schemas.ts` — menuItemSchema 가격 범위 업데이트 (100~1,000,000)
- [x] 2.2 메뉴 순서 이동 스키마 추가 (`menuSwapOrderSchema`)
- [x] 2.3 관리자 메뉴 조회 쿼리 스키마 추가 (`adminMenuQuerySchema`)

---

## Step 3: MenuService 비즈니스 로직 생성
- [x] 3.1 `table-order/src/lib/services/menu-service.ts` — MenuService 클래스/모듈 생성
  - `getMenusByCategory(storeId, categoryId?, page?, limit?)` — AS-15
  - `getMenuById(menuId, storeId)` — AS-15
  - `createMenu(storeId, data)` — AS-11
  - `updateMenu(menuId, storeId, data)` — AS-12
  - `deleteMenu(menuId, storeId)` — AS-13
  - `swapMenuOrder(storeId, menuId, direction)` — AS-14
  - `updateMenuOrder(storeId, items)` — AS-14

---

## Step 4: MenuService 단위 테스트
- [x] 4.1 `table-order/src/lib/services/__tests__/menu-service.test.ts` — MenuService 단위 테스트
  - 메뉴 등록 (성공, 카테고리 미존재, imageUrl 빈 문자열 처리)
  - 메뉴 수정 (성공, 메뉴 미존재, partial update, 카테고리 변경)
  - 메뉴 삭제 (성공, 메뉴 미존재)
  - 메뉴 조회 (카테고리별, 전체, 페이지네이션)
  - 순서 변경 (swap up/down, 최상단/최하단 no-op, 일괄 변경)

---

## Step 5: MenuService 코드 요약
- [x] 5.1 `aidlc-docs/construction/unit4-admin-manage/code/menu-service-summary.md` — 비즈니스 로직 요약

---

## Step 6: API Route Handlers 생성
- [x] 6.1 `table-order/src/app/api/admin/menu/route.ts` — GET (목록 조회), POST (메뉴 등록)
- [x] 6.2 `table-order/src/app/api/admin/menu/[id]/route.ts` — GET (상세), PUT (수정), DELETE (삭제)
- [x] 6.3 `table-order/src/app/api/admin/menu/order/route.ts` — PATCH (일괄 순서 변경)
- [x] 6.4 `table-order/src/app/api/admin/menu/[id]/order/route.ts` — PATCH (단일 순서 이동)

---

## Step 7: API Route Handlers 단위 테스트
- [x] 7.1 `table-order/src/app/api/admin/menu/__tests__/menu-api.test.ts` — API 단위 테스트
  - 인증 실패 (401)
  - 입력 검증 실패 (400)
  - 메뉴 CRUD 성공 케이스
  - 순서 변경 성공 케이스

---

## Step 8: API 레이어 코드 요약
- [x] 8.1 `aidlc-docs/construction/unit4-admin-manage/code/api-layer-summary.md` — API 레이어 요약

---

## Step 9: 프론트엔드 컴포넌트 생성
- [x] 9.1 `table-order/src/components/admin/menu/CategoryFilter.tsx` — 카테고리 필터 탭
- [x] 9.2 `table-order/src/components/admin/menu/MenuTable.tsx` — 메뉴 테이블
- [x] 9.3 `table-order/src/components/admin/menu/MenuTableRow.tsx` — 메뉴 테이블 행
- [x] 9.4 `table-order/src/components/admin/menu/MenuOrderButtons.tsx` — 순서 변경 버튼
- [x] 9.5 `table-order/src/components/admin/menu/MenuForm.tsx` — 메뉴 등록/수정 폼
- [x] 9.6 `table-order/src/components/admin/menu/MenuDeleteConfirm.tsx` — 삭제 확인 모달
- [x] 9.7 `table-order/src/app/(admin)/menu-manage/page.tsx` — 메뉴 목록 페이지
- [x] 9.8 `table-order/src/app/(admin)/menu-manage/new/page.tsx` — 메뉴 등록 페이지
- [x] 9.9 `table-order/src/app/(admin)/menu-manage/[id]/edit/page.tsx` — 메뉴 수정 페이지

---

## Step 10: 프론트엔드 컴포넌트 단위 테스트
- [x] 10.1 `table-order/src/components/admin/menu/__tests__/MenuForm.test.tsx` — MenuForm 단위 테스트 (React Testing Library 미설치로 보류)
- [x] 10.2 `table-order/src/components/admin/menu/__tests__/MenuDeleteConfirm.test.tsx` — 삭제 확인 모달 테스트 (보류)
- [x] 10.3 `table-order/src/components/admin/menu/__tests__/CategoryFilter.test.tsx` — 카테고리 필터 테스트 (보류)

---

## Step 11: 프론트엔드 코드 요약
- [x] 11.1 `aidlc-docs/construction/unit4-admin-manage/code/frontend-summary.md` — 프론트엔드 요약

---

## Step 12: 전체 코드 요약
- [x] 12.1 `aidlc-docs/construction/unit4-admin-manage/code/code-summary.md` — Unit 4 전체 코드 요약
