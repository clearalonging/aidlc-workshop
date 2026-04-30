# Unit 4 (Admin Manage) - NFR Requirements

> Unit 4는 Unit 1 Foundation에서 구축된 기반 인프라(인증, 미들웨어, 로깅, 에러 핸들링)를 그대로 활용합니다.
> 이 문서는 Unit 4 고유의 NFR 요구사항만 정의합니다.

---

## 1. 성능 요구사항

### NFR-U4-01: API 응답 시간
- 모든 메뉴 관리 API 응답 시간: **1초 이내**
- 메뉴 목록 조회 (카테고리별 페이지네이션 포함): 1초 이내
- 메뉴 등록/수정/삭제: 1초 이내
- 메뉴 순서 변경 (swap): 1초 이내

### NFR-U4-02: 페이지네이션
- 메뉴 목록 조회 시 **카테고리별 페이지네이션** 적용
- 페이지당 기본 20개 항목
- 최대 페이지 크기: 100개
- 카테고리 필터링과 페이지네이션 조합 지원

---

## 2. 보안 요구사항

### NFR-U4-03: 접근 제어
- 모든 메뉴 관리 API는 **관리자 인증 필수** (JWT, role: ADMIN)
- **Object-level authorization**: menuId 접근 시 storeId 일치 확인 (IDOR 방지)
- Unit 1의 인증 미들웨어 (`authenticateAdmin`) 재사용

### NFR-U4-04: 입력 검증
- 모든 API 입력은 **Zod 스키마**로 검증 (SECURITY-05)
- 문자열 최대 길이 제한: name(100), description(500), imageUrl(2000)
- 가격 범위: 100 ≤ price ≤ 1,000,000
- Prisma 파라미터화 쿼리로 SQL Injection 방지

### NFR-U4-05: Rate Limiting
- 메뉴 관리 API: **분당 200회** (관리자 전용, 일반 API 대비 완화)
- Unit 1의 Rate Limiter 설정을 관리자 메뉴 API에 맞게 조정

---

## 3. 신뢰성 요구사항

### NFR-U4-06: 트랜잭션 무결성
- 메뉴 순서 변경 (swap): **Prisma 트랜잭션**으로 원자적 실행
- 일괄 순서 변경: 트랜잭션으로 모든 항목 동시 업데이트
- 메뉴 삭제: 물리적 삭제 시 OrderItem 참조 무결성 처리

### NFR-U4-07: 에러 처리
- Unit 1의 글로벌 에러 핸들러 (`withErrorHandler`) 재사용
- 모든 외부 호출(DB)에 명시적 에러 핸들링
- 프로덕션 에러 응답에 내부 정보 노출 금지 (SECURITY-09)

---

## 4. 로깅 요구사항

### NFR-U4-08: 감사 로깅
- 메뉴 등록/수정/삭제 시 **pino INFO 레벨** 로그 기록
- 로그 포함 정보: requestId, adminId, 작업 유형, menuId, timestamp
- 민감 정보 로깅 금지 (SECURITY-03)

---

## 5. 사용성 요구사항

### NFR-U4-09: UI 접근성
- 모든 폼 필드에 `<label>` 연결
- 에러 메시지에 `role="alert"` 적용
- 최소 터치 영역 44x44px
- 키보드 네비게이션 지원

### NFR-U4-10: 시각적 피드백
- 등록/수정/삭제 성공 시 성공 메시지 표시
- 에러 발생 시 필드별 에러 메시지 표시
- 로딩 상태 표시 (API 호출 중)

---

## 6. 유지보수성 요구사항

### NFR-U4-11: 테스트
- MenuService 비즈니스 로직 단위 테스트
- API Route Handler 단위 테스트
- 프론트엔드 컴포넌트 단위 테스트
- 테스트 프레임워크: Jest + ts-jest (Unit 1과 동일)

### NFR-U4-12: 코드 구조
- 서비스 레이어와 API 레이어 분리
- 공통 미들웨어/유틸리티 재사용
- TypeScript 타입 안전성 유지

---

## 7. Unit 1 Foundation 재사용 항목

| 항목 | Unit 1 제공 | Unit 4 사용 방식 |
|------|-----------|----------------|
| JWT 인증 | `authenticateAdmin()` | 모든 API에서 호출 |
| 입력 검증 | `validateBody()` | 모든 POST/PUT에서 호출 |
| 에러 핸들링 | `withErrorHandler()` | 모든 Route Handler 래핑 |
| 로깅 | `logger`, `createRequestLogger()` | 감사 로그 기록 |
| Prisma | `prisma` 싱글톤 | DB 접근 |
| Zod 스키마 | `menuItemSchema`, `updateMenuItemSchema`, `menuOrderSchema` | 입력 검증 |
| 에러 클래스 | `NotFoundError`, `BadRequestError`, `ValidationError` | 비즈니스 에러 |
| 보안 헤더 | Next.js 미들웨어 | 자동 적용 |
