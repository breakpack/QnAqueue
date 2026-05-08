export type QuestionStatus = 'pending' | 'current' | 'completed';

export interface PresentationSession {
  id: string;
  title: string;
  createdAt: string;
  memo: string;
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
