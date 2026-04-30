# Unit 4 (Admin Manage) - 프론트엔드 컴포넌트

---

## 1. 페이지 구조

```
src/app/(admin)/menu-manage/
├── page.tsx                    # 메뉴 목록 페이지 (AS-15)
├── new/
│   └── page.tsx                # 메뉴 등록 페이지 (AS-11)
└── [id]/
    └── edit/
        └── page.tsx            # 메뉴 수정 페이지 (AS-12)
```

> **결정사항 (Q5: A)**: 테이블(표) 형태 목록 + 등록/수정은 별도 페이지

---

## 2. 컴포넌트 계층 구조

```
src/components/admin/menu/
├── MenuListPage.tsx            # 메뉴 목록 페이지 컴포넌트
├── MenuTable.tsx               # 메뉴 테이블 (카테고리별)
├── MenuTableRow.tsx            # 메뉴 테이블 행
├── MenuForm.tsx                # 메뉴 등록/수정 공통 폼
├── MenuDeleteConfirm.tsx       # 삭제 확인 모달
├── CategoryFilter.tsx          # 카테고리 필터 탭
└── MenuOrderButtons.tsx        # 순서 변경 화살표 버튼
```

---

## 3. 컴포넌트 상세

### 3.1 MenuListPage (메뉴 목록 페이지)

**경로**: `/admin/menu-manage`
**스토리**: AS-15 (카테고리별 메뉴 조회)

**상태 (State)**:
| 상태 | 타입 | 초기값 | 설명 |
|------|------|--------|------|
| `categories` | `CategoryWithMenus[]` | `[]` | 카테고리별 메뉴 데이터 |
| `selectedCategoryId` | `number \| null` | `null` | 선택된 카테고리 (null = 전체) |
| `isLoading` | `boolean` | `true` | 로딩 상태 |
| `error` | `string \| null` | `null` | 에러 메시지 |
| `deleteTarget` | `MenuItem \| null` | `null` | 삭제 대상 메뉴 (모달 표시용) |

**사용자 인터랙션**:
- 카테고리 탭 클릭 → `selectedCategoryId` 변경 → 필터링된 메뉴 표시
- "메뉴 등록" 버튼 클릭 → `/admin/menu-manage/new`로 이동
- 메뉴 행의 "수정" 클릭 → `/admin/menu-manage/[id]/edit`로 이동
- 메뉴 행의 "삭제" 클릭 → `deleteTarget` 설정 → 확인 모달 표시
- 위/아래 화살표 클릭 → API 호출 → 목록 새로고침

**API 연동**:
- `GET /api/admin/menu` — 초기 로드 및 카테고리 변경 시
- `DELETE /api/admin/menu/[id]` — 삭제 확인 시
- `PATCH /api/admin/menu/[id]/order` — 순서 변경 시

**data-testid**:
- `menu-list-page` — 페이지 컨테이너
- `menu-list-add-button` — 메뉴 등록 버튼
- `menu-list-loading` — 로딩 표시
- `menu-list-error` — 에러 메시지

---

### 3.2 CategoryFilter (카테고리 필터)

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| `categories` | `Category[]` | 카테고리 목록 |
| `selectedId` | `number \| null` | 선택된 카테고리 ID |
| `onSelect` | `(id: number \| null) => void` | 카테고리 선택 콜백 |

**렌더링**:
- "전체" 탭 + 각 카테고리 탭
- 선택된 탭 시각적 강조 (active 스타일)

**data-testid**:
- `category-filter` — 필터 컨테이너
- `category-filter-all` — 전체 탭
- `category-filter-item-{id}` — 개별 카테고리 탭

---

### 3.3 MenuTable (메뉴 테이블)

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| `menuItems` | `MenuItem[]` | 메뉴 목록 |
| `categoryName` | `string` | 카테고리명 (테이블 헤더) |
| `onEdit` | `(id: number) => void` | 수정 클릭 콜백 |
| `onDelete` | `(item: MenuItem) => void` | 삭제 클릭 콜백 |
| `onMoveUp` | `(id: number) => void` | 위로 이동 콜백 |
| `onMoveDown` | `(id: number) => void` | 아래로 이동 콜백 |
| `isFirst` | `(id: number) => boolean` | 최상단 여부 |
| `isLast` | `(id: number) => boolean` | 최하단 여부 |

**테이블 컬럼**:
| 컬럼 | 내용 |
|------|------|
| 순서 | 위/아래 화살표 버튼 |
| 메뉴명 | 메뉴 이름 |
| 가격 | 가격 (원 단위, 포맷팅) |
| 상태 | isAvailable 뱃지 |
| 등록일 | createdAt (날짜 포맷) |
| 관리 | 수정/삭제 버튼 |

**data-testid**:
- `menu-table-{categoryId}` — 테이블 컨테이너
- `menu-table-header-{categoryId}` — 카테고리 헤더

---

### 3.4 MenuTableRow (메뉴 테이블 행)

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| `item` | `MenuItem` | 메뉴 데이터 |
| `onEdit` | `() => void` | 수정 클릭 |
| `onDelete` | `() => void` | 삭제 클릭 |
| `onMoveUp` | `() => void` | 위로 이동 |
| `onMoveDown` | `() => void` | 아래로 이동 |
| `isFirst` | `boolean` | 최상단 여부 (위 버튼 비활성화) |
| `isLast` | `boolean` | 최하단 여부 (아래 버튼 비활성화) |

**data-testid**:
- `menu-row-{id}` — 행 컨테이너
- `menu-row-{id}-edit-button` — 수정 버튼
- `menu-row-{id}-delete-button` — 삭제 버튼
- `menu-row-{id}-move-up-button` — 위로 이동 버튼
- `menu-row-{id}-move-down-button` — 아래로 이동 버튼

---

### 3.5 MenuForm (메뉴 등록/수정 폼)

**경로**: `/admin/menu-manage/new` (등록), `/admin/menu-manage/[id]/edit` (수정)
**스토리**: AS-11 (등록), AS-12 (수정)

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| `mode` | `'create' \| 'edit'` | 폼 모드 |
| `initialData` | `MenuItem \| undefined` | 수정 시 기존 데이터 |
| `categories` | `Category[]` | 카테고리 목록 |

**폼 필드**:
| 필드 | 타입 | 필수 | 검증 |
|------|------|:----:|------|
| 메뉴명 | text input | ✅ | 1~100자 |
| 가격 | number input | ✅ | 100~1,000,000 정수 |
| 카테고리 | select dropdown | ✅ | 기존 카테고리 중 선택 |
| 설명 | textarea | ❌ | 최대 500자 |
| 이미지 URL | text input | ❌ | URL 형식 |

**상태 (State)**:
| 상태 | 타입 | 설명 |
|------|------|------|
| `formData` | `MenuFormData` | 폼 입력 데이터 |
| `errors` | `Record<string, string>` | 필드별 에러 메시지 |
| `isSubmitting` | `boolean` | 제출 중 상태 |
| `submitError` | `string \| null` | 서버 에러 메시지 |

**클라이언트 사이드 검증**:
- 제출 전 Zod 스키마로 검증
- 필드별 에러 메시지 즉시 표시
- 서버 에러 발생 시 상단에 에러 메시지 표시

**사용자 인터랙션**:
- 폼 입력 → 실시간 상태 업데이트
- "저장" 버튼 클릭 → 클라이언트 검증 → API 호출 → 성공 시 목록 페이지로 이동
- "취소" 버튼 클릭 → 목록 페이지로 이동

**API 연동**:
- 등록: `POST /api/admin/menu`
- 수정: `PUT /api/admin/menu/[id]`
- 카테고리 목록: `GET /api/admin/menu` (카테고리 정보 추출)

**data-testid**:
- `menu-form` — 폼 컨테이너
- `menu-form-name-input` — 메뉴명 입력
- `menu-form-price-input` — 가격 입력
- `menu-form-category-select` — 카테고리 선택
- `menu-form-description-input` — 설명 입력
- `menu-form-image-url-input` — 이미지 URL 입력
- `menu-form-submit-button` — 저장 버튼
- `menu-form-cancel-button` — 취소 버튼
- `menu-form-error` — 에러 메시지

---

### 3.6 MenuDeleteConfirm (삭제 확인 모달)

**스토리**: AS-13

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| `item` | `MenuItem \| null` | 삭제 대상 (null이면 모달 숨김) |
| `onConfirm` | `() => void` | 삭제 확인 |
| `onCancel` | `() => void` | 취소 |
| `isDeleting` | `boolean` | 삭제 진행 중 |

**렌더링**:
- 오버레이 배경
- "정말 삭제하시겠습니까?" 메시지 + 메뉴명 표시
- 확인/취소 버튼

**data-testid**:
- `menu-delete-confirm-modal` — 모달 컨테이너
- `menu-delete-confirm-button` — 확인 버튼
- `menu-delete-cancel-button` — 취소 버튼

---

### 3.7 MenuOrderButtons (순서 변경 버튼)

**스토리**: AS-14

**Props**:
| Prop | 타입 | 설명 |
|------|------|------|
| `onMoveUp` | `() => void` | 위로 이동 |
| `onMoveDown` | `() => void` | 아래로 이동 |
| `disableUp` | `boolean` | 위 버튼 비활성화 |
| `disableDown` | `boolean` | 아래 버튼 비활성화 |

**data-testid**: 부모 컴포넌트(MenuTableRow)에서 관리

---

## 4. 페이지 라우팅 및 네비게이션

| 경로 | 페이지 | 진입 방법 |
|------|--------|----------|
| `/admin/menu-manage` | 메뉴 목록 | 관리자 네비게이션 메뉴 |
| `/admin/menu-manage/new` | 메뉴 등록 | 목록 페이지 "메뉴 등록" 버튼 |
| `/admin/menu-manage/[id]/edit` | 메뉴 수정 | 목록 페이지 "수정" 버튼 |

**네비게이션 플로우**:
```
메뉴 목록 ──→ 메뉴 등록 ──→ (저장 성공) ──→ 메뉴 목록
메뉴 목록 ──→ 메뉴 수정 ──→ (저장 성공) ──→ 메뉴 목록
메뉴 목록 ──→ 삭제 확인 모달 ──→ (삭제 성공) ──→ 메뉴 목록 (새로고침)
```

---

## 5. 타입 정의 (프론트엔드)

```typescript
// 카테고리 + 메뉴 목록 응답
interface CategoryWithMenus {
  id: number;
  name: string;
  sortOrder: number;
  menuItems: MenuItemResponse[];
  _count: { menuItems: number };
}

// 메뉴 응답
interface MenuItemResponse {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  category?: { id: number; name: string };
}

// 폼 데이터
interface MenuFormData {
  name: string;
  price: number | '';
  categoryId: number | '';
  description: string;
  imageUrl: string;
}
```

---

## 6. 접근성 (Accessibility)

- 모든 폼 필드에 `<label>` 연결
- 에러 메시지에 `role="alert"` 적용
- 모달에 `role="dialog"`, `aria-modal="true"` 적용
- 버튼에 `aria-label` 적용 (아이콘 버튼)
- 키보드 네비게이션 지원 (Tab, Enter, Escape)
- 최소 터치 영역 44x44px (NFR-03)
