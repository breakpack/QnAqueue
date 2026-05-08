export type QuestionStatus = 'pending' | 'current' | 'completed';

export interface PresentationSession {
  id: string;
  title: string;
  createdAt: string;
  memo: string;
  material: PresentationMaterial | null;
  timing: PresentationTiming;
}

export type TimerMode = 'presentation' | 'qna';

export interface PresentationTiming {
  presentationLimitMinutes: number;
  qnaLimitMinutes: number;
  mode: TimerMode;
  elapsedSeconds: number;
  isRunning: boolean;
  startedAt: string | null;
}

export interface PresentationMaterial {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  dataUrl: string;
}

export interface Question {
  id: string;
  presentationId: string;
  nickname: string;
  content: string;
  createdAt: string;
  completed: boolean;
}

export interface QnaData {
  sessions: PresentationSession[];
  questions: Question[];
  selectedSessionId: string | null;
  currentQuestionIdBySession: Record<string, string | null>;
}

export interface SpeakerGroup {
  nickname: string;
  firstQuestionAt: string;
  questions: Question[];
}
