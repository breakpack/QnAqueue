# 발표별 Q&A Queue

발표 평가와 질의응답 시간에 사용할 수 있는 발표별 Q&A 큐 웹앱입니다. 질문은 질문 단위가 아니라 질문자 별명 단위로 묶여 진행됩니다.

## 주요 기능

- 발표 세션 생성, 선택, 삭제
- 발표별 질문 등록, 삭제, 완료 처리
- 질문자별 큐 진행
  - 질문자는 처음 질문을 등록한 시간 순서로 정렬
  - 같은 별명의 질문은 한 차례에 이어서 진행
  - 뒤늦게 추가한 같은 별명 질문도 해당 질문자 차례 안에서 처리
- 발표자료 업로드, 열기, 삭제
- 발표별 평가 메모 저장
- 발표 시간 / 질문 시간 제한 설정
- 발표 타이머와 질문 타이머 시작, 일시정지, 초기화, 전환
- 서버 기반 상태 저장과 WebSocket 동기화
- 다크모드와 반응형 UI
- Docker Compose 실행 지원

## 실행 방법

### Docker Compose

```bash
docker compose up --build
```

접속:

```text
http://localhost:3040
```

Docker Compose 실행 시 서버가 빌드된 React 앱을 서빙하고, 상태는 Docker volume `qna-data`에 저장됩니다.

### 로컬 서버 실행

```bash
npm install
npm run build
PORT=3040 npm start
```

접속:

```text
http://localhost:3040
```

### 개발 서버

```bash
npm run dev -- --host 127.0.0.1 --port 3040
```

개발 서버는 UI 개발용입니다. 여러 사용자의 실시간 동기화 검증은 `npm start` 또는 Docker Compose 기반 서버 실행으로 확인하는 것을 권장합니다.

## 다중 사용자 동기화

서버가 단일 상태 원본입니다.

- `GET /api/state`: 현재 전체 상태 조회
- `PUT /api/state`: 전체 상태 저장
- `WS /ws`: 상태 변경 브로드캐스트

발표 생성, 질문 추가, 질문 완료, 타이머 시작 같은 변경은 서버에 저장됩니다. 서버는 저장 직후 WebSocket으로 모든 접속자에게 최신 상태를 전송하므로 새로고침 없이 다른 사용자 화면에 반영됩니다.

상단에는 동기화 상태가 표시됩니다.

- `불러오는 중`: 서버 상태 초기 로딩 중
- `저장 중`: 변경 사항 저장 중
- `동기화됨`: 서버와 연결되어 최신 상태 수신 중
- `오프라인`: WebSocket 연결 끊김, 자동 재연결 대기
- `저장 실패`: 서버 저장 실패

타이머는 서버 시간을 기준으로 시작 시각을 저장합니다. 각 브라우저는 서버 시간 오프셋을 반영해 남은 시간을 계산하므로 여러 사용자가 같은 타이머를 보게 됩니다.

## 질문 진행 규칙

큐 로직은 `src/utils/queue.ts`에 분리되어 있습니다.

- `groupQuestionsBySpeaker(questions)`
  - 질문을 별명 기준으로 묶습니다.
  - 각 질문자의 첫 질문 등록 시간을 기준으로 질문자 순서를 정합니다.

- `getNextQuestion(questions, currentQuestionId)`
  - 현재 질문자의 남은 질문을 먼저 반환합니다.
  - 현재 질문자의 질문이 끝나면 다음 질문자의 첫 미완료 질문으로 이동합니다.

- `getQuestionStatus(question, currentQuestionId)`
  - 질문 목록에서 `진행 대기`, `진행 중`, `완료` 상태를 구분합니다.

## 저장 구조

서버 저장 파일 기본 경로:

```text
data/qna-state.json
```

Docker Compose에서는 이 경로가 named volume으로 유지됩니다.

상태 구조:

```ts
{
  sessions: PresentationSession[];
  questions: Question[];
  selectedSessionId: string | null;
  currentQuestionIdBySession: Record<string, string | null>;
}
```

발표 세션에는 제목, 메모, 발표자료, 타이머 설정이 포함됩니다. 질문에는 발표 ID, 질문 ID, 별명, 질문 내용, 등록 시간, 완료 여부가 포함됩니다.

브라우저 `localStorage`는 서버 접속 실패 시 fallback 캐시로만 사용됩니다.

## 주요 파일 구조

```text
src/
  App.tsx
  components/
    CurrentQuestionCard.tsx
    MaterialPanel.tsx
    MemoPanel.tsx
    QuestionForm.tsx
    QuestionList.tsx
    SessionPanel.tsx
    TimerPanel.tsx
  hooks/
    useQnaData.ts
  storage/
    qnaStorage.ts
  types/
    index.ts
  utils/
    queue.ts
    time.ts
server/
  index.js
Dockerfile
docker-compose.yml
```

## 검증 명령

```bash
npm run lint
npm test
npm run build
```

## 서버 연동 확장 포인트

현재 서버는 파일 기반 JSON 저장소를 사용합니다. DB나 외부 API로 교체하려면 `server/index.js`의 `readState()`와 `writeState()`를 바꾸면 됩니다.

클라이언트 쪽 통신 계층은 `src/storage/qnaStorage.ts`에 모여 있습니다. API 경로나 인증, WebSocket 주소가 바뀌면 이 파일을 수정하면 됩니다.
