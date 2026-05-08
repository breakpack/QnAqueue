import type { Question, QuestionStatus } from '../types';
import { getQuestionStatus } from '../utils/queue';
import { formatDateTime } from '../utils/time';

interface QuestionListProps {
  questions: Question[];
  currentQuestionId: string | null;
  onDelete: (questionId: string) => void;
}

const labels: Record<QuestionStatus, string> = {
  pending: '진행 대기',
  current: '진행 중',
  completed: '완료',
};

export function QuestionList({ questions, currentQuestionId, onDelete }: QuestionListProps) {
  const statuses: QuestionStatus[] = ['current', 'pending', 'completed'];

  return (
    <section className="list-section">
      <div className="section-heading">
        <p className="eyebrow">Questions</p>
        <h2>질문 목록</h2>
      </div>

      {statuses.map((status) => {
        const rows = questions.filter((question) => getQuestionStatus(question, currentQuestionId) === status);
        return (
          <div className="status-group" key={status}>
            <div className="status-heading">
              <h3>{labels[status]}</h3>
              <span>{rows.length}</span>
            </div>
            {rows.length === 0 ? (
              <p className="empty-copy">해당 질문이 없습니다.</p>
            ) : (
              rows.map((question) => (
                <article className="question-row" key={question.id}>
                  <div>
                    <div className="row-topline">
                      <strong>{question.nickname}</strong>
                      <span className={`status-pill ${status}`}>{labels[status]}</span>
                    </div>
                    <p>{question.content}</p>
                    <small>{formatDateTime(question.createdAt)}</small>
                  </div>
                  <button className="icon-button ghost" type="button" title="질문 삭제" onClick={() => onDelete(question.id)}>
                    ×
                  </button>
                </article>
              ))
            )}
          </div>
        );
      })}
    </section>
  );
}
