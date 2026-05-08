import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { localQnaStorage, remoteQnaStorage } from '../storage/qnaStorage';
import type { PresentationMaterial, PresentationSession, PresentationTiming, QnaData, Question } from '../types';
import { getNextQuestion } from '../utils/queue';

const createId = () => `${Date.now().toString(36)}-${crypto.randomUUID()}`;
const now = () => new Date().toISOString();
type SyncStatus = 'loading' | 'online' | 'saving' | 'offline' | 'error';

export function useQnaData() {
  const [data, setData] = useState<QnaData>(() => localQnaStorage.load());
  const dataRef = useRef(data);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const saveVersionRef = useRef(0);

  useEffect(() => {
    dataRef.current = data;
    localQnaStorage.save(data);
  }, [data]);

  const syncData = useCallback(async (nextData: QnaData) => {
    const version = saveVersionRef.current + 1;
    saveVersionRef.current = version;
    setSyncStatus('saving');

    try {
      await remoteQnaStorage.save(nextData);
      if (saveVersionRef.current === version) setSyncStatus('online');
    } catch {
      if (saveVersionRef.current === version) setSyncStatus('error');
    }
  }, []);

  const updateData = useCallback((updater: (prev: QnaData) => QnaData) => {
    setData((prev) => {
      const next = updater(prev);
      dataRef.current = next;
      localQnaStorage.save(next);
      void syncData(next);
      return next;
    });
  }, [syncData]);

  useEffect(() => {
    let active = true;

    remoteQnaStorage.load().then((payload) => {
      if (!active) return;
      if (!payload) {
        setSyncStatus('offline');
        return;
      }
      setServerOffsetMs(remoteQnaStorage.getServerOffset(payload.serverNow));
      dataRef.current = payload.data;
      setData(payload.data);
      localQnaStorage.save(payload.data);
      setSyncStatus('online');
    });

    const unsubscribe = remoteQnaStorage.subscribe((remoteData, offset) => {
      setServerOffsetMs(offset);
      dataRef.current = remoteData;
      setData(remoteData);
      localQnaStorage.save(remoteData);
      setSyncStatus('online');
    }, (status) => setSyncStatus((current) => (current === 'saving' ? current : status)));

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const selectedSession = useMemo(
    () => data.sessions.find((session) => session.id === data.selectedSessionId) ?? null,
    [data.selectedSessionId, data.sessions],
  );

  const sessionQuestions = useMemo(
    () => data.questions.filter((question) => question.presentationId === data.selectedSessionId),
    [data.questions, data.selectedSessionId],
  );

  const currentQuestionId = selectedSession ? data.currentQuestionIdBySession[selectedSession.id] ?? null : null;
  const currentQuestion = sessionQuestions.find((question) => question.id === currentQuestionId && !question.completed) ?? null;

  const selectSession = (sessionId: string) => {
    updateData((prev) => ({ ...prev, selectedSessionId: sessionId }));
  };

  const createSession = (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const session: PresentationSession = {
      id: createId(),
      title: trimmed,
      createdAt: now(),
      memo: '',
      material: null,
      timing: {
        presentationLimitMinutes: 10,
        qnaLimitMinutes: 5,
        mode: 'presentation',
        elapsedSeconds: 0,
        isRunning: false,
        startedAt: null,
      },
    };

    updateData((prev) => ({
      ...prev,
      sessions: [session, ...prev.sessions],
      selectedSessionId: session.id,
      currentQuestionIdBySession: { ...prev.currentQuestionIdBySession, [session.id]: null },
    }));
  };

  const deleteSession = (sessionId: string) => {
    updateData((prev) => {
      const sessions = prev.sessions.filter((session) => session.id !== sessionId);
      const currentQuestionIdBySession = { ...prev.currentQuestionIdBySession };
      delete currentQuestionIdBySession[sessionId];
      const selectedSessionId = prev.selectedSessionId === sessionId ? sessions[0]?.id ?? null : prev.selectedSessionId;

      return {
        ...prev,
        sessions,
        questions: prev.questions.filter((question) => question.presentationId !== sessionId),
        selectedSessionId,
        currentQuestionIdBySession,
      };
    });
  };

  const addQuestion = (nickname: string, content: string) => {
    if (!selectedSession) return;

    const cleanNickname = nickname.trim();
    const cleanContent = content.trim();
    if (!cleanNickname || !cleanContent) return;

    const question: Question = {
      id: createId(),
      presentationId: selectedSession.id,
      nickname: cleanNickname,
      content: cleanContent,
      createdAt: now(),
      completed: false,
    };

    updateData((prev) => {
      const questions = [...prev.questions, question];
      const current = prev.currentQuestionIdBySession[selectedSession.id];
      return {
        ...prev,
        questions,
        currentQuestionIdBySession: {
          ...prev.currentQuestionIdBySession,
          [selectedSession.id]: current ?? getNextQuestion(questions.filter((item) => item.presentationId === selectedSession.id), null)?.id ?? null,
        },
      };
    });
  };

  const deleteQuestion = (questionId: string) => {
    if (!selectedSession) return;

    updateData((prev) => {
      const questions = prev.questions.filter((question) => question.id !== questionId);
      const scoped = questions.filter((question) => question.presentationId === selectedSession.id);
      const current = prev.currentQuestionIdBySession[selectedSession.id];
      const nextCurrent = current === questionId ? getNextQuestion(scoped, null)?.id ?? null : current ?? null;

      return {
        ...prev,
        questions,
        currentQuestionIdBySession: {
          ...prev.currentQuestionIdBySession,
          [selectedSession.id]: nextCurrent,
        },
      };
    });
  };

  const completeCurrentAndAdvance = () => {
    if (!selectedSession || !currentQuestionId) return;

    updateData((prev) => {
      const questions = prev.questions.map((question) =>
        question.id === currentQuestionId ? { ...question, completed: true } : question,
      );
      const scoped = questions.filter((question) => question.presentationId === selectedSession.id);

      return {
        ...prev,
        questions,
        currentQuestionIdBySession: {
          ...prev.currentQuestionIdBySession,
          [selectedSession.id]: getNextQuestion(scoped, currentQuestionId)?.id ?? null,
        },
      };
    });
  };

  const updateMemo = (memo: string) => {
    if (!selectedSession) return;
    updateData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) => (session.id === selectedSession.id ? { ...session, memo } : session)),
    }));
  };

  const updateMaterial = (material: PresentationMaterial | null) => {
    if (!selectedSession) return;
    updateData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) => (session.id === selectedSession.id ? { ...session, material } : session)),
    }));
  };

  const updateTiming = (timing: PresentationTiming) => {
    if (!selectedSession) return;
    updateData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) => (session.id === selectedSession.id ? { ...session, timing } : session)),
    }));
  };

  return {
    sessions: data.sessions,
    selectedSession,
    sessionQuestions,
    currentQuestion,
    currentQuestionId,
    serverOffsetMs,
    syncStatus,
    createSession,
    selectSession,
    deleteSession,
    addQuestion,
    deleteQuestion,
    completeCurrentAndAdvance,
    updateMemo,
    updateMaterial,
    updateTiming,
  };
}
