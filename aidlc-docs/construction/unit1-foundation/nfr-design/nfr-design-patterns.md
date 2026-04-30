# Unit 1 (Foundation) - NFR 설계 패턴

---

## 1. 보안 패턴

### 1.1 인증 미들웨어 패턴 (Chain of Responsibility)
```
Request → Rate Limiter → Auth Middleware → Role Check → Input Validation → Handler
```
- 각 미들웨어는 독립적으로 실패 가능
- 실패 시 즉시 응답 반환 (다음 미들웨어 실행 안 함)
- 성공 시 `req.user`에 인증 정보 주입

### 1.2 Fail-Closed 패턴
- 인증 검증 실패 시 기본적으로 접근 거부
- 예외 처리 중 오류 발생 시 500 반환 (접근 허용 안 함)
- 토큰 검증 오류 = 인증 실패로 처리

### 1.3 Defense in Depth (심층 방어)
```
레이어 1: Rate Limiting (IP 기반)
레이어 2: JWT 토큰 검증 (서명, 만료)
레이어 3: 역할 기반 접근 제어 (ADMIN/TABLE)
레이어 4: 입력값 검증 (Zod 스키마)
레이어 5: Prisma 파라미터화 쿼리 (SQL Injection 방지)
```

---

## 2. 신뢰성 패턴

### 2.1 트랜잭션 패턴 (이용 완료 처리)
```typescript
// 이용 완료 처리 - 원자적 실행
await prisma.$transaction(async (tx) => {
  // 1. 세션 종료
  await tx.tableSession.update({ where: { id: sessionId }, data: { completedAt: new Date() } });
  // 2. 주문 이력 이동 (필요 시)
  // 3. 테이블 상태 업데이트
});
```

### 2.2 SSE 재연결 패턴
- 클라이언트: `EventSource` 기본 자동 재연결 (3초 간격)
- 서버: 연결 해제 감지 시 클라이언트 맵에서 즉시 제거
- Heartbeat: 30초마다 `: ping\n\n` 전송 (연결 유지)

### 2.3 에러 격리 패턴
```typescript
// 글로벌 에러 핸들러
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Promise Rejection');
  // 서버 종료 안 함 - 격리 처리
});
```

---

## 3. 성능 패턴

### 3.1 Prisma 연결 풀링
```typescript
// lib/prisma.ts - 싱글톤 패턴
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 3.2 JWT 검증 최적화
- 토큰 검증은 동기 방식 사용 (`jwt.verify` 동기 오버로드)
- Secret을 환경 변수에서 한 번만 로드 (모듈 레벨 캐싱)

---

## 4. 로깅 패턴

### 4.1 Request ID 전파 패턴
```typescript
// 모든 요청에 requestId 주입
const requestId = req.headers['x-request-id'] as string || randomUUID();
req.requestId = requestId;
res.setHeader('x-request-id', requestId);
// 이후 모든 로그에 requestId 포함
logger.info({ requestId, userId: req.user?.sub }, 'Request received');
```

### 4.2 구조화된 에러 로깅
```typescript
logger.error({
  requestId,
  error: {
    message: error.message,
    code: error.code,
    // stack은 개발 환경에서만
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  }
}, 'Request failed');
```
