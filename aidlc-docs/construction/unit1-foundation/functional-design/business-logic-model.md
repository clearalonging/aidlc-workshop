# Unit 1 (Foundation) - 비즈니스 로직 모델

---

## 1. AuthService 로직 모델

### 1.1 관리자 로그인 플로우
```
loginAdmin(storeId, username, password):
  1. Store 존재 확인 → 없으면 401
  2. checkLoginAttempts(username) → 차단 중이면 429
  3. Admin 조회 (storeId + username) → 없으면 401
  4. bcrypt.compare(password, admin.passwordHash) → 불일치 시 401
  5. recordLoginAttempt(username, success=false/true)
  6. 성공 시: JWT 생성 { sub: admin.id, role: 'ADMIN', storeId, exp: +16h }
  7. 반환: { token, expiresAt }
```

### 1.2 테이블 로그인 플로우
```
loginTable(storeId, tableNumber, password):
  1. Store 존재 확인 → 없으면 401
  2. Table 조회 (storeId + tableNumber) → 없으면 401
  3. bcrypt.compare(password, table.passwordHash) → 불일치 시 401
  4. JWT 생성 { sub: table.id, role: 'TABLE', storeId, tableNumber, exp: +24h }
  5. 반환: { token, tableId, tableNumber }
```

### 1.3 로그인 시도 제한 로직
```
checkLoginAttempts(identifier):
  1. 최근 15분 내 LoginAttempt 조회 (identifier, success=false)
  2. 실패 횟수 >= 5 → { allowed: false, blockedUntil: lastAttempt + 15min }
  3. 실패 횟수 < 5 → { allowed: true, remainingAttempts: 5 - count }

recordLoginAttempt(identifier, success):
  1. LoginAttempt 레코드 생성
  2. success=true 시: 해당 identifier의 최근 실패 기록 무효화 (선택적)
```

---

## 2. SSEManager 로직 모델

### 2.1 클라이언트 관리
```
clients: Map<string, ServerResponse>  // clientId → response

addClient(clientId, response):
  1. clients.set(clientId, response)
  2. response에 SSE 헤더 설정
  3. 연결 확인 이벤트 전송: "connected"
  4. response.on('close') → removeClient(clientId)

removeClient(clientId):
  1. clients.delete(clientId)

broadcast(event, data):
  1. clients.forEach(response → response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
  2. 전송 실패한 클라이언트 자동 제거
```

---

## 3. 미들웨어 로직 모델

### 3.1 인증 미들웨어
```
authMiddleware(requiredRole):
  1. Authorization 헤더에서 Bearer 토큰 추출
  2. 토큰 없음 → 401
  3. jwt.verify(token, JWT_SECRET) → 실패 시 401
  4. payload.exp < now() → 401 (만료)
  5. requiredRole 지정 시: payload.role !== requiredRole → 403
  6. req.user = payload (다음 핸들러에서 사용)
  7. next()
```

### 3.2 입력 검증 미들웨어
```
validateBody(schema: ZodSchema):
  1. schema.safeParse(req.body)
  2. 실패 시: 400 + { errors: zodError.flatten() }
  3. 성공 시: req.validatedBody = parsed; next()
```

### 3.3 글로벌 에러 핸들러
```
errorHandler(error, req, res):
  1. requestId = req.headers['x-request-id'] || uuid()
  2. logger.error({ requestId, error: error.message, stack: error.stack })
  3. if (error instanceof AppError): res.status(error.statusCode).json({ message: error.message })
  4. else: res.status(500).json({ message: '서버 오류가 발생했습니다.' })
```

---

## 4. 데이터베이스 시드 로직

### 4.1 시드 데이터 생성 순서
```
seed():
  1. Store 생성: { id: 'store-001', name: '테이블오더 매장' }
  2. Admin 생성: { storeId: 'store-001', username: 'admin', passwordHash: bcrypt('admin1234', 12) }
  3. Category 생성: ['메인 메뉴', '사이드', '음료', '디저트']
  4. MenuItem 샘플 생성 (카테고리별 2~3개)
  5. Table 샘플 생성 (1~5번 테이블, 기본 비밀번호: '1234')
```

---

## 5. 주문 번호 생성 로직

```
generateOrderNumber(date: Date):
  1. dateStr = format(date, 'YYYYMMDD')
  2. 오늘 날짜의 마지막 주문 번호 조회
  3. sequence = lastOrder ? parseInt(lastOrder.orderNumber.slice(-4)) + 1 : 1
  4. return `ORD-${dateStr}-${sequence.toString().padStart(4, '0')}`
```
