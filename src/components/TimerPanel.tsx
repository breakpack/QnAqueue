import { useEffect, useMemo, useState } from 'react';
import type { PresentationTiming, TimerMode } from '../types';

interface TimerPanelProps {
  disabled: boolean;
  timing: PresentationTiming | null;
  serverOffsetMs: number;
  onChange: (timing: PresentationTiming) => void;
}

const modeLabels: Record<TimerMode, string> = {
  presentation: '발표 시간',
  qna: '질문 시간',
};

const getElapsedSeconds = (timing: PresentationTiming, currentTime: number) => {
  if (currentTime === 0) return timing.elapsedSeconds;
  if (!timing.isRunning || !timing.startedAt) return timing.elapsedSeconds;
  return timing.elapsedSeconds + Math.max(0, Math.floor((currentTime - new Date(timing.startedAt).getTime()) / 1000));
};

const formatTimer = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0');
  const rest = (safeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${rest}`;
};

export function TimerPanel({ disabled, timing, serverOffsetMs, onChange }: TimerPanelProps) {
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!timing?.isRunning) return undefined;
    const interval = window.setInterval(() => setCurrentTime(Date.now() + serverOffsetMs), 500);
    return () => window.clearInterval(interval);
  }, [serverOffsetMs, timing?.isRunning]);

  const elapsedSeconds = useMemo(() => (timing ? getElapsedSeconds(timing, currentTime) : 0), [currentTime, timing]);
  const limitSeconds = timing
    ? (timing.mode === 'presentation' ? timing.presentationLimitMinutes : timing.qnaLimitMinutes) * 60
    : 0;
  const remainingSeconds = limitSeconds - elapsedSeconds;
  const isOvertime = Boolean(timing && remainingSeconds < 0);

  const patchTiming = (patch: Partial<PresentationTiming>) => {
    if (!timing) return;
    onChange({ ...timing, ...patch });
  };

  const captureElapsed = () => {
    if (!timing) return 0;
    return getElapsedSeconds(timing, Date.now() + serverOffsetMs);
  };

  const setMode = (mode: TimerMode) => {
    if (!timing || mode === timing.mode) return;
    onChange({ ...timing, mode, elapsedSeconds: 0, isRunning: false, startedAt: null });
  };

  return (
    <section className="timer-panel">
      <div className="section-heading">
        <p className="eyebrow">Timer</p>
        <h2>시간 관리</h2>
      </div>

      <div className="timer-mode" role="group" aria-label="타이머 모드">
        <button
          disabled={disabled}
          className={timing?.mode === 'presentation' ? 'active' : ''}
          type="button"
          onClick={() => setMode('presentation')}
        >
          발표
        </button>
        <button
          disabled={disabled}
          className={timing?.mode === 'qna' ? 'active' : ''}
          type="button"
          onClick={() => setMode('qna')}
        >
          질문
        </button>
      </div>

      <div className={`timer-display ${isOvertime ? 'overtime' : ''}`}>
        <span>{timing ? modeLabels[timing.mode] : '발표 시간'}</span>
        <strong>{isOvertime ? `+${formatTimer(Math.abs(remainingSeconds))}` : formatTimer(remainingSeconds)}</strong>
        <small>
          경과 {formatTimer(elapsedSeconds)} / 제한 {formatTimer(limitSeconds)}
        </small>
      </div>

      <div className="limit-grid">
        <label>
          발표 제한(분)
          <input
            disabled={disabled}
            min="1"
            type="number"
            value={timing?.presentationLimitMinutes ?? 10}
            onChange={(event) => patchTiming({ presentationLimitMinutes: Number(event.target.value) || 1 })}
          />
        </label>
        <label>
          질문 제한(분)
          <input
            disabled={disabled}
            min="1"
            type="number"
            value={timing?.qnaLimitMinutes ?? 5}
            onChange={(event) => patchTiming({ qnaLimitMinutes: Number(event.target.value) || 1 })}
          />
        </label>
      </div>

      <div className="timer-actions">
        {timing?.isRunning ? (
          <button
            disabled={disabled}
            className="primary text-button"
            type="button"
            onClick={() => patchTiming({ elapsedSeconds: captureElapsed(), isRunning: false, startedAt: null })}
          >
            일시정지
          </button>
        ) : (
          <button
            disabled={disabled}
            className="primary text-button"
            type="button"
            onClick={() => patchTiming({ isRunning: true, startedAt: new Date(Date.now() + serverOffsetMs).toISOString() })}
          >
            시작
          </button>
        )}
        <button
          disabled={disabled}
          className="ghost text-button"
          type="button"
          onClick={() => patchTiming({ elapsedSeconds: 0, isRunning: false, startedAt: null })}
        >
          초기화
        </button>
        <button
          disabled={disabled}
          className="ghost text-button"
          type="button"
          onClick={() => setMode(timing?.mode === 'presentation' ? 'qna' : 'presentation')}
        >
          {timing?.mode === 'presentation' ? '질문 시간으로' : '발표 시간으로'}
        </button>
      </div>
    </section>
  );
}
