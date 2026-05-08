import type { QnaData } from '../types';

const STORAGE_KEY = 'presentation-qna-queue:v1';

const initialData: QnaData = {
  sessions: [],
  questions: [],
  selectedSessionId: null,
  currentQuestionIdBySession: {},
};

export interface QnaStorage {
  load(): QnaData;
  save(data: QnaData): void;
}

export const localQnaStorage: QnaStorage = {
  load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return initialData;
      return { ...initialData, ...JSON.parse(raw) } as QnaData;
    } catch {
      return initialData;
    }
  },
  save(data) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
};

export { STORAGE_KEY };
