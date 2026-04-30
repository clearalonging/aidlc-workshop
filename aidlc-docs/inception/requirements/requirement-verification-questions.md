# 요구사항 명확화 질문

아래 질문에 답변해 주세요. 각 질문의 `[Answer]:` 태그 뒤에 선택한 옵션의 알파벳을 입력해 주세요.
"Other"를 선택한 경우, `[Answer]:` 태그 뒤에 상세 설명을 작성해 주세요.

---

## Question 1
백엔드(서버) 기술 스택으로 어떤 것을 사용하시겠습니까?

A) Node.js + Express (JavaScript/TypeScript)
B) Spring Boot (Java/Kotlin)
C) NestJS (TypeScript)
D) FastAPI (Python)
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 2
프론트엔드(고객용 + 관리자용) 기술 스택으로 어떤 것을 사용하시겠습니까?

A) React (TypeScript)
B) Vue.js (TypeScript)
C) Next.js (TypeScript, React 기반 풀스택)
D) Angular (TypeScript)
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 3
데이터베이스로 어떤 것을 사용하시겠습니까?

A) PostgreSQL (관계형 데이터베이스)
B) MySQL (관계형 데이터베이스)
C) MongoDB (NoSQL 문서형 데이터베이스)
D) SQLite (경량 관계형 데이터베이스, 개발/소규모 매장용)
X) Other (please describe after [Answer]: tag below)

[Answer]: D

## Question 4
프로젝트 아키텍처 패턴으로 어떤 것을 선호하시겠습니까?

A) 모놀리식 (Monolithic) - 하나의 서버 애플리케이션에 모든 기능 포함
B) 프론트엔드/백엔드 분리 (SPA + REST API) - 프론트엔드와 백엔드를 별도 프로젝트로 분리
C) 풀스택 프레임워크 (Next.js 등) - 프론트엔드와 백엔드를 하나의 프레임워크에서 처리
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 5
배포 환경은 어떻게 계획하고 계십니까?

A) 로컬 서버 (매장 내 서버에서 직접 운영)
B) 클라우드 (AWS, GCP, Azure 등)
C) 컨테이너 기반 (Docker/Docker Compose)
D) 배포 환경은 아직 미정 (개발 우선, 배포는 나중에 결정)
X) Other (please describe after [Answer]: tag below)

[Answer]: D

## Question 6
매장(Store)은 단일 매장만 지원하면 되나요, 아니면 다중 매장(멀티테넌트)을 지원해야 하나요?

A) 단일 매장만 지원 (하나의 매장에서만 사용)
B) 다중 매장 지원 (여러 매장이 하나의 시스템을 공유, 각 매장은 독립적으로 운영)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 7
메뉴 이미지 관리는 어떻게 처리하시겠습니까?

A) 외부 이미지 URL 직접 입력 (별도 이미지 호스팅 사용)
B) 서버에 이미지 파일 업로드 (로컬 파일 시스템 저장)
C) 클라우드 스토리지 업로드 (S3, GCS 등)
D) 이미지 기능은 MVP에서 제외 (텍스트만 표시)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 8
관리자 계정 관리는 어떻게 하시겠습니까?

A) 시스템 초기 설정 시 관리자 계정 1개를 시드 데이터로 생성 (추가 계정 생성 불필요)
B) 관리자 회원가입 기능 포함 (매장별 관리자 계정 자체 생성)
C) 슈퍼 관리자가 매장 관리자 계정을 생성/관리
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 9
고객용 인터페이스와 관리자용 인터페이스를 어떻게 구성하시겠습니까?

A) 하나의 웹 애플리케이션 내에서 경로(URL)로 구분 (예: /customer, /admin)
B) 별도의 웹 애플리케이션으로 분리 (고객용 앱, 관리자용 앱)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 10
테스트 전략은 어떻게 하시겠습니까?

A) 단위 테스트(Unit Test)만 포함
B) 단위 테스트 + 통합 테스트(Integration Test) 포함
C) 단위 테스트 + 통합 테스트 + E2E 테스트 포함
D) 테스트는 MVP에서 최소화 (핵심 비즈니스 로직만 단위 테스트)
X) Other (please describe after [Answer]: tag below)

[Answer]: D

## Question 11: Security Extensions
이 프로젝트에 보안 확장 규칙(Security Extension Rules)을 적용하시겠습니까?

A) Yes — 모든 SECURITY 규칙을 blocking constraint로 적용 (프로덕션 수준 애플리케이션에 권장)
B) No — 모든 SECURITY 규칙 건너뛰기 (PoC, 프로토타입, 실험적 프로젝트에 적합)
X) Other (please describe after [Answer]: tag below)

[Answer]: A
