# Unit 1 (Foundation) - 비즈니스 규칙

---

## 1. 인증 비즈니스 규칙

### BR-AUTH-01: 관리자 로그인
- 입력: `storeId`, `username`, `password`
- 검증 순서:
  1. `storeId` 존재 확인
  2. 로그인 시도 횟수 확인 (BR-AUTH-04)
  3. `username`으로 Admin 조회
  4. bcrypt로 비밀번호 비교
  5. 성공 시 JWT 발급 (만료: 16시간)
  6. 로그인 시도 기록 (성공/실패)
- 실패 시: 401 Unauthorized (구체적 실패 이유 노출 금지)

### BR-AUTH-02: 테이블 로그인
- 입력: `storeId`, `tableNumber`, `password`
- 검증 순서:
  1. `storeId` 존재 확인
  2. `tableNumber`로 Table 조회
  3. bcrypt로 비밀번호 비교
  4. 성공 시 JWT 발급 (만료: 24시간, 자동 갱신 없음)
- 실패 시: 401 Unauthorized

### BR-AUTH-03: JWT 토큰 구조
- **관리자 토큰 Payload**: `{ sub: adminId, role: 'ADMIN', storeId, iat, exp }`
- **테이블 토큰 Payload**: `{ sub: tableId, role: 'TABLE', storeId, tableNumber, iat, exp }`
- 서명 알고리즘: HS256
- Secret: 환경 변수 `JWT_SECRET` (최소 32자)

### BR-AUTH-04: 로그인 시도 제한 (Brute-force 방지)
- 기준: 동일 `username` 기준 최근 15분 내 실패 횟수
- 임계값: 5회 실패 시 차단
- 차단 시간: 15분
- 차단 중 시도 시: 429 Too Many Requests + 남은 차단 시간 반환
- 성공 로그인 시: 실패 카운트 초기화 (단, 기록은 유지)

### BR-AUTH-05: 비밀번호 해싱
- 알고리즘: bcrypt
- Cost factor: 12
- 적용 대상: Admin.passwordHash, Table.passwordHash

---

## 2. 세션 비즈니스 규칙

### BR-SESSION-01: 테이블 세션 시작
- 트리거: 테이블에서 첫 주문 생성 시
- 조건: 해당 테이블에 활성 세션(`completedAt IS NULL`)이 없을 때
- 동작: 새 TableSession 생성 (`startedAt = now()`)
- 세션 ID: UUID v4

### BR-SESSION-02: 테이블 세션 종료 (이용 완료)
- 트리거: 관리자가 이용 완료 처리
- 동작 (트랜잭션):
  1. 활성 세션의 `completedAt = now()` 설정
  2. 해당 세션의 모든 Order를 OrderHistory로 이동
  3. 완료 처리 완료
- 결과: 테이블 현재 주문 목록 비워짐 (새 세션 시작 가능)

### BR-SESSION-03: 세션 ID 기반 주문 필터링
- 고객 주문 내역 조회 시 현재 활성 세션 ID로만 필터링
- 이전 세션 주문은 고객에게 표시하지 않음

---

## 3. 미들웨어 비즈니스 규칙

### BR-MW-01: 인증 미들웨어
- 모든 `/api/*` 경로에 적용 (공개 경로 제외)
- 공개 경로: `POST /api/auth/admin/login`, `POST /api/auth/table/login`
- Authorization 헤더에서 Bearer 토큰 추출
- 토큰 검증: 서명, 만료, 역할(role) 확인
- 실패 시: 401 Unauthorized

### BR-MW-02: 역할 기반 접근 제어
- `role: 'ADMIN'` 필요 경로: `/api/admin/*`, `/api/orders/stream`
- `role: 'TABLE'` 필요 경로: `/api/menu`, `/api/orders` (고객용)
- 역할 불일치 시: 403 Forbidden

### BR-MW-03: 입력 검증 (Zod)
- 모든 API 요청 본문을 Zod 스키마로 검증
- 검증 실패 시: 400 Bad Request + 필드별 오류 메시지
- 요청 본문 최대 크기: 1MB

### BR-MW-04: Rate Limiting
- 로그인 엔드포인트: 분당 10회 (IP 기준)
- 일반 API: 분당 100회 (IP 기준)
- 초과 시: 429 Too Many Requests + Retry-After 헤더

### BR-MW-05: 에러 핸들링
- 모든 처리되지 않은 예외를 글로벌 핸들러에서 포착
- 프로덕션 응답: 일반 메시지만 반환 (스택 트레이스 노출 금지)
- 에러 로그: 구조화된 형식으로 기록 (timestamp, requestId, error)

### BR-MW-06: 보안 헤더
- `Content-Security-Policy: default-src 'self'`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## 4. SSE 비즈니스 규칙

### BR-SSE-01: SSE 연결 관리
- 관리자 인증 후 `/api/orders/stream` 엔드포인트로 SSE 연결
- 연결 시 `Content-Type: text/event-stream` 헤더 설정
- 클라이언트 연결 해제 시 자동 정리

### BR-SSE-02: 이벤트 발행 시점
- 새 주문 생성 시: `event: new-order`
- 주문 상태 변경 시: `event: order-status-changed`
- 주문 삭제 시: `event: order-deleted`
- 테이블 이용 완료 시: `event: table-completed`

### BR-SSE-03: 이벤트 데이터 형식
```json
{
  "event": "new-order",
  "data": {
    "orderId": 1,
    "tableId": 1,
    "tableNumber": 3,
    "totalAmount": 25000,
    "createdAt": "2026-04-30T10:00:00Z"
  }
}
```

---

## 5. 로깅 비즈니스 규칙

### BR-LOG-01: 구조화된 로그 형식
```json
{
  "timestamp": "2026-04-30T10:00:00Z",
  "level": "INFO",
  "requestId": "uuid-v4",
  "message": "Order created",
  "context": { "orderId": 1, "tableId": 1 }
}
```

### BR-LOG-02: 민감 정보 로깅 금지
- 비밀번호, JWT 토큰, 개인 식별 정보 로그 출력 금지
- 로그에 포함 가능: requestId, userId(익명화), 타임스탬프, 이벤트 유형

### BR-LOG-03: 로그 레벨
- `ERROR`: 처리되지 않은 예외, 시스템 오류
- `WARN`: 인증 실패, 검증 오류
- `INFO`: 주요 비즈니스 이벤트 (주문 생성, 상태 변경)
- `DEBUG`: 개발 환경에서만 활성화
