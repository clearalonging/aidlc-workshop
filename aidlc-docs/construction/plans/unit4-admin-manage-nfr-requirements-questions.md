# Unit 4 (Admin Manage) - NFR Requirements 질문

Unit 4는 Unit 1 Foundation의 기술 스택을 그대로 사용합니다.
Unit 4 고유의 NFR 결정이 필요한 항목에 대해 질문합니다.

---

## Question 1
메뉴 관리 API의 응답 시간 목표는 어느 수준으로 설정할까요?

A) 500ms 이내 (빠른 응답, 일반적인 CRUD 기준)
B) 1초 이내 (기존 NFR-01 메뉴 조회 기준과 동일)
C) 2초 이내 (관리자 기능이므로 여유 있게)
X) Other (please describe after [Answer]: tag below)

[Answer]: b

---

## Question 2
메뉴 목록 조회 시 페이지네이션이 필요할까요?

A) 불필요 — 단일 매장 기준 메뉴 수가 제한적이므로 전체 조회 (최대 200개 이내 예상)
B) 필요 — 카테고리별 페이지네이션 적용 (페이지당 20개)
C) 조건부 — 메뉴 수가 100개 이상이면 페이지네이션, 미만이면 전체 조회
X) Other (please describe after [Answer]: tag below)

[Answer]: b

---

## Question 3
메뉴 등록/수정/삭제 시 감사 로그(audit log) 수준은 어떻게 할까요?

A) 기본 로깅만 — pino 로거로 INFO 레벨 기록 (누가, 언제, 무엇을)
B) 상세 감사 로그 — 변경 전/후 값 포함하여 별도 감사 테이블에 기록
C) 로깅 없음 — 메뉴 관리는 감사 로그 불필요
X) Other (please describe after [Answer]: tag below)

[Answer]: a

---

## Question 4
메뉴 관리 API에 대한 Rate Limiting은 어떻게 적용할까요?

A) Unit 1의 일반 API Rate Limit 그대로 적용 (분당 100회)
B) 관리자 전용이므로 Rate Limiting 완화 (분당 200회)
C) 관리자 전용이므로 Rate Limiting 미적용
X) Other (please describe after [Answer]: tag below)

[Answer]: b

---
