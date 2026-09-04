import { useState, useEffect, useRef, useCallback } from 'react';

export interface TimerHookReturn {
  elapsedSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  completionPct: number;
  start: (fromElapsed?: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  targetSeconds: number;
}

export function useTimer(targetMinutes: number): TimerHookReturn {
  const targetSeconds = targetMinutes * 60;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback((fromElapsed = 0) => {
    setElapsedSeconds(fromElapsed);
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    setIsPaused(true);
    clearTimer();
  }, [clearTimer]);

  const resume = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    clearTimer();
  }, [clearTimer]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          if (prev >= targetSeconds) {
            clearTimer();
            setIsRunning(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [isRunning, isPaused, targetSeconds, clearTimer]);

  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);
  const completionPct = targetSeconds > 0 ? Math.min(100, (elapsedSeconds / targetSeconds) * 100) : 0;

  return {
    elapsedSeconds,
    remainingSeconds,
    isRunning,
    isPaused,
    completionPct,
    start,
    pause,
    resume,
    reset,
    targetSeconds,
  };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
