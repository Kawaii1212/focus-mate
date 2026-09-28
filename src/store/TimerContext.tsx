"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const TIMER_STORAGE_KEY = 'focusmate_active_timer';

export interface TimerSessionConfig {
  taskTitle: string;
  focusMinutes: number;
  breakMinutes: number;
  mode: 'solo' | 'costudy';
  plannerBlockId?: string;
}

export interface ActiveTimerSession extends TimerSessionConfig {
  accumulatedSeconds: number;
  runningSince: number | null;
}

interface TimerContextValue {
  session: ActiveTimerSession | null;
  hydrated: boolean;
  startSession: (config: TimerSessionConfig, fromElapsedSeconds?: number) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  clearSession: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

function loadSession(): ActiveTimerSession | null {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.taskTitle === 'string' &&
      typeof parsed.focusMinutes === 'number' &&
      Number.isFinite(parsed.focusMinutes)
    ) {
      return {
        taskTitle: parsed.taskTitle,
        focusMinutes: parsed.focusMinutes,
        breakMinutes: typeof parsed.breakMinutes === 'number' ? parsed.breakMinutes : 10,
        mode: parsed.mode === 'costudy' ? 'costudy' : 'solo',
        plannerBlockId: typeof parsed.plannerBlockId === 'string' ? parsed.plannerBlockId : undefined,
        accumulatedSeconds: Number.isFinite(parsed.accumulatedSeconds) ? parsed.accumulatedSeconds : 0,
        runningSince: typeof parsed.runningSince === 'number' ? parsed.runningSince : null,
      };
    }
  } catch {
    // ignore corrupted state
  }
  return null;
}

export function getElapsedSeconds(session: ActiveTimerSession | null, now: number = Date.now()): number {
  if (!session) return 0;
  const running = session.runningSince !== null ? Math.floor((now - session.runningSince) / 1000) : 0;
  return Math.max(0, session.accumulatedSeconds + running);
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ActiveTimerSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSession(loadSession());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (session) {
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(TIMER_STORAGE_KEY);
      }
    } catch {
      // storage may be unavailable
    }
  }, [session, hydrated]);

  const startSession = useCallback((config: TimerSessionConfig, fromElapsedSeconds = 0) => {
    setSession({
      ...config,
      accumulatedSeconds: Math.max(0, Math.floor(fromElapsedSeconds)),
      runningSince: Date.now(),
    });
  }, []);

  const pauseSession = useCallback(() => {
    setSession((prev) => {
      if (!prev || prev.runningSince === null) return prev;
      const extra = Math.floor((Date.now() - prev.runningSince) / 1000);
      return { ...prev, accumulatedSeconds: prev.accumulatedSeconds + extra, runningSince: null };
    });
  }, []);

  const resumeSession = useCallback(() => {
    setSession((prev) => {
      if (!prev || prev.runningSince !== null) return prev;
      return { ...prev, runningSince: Date.now() };
    });
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, hydrated, startSession, pauseSession, resumeSession, clearSession }),
    [session, hydrated, startSession, pauseSession, resumeSession, clearSession]
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimerSession(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimerSession must be used within TimerProvider');
  return ctx;
}
