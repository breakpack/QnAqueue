import { CurrentQuestionCard } from './components/CurrentQuestionCard';
import { MaterialPanel } from './components/MaterialPanel';
import { MemoPanel } from './components/MemoPanel';
import { QuestionForm } from './components/QuestionForm';
import { QuestionList } from './components/QuestionList';
import { SessionPanel } from './components/SessionPanel';
import { TimerPanel } from './components/TimerPanel';
import { useQnaData } from './hooks/useQnaData';

function App() {
  const {
    sessions,
    selectedSession,
    sessionQuestions,
    currentQuestion,
    currentQuestionId,
    serverOffsetMs,
    syncStatus,
    createSession,
    selectSession,
    deleteSession,
    addQuestion,
    deleteQuestion,
    completeCurrentAndAdvance,
    updateMemo,
    updateMaterial,
    updateTiming,
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
        footer={
          <TimerPanel
            disabled={!selectedSession}
            timing={selectedSession?.timing ?? null}
            serverOffsetMs={serverOffsetMs}
            onChange={updateTiming}
          />
        }
      />

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Live Q&A</p>
            <h2>{selectedSession?.title ?? '발표를 선택하세요'}</h2>
          </div>
          <div className="theme-hint" aria-label="다크모드 지원">
            <span className={`sync-pill ${syncStatus}`}>{syncStatusLabel(syncStatus)}</span>
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
            <MaterialPanel
              disabled={!selectedSession}
              material={selectedSession?.material ?? null}
              onChange={updateMaterial}
            />
            <MemoPanel disabled={!selectedSession} memo={selectedSession?.memo ?? ''} onChange={updateMemo} />
          </div>
          <QuestionList questions={sessionQuestions} currentQuestionId={currentQuestionId} onDelete={deleteQuestion} />
        </div>
      </main>
    </div>
  );
}

const syncStatusLabel = (status: string) => {
  if (status === 'loading') return '불러오는 중';
  if (status === 'saving') return '저장 중';
  if (status === 'online') return '동기화됨';
  if (status === 'offline') return '오프라인';
  return '저장 실패';
};

export default App;
