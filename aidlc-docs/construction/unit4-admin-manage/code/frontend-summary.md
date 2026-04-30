# Unit 4 - Frontend 코드 요약

## 생성 파일

### 컴포넌트 (6개)
| 파일 | 역할 | 스토리 |
|------|------|--------|
| `src/components/admin/menu/CategoryFilter.tsx` | 카테고리 필터 탭 | AS-15 |
| `src/components/admin/menu/MenuTable.tsx` | 메뉴 테이블 | AS-15 |
| `src/components/admin/menu/MenuTableRow.tsx` | 메뉴 테이블 행 | AS-15 |
| `src/components/admin/menu/MenuOrderButtons.tsx` | 순서 변경 버튼 | AS-14 |
| `src/components/admin/menu/MenuForm.tsx` | 등록/수정 폼 | AS-11, AS-12 |
| `src/components/admin/menu/MenuDeleteConfirm.tsx` | 삭제 확인 모달 | AS-13 |

### 페이지 (3개)
| 파일 | 경로 | 스토리 |
|------|------|--------|
| `src/app/(admin)/menu-manage/page.tsx` | `/admin/menu-manage` | AS-15, AS-13, AS-14 |
| `src/app/(admin)/menu-manage/new/page.tsx` | `/admin/menu-manage/new` | AS-11 |
| `src/app/(admin)/menu-manage/[id]/edit/page.tsx` | `/admin/menu-manage/[id]/edit` | AS-12 |

## 접근성
- 모든 폼 필드에 `<label>` 연결
- 에러 메시지에 `role="alert"` 적용
- 모달에 `role="dialog"`, `aria-modal="true"` 적용
- 버튼에 `aria-label` 적용
- 최소 터치 영역 44x44px
- `data-testid` 속성 전체 적용

## 프론트엔드 단위 테스트
- React Testing Library 미설치로 보류
- Build & Test 단계에서 설치 후 작성 예정
