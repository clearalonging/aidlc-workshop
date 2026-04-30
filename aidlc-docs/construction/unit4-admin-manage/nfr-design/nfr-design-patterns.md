# Unit 4 (Admin Manage) - NFR 설계 패턴

> Unit 4는 Unit 1 Foundation의 NFR 설계 패턴을 **대부분 재사용**합니다.
> 이 문서는 Unit 4 고유의 패턴과 Unit 1 패턴의 적용 방식을 정의합니다.

---

## 1. Unit 1 재사용 패턴

### 1.1 인증 미들웨어 패턴 (Chain of Responsibility) — 재사용
```
Request → Rate Limiter (200/min) → Auth Middleware (ADMIN) → Input Validation (Zod) → Handler
```
- Unit 1의 `authenticateAdmin()` 그대로 사용
- Rate Limit만 200/min으로 조정

### 1.2 Fail-Closed 패턴 — 재사용
- `withErrorHandler()` 래퍼로 모든 Route Handler 감싸기
- 인증/검증 실패 시 기본 거부
- 예외 발생 시 500 반환 (접근 허용 안 함)

### 1.3 Defense in Depth — 재사용
```
레이어 1: Rate Limiting (IP 기반, 200/min)
레이어 2: JWT 토큰 검증 (서명, 만료, role: ADMIN)
레이어 3: Object-level Authorization (storeId 일치 확인)
레이어 4: 입력값 검증 (Zod 스키마)
레이어 5: Prisma 파라미터화 쿼리 (SQL Injection 방지)
```

### 1.4 구조화된 로깅 패턴 — 재사용
- `createRequestLogger(requestId)` 사용
- 감사 로그: INFO 레벨, adminId + action + menuId 포함

---

## 2. Unit 4 고유 패턴

### 2.1 서버 사이드 페이지네이션 패턴

```typescript
// 페이지네이션 적용 메뉴 조회
async function getMenusByCategory(
  storeId: string,
  categoryId?: number,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100); // 최대 100개 제한

  const where = {
    storeId,
    ...(categoryId && { categoryId }),
  };

  const [items, total] = await Promise.all([
    prisma.menuItem.findMany({
      where,
      skip,
      take,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: { category: true },
    }),
    prisma.menuItem.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit: take,
    totalPages: Math.ceil(total / take),
  };
}
```

**설계 원칙:**
- `skip`/`take` 기반 오프셋 페이지네이션 (SQLite 호환)
- 총 개수와 데이터를 `Promise.all`로 병렬 조회 (성능)
- 최대 페이지 크기 100개 제한 (메모리 보호)
- 정렬: sortOrder ASC → id ASC (안정적 정렬)

### 2.2 순서 변경 트랜잭션 패턴 (Swap)

```typescript
// 두 메뉴의 sortOrder 교환 - 원자적 실행
async function swapMenuOrder(
  storeId: string,
  menuId: number,
  direction: 'up' | 'down'
) {
  await prisma.$transaction(async (tx) => {
    // 1. 현재 메뉴 조회
    const current = await tx.menuItem.findFirst({
      where: { id: menuId, storeId },
    });
    if (!current) throw new NotFoundError('메뉴');

    // 2. 인접 메뉴 찾기 (같은 카테고리 내)
    const adjacent = await tx.menuItem.findFirst({
      where: {
        storeId,
        categoryId: current.categoryId,
        sortOrder: direction === 'up'
          ? { lt: current.sortOrder }
          : { gt: current.sortOrder },
      },
      orderBy: {
        sortOrder: direction === 'up' ? 'desc' : 'asc',
      },
    });

    // 3. 인접 메뉴 없으면 no-op
    if (!adjacent) return;

    // 4. sortOrder 교환
    await tx.menuItem.update({
      where: { id: current.id },
      data: { sortOrder: adjacent.sortOrder },
    });
    await tx.menuItem.update({
      where: { id: adjacent.id },
      data: { sortOrder: current.sortOrder },
    });
  });
}
```

**설계 원칙:**
- Prisma `$transaction`으로 원자적 실행 (두 업데이트가 모두 성공하거나 모두 롤백)
- 같은 카테고리 내에서만 순서 교환
- 최상단/최하단에서의 이동은 no-op (에러 아님)
- 트랜잭션 내에서 조회 + 업데이트 (race condition 방지)

### 2.3 일괄 순서 변경 트랜잭션 패턴

```typescript
// 여러 메뉴의 sortOrder 일괄 업데이트
async function updateMenuOrder(
  storeId: string,
  items: { id: number; sortOrder: number }[]
) {
  await prisma.$transaction(async (tx) => {
    // 1. 모든 menuId가 storeId에 속하는지 확인
    const menuIds = items.map(item => item.id);
    const existingCount = await tx.menuItem.count({
      where: { id: { in: menuIds }, storeId },
    });
    if (existingCount !== menuIds.length) {
      throw new BadRequestError('존재하지 않는 메뉴가 포함되어 있습니다.');
    }

    // 2. 일괄 업데이트
    for (const item of items) {
      await tx.menuItem.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      });
    }
  });
}
```

**설계 원칙:**
- 트랜잭션으로 전체 성공 또는 전체 롤백
- 소유권 검증 후 업데이트 (SECURITY-08)
- 순차 업데이트 (SQLite 단일 writer 특성에 적합)

### 2.4 물리적 삭제 + 참조 무결성 패턴

```typescript
// 메뉴 삭제 시 OrderItem 참조 처리
async function deleteMenu(menuId: number, storeId: string) {
  const menu = await prisma.menuItem.findFirst({
    where: { id: menuId, storeId },
  });
  if (!menu) throw new NotFoundError('메뉴');

  // 물리적 삭제 실행
  // OrderItem.menuItemName, OrderItem.unitPrice는 스냅샷이므로
  // 주문 내역 무결성 유지됨
  await prisma.menuItem.delete({ where: { id: menuId } });
}
```

**참조 무결성 고려사항:**
- 현재 Prisma 스키마에서 `OrderItem.menuItemId → MenuItem` 관계가 있음
- 메뉴 삭제 시 OrderItem이 참조하고 있으면 Prisma가 에러 발생
- **해결 방안**: Prisma 스키마에서 `OrderItem.menuItemId`를 optional로 변경하고 `onDelete: SetNull` 적용 필요
- 또는 삭제 전 관련 OrderItem의 menuItemId를 null로 업데이트

### 2.5 감사 로깅 패턴

```typescript
// 메뉴 CRUD 감사 로그
function logMenuAction(
  requestLogger: pino.Logger,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'REORDER',
  adminId: number,
  menuId: number,
  menuName?: string
) {
  requestLogger.info(
    {
      action,
      adminId,
      menuId,
      menuName,
      entity: 'MenuItem',
    },
    `Menu ${action.toLowerCase()}d`
  );
}
```

---

## 3. 에러 처리 전략 (Unit 4)

| 시나리오 | 에러 클래스 | HTTP 상태 | 메시지 |
|---------|-----------|:---------:|--------|
| 메뉴 미존재 | `NotFoundError` | 404 | "메뉴을(를) 찾을 수 없습니다." |
| 카테고리 미존재 | `BadRequestError` | 400 | "존재하지 않는 카테고리입니다." |
| 입력 검증 실패 | `ValidationError` | 400 | 필드별 에러 메시지 |
| 인증 실패 | `UnauthorizedError` | 401 | "인증 토큰이 필요합니다." |
| 권한 없음 | `ForbiddenError` | 403 | "접근 권한이 없습니다." |
| Rate Limit 초과 | `TooManyRequestsError` | 429 | "요청 횟수를 초과했습니다." |
| 순서 변경 메뉴 미존재 | `BadRequestError` | 400 | "존재하지 않는 메뉴가 포함되어 있습니다." |
| DB 삭제 참조 오류 | `BadRequestError` | 400 | "메뉴를 삭제할 수 없습니다." |
| 서버 내부 오류 | (글로벌 핸들러) | 500 | "서버 오류가 발생했습니다." |
