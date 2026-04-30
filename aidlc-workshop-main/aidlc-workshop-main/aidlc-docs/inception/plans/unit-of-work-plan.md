# 테이블오더 서비스 - Unit of Work Plan

## 분해 전략

Next.js 풀스택 모놀리식 아키텍처이지만, **3명의 개발자**가 병렬로 작업할 수 있도록 **3개의 논리적 유닛**으로 분해합니다. 단일 배포 단위(하나의 Next.js 프로젝트) 내에서 모듈 경계를 명확히 하여 각 개발자가 독립적으로 작업할 수 있도록 합니다.

### 분해 기준
- **기능 도메인 기반**: 고객 주문, 관리자 운영, 공통 기반으로 분리
- **의존성 최소화**: 유닛 간 인터페이스를 명확히 정의하여 병렬 개발 가능
- **작업량 균형**: 3명의 개발자에게 균등한 작업량 배분

### 유닛 구성
- **Unit 1 — Foundation (기반 시스템)**: DB 스키마, 인증, 공통 미들웨어, 프로젝트 셋업
- **Unit 2 — Customer (고객 주문)**: 고객 UI, 메뉴 조회 API, 장바구니, 주문 생성/조회
- **Unit 3 — Admin (관리자 운영)**: 관리자 UI, 실시간 모니터링, 테이블 관리, 메뉴 관리

### 개발 순서
Unit 1 (Foundation)이 먼저 완료되어야 Unit 2, Unit 3가 병렬로 진행 가능합니다.

```
Unit 1 (Foundation) ──→ Unit 2 (Customer) ──→ Build and Test
                    ──→ Unit 3 (Admin)     ──→
```

---

## 실행 계획

### Phase A: 유닛 정의
- [x] A1. Unit 1 (Foundation) 정의 — DB 스키마, 인증, 공통 미들웨어
- [x] A2. Unit 2 (Customer) 정의 — 고객 UI, 메뉴 조회, 장바구니, 주문
- [x] A3. Unit 3 (Admin) 정의 — 관리자 UI, 대시보드, 테이블/메뉴 관리
- [x] A4. 개발자 할당
- [x] A5. 유닛 문서 생성 (`unit-of-work.md`)

### Phase B: 의존성 매핑
- [x] B1. 유닛 간 의존성 매트릭스 작성
- [x] B2. 의존성 문서 생성 (`unit-of-work-dependency.md`)

### Phase C: 스토리 매핑
- [x] C1. User Stories를 유닛에 매핑
- [x] C2. 스토리 매핑 문서 생성 (`unit-of-work-story-map.md`)

### Phase D: 검증
- [x] D1. 모든 스토리가 유닛에 할당되었는지 확인
- [x] D2. 의존성 순환 없는지 확인
- [x] D3. 작업량 균형 확인
