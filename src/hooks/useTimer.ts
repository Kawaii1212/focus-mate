import { useEffect, useState } from 'react';
import { getElapsedSeconds, useTimerSession } from '@/store/TimerContext';

export interface TimerHookReturn {
  elapsedSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  completionPct: number;
  pause: () => void;
  resume: () => void;
  targetSeconds: number;
}

export function useTimer(): TimerHookReturn {
  const { session, pauseSession, resumeSession } = useTimerSession();
  const [, setTick] = useState(0);

  const isRunning = session !== null && session.runningSince !== null;
  const targetSeconds = session ? session.focusMinutes * 60 : 0;

  useEffect(() => {
    if (!isRunning) return;

    const tick = () => setTick((t) => t + 1);
    const interval = setInterval(tick, 500);
    const onVisibilityChange = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isRunning]);

  const rawElapsed = getElapsedSeconds(session);
  const elapsedSeconds = targetSeconds > 0 ? Math.min(targetSeconds, rawElapsed) : 0;
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);
  const completionPct = targetSeconds > 0 ? Math.min(100, (elapsedSeconds / targetSeconds) * 100) : 0;

  return {
    elapsedSeconds,
    remainingSeconds,
    isRunning,
    isPaused: session !== null && session.runningSince === null,
    completionPct,
    pause: pauseSession,
    resume: resumeSession,
    targetSeconds,
  };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
