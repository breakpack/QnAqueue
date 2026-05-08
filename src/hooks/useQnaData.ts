import { useEffect, useMemo, useRef, useState } from 'react';
import { localQnaStorage, remoteQnaStorage } from '../storage/qnaStorage';
import type { PresentationMaterial, PresentationSession, PresentationTiming, QnaData, Question } from '../types';
import { getNextQuestion } from '../utils/queue';

const createId = () => `${Date.now().toString(36)}-${crypto.randomUUID()}`;
const now = () => new Date().toISOString();

export function useQnaData() {
  const [data, setData] = useState<QnaData>(() => localQnaStorage.load());
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const suppressRemoteSaveRef = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    localQnaStorage.save(data);
    if (suppressRemoteSaveRef.current) {
      suppressRemoteSaveRef.current = false;
      return;
    }

    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      remoteQnaStorage.save(data).catch(() => undefined);
    }, 250);
  }, [data]);

  useEffect(() => {
    let active = true;

    remoteQnaStorage.load().then((payload) => {
      if (!active || !payload) return;
      suppressRemoteSaveRef.current = true;
      setServerOffsetMs(remoteQnaStorage.getServerOffset(payload.serverNow));
      setData(payload.data);
      localQnaStorage.save(payload.data);
    });

    const unsubscribe = remoteQnaStorage.subscribe((remoteData, offset) => {
      suppressRemoteSaveRef.current = true;
      setServerOffsetMs(offset);
      setData(remoteData);
      localQnaStorage.save(remoteData);
    });

    return () => {
      active = false;
      unsubscribe();
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
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
    setData((prev) => ({ ...prev, selectedSessionId: sessionId }));
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

    setData((prev) => ({
      ...prev,
      sessions: [session, ...prev.sessions],
      selectedSessionId: session.id,
      currentQuestionIdBySession: { ...prev.currentQuestionIdBySession, [session.id]: null },
    }));
  };

  const deleteSession = (sessionId: string) => {
    setData((prev) => {
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

    setData((prev) => {
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

    setData((prev) => {
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

    setData((prev) => {
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
    setData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) => (session.id === selectedSession.id ? { ...session, memo } : session)),
    }));
  };

  const updateMaterial = (material: PresentationMaterial | null) => {
    if (!selectedSession) return;
    setData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) => (session.id === selectedSession.id ? { ...session, material } : session)),
    }));
  };

  const updateTiming = (timing: PresentationTiming) => {
    if (!selectedSession) return;
    setData((prev) => ({
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
