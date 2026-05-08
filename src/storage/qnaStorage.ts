import type { PresentationSession, QnaData } from '../types';

const STORAGE_KEY = 'presentation-qna-queue:v1';

const initialData: QnaData = {
  sessions: [],
  questions: [],
  selectedSessionId: null,
  currentQuestionIdBySession: {},
};

const initialTiming = {
  presentationLimitMinutes: 10,
  qnaLimitMinutes: 5,
  mode: 'presentation' as const,
  elapsedSeconds: 0,
  isRunning: false,
  startedAt: null,
};

export interface RemoteStatePayload {
  data: QnaData;
  serverNow: string;
}

export interface QnaStorage {
  load(): QnaData;
  save(data: QnaData): void;
}

const normalizeSession = (session: PresentationSession): PresentationSession => ({
  ...session,
  memo: session.memo ?? '',
  material: session.material ?? null,
  timing: { ...initialTiming, ...session.timing },
});

const normalizeData = (data: Partial<QnaData>): QnaData => ({
  ...initialData,
  ...data,
  sessions: (data.sessions ?? []).map(normalizeSession),
  questions: data.questions ?? [],
  currentQuestionIdBySession: data.currentQuestionIdBySession ?? {},
});

const getServerOffset = (serverNow: string) => new Date(serverNow).getTime() - Date.now();

export const localQnaStorage: QnaStorage = {
  load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return initialData;
      return normalizeData(JSON.parse(raw));
    } catch {
      return initialData;
    }
  },
  save(data) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
};

export const remoteQnaStorage = {
  async load(): Promise<RemoteStatePayload | null> {
    try {
      const response = await fetch('/api/state', { cache: 'no-store' });
      if (!response.ok) return null;
      const payload = (await response.json()) as RemoteStatePayload;
      return { data: normalizeData(payload.data), serverNow: payload.serverNow };
    } catch {
      return null;
    }
  },
  async save(data: QnaData): Promise<void> {
    await fetch('/api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
  },
  subscribe(onState: (data: QnaData, serverOffsetMs: number) => void): () => void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

    socket.addEventListener('message', (event) => {
      const payload = JSON.parse(event.data) as RemoteStatePayload & { type: string };
      if (payload.type !== 'state') return;
      onState(normalizeData(payload.data), getServerOffset(payload.serverNow));
    });

    socket.addEventListener('error', () => socket.close());

    return () => socket.close();
  },
  getServerOffset,
};

export { STORAGE_KEY };
