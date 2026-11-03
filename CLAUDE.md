# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

- 교육용 **문제풀이 웹앱**입니다. 요구사항의 기준은 `PRD.md`입니다. 작업 전에 항상 `PRD.md`를 먼저 읽습니다.
- 기술 구성: Next.js + TypeScript, Vercel 배포, PC·휴대폰 겸용 화면
- 이용 흐름(현재 버전, 2026-11-03): 첫 화면(`/`)에서 [교사로 시작하기]·[학생으로 시작하기] 선택
  - 교사(`/teacher`): Firebase Google 로그인(허용 계정 1개) 후 기본 구조(문제 등록·학생 풀이 결과 칸, [로그아웃], [첫 화면으로])
  - 학생(`/student`): 이름 입력 → `question-papers` 폴더의 문제지 목록 → 문제지 선택 → 문항 확인 → 한 문제씩 풀이 → 모두 답한 뒤 제출 → 점수·문항별 정오·해설 확인
- 초기 버전(커밋 `1083233`)은 학생이 JSON 파일을 직접 업로드하는 방식이었습니다. 지금은 쓰지 않으며, 학생에게 업로드를 요구하지 않습니다.

## 폴더 구성 (2026-11-02 기준)

- 이 폴더(`G:\내 드라이브\0. 2026년\21. claude`)는 Google Drive 동기화 폴더입니다. **요구사항 문서만 보관**하고 앱 코드는 만들지 않습니다.
- 앱 개발 폴더는 `C:\dev\quiz-app`입니다. 1일차 앱 코드가 여기에 있습니다.
- `PRD.md`, `CLAUDE.md`, `question-papers/sample-questions.json`이 두 곳에 있으므로, 한쪽을 고치면 두 파일 내용이 같은지 확인하고 다르면 사용자에게 알립니다.
- Next.js 16.4.3을 사용합니다. 학습 데이터와 다른 부분이 있으므로 코드를 쓰기 전에 `AGENTS.md`의 안내대로 `node_modules/next/dist/docs/`의 문서를 확인합니다.

## 명령 (`C:\dev\quiz-app`에서 실행, 2026-11-02 확인)

- `npm run dev`: 내 컴퓨터에서 앱 실행 (http://localhost:3000)
  - Claude 앱 안의 브라우저 화면에서는 `G:\내 드라이브\0. 2026년\21. claude\.claude\launch.json`의 `quiz-app` 설정(`npm --prefix C:\dev\quiz-app run dev`)으로 실행합니다.
- `npm test`: 자동 점검 (Vitest, `src/lib/quiz/*.test.ts`)
  - 한 파일만 점검할 때: `npx vitest run src/lib/quiz/score.test.ts`
- `npm run lint`: 코드 규칙 검사
- `npm run build`: 배포용 제작 점검. 내 컴퓨터에서만 실행하며 인터넷에 올리지 않습니다.
- 배포(`vercel` 명령, git push 등)는 사용자가 따로 요청할 때만 합니다.

## 앱 구조

- `question-papers/*.json`: 문제지 파일. 최상위 `title`(목록에 표시)과 `questions`
- `src/lib/quiz/`: 화면과 상관없는 규칙
  - `papers.ts`: `question-papers` 폴더를 파일 이름 순서로 읽습니다. 서버 화면(`page.tsx`)에서만 쓰며, 제작 때 읽어 화면에 포함됩니다. 그래서 문제지를 추가하면 다시 제작(배포)해야 합니다.
    - 경로는 `path.join(process.cwd(), "question-papers", ...)` 형태로 고정합니다. 경로를 변수로 넘기면 제작 시 "프로젝트 전체가 배포에 포함된다"는 경고가 납니다.
  - `validate.ts`: 문제지 검사. 제목과 문항별 한국어 오류 목록을 만들고, 하나라도 있으면 그 문제지는 풀 수 없게 합니다.
  - `score.ts`: 채점. 소수 첫째 자리 반올림은 정수 계산으로 처리합니다.
  - `types.ts`: 문항·문제지 형식
- `src/app/page.tsx`: 첫 화면(교사·학생 선택).
- `src/app/teacher/page.tsx` → `src/components/TeacherApp.tsx`: 교사 로그인 화면. Google 팝업 로그인 후 `/api/teacher/me`에 토큰을 보내, 서버가 허용 계정이라고 답할 때만 `TeacherDashboard`를 보여줍니다. 허용되지 않으면 안내 후 자동 로그아웃합니다.
- `src/app/api/teacher/me/route.ts`: 교사 확인 서버 창구(200 허용 / 401 로그인 안 됨·토큰 오류 / 403 다른 계정 / 500 설정 없음).
- `src/lib/auth/verifyTeacher.ts`(서버 전용): `firebase-admin`으로 토큰을 확인합니다. 프로젝트 ID만 쓰며 비밀키(서비스 계정)는 쓰지 않습니다. **앞으로 만들 교사 기능의 서버 코드는 먼저 `verifyTeacherRequest(request)`로 확인합니다.**
- `src/lib/auth/teacher.ts`: 허용 이메일 비교(대소문자·공백 무시, Google이 확인한 이메일만)와 토큰 읽기 규칙. 점검 파일 `teacher.test.ts`
- `src/lib/firebase/client.ts`: 브라우저용 Firebase 연결
- 설정값은 `C:\dev\quiz-app\.env.local`(Git에 안 올라감): `NEXT_PUBLIC_FIREBASE_API_KEY`·`_AUTH_DOMAIN`·`_PROJECT_ID`·`_APP_ID`(공개 값, `firebase apps:sdkconfig WEB 1:791239491499:web:81b683aca6ba0968b15cee --project quiz-app-2qy8u`로 다시 받기)와 `TEACHER_EMAIL`(서버 전용). Vercel에 배포할 때는 같은 값을 Vercel 환경 변수에도 넣어야 합니다.
- `src/app/student/page.tsx`: 서버에서 문제지를 읽어 `StudentApp`에 넘깁니다.
- `src/components/StudentApp.tsx`: 이름 입력(`StudentNameStep`) 후 "○○○ 학생" 표시와 함께 `QuizApp`을 보여줍니다. 이름은 저장하지 않습니다. 학생 화면에는 교사 화면·결과표로 가는 버튼을 두지 않습니다.
- `src/components/QuizApp.tsx`: 화면 단계(list → review → solving → result)를 관리하는 유일한 상태 보관 장소. 저장소·localStorage는 쓰지 않습니다.
- `PaperListStep` / `ReviewStep` / `QuestionStep` / `ResultStep`: 단계별 화면. 2일차 기능은 이 구조 위에 추가합니다.

## 개발 범위 (1일차 / 2일차)

- **1일차**: `question-papers` 문제지 목록·선택, 문항 표시, 4지선다 풀이, 제출 후 채점·점수·정오·해설, 로컬 실행, Vercel 배포
- **2일차**: 교사 Google 로그인·학생 게스트 입장, Azure AI 문제 생성, 문제 저장·공개, Firestore 결과 저장, 교사용 성적 조회
- 2일차 진행(2026-11-03): 교사·학생 선택 첫 화면, 교사 화면 기본 구조, 학생 이름 입장, 교사 Google 로그인(허용 계정 1개·서버 확인·로그아웃)까지 완료하고 내 컴퓨터에서 확인했습니다. AI·Firestore는 아직 연결하지 않았습니다(배포 안 함).
- 1일차에는 로그인·AI·DB를 **구현하지 않습니다.** 나중에 확장하기 쉬운 구조로 만들되, 2일차 기능을 미리 만들지 않습니다.

## 반드시 지킬 앱 규칙 (PRD.md 결정 사항 요약)

- 문제지 파일: `question-papers` 폴더, 최상위 `title`(questions 앞)과 `questions` 배열, 각 문항은 `question`, `options`(4개), `correctAnswer`(1~4, 1이 첫 번째 보기), `explanation`
- 홈 화면 목록에는 파일 이름이 아니라 각 파일의 `title`을 표시합니다. 제목을 코드에 고정하지 않습니다. 목록은 파일 이름 순서이고 문항 수를 함께 보여줍니다.
- 학생에게 파일 업로드를 요구하지 않습니다.
- 잘못된 문제지는 **풀 수 없게** 하고, 목록에 파일 이름과 함께 몇 번 문항의 어떤 항목이 틀렸는지 쉬운 한국어로 안내합니다.
- 문제지를 고르면 문항 확인 화면(제목·총 문항 수·문제 목록, [풀이 시작]·[다른 문제지 고르기])을 거쳐 풀이를 시작합니다.
- 풀이 중에는 정답 여부·점수·해설을 **절대 보여주지 않습니다.**
- [이전]/[다음]으로 답을 바꿀 수 있고, 진행률(예: 3/10)을 표시하며, 모든 문항에 답해야 [제출]이 활성화됩니다.
- 점수 = 정답 수 ÷ 전체 문항 수 × 100, 소수 첫째 자리까지 반올림합니다(예: 66.7점).
- 결과 화면: 문항마다 내가 고른 답·정답·○/×·해설, 그리고 [다시 풀기]·[다른 문제지 고르기] 버튼
- 새로고침하면 진행 상황이 사라져도 됩니다(1일차). 문제·보기 순서는 섞지 않습니다.
- 원본 JSON 접근을 막거나 정답을 숨기는 보호 기능은 현재 범위가 아닙니다.
- 확인을 위해 사용자 허락 없이 임의의 문제지나 문항을 `question-papers`에 추가하지 않습니다.
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
  - 2026-11-03 이 앱용 프로젝트 `quiz-app-2qy8u`(이름 quiz-app, 무료 요금제)와 웹 앱을 사용자 요청으로 CLI(`projects:create`, `apps:create`)로 만들었습니다. Google 로그인은 임시 폴더의 `firebase.json`(`auth.providers.googleSignIn`)으로 `firebase deploy --only auth`해 켰습니다. 앱 폴더에는 `firebase.json`이 없습니다.
  - CLI로 만든 프로젝트는 로그인 허용 도메인에 `localhost`가 **빠져 있어** 로그인 시 "unauthorized-domain"이 났습니다. Identity Toolkit 관리 API(`admin/v2/projects/quiz-app-2qy8u/config`, `authorizedDomains`)로 추가했습니다. Vercel 주소를 추가할 때도 같은 방법이나 Firebase 화면(Authentication → 설정 → 승인된 도메인)을 씁니다.
  - 2026-11-03 사용자가 arerama1211@gmail.com으로 교사 로그인 성공, 새로고침 후 유지, 로그아웃을 확인했습니다. 다른 계정 차단은 실제 다른 계정으로는 아직 확인하지 않았습니다(서버 규칙 점검으로만 확인).
- `claude` 명령은 PATH에 없고, Claude 앱에 들어 있는 `C:\Users\마아람\AppData\Local\Claude-Data\claude_pzs8sxrjxfjjc\claude-code\2.1.309\9078b9c1d466\claude.exe`를 썼습니다(앱 업데이트 시 경로가 바뀔 수 있음).
