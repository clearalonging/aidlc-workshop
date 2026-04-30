# 테이블오더 서비스 - Unit of Work 의존성

---

## 1. 유닛 간 의존성 매트릭스

| 유닛 | Unit 1 (Foundation) | Unit 2 (Customer) | Unit 3 (Admin Monitor) | Unit 4 (Admin Manage) |
|------|:---:|:---:|:---:|:---:|
| **Unit 1 (Foundation)** | - | - | - | - |
| **Unit 2 (Customer Order)** | ✅ 의존 | - | - | - |
| **Unit 3 (Admin Monitor)** | ✅ 의존 | - | - | - |
| **Unit 4 (Admin Manage)** | ✅ 의존 | - | - | - |

- Unit 2, 3, 4 → Unit 1에 의존 (DB 스키마, 인증, 미들웨어, SSE, 타입)
- Unit 2 ↔ Unit 3 ↔ Unit 4: 직접 의존 없음

---

## 2. 의존성 상세

### Unit 2 (Customer Order) → Unit 1 의존 항목
| 의존 대상 | 의존 유형 | 설명 |
|----------|----------|------|
| Prisma 스키마 | 빌드 타임 | MenuItem, Order, OrderItem, Category, TableSession 모델 |
| AuthService | 런타임 | 테이블 토큰 검증 (authMiddleware) |
| Middleware | 런타임 | 인증, 입력 검증, 에러 핸들링 |
| Types | 빌드 타임 | API 요청/응답 타입 |
| Validators | 런타임 | Zod 스키마 (주문 생성 검증) |
| SSEManager | 런타임 | 주문 생성 시 이벤트 발행 |

### Unit 3 (Admin Monitor) → Unit 1 의존 항목
| 의존 대상 | 의존 유형 | 설명 |
|----------|----------|------|
| Prisma 스키마 | 빌드 타임 | Table, Order, OrderItem, TableSession, OrderHistory 모델 |
| AuthService | 런타임 | 관리자 토큰 검증 (authMiddleware) |
| SSEManager | 런타임 | 실시간 이벤트 브로드캐스트 및 수신 |
| Middleware | 런타임 | 인증, 입력 검증, 에러 핸들링 |
| Types | 빌드 타임 | API 요청/응답 타입 |
| Shared UI | 빌드 타임 | 공통 UI 컴포넌트 (모달, 버튼 등) |

### Unit 4 (Admin Manage) → Unit 1 의존 항목
| 의존 대상 | 의존 유형 | 설명 |
|----------|----------|------|
| Prisma 스키마 | 빌드 타임 | MenuItem, Category 모델 |
| AuthService | 런타임 | 관리자 토큰 검증 (authMiddleware) |
| Middleware | 런타임 | 인증, 입력 검증, 에러 핸들링 |
| Types | 빌드 타임 | API 요청/응답 타입 |
| Validators | 런타임 | Zod 스키마 (메뉴 등록/수정 검증) |
| Shared UI | 빌드 타임 | 공통 UI 컴포넌트 (폼, 버튼 등) |

---

## 3. 공유 서비스 파일

| 공유 파일 | Unit 2 | Unit 3 | Unit 4 |
|----------|--------|--------|--------|
| `menu-service.ts` | 조회 메서드 | - | CRUD 메서드 |
| `order-service.ts` | 생성/조회 메서드 | 상태 변경/삭제/SSE 메서드 | - |
| `table-service.ts` | - | 전체 담당 | - |

---

## 4. 개발 순서 및 병렬화

```
Phase 1 (공동):  Unit 1 (Foundation) ── 3명 공동 ──────────→
Phase 2 (병렬):   Dev A: Unit 2 (Customer Order) ─────────→
                  Dev B: Unit 3 (Admin Monitor)  ─────────→  Build and Test
                  Dev C: Unit 4 (Admin Manage)   ─────────→
```

| Phase | 유닛 | 담당 | 선행 조건 | 병렬 |
|-------|------|------|----------|:----:|
| Phase 1 | Unit 1 (Foundation) | 3명 공동 | 없음 | - |
| Phase 2 | Unit 2 (Customer Order) | Developer A | Unit 1 완료 | ✅ |
| Phase 2 | Unit 3 (Admin Monitor) | Developer B | Unit 1 완료 | ✅ |
| Phase 2 | Unit 4 (Admin Manage) | Developer C | Unit 1 완료 | ✅ |
| Phase 3 | Build and Test | 3명 공동 | Unit 2,3,4 완료 | - |

---

## 5. 의존성 순환 검증

✅ **순환 의존성 없음**
- Unit 1 → 없음 (독립)
- Unit 2 → Unit 1 (단방향)
- Unit 3 → Unit 1 (단방향)
- Unit 4 → Unit 1 (단방향)
- Unit 2 ↔ Unit 3 ↔ Unit 4: 직접 의존 없음

---

## 6. 통합 테스트 포인트

| 통합 시나리오 | 관련 유닛 | 설명 |
|-------------|----------|------|
| 고객 주문 → 실시간 알림 | Unit 2 + Unit 3 | 고객 주문 생성 → SSE → 관리자 대시보드 반영 |
| 메뉴 등록 → 고객 조회 | Unit 4 + Unit 2 | 관리자 메뉴 등록 → 고객 메뉴 목록에 표시 |
| 테이블 이용 완료 → 고객 세션 리셋 | Unit 3 + Unit 2 | 관리자 이용 완료 → 고객 주문 내역 초기화 |
| 인증 → 모든 API | Unit 1 + Unit 2,3,4 | JWT 토큰 검증이 모든 보호된 API에서 동작 |
