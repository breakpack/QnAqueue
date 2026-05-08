import type { Question } from '../types';
import { getQuestionNumberForSpeaker, getRemainingForSpeaker } from '../utils/queue';

interface CurrentQuestionCardProps {
  questions: Question[];
  currentQuestion: Question | null;
  onNext: () => void;
  onDelete: (questionId: string) => void;
}

export function CurrentQuestionCard({ questions, currentQuestion, onNext, onDelete }: CurrentQuestionCardProps) {
  if (!currentQuestion) {
    return (
      <section className="stage empty-stage">
        <p className="stage-title">대기 중인 질문이 없습니다</p>
        <div className="question-card">
          <p>질문이 등록되면 질문자 순서대로 바로 표시됩니다.</p>
        </div>
      </section>
    );
  }

  const questionNumber = getQuestionNumberForSpeaker(questions, currentQuestion);
  const remaining = Math.max(getRemainingForSpeaker(questions, currentQuestion.nickname) - 1, 0);

  return (
    <section className="stage">
      <p className="stage-title">지금은 {currentQuestion.nickname}님이 질문할 차례입니다</p>
      <div className="question-card">
        <div className="question-meta">
          <span>Q{questionNumber}</span>
          <span>남은 질문 {remaining}개</span>
        </div>
        <p>{currentQuestion.content}</p>
      </div>
      <div className="stage-actions">
        <button className="primary text-button large" type="button" onClick={onNext}>
          <span aria-hidden="true">✓</span>
          질문 완료 / 다음 질문
        </button>
        <button className="ghost text-button large" type="button" onClick={() => onDelete(currentQuestion.id)}>
          <span aria-hidden="true">×</span>
          질문 삭제
        </button>
      </div>
    </section>
  );
}
