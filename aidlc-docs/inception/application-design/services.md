# 테이블오더 서비스 - 서비스 정의 및 오케스트레이션

---

## 1. 서비스 정의

### AuthService
- **역할**: 인증 및 권한 관리의 중앙 서비스
- **오케스트레이션**:
  - 관리자 로그인: 자격 증명 검증 → 로그인 시도 확인 → JWT 발급
  - 테이블 로그인: 테이블 자격 증명 검증 → 토큰 발급
  - 토큰 검증: 모든 보호된 API 요청 전 실행
- **의존성**: Database (Prisma)

### MenuService
- **역할**: 메뉴 데이터의 CRUD 및 비즈니스 규칙 관리
- **오케스트레이션**:
  - 메뉴 조회: 카테고리별 그룹화 → 정렬 순서 적용 → 반환
  - 메뉴 등록: 데이터 검증 → 저장 → 반환
  - 메뉴 수정/삭제: 존재 확인 → 수정/삭제 → 반환
- **의존성**: Database (Prisma)

### OrderService
- **역할**: 주문 생성, 상태 관리, 실시간 이벤트 발행
- **오케스트레이션**:
  - 주문 생성: 메뉴 유효성 검증 → 금액 계산 → 주문 저장 → SSE 이벤트 발행
  - 상태 변경: 상태 전이 검증 → 업데이트 → SSE 이벤트 발행
  - 주문 삭제: 존재 확인 → 삭제 → 총 금액 재계산 → SSE 이벤트 발행
- **의존성**: Database (Prisma), SSEManager, MenuService (메뉴 유효성 검증)

### TableService
- **역할**: 테이블 설정, 세션 라이프사이클, 이력 관리
- **오케스트레이션**:
  - 테이블 설정: 비밀번호 해싱 → 테이블 저장
  - 이용 완료: 현재 세션 주문 → 이력 이동 → 세션 종료 → 리셋 → SSE 이벤트 발행
  - 과거 내역: 날짜 필터 적용 → 이력 조회 → 반환
- **의존성**: Database (Prisma), AuthService (비밀번호 해싱), SSEManager

---

## 2. 서비스 상호작용 패턴

### 주문 생성 플로우
```
CustomerUI → OrderAPI → authMiddleware → OrderService
                                            ├→ MenuService.getMenuById() (메뉴 유효성)
                                            ├→ Database (주문 저장)
                                            └→ SSEManager.broadcast() (실시간 알림)
                                                  └→ AdminUI (SSE 수신)
```

### 관리자 로그인 플로우
```
AdminUI → AuthAPI → AuthService
                      ├→ checkLoginAttempts()
                      ├→ Database (사용자 조회)
                      ├→ comparePassword()
                      ├→ JWT 토큰 생성
                      └→ recordLoginAttempt()
```

### 테이블 이용 완료 플로우
```
AdminUI → TableAPI → authMiddleware → TableService
                                        ├→ Database (현재 세션 주문 조회)
                                        ├→ Database (주문 이력 이동)
                                        ├→ Database (세션 종료)
                                        ├→ Database (테이블 리셋)
                                        └→ SSEManager.broadcast() (실시간 알림)
```

### SSE 실시간 스트림 플로우
```
AdminUI → OrderAPI(/stream) → authMiddleware → SSEManager.addClient()
                                                    ↓
OrderService.createOrder() → SSEManager.broadcast() → AdminUI (이벤트 수신)
OrderService.updateStatus() → SSEManager.broadcast() → AdminUI (이벤트 수신)
OrderService.deleteOrder() → SSEManager.broadcast() → AdminUI (이벤트 수신)
TableService.completeTable() → SSEManager.broadcast() → AdminUI (이벤트 수신)
```

---

## 3. 에러 처리 전략

| 서비스 | 에러 유형 | 처리 방식 |
|--------|----------|----------|
| AuthService | 인증 실패 | 401 Unauthorized, 로그인 시도 기록 |
| AuthService | 시도 횟수 초과 | 429 Too Many Requests, 차단 시간 안내 |
| MenuService | 메뉴 미존재 | 404 Not Found |
| MenuService | 검증 실패 | 400 Bad Request, 검증 오류 상세 |
| OrderService | 메뉴 유효하지 않음 | 400 Bad Request |
| OrderService | 주문 미존재 | 404 Not Found |
| TableService | 테이블 미존재 | 404 Not Found |
| TableService | 활성 세션 없음 | 400 Bad Request |
| 공통 | 서버 내부 오류 | 500 Internal Server Error, 일반 메시지 |
