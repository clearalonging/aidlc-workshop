# Unit 4 (Admin Manage) - Functional Design 질문

Unit 4 (관리자 메뉴 관리) 기능 설계를 위한 질문입니다.
각 질문의 [Answer]: 태그 뒤에 선택지 문자를 입력해 주세요.

---

## Question 1
메뉴 등록/수정 시 카테고리가 존재하지 않는 경우 어떻게 처리할까요?

A) 기존 카테고리 목록에서만 선택 가능 (카테고리 관리는 별도 기능으로 추후 추가)
B) 메뉴 등록/수정 화면에서 새 카테고리를 인라인으로 추가할 수 있도록 지원
C) 별도의 카테고리 관리 화면을 Unit 4에 포함하여 CRUD 제공
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
메뉴 삭제 시 해당 메뉴가 이미 주문된 적이 있는 경우 어떻게 처리할까요?

A) 물리적 삭제 (DB에서 완전 삭제) — 주문 내역의 메뉴명/단가는 OrderItem에 스냅샷으로 보존되므로 문제 없음
B) 논리적 삭제 (isAvailable = false로 변경) — 고객 화면에서 숨기되 데이터는 유지
C) 주문 이력이 있으면 삭제 불가 — 에러 메시지 표시
X) Other (please describe after [Answer]: tag below)

[Answer]: a

---

## Question 3
메뉴 노출 순서 조정 UI는 어떤 방식을 선호하시나요?

A) 드래그 앤 드롭 (직관적이지만 구현 복잡도 높음, 외부 라이브러리 필요)
B) 위/아래 화살표 버튼 (단순하고 구현 용이, 터치 친화적)
C) 직접 숫자 입력 (sortOrder 값을 직접 입력)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 4
메뉴 이미지 URL 입력 시 유효성 검증 수준은 어느 정도로 할까요?

A) URL 형식 검증만 (Zod url() 검증)
B) URL 형식 검증 + 이미지 미리보기 표시 (URL 입력 후 미리보기로 확인)
C) URL 형식 검증만, 이미지 미리보기 없음, 빈 값 허용 (이미지 선택사항)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5
메뉴 관리 화면의 레이아웃은 어떤 형태를 선호하시나요?

A) 테이블(표) 형태 목록 + 등록/수정은 별도 페이지
B) 카드 형태 목록 + 등록/수정은 모달(팝업)
C) 테이블(표) 형태 목록 + 등록/수정은 모달(팝업)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 6
메뉴 가격의 유효 범위를 어떻게 설정할까요?

A) 최소 100원 ~ 최대 1,000,000원 (일반적인 음식점 가격 범위)
B) 최소 1원 ~ 최대 10,000,000원 (넓은 범위)
C) 최소 1,000원 ~ 최대 500,000원 (실용적 범위)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---
