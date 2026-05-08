import { CurrentQuestionCard } from './components/CurrentQuestionCard';
import { MemoPanel } from './components/MemoPanel';
import { QuestionForm } from './components/QuestionForm';
import { QuestionList } from './components/QuestionList';
import { SessionPanel } from './components/SessionPanel';
import { useQnaData } from './hooks/useQnaData';

function App() {
  const {
    sessions,
    selectedSession,
    sessionQuestions,
    currentQuestion,
    currentQuestionId,
    createSession,
    selectSession,
    deleteSession,
    addQuestion,
    deleteQuestion,
    completeCurrentAndAdvance,
    updateMemo,
  } = useQnaData();

  const selectedSessionId = selectedSession?.id ?? null;

  return (
    <div className="app-shell">
      <SessionPanel
        sessions={sessions}
        selectedSessionId={selectedSessionId}
        onCreate={createSession}
        onSelect={selectSession}
        onDelete={deleteSession}
      />

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Live Q&A</p>
            <h2>{selectedSession?.title ?? '발표를 선택하세요'}</h2>
          </div>
          <div className="theme-hint" aria-label="다크모드 지원">
            <span>☀</span>
            <span>☾</span>
          </div>
        </header>

        <CurrentQuestionCard
          questions={sessionQuestions}
          currentQuestion={currentQuestion}
          onNext={completeCurrentAndAdvance}
          onDelete={deleteQuestion}
        />

        <div className="lower-grid">
          <div className="control-stack">
            <QuestionForm disabled={!selectedSession} onAdd={addQuestion} />
            <MemoPanel disabled={!selectedSession} memo={selectedSession?.memo ?? ''} onChange={updateMemo} />
          </div>
          <QuestionList questions={sessionQuestions} currentQuestionId={currentQuestionId} onDelete={deleteQuestion} />
        </div>
      </main>
    </div>
  );
}

export default App;
