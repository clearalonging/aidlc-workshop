# 요구사항 명확화 추가 질문

답변 분석 중 아래와 같은 모호한 부분이 발견되었습니다. 추가 질문에 답변해 주세요.

---

## Ambiguity 1: 백엔드 아키텍처 구성

Q1에서 **NestJS (백엔드)**를, Q2에서 **Next.js (풀스택 프레임워크)**를, Q4에서 **풀스택 프레임워크**를 선택하셨습니다.

Next.js는 자체적으로 API Routes/Route Handlers를 통해 백엔드 기능을 제공합니다. NestJS를 별도 백엔드로 사용하면 **Next.js(프론트엔드) + NestJS(백엔드 API 서버)** 구조가 되어 사실상 프론트엔드/백엔드 분리 아키텍처가 됩니다.

### Clarification Question 1
백엔드 구성을 어떻게 하시겠습니까?

A) Next.js만 사용 — Next.js의 API Routes(Route Handlers)로 백엔드 로직 처리 (하나의 프로젝트, 풀스택)
B) Next.js(프론트엔드) + NestJS(백엔드) 분리 — Next.js는 UI만 담당, NestJS가 별도 API 서버로 동작 (두 개의 프로젝트)
X) Other (please describe after [Answer]: tag below)

[Answer]: A
