import { describe, expect, it } from 'vitest';
import type { Question } from '../types';
import { getNextQuestion, getPendingQueue, getQuestionStatus, groupQuestionsBySpeaker } from '../utils/queue';

const q = (id: string, nickname: string, createdAt: string, completed = false): Question => ({
  id,
  presentationId: 'session-1',
  nickname,
  content: `Question ${id}`,
  createdAt,
  completed,
});

describe('queue utilities', () => {
  it('orders speakers by first question and keeps repeat nicknames grouped', () => {
    const questions = [
      q('2', 'Bea', '2026-01-01T10:02:00.000Z'),
      q('3', 'Alex', '2026-01-01T10:03:00.000Z'),
      q('1', 'Alex', '2026-01-01T10:01:00.000Z'),
    ];

    expect(groupQuestionsBySpeaker(questions).map((group) => [group.nickname, group.questions.map((item) => item.id)])).toEqual([
      ['Alex', ['1', '3']],
      ['Bea', ['2']],
    ]);
    expect(getPendingQueue(questions, null).map((question) => question.id)).toEqual(['1', '3', '2']);
  });

  it('skips completed and current questions when finding the next question', () => {
    const questions = [
      q('a1', 'Ari', '2026-01-01T10:00:00.000Z'),
      q('a2', 'Ari', '2026-01-01T10:01:00.000Z'),
      q('bo1', 'Bo', '2026-01-01T10:02:00.000Z'),
      q('cy1', 'Cy', '2026-01-01T10:03:00.000Z', true),
    ];

    expect(getQuestionStatus(questions[0], 'a1')).toBe('current');
    expect(getQuestionStatus(questions[3], 'a1')).toBe('completed');
    expect(getNextQuestion(questions, 'a1')?.id).toBe('a2');
    expect(getNextQuestion(questions.map((question) => (question.id === 'a2' ? { ...question, completed: true } : question)), 'a1')?.id).toBe('bo1');
  });
});
