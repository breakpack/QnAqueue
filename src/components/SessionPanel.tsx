import { FormEvent, useState } from 'react';
import type { PresentationSession } from '../types';
import { formatDateTime } from '../utils/time';

interface SessionPanelProps {
  sessions: PresentationSession[];
  selectedSessionId: string | null;
  onCreate: (title: string) => void;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
}

export function SessionPanel({ sessions, selectedSessionId, onCreate, onSelect, onDelete }: SessionPanelProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onCreate(title);
    setTitle('');
  };

  return (
    <aside className="session-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Presentation</p>
          <h1>Q&A Queue</h1>
        </div>
      </div>

      <form className="create-form" onSubmit={handleSubmit}>
        <input
          aria-label="발표 제목"
          placeholder="발표 제목"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <button type="submit" className="icon-button primary" title="발표 생성">
          +
        </button>
      </form>

      <div className="session-list">
        {sessions.length === 0 ? (
          <p className="empty-copy">발표를 먼저 생성하세요.</p>
        ) : (
          sessions.map((session) => (
            <button
              className={`session-item ${session.id === selectedSessionId ? 'active' : ''}`}
              key={session.id}
              type="button"
              onClick={() => onSelect(session.id)}
            >
              <span>
                <strong>{session.title}</strong>
                <small>{formatDateTime(session.createdAt)}</small>
              </span>
              <span
                role="button"
                tabIndex={0}
                className="delete-inline"
                title="발표 삭제"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(session.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onDelete(session.id);
                }}
              >
                ×
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
