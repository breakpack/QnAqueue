import { describe, expect, it } from 'vitest';
import { localQnaStorage, STORAGE_KEY } from '../storage/qnaStorage';
import type { QnaData } from '../types';

describe('qna localStorage layer', () => {
  it('round trips state and falls back to initial data for empty or corrupt storage', () => {
    window.localStorage.clear();
    expect(localQnaStorage.load()).toEqual({ sessions: [], questions: [], selectedSessionId: null, currentQuestionIdBySession: {} });

    const state: QnaData = {
      selectedSessionId: 's1',
      sessions: [{ id: 's1', title: 'Demo', createdAt: '2026-01-01T10:00:00.000Z', memo: 'Strong answers' }],
      questions: [{ id: 'q1', presentationId: 's1', nickname: 'Alex', content: 'Why?', createdAt: '2026-01-01T10:01:00.000Z', completed: false }],
      currentQuestionIdBySession: { s1: 'q1' },
    };

    localQnaStorage.save(state);
    expect(localQnaStorage.load()).toEqual(state);

    window.localStorage.setItem(STORAGE_KEY, '{bad json');
    expect(localQnaStorage.load()).toEqual({ sessions: [], questions: [], selectedSessionId: null, currentQuestionIdBySession: {} });
  });
});
