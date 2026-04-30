# Unit 4 (Admin Manage) - 전체 코드 요약

## 생성 파일 총 목록

### 인프라 변경 (2개)
| 파일 | 변경 내용 |
|------|----------|
| `prisma/schema.prisma` | OrderItem.menuItemId optional + onDelete: SetNull |
| `src/lib/validators/common-schemas.ts` | 가격 범위 100~1M, menuSwapOrderSchema, adminMenuQuerySchema 추가 |

### 비즈니스 로직 (1개 + 테스트 1개)
| 파일 | 역할 |
|------|------|
| `src/lib/services/menu-service.ts` | MenuService (7개 메서드) |
| `src/lib/services/__tests__/menu-service.test.ts` | 단위 테스트 (22개 케이스) ✅ |

### API 레이어 (4개 + 테스트 1개)
| 파일 | 엔드포인트 |
|------|-----------|
| `src/app/api/admin/menu/route.ts` | GET, POST |
| `src/app/api/admin/menu/[id]/route.ts` | GET, PUT, DELETE |
| `src/app/api/admin/menu/order/route.ts` | PATCH |
| `src/app/api/admin/menu/[id]/order/route.ts` | PATCH |
| `src/app/api/admin/menu/__tests__/menu-api.test.ts` | 단위 테스트 (11개 케이스) ✅ |

### 프론트엔드 (6개 컴포넌트 + 3개 페이지)
| 파일 | 역할 |
|------|------|
| `src/components/admin/menu/CategoryFilter.tsx` | 카테고리 필터 |
| `src/components/admin/menu/MenuTable.tsx` | 메뉴 테이블 |
| `src/components/admin/menu/MenuTableRow.tsx` | 테이블 행 |
| `src/components/admin/menu/MenuOrderButtons.tsx` | 순서 버튼 |
| `src/components/admin/menu/MenuForm.tsx` | 등록/수정 폼 |
| `src/components/admin/menu/MenuDeleteConfirm.tsx` | 삭제 모달 |
| `src/app/(admin)/menu-manage/page.tsx` | 목록 페이지 |
| `src/app/(admin)/menu-manage/new/page.tsx` | 등록 페이지 |
| `src/app/(admin)/menu-manage/[id]/edit/page.tsx` | 수정 페이지 |

## 테스트 결과
- MenuService: **22개 통과** ✅
- API Routes: **11개 통과** ✅
- 총 **33개 테스트 통과**

## 스토리 커버리지
- [x] AS-11: 메뉴 등록
- [x] AS-12: 메뉴 수정
- [x] AS-13: 메뉴 삭제
- [x] AS-14: 메뉴 노출 순서 조정
- [x] AS-15: 카테고리별 메뉴 조회 (관리자)
