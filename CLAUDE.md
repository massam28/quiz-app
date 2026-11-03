# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

- 교육용 **문제풀이 웹앱**입니다. 요구사항의 기준은 `PRD.md`입니다. 작업 전에 항상 `PRD.md`를 먼저 읽습니다.
- 기술 구성: Next.js + TypeScript, Firebase(Auth·Firestore, 프로젝트 `quiz-app-2qy8u`), Vercel 배포, PC·휴대폰 겸용 화면
- 이용 흐름(현재 버전, 2026-11-03): 첫 화면(`/`)에서 [교사로 시작하기]·[학생으로 시작하기] 선택
  - 교사(`/teacher`): Firebase Google 로그인(허용 계정 1개) → JSON 문제지 올리기·확인·저장(비공개) → 공개/비공개 → 문제지별 결과표·평균
  - 교사 AI 출제: PDF 업로드 → Azure AI 생성(서버) → 제목·10문항·정답·해설 확인 → [저장](바로 공개) / [취소]
  - 학생(`/student`): 이름 입력 → **공개된** 문제지 목록 → 문항 확인 → 한 문제씩 풀이 → 제출(서버 채점·Firestore 저장) → 점수·문항별 정오·해설
- 학생에게 파일 업로드를 요구하지 않습니다. 파일을 올리는 것은 로그인한 교사뿐입니다. `question-papers` 폴더는 이제 교사가 올릴 예시 파일 보관용이며 앱이 직접 읽지 않습니다.

## 폴더 구성 (2026-11-02 기준)

- 이 폴더(`G:\내 드라이브\0. 2026년\21. claude`)는 Google Drive 동기화 폴더입니다. **요구사항 문서만 보관**하고 앱 코드는 만들지 않습니다.
- 앱 개발 폴더는 `C:\dev\quiz-app`입니다. 1일차 앱 코드가 여기에 있습니다.
- `PRD.md`, `CLAUDE.md`, `question-papers/sample-questions.json`이 두 곳에 있으므로, 한쪽을 고치면 두 파일 내용이 같은지 확인하고 다르면 사용자에게 알립니다.
- Next.js 16.4.3을 사용합니다. 학습 데이터와 다른 부분이 있으므로 코드를 쓰기 전에 `AGENTS.md`의 안내대로 `node_modules/next/dist/docs/`의 문서를 확인합니다.

## 명령 (`C:\dev\quiz-app`에서 실행, 2026-11-02 확인)

- `npm run dev`: 내 컴퓨터에서 앱 실행 (http://localhost:3000)
  - Claude 앱 안의 브라우저 화면에서는 `G:\내 드라이브\0. 2026년\21. claude\.claude\launch.json`의 `quiz-app` 설정(`npm --prefix C:\dev\quiz-app run dev`)으로 실행합니다.
- `npm test`: 자동 점검 (Vitest, `src/lib/**/*.test.ts`)
  - 한 파일만 점검할 때: `npx vitest run src/lib/quiz/score.test.ts`
- `npm run lint`: 코드 규칙 검사
- `npm run build`: 배포용 제작 점검. 내 컴퓨터에서만 실행하며 인터넷에 올리지 않습니다.
- 배포(`vercel` 명령, git push 등)는 사용자가 따로 요청할 때만 합니다.
- `firebase deploy --only firestore:rules`: `firestore.rules`(외부 직접 접근 전부 차단)를 Firebase에 적용. 앱 폴더의 `firebase.json`·`.firebaserc`가 프로젝트를 가리킵니다.
- 코드를 많이 바꾸거나 패키지를 설치한 뒤 실행 중인 앱이 "module factory is not available", "~ is not a function" 같은 오류를 내면 코드 문제가 아니라 실행 중 앱의 묵은 상태입니다. 앱을 끄고 `.next` 폴더를 지운 뒤 다시 실행합니다(2026-11-03 두 번 발생).

## 앱 구조

- `question-papers/*.json`: 교사가 올릴 예시 문제지 파일. 최상위 `title`과 `questions`
- 데이터 흐름: 브라우저 → 앱 서버(`src/app/api/**/route.ts`, `firebase-admin`) → Firestore. 브라우저는 Firestore에 직접 접근하지 않습니다(`firestore.rules`가 전부 차단).
- Firestore 구성(`src/lib/quiz/store.ts`, 서버 전용)
  - `papers/{자동 ID}`: title, titleKey(중복 판단), contentHash(문항 내용 중복 판단), questions(정답·해설 포함), questionCount, published, createdBy, createdAt, updatedAt
  - `results/{문제지ID}_{정리한 이름의 sha256 앞 24자}`: paperId, paperTitle, studentName, answers, score, correctCount, total, wrongQuestions, submittedAt. 같은 문제지·같은 이름은 같은 문서라 다시 풀면 덮어씁니다.
- 서버 창구
  - 학생: `GET /api/papers`(공개 목록), `GET /api/papers/[id]`(문제·보기만, 정답·해설 없음), `POST /api/papers/[id]/submit`(서버 채점·저장 후 결과 반환)
  - 교사(모두 `requireTeacher`로 토큰·허용 계정 확인): `GET/POST /api/teacher/papers`, `PATCH /api/teacher/papers/[id]`(공개 여부), `GET /api/teacher/papers/[id]/results`, `GET /api/teacher/me`
  - AI 출제(교사, `requireTeacher`): `POST /api/teacher/ai/generate`(PDF 1개를 FormData로 받아 검사·추출 → Azure 호출 → 검증한 문제지 반환, 저장 안 함, `maxDuration` 120), `POST /api/teacher/ai/save`(다시 검증 후 `createPaper(..., { published: true, source: "ai" })`)
  - 공통 응답·오류 문구: `src/lib/api/respond.ts`. 서버 비밀키가 없으면 503으로 안내합니다.
- `src/lib/ai/`: AI 출제
  - `limits.ts`: 교육용 입력 기준(PDF 524,288바이트, 본문 12,000자, 최소 100자, 10문항), 파일·본문 검사, AI 결과 검사(`validateGeneratedQuiz` = `parseQuizFile` + 10문항 + 제목 중복). 화면·서버 공용. 점검 `limits.test.ts`
  - `pdfText.ts`(서버 전용): `unpdf`로 본문 추출. 암호(PasswordException)·손상(InvalidPDFException) 구분. 본문을 자르지 않음
  - `azureQuiz.ts`: Azure OpenAI v1 `POST {AZURE_ENDPOINT}/openai/v1/chat/completions`, `api-key` 머리글, `model`=배포명, `response_format` json_schema, 90초 제한, 401/403/429/시간 초과/형식 오류 구분, 자동 재시도 없음. 지시문은 PDF를 `<자료>`로 감싸고 그 안의 명령을 따르지 않게 함. 점검 `azureQuiz.test.ts`(가짜 응답, 실제 호출 없음)
  - GPT-5 계열이라 `temperature`·`max_tokens`는 보내지 않습니다. `responses` 창구가 아니라 `chat/completions`를 씁니다(강사 안내에 창구 명시가 없어 선택, 2026-11-03 실제 호출 성공).
- 앱 import 규칙: `src/lib/**` 안에서는 상대 경로(`../quiz/validate`)를 씁니다. 점검 도구(Vitest)가 `@/` 경로를 모릅니다.
- `src/lib/quiz/`: 화면과 상관없는 규칙
  - `validate.ts`: 문제지 검사(교사 화면과 서버가 함께 씀). 제목과 문항별 한국어 오류 목록
  - `score.ts`: 채점. 소수 첫째 자리 반올림은 정수 계산으로 처리합니다.
  - `records.ts`: 학생용 문항(정답 제외), 이름·제목 정리, 제출 답 검사, 틀린 문항 번호, 평균. 점검 파일 `records.test.ts`
  - `types.ts`: 문항·문제지 형식
- `src/app/page.tsx`: 첫 화면(교사·학생 선택).
- `src/app/teacher/page.tsx` → `src/components/TeacherApp.tsx`: 교사 로그인 화면. Google 팝업 로그인 후 `/api/teacher/me`에 토큰을 보내, 서버가 허용 계정이라고 답할 때만 `TeacherDashboard`를 보여줍니다. 허용되지 않으면 안내 후 자동 로그아웃합니다.
- `src/app/api/teacher/me/route.ts`: 교사 확인 서버 창구(200 허용 / 401 로그인 안 됨·토큰 오류 / 403 다른 계정 / 500 설정 없음).
- `src/lib/auth/firebaseToken.ts`: Firebase ID 토큰을 `jose`로 직접 확인(Google 공개키·RS256·발급자·대상·만료·auth_time). **`firebase-admin/auth`는 쓰지 않습니다**: 그 안의 `jwks-rsa` 4.x가 ESM 전용 `jose` 6을 `require`로 불러 Vercel 서버에서 `ERR_REQUIRE_ESM`으로 모든 서버 창구가 500이 났습니다(2026-11-03). 내 컴퓨터에서 재현: `npm run build` 후 `node --no-experimental-require-module node_modules/next/dist/bin/next start -p 3100`. 점검 `firebaseToken.test.ts`
- `src/lib/auth/verifyTeacher.ts`(서버 전용): `verifyTeacherRequest`(토큰·허용 계정 확인)와 `requireTeacher`(교사가 아니면 돌려보낼 응답). **교사 기능의 서버 코드는 먼저 `requireTeacher(request)`로 확인합니다.**
- `src/lib/auth/teacher.ts`: 허용 이메일 비교(대소문자·공백 무시, Google이 확인한 이메일만)와 토큰 읽기 규칙. 점검 파일 `teacher.test.ts`
- `src/lib/firebase/client.ts`: 브라우저용 Firebase 연결(로그인만). `src/lib/firebase/admin.ts`(서버 전용): 서버용 연결(Firestore만)
- `src/lib/api/client.ts`: 화면에서 서버 창구 부르기. `teacherRequest`는 로그인 토큰을 붙입니다.
- 설정값은 `C:\dev\quiz-app\.env.local`(Git에 안 올라감)
  - `NEXT_PUBLIC_FIREBASE_API_KEY`·`_AUTH_DOMAIN`·`_PROJECT_ID`·`_APP_ID`: 공개 값. `firebase apps:sdkconfig WEB 1:791239491499:web:81b683aca6ba0968b15cee --project quiz-app-2qy8u`로 다시 받기
  - `TEACHER_EMAIL`: 서버 전용
  - `AZURE_API_STYLE`(`openai-v1`), `AZURE_ENDPOINT`, `AZURE_DEPLOYMENT`(`gpt-5.6-luna`), `AZURE_API_KEY`: 강사 제공 Azure 연결값(서버 전용). 키 값은 출력·문서·커밋에 절대 적지 않습니다. 2026-11-03 사용자가 채팅에 붙여 넣은 값을 넣었으므로, 연수 후 강사에게 키 교체 필요 여부 확인을 권했습니다.
  - `GOOGLE_APPLICATION_CREDENTIALS`: 서버용 비밀키 **파일 위치**(`C:/Users/마아람/.firebase-keys/quiz-app-2qy8u-admin.json`, 앱 폴더·Drive 바깥). 비밀키 내용은 절대 출력·커밋하지 않습니다.
  - Vercel에 배포할 때: 위 공개 값과 `TEACHER_EMAIL`을 Vercel 환경 변수에 넣고, 비밀키는 파일 위치 대신 `FIREBASE_SERVICE_ACCOUNT_JSON`(파일 내용)을 **사용자가 Vercel 설정 화면에 직접** 넣습니다.
- `src/components/TeacherDashboard.tsx`: 등록한 문제지 목록·공개 전환. `AiGeneratePanel`(PDF → AI 생성 → [저장]/[취소], 생성 중 잠금, 실패 시 [다시 시도]), `PaperUploadPanel`(JSON 올리기·미리보기·저장), `QuizPreview`(두 패널 공용 미리보기), `ResultsPanel`(결과표·평균)
- `src/app/student/page.tsx` → `src/components/StudentApp.tsx`: 이름 입력(`StudentNameStep`) 후 "○○○ 학생" 표시와 함께 `QuizApp`. 학생 화면에는 교사 화면·결과표로 가는 버튼을 두지 않습니다.
- `src/components/QuizApp.tsx`: 학생 화면 단계(list → review → solving → result) 상태 보관. 목록·문제는 서버에서 받고, 제출하면 서버가 채점·저장한 결과를 받습니다. 저장 실패 시 [다시 제출]. localStorage는 쓰지 않습니다.
- `PaperListStep` / `ReviewStep` / `QuestionStep` / `ResultStep`: 학생 단계별 화면

## 개발 범위 (1일차 / 2일차)

- **1일차**: `question-papers` 문제지 목록·선택, 문항 표시, 4지선다 풀이, 제출 후 채점·점수·정오·해설, 로컬 실행, Vercel 배포
- **2일차**: 교사 Google 로그인·학생 게스트 입장, Azure AI 문제 생성, 문제 저장·공개, Firestore 결과 저장, 교사용 성적 조회
- 2일차 진행(2026-11-03): 교사·학생 선택, 교사 Google 로그인, 교사 JSON 문제지 등록·공개·비공개, 학생 결과 Firestore 저장, 교사 결과표·평균, PDF Azure AI 출제까지 완료하고 내 컴퓨터에서 확인했습니다(배포 안 함). 문제지 삭제·재응시 제한은 없음(사용자 기본안 유지).
- 1일차에는 로그인·AI·DB를 **구현하지 않습니다.** 나중에 확장하기 쉬운 구조로 만들되, 2일차 기능을 미리 만들지 않습니다.

## 반드시 지킬 앱 규칙 (PRD.md 결정 사항 요약)

- 문제지 파일: 최상위 `title`(questions 앞)과 `questions` 배열, 각 문항은 `question`, `options`(4개), `correctAnswer`(1~4, 1이 첫 번째 보기), `explanation`
- 학생 목록에는 교사가 공개한 문제지만, 제목 순서로 문항 수와 함께 보여줍니다. 제목을 코드에 고정하지 않습니다.
- 학생에게 파일 업로드를 요구하지 않습니다.
- 잘못된 문제지는 **등록하지 않고**, 파일 이름과 함께 몇 번 문항의 어떤 항목이 틀렸는지 쉬운 한국어로 안내합니다. 제목이 같거나 문항 내용이 똑같은 문제지는 중복으로 안내하고 저장하지 않습니다.
- 학생에게는 풀이 중 정답·해설을 **보내지도** 않습니다. 채점은 제출 때 서버에서 합니다.
- 교사 기능(등록·공개 변경·결과 조회)은 서버에서 허용된 교사인지 확인합니다. Firestore를 외부에 열지 않습니다.
- 결과는 제출할 때 한 번 저장하고, 같은 문제지·같은 이름(빈칸 정리)은 최신 결과로 덮어씁니다. 평균은 이름별 최신 결과 기준입니다.
- 문제지를 고르면 문항 확인 화면(제목·총 문항 수·문제 목록, [풀이 시작]·[다른 문제지 고르기])을 거쳐 풀이를 시작합니다.
- 풀이 중에는 정답 여부·점수·해설을 **절대 보여주지 않습니다.**
- [이전]/[다음]으로 답을 바꿀 수 있고, 진행률(예: 3/10)을 표시하며, 모든 문항에 답해야 [제출]이 활성화됩니다.
- 점수 = 정답 수 ÷ 전체 문항 수 × 100, 소수 첫째 자리까지 반올림합니다(예: 66.7점).
- 결과 화면: 문항마다 내가 고른 답·정답·○/×·해설, 그리고 [다시 풀기]·[다른 문제지 고르기] 버튼
- 새로고침하면 진행 상황이 사라져도 됩니다(1일차). 문제·보기 순서는 섞지 않습니다.
- 확인을 위해 사용자 허락 없이 임의의 문제지나 문항을 `question-papers`나 Firestore에 추가하지 않습니다(확인용 데이터를 넣었다면 사용자에게 알립니다).
- 앱 화면의 안내 문구와 오류 메시지는 일반인이 이해할 수 있는 쉬운 한국어로 씁니다.

## 작업 기준

- `PRD.md`의 요구사항을 기준으로 작업하고, 지금 만들 기능과 나중에 추가할 기능을 구분합니다.
- 정해진 조건을 마음대로 바꾸거나, 요청하지 않은 기능을 추가하지 않습니다.
- 정해지지 않은 내용이나 선택이 필요한 사항은 먼저 질문합니다.
- 기존 파일 내용과 `PRD.md`가 다르면 임의로 결정하지 말고 사용자에게 알립니다.
- 아직 확인할 수 없는 내용은 추측해서 채우지 않습니다.

## 사용자에게 설명하는 방법

사용자는 개발을 모르는 일반인입니다.

- **새 세션을 시작하면 먼저 1일차인지 2일차인지 물어봅니다.**
- 모든 설명은 쉬운 한국어로 합니다. 개발 지식이 있어야 이해되는 기술용어는 쓰지 않습니다.
- 사용자가 알아야 할 것은 "무엇을 하면 되는지"와 "어떤 결과가 나오는지"입니다.
- 화면에 보이는 버튼 이름과 파일 이름은 그대로 쓰고, 설명은 쉬운 말로 합니다.
- 설치나 설정이 필요하면 다음 순서로 안내합니다.
  1. 어느 화면을 열어야 하는지
  2. 무엇을 누르거나 입력해야 하는지
  3. 제대로 됐는지 무엇을 보고 확인하는지
- 사용자가 입력할 내용은 그대로 복사해서 쓸 수 있게 제공합니다.
- 여러 가지를 한꺼번에 시키지 않고 한 단계씩 안내합니다.
- 오류가 나면 원인과 해결 방법을 쉬운 말로 설명합니다.

## 작업 진행 방법

- 앱을 만들거나 크게 고치기 전에, 무엇을 어떤 순서로 할지 짧게 설명하고 사용자 확인을 받습니다.
- 수정 후에는 무엇이 바뀌었는지, 사용자가 어떻게 확인하면 되는지 알려줍니다.
- 실제로 확인한 결과와 아직 확인하지 못한 부분을 나눠서 말합니다.
- 실행하거나 확인하지 않은 일을 완료했다고 말하지 않습니다.
- 사용자가 직접 브라우저를 조작하지 않아도 되도록 터미널 명령(CLI), MCP, 플러그인 등을 최대한 활용합니다. 불가능하면 방법을 친절하게 안내합니다.
- 사용자의 컴퓨터를 직접 조작하지 않습니다(마우스·키보드 조작, 사용자의 Chrome 사용 등). 앱 확인은 Claude 앱 안의 브라우저 화면과 터미널 명령으로 합니다.
- 계정 가입, 비밀번호 입력, 결제는 Claude가 대신하지 않습니다. 사용자가 직접 하도록 위 순서대로 안내합니다.

## 현재 상태 메모 (2026-11-02 확인)

- 1일차 앱 제작과 내 컴퓨터에서 확인까지 마쳤습니다. 2026-11-03에 Vercel에 배포했습니다(아래 Vercel 항목).
- 문제지 목록 방식(현재 버전)으로 바꾸고 내 컴퓨터에서 확인했습니다.
- `question-papers`의 문제지: `high-school-questions.json`("고등학교 정보과목", 10문항), `sample-questions.json`("중학교 정보과목", 10문항). 두 문제지가 목록에 함께 표시되고 각각 끝까지 풀리는 것을 확인했습니다.
- `high-school-questions.json`은 앱 폴더에만 있고 Google Drive 폴더에는 복사하지 않았습니다.
- 설치됨: Node.js v24.18.0, npm 11.16.0, Git 2.55.0
- 설치됨(2026-11-03): Vercel CLI 65.10.0 (`npm i -g vercel`, 이 Windows 사용자 전용 `C:\Users\마아람\AppData\Roaming\npm`)
- 설치 안 됨: GitHub CLI(`gh`)
- Git 표시 이름·이메일: `massam28` / `arerama1211@gmail.com` (컴퓨터 전체 설정)
- `C:\dev\quiz-app`은 Git 저장소(`main` 브랜치)입니다. 첫 커밋 `1083233`에 1일차 앱을 기록했습니다.
- GitHub 저장소: https://github.com/massam28/quiz-app (공개, 원격 이름 `origin`, `main` 연결). 2026-11-02에 처음 올렸습니다.
  - GitHub 로그인은 Windows에 저장된 massam28 로그인(Git Credential Manager)을 씁니다. GitHub CLI(`gh`)는 설치하지 않았습니다.
  - 공개 저장소라 문제지 정답, 이 파일의 이메일·폴더 경로, 커밋 작성자 이메일이 누구에게나 보입니다.
  - GitHub에 올리기(push)는 사용자가 요청할 때만 합니다.
- Vercel (2026-11-03 확인): `vercel whoami` → `arerama1211-4956`, 팀 `twogaSSam`(hobby). 배포는 사용자가 따로 요청할 때만 합니다.
  - 2026-11-03 첫 배포: 프로젝트 `twoga-ss-am/quiz-app`(사용자가 이름 결정), 앱 폴더에 `.vercel` 연결. `vercel deploy --prod --yes`로 정식 배포했습니다.
  - 정식 주소: https://quiz-app-navy-two-13.vercel.app (로그인 없이 열림 확인). 배포별 주소(`quiz-8mqnjeqyb-...`)는 Vercel 보호 기능 때문에 로그인이 필요합니다.
  - GitHub 자동 연결은 실패했습니다(연결 안 됨). 그래서 GitHub에 올려도 자동 배포되지 않고, 다시 배포하려면 `vercel deploy --prod`를 실행합니다.
  - `vercel link`가 `.gitignore`에 `.vercel`, `.env*`를 추가했고 `.env.local`(Vercel 접속 토큰)을 만들었습니다. 이 변경은 아직 커밋하지 않았습니다.
  - 사용자 범위로 공식 스킬 `vercel-cli`(`~\.claude\skills\vercel-cli`)를 설치하고, 공식 MCP `vercel`(`https://mcp.vercel.com`, `~\.claude.json`)을 등록했습니다. MCP는 `claude mcp list`에서 "Needs authentication"(계정 승인 전)입니다.
  - 공식 플러그인 `vercel@anthropic-plugin-directory`(0.49.2)를 사용자 범위로 설치했습니다. bun이 없어 일부 추가 구성은 설치되지 않았습니다.
- Firebase (2026-11-03 확인): Firebase CLI 15.34.2(`npm i -g firebase-tools`, `C:\Users\마아람\AppData\Roaming\npm`). `firebase login`으로 `arerama1211@gmail.com` 로그인, `firebase projects:list`에 기존 프로젝트 4개가 보입니다(이번에 새로 만들지 않음).
  - 공식 플러그인 `firebase@firebase` 1.1.0(마켓플레이스 `firebase/agent-skills`)을 사용자 범위로 설치했습니다. Firebase 스킬 14개와 MCP(`npx -y firebase-tools@15.32.1 mcp --dir .`)가 함께 들어 있고, `claude mcp list`에서 Connected입니다.
  - 앱을 다시 시작한 새 대화에서 MCP 도구(`firebase_get_environment`)로 계정 조회는 아직 확인하지 않았습니다.
  - 2026-11-03 이 앱용 프로젝트 `quiz-app-2qy8u`(이름 quiz-app, 무료 요금제)와 웹 앱을 사용자 요청으로 CLI(`projects:create`, `apps:create`)로 만들었습니다. Google 로그인은 임시 폴더의 `firebase.json`(`auth.providers.googleSignIn`)으로 `firebase deploy --only auth`해 켰습니다. (앱 폴더의 `firebase.json`에는 Firestore 설정만 있습니다.)
  - 2026-11-03 Firestore `(default)`를 서울(`asia-northeast3`), standard, 삭제 방지 켜고 CLI로 만들고 `firestore.rules`(전부 차단)를 적용했습니다. 외부에서 REST로 읽으면 403 PERMISSION_DENIED인 것을 확인했습니다.
  - 2026-11-03 사용자 요청으로 서비스 계정 `firebase-adminsdk-fbsvc@quiz-app-2qy8u.iam.gserviceaccount.com`의 키(키 ID `720c82ca…`)를 IAM API로 만들어 `C:\Users\마아람\.firebase-keys\quiz-app-2qy8u-admin.json`에만 저장했습니다(내용 미출력). 이때 프로젝트의 IAM API(`iam.googleapis.com`)를 켰습니다.
  - 2026-11-03 확인용으로 예시 `sample-questions.json`("중학교 정보과목")을 등록했고(현재 비공개), 시험용 학생 결과 2건(김민수 100점, 이영희 70점)이 Firestore에 있습니다.
  - 2026-11-03 AI 출제 실제 확인: 사용자가 고른 `표준학습자료_정보보호와데이터활용-5.pdf`로 Azure 호출 1회 성공(8.6초) → "안전한 계정 관리와 데이터 활용 점검 문제" 저장·공개 → 학생 "박지원" 80점 제출 → 시험 후 비공개로 돌림. 사용자가 직접 등록한 "고등학교 정보과목 cpy"(공개 중)도 있습니다.
  - 암호가 걸린 실제 PDF, 서버 쪽 512KiB 초과 거부(화면에서 먼저 막힘)는 아직 미확인입니다.
  - 2026-11-03 GitHub에 `1819a15`까지 push, Vercel 정식 배포 2회(첫 배포는 `firebase-admin/auth` 로딩 오류로 서버 창구 전부 500 → 수정 후 재배포). Vercel 환경 변수(Production): `NEXT_PUBLIC_FIREBASE_*` 4개, `TEACHER_EMAIL`, `AZURE_API_STYLE`·`AZURE_ENDPOINT`·`AZURE_DEPLOYMENT`(Claude가 CLI로 입력), `AZURE_API_KEY`·`FIREBASE_SERVICE_ACCOUNT_JSON`(사용자가 터미널 명령으로 직접 입력, Secret). Firebase 로그인 허용 도메인에 `quiz-app-navy-two-13.vercel.app` 추가. 배포 주소 확인 범위는 PRD.md "배포 주소에서 따로 시험할 항목" 표. 시험 결과 "배포시험"(100점) 1건이 Firestore에 있습니다.
  - Vercel 로그 확인: `vercel logs --since 20m --json` (오류·경고·console 출력만 남고 정상 요청은 안 보일 수 있음)
  - CLI로 만든 프로젝트는 로그인 허용 도메인에 `localhost`가 **빠져 있어** 로그인 시 "unauthorized-domain"이 났습니다. Identity Toolkit 관리 API(`admin/v2/projects/quiz-app-2qy8u/config`, `authorizedDomains`)로 추가했습니다. Vercel 주소를 추가할 때도 같은 방법이나 Firebase 화면(Authentication → 설정 → 승인된 도메인)을 씁니다.
  - 2026-11-03 사용자가 arerama1211@gmail.com으로 교사 로그인 성공, 새로고침 후 유지, 로그아웃을 확인했습니다. 다른 계정 차단은 실제 다른 계정으로는 아직 확인하지 않았습니다(서버 규칙 점검으로만 확인).
- `claude` 명령은 PATH에 없고, Claude 앱에 들어 있는 `C:\Users\마아람\AppData\Local\Claude-Data\claude_pzs8sxrjxfjjc\claude-code\2.1.309\9078b9c1d466\claude.exe`를 썼습니다(앱 업데이트 시 경로가 바뀔 수 있음).
