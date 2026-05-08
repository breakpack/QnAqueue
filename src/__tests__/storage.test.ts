import { describe, expect, it } from 'vitest';
import { localQnaStorage, STORAGE_KEY } from '../storage/qnaStorage';
import type { QnaData } from '../types';

const timing = {
  presentationLimitMinutes: 10,
  qnaLimitMinutes: 5,
  mode: 'presentation' as const,
  elapsedSeconds: 0,
  isRunning: false,
  startedAt: null,
};

describe('qna localStorage layer', () => {
  it('round trips state and falls back to initial data for empty or corrupt storage', () => {
    window.localStorage.clear();
    expect(localQnaStorage.load()).toEqual({ sessions: [], questions: [], selectedSessionId: null, currentQuestionIdBySession: {} });

    const state: QnaData = {
      selectedSessionId: 's1',
      sessions: [{ id: 's1', title: 'Demo', createdAt: '2026-01-01T10:00:00.000Z', memo: 'Strong answers', material: null, timing }],
      questions: [{ id: 'q1', presentationId: 's1', nickname: 'Alex', content: 'Why?', createdAt: '2026-01-01T10:01:00.000Z', completed: false }],
      currentQuestionIdBySession: { s1: 'q1' },
    };

    localQnaStorage.save(state);
    expect(localQnaStorage.load()).toEqual(state);

    window.localStorage.setItem(STORAGE_KEY, '{bad json');
    expect(localQnaStorage.load()).toEqual({ sessions: [], questions: [], selectedSessionId: null, currentQuestionIdBySession: {} });
  });

  it('migrates sessions saved before presentation materials existed', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedSessionId: 's1',
        sessions: [{ id: 's1', title: 'Legacy', createdAt: '2026-01-01T10:00:00.000Z', memo: '' }],
        questions: [],
        currentQuestionIdBySession: {},
      }),
    );

    expect(localQnaStorage.load().sessions[0].material).toBeNull();
    expect(localQnaStorage.load().sessions[0].timing).toEqual(timing);
  });
});
