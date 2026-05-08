import type { Question, QuestionStatus, SpeakerGroup } from '../types';

const byCreatedAt = (a: Question, b: Question) =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

export function getQuestionStatus(question: Question, currentQuestionId: string | null): QuestionStatus {
  if (question.completed) return 'completed';
  if (question.id === currentQuestionId) return 'current';
  return 'pending';
}

export function groupQuestionsBySpeaker(questions: Question[]): SpeakerGroup[] {
  const groups = new Map<string, Question[]>();

  for (const question of questions) {
    const key = question.nickname.trim().toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), question]);
  }

  return [...groups.values()]
    .map((speakerQuestions) => {
      const sorted = [...speakerQuestions].sort(byCreatedAt);
      return {
        nickname: sorted[0]?.nickname ?? 'Anonymous',
        firstQuestionAt: sorted[0]?.createdAt ?? new Date(0).toISOString(),
        questions: sorted,
      };
    })
    .sort((a, b) => new Date(a.firstQuestionAt).getTime() - new Date(b.firstQuestionAt).getTime());
}

export function getPendingQueue(questions: Question[], currentQuestionId: string | null): Question[] {
  return groupQuestionsBySpeaker(
    questions.filter((question) => !question.completed && question.id !== currentQuestionId),
  ).flatMap((group) => group.questions);
}

export function getNextQuestion(questions: Question[], currentQuestionId: string | null): Question | null {
  return getPendingQueue(questions, currentQuestionId)[0] ?? null;
}

export function getQuestionNumberForSpeaker(questions: Question[], target: Question): number {
  return questions
    .filter((question) => question.nickname.trim().toLowerCase() === target.nickname.trim().toLowerCase())
    .sort(byCreatedAt)
    .findIndex((question) => question.id === target.id) + 1;
}

export function getRemainingForSpeaker(questions: Question[], nickname: string): number {
  const key = nickname.trim().toLowerCase();
  return questions.filter((question) => !question.completed && question.nickname.trim().toLowerCase() === key).length;
}
