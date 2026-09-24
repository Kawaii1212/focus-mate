"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useApp, useMascot } from '@/store/AppContext';
import { useTimerSession } from '@/store/TimerContext';
import { sessionApi } from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';
import MascotSVG from '@/components/mascot/MascotSVG';
import SpeechBubble from '@/components/mascot/SpeechBubble';
import { getRandomSpeech } from '@/lib/mascotData';
import { useTimer, formatTime } from '@/hooks/useTimer';
import { StudySession } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pause, Square, Flame, Zap, Star } from 'lucide-react';
import QuitWarningModal from '@/components/pomodoro/QuitWarningModal';

interface SessionState {
  taskTitle: string;
  focusMinutes: number;
  breakMinutes: number;
  mode: 'solo' | 'costudy';
  plannerBlockId?: string;
  elapsedSeconds?: number; // present when resuming from pause
}

export default function ActiveSessionPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const location = { pathname, state: (() => { try { return JSON.parse(searchParams?.get('state') || 'null'); } catch { return null; } })() };;
  const urlSession = (() => { try { return JSON.parse(searchParams?.get('state') || 'null'); } catch { return null; } })() as SessionState | null;
  const { state: appState, dispatch } = useApp();
  const mascot = useMascot();
  const { session: timerSession, hydrated, startSession, clearSession } = useTimerSession();

  const timer = useTimer();
  const [showQuitWarning, setShowQuitWarning] = useState(false);
  const [speech, setSpeech] = useState('');
  const completingRef = useRef(false);

  // Global timer state survives sidebar navigation; URL is only a bootstrap fallback
  const session: SessionState | null = hydrated ? (timerSession ?? urlSession) : null;

  const fullExp = Math.round((session?.focusMinutes ?? 25) * 1.1);
  const fullCoin = Math.round((session?.focusMinutes ?? 25) * 0.44);

  // Bootstrap from URL when there is no global session (deep link / first visit)
  useEffect(() => {
    if (!hydrated || timerSession || !urlSession || completingRef.current) return;
    const target = urlSession.focusMinutes * 60;
    const from = urlSession.elapsedSeconds ?? 0;
    if (target > 0 && from >= target) {
      // Stale URL from an already-finished session — do not resurrect it
      router.replace('/study');
      return;
    }
    startSession(urlSession, from);
  }, [hydrated, timerSession, urlSession, startSession, router]);

  // Rotate mascot speech every 2 minutes
  useEffect(() => {
    if (!mascot) return;
    setSpeech(getRandomSpeech(mascot.personaId, 'studying'));
    const interval = setInterval(() => {
      setSpeech(getRandomSpeech(mascot.personaId, 'studying'));
    }, 120 * 1000);
    return () => clearInterval(interval);
  }, [mascot]);

  // Auto-complete when timer reaches 0
  useEffect(() => {
    if (!hydrated || completingRef.current) return;
    if (timer.targetSeconds > 0 && timer.elapsedSeconds >= timer.targetSeconds && session) {
      handleComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.elapsedSeconds, timer.targetSeconds, hydrated, session]);

  const pct = timer.completionPct;
  const earnedExp = Math.round((pct / 100) * fullExp);
  const earnedCoin = Math.round((pct / 100) * fullCoin) * (appState.isPremium ? 2 : 1);

  const handlePause = () => {
    if (!session) return;
    timer.pause();
    const pauseState = {
      taskTitle: session.taskTitle,
      focusMinutes: session.focusMinutes,
      breakMinutes: session.breakMinutes,
      mode: session.mode,
      plannerBlockId: session.plannerBlockId,
      elapsedSeconds: timer.elapsedSeconds,
    };
    router.push(`/study/pause?state=${encodeURIComponent(JSON.stringify(pauseState))}`);
  };

  const handleEndAttempt = () => {
    if (pct >= 50) {
      handleComplete();
    } else {
      setShowQuitWarning(true);
    }
  };

  const handleComplete = async () => {
    if (completingRef.current || !session) return;
    completingRef.current = true;

    const targetSeconds = session.focusMinutes * 60;
    const elapsedSeconds = Math.min(timer.elapsedSeconds, targetSeconds);
    const actualMinutes = Math.round(elapsedSeconds / 60);
    const completionPct = targetSeconds > 0 ? Math.min(100, (elapsedSeconds / targetSeconds) * 100) : 0;
    const isValid = completionPct >= 50;

    const s: StudySession = {
      id: '', // let backend generate
      taskTitle: session.taskTitle,
      targetMinutes: session.focusMinutes,
      actualMinutes,
      completionPct,
      expEarned: Math.round((completionPct / 100) * fullExp),
      coinEarned: Math.round((completionPct / 100) * fullCoin) * (appState.isPremium ? 2 : 1),
      isValid,
      streakSaved: isValid,
      plannerBlockId: session.plannerBlockId,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    try {
      if (appState.user?.id) {
        const savedSession = await sessionApi.createSession(s);
        s.id = savedSession.id;
      }
    } catch (error) {
      console.error('Failed to save session to backend', error);
      s.id = Date.now().toString(); // fallback
    }

    dispatch({ type: 'ADD_SESSION', payload: s });
    dispatch({ type: 'UPDATE_MASCOT_EXP', payload: { expGained: s.expEarned, coinGained: s.coinEarned } });
    if (isValid) {
      dispatch({ type: 'UPDATE_STREAK', payload: { isValid: true } });
    }
    if (session.plannerBlockId) {
      dispatch({ type: 'COMPLETE_PLANNER_BLOCK', payload: session.plannerBlockId });
    }

    clearSession();
    router.push(`/study/complete?state=${encodeURIComponent(JSON.stringify(s))}`);
  };

  if (!hydrated) {
    return (
      <AppLayout>
        <div className="text-center py-20 text-muted-foreground">Đang tải phiên học...</div>
      </AppLayout>
    );
  }

  if (!session) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Không tìm thấy phiên học.</p>
          <Button onClick={() => router.push('/study')} className="mt-4 rounded-xl">Thiết lập phiên mới</Button>
        </div>
      </AppLayout>
    );
  }

  // Ring progress
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference - (pct / 100) * circumference;

  return (
    <AppLayout hideMascotPanel mascotState="studying">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Đang học</h1>
            <p className="text-sm text-muted-foreground truncate max-w-xs">{session.taskTitle}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {session.mode === 'costudy' ? 'Co-study' : 'Solo'}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Timer */}
          <div className="col-span-2 flex flex-col items-center gap-5">
            <div className="relative flex items-center justify-center">
              {/* Pulse ring */}
              <div
                className="absolute rounded-full animate-pulse-ring"
                style={{
                  width: 220,
                  height: 220,
                  border: '2px solid hsl(var(--sky) / 0.3)',
                }}
              />
              <svg width={220} height={220} className="timer-ring">
                {/* Background circle */}
                <circle
                  cx={110} cy={110} r={radius}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth={10}
                />
                {/* Progress */}
                <circle
                  cx={110} cy={110} r={radius}
                  fill="none"
                  stroke="hsl(var(--sky))"
                  strokeWidth={10}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDash}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              {/* Time text */}
              <div className="absolute text-center">
                <p className="text-4xl font-bold text-foreground font-mono">
                  {formatTime(timer.remainingSeconds)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(pct)}% hoàn thành
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="rounded-2xl gap-2 px-8"
                onClick={handlePause}
              >
                <Pause className="w-5 h-5" /> Tạm dừng
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-2xl gap-2 px-8"
                onClick={handleEndAttempt}
                style={{ borderColor: 'hsl(var(--destructive) / 0.5)', color: 'hsl(var(--destructive))' }}
              >
                <Square className="w-5 h-5" /> Kết thúc
              </Button>
            </div>

            {/* Earn preview */}
            <div
              className="flex gap-4 p-4 rounded-2xl w-full"
              style={{ background: 'hsl(var(--sky-light))' }}
            >
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4" style={{ color: 'hsl(var(--butter))' }} />
                <span className="text-sm font-medium">+{earnedExp} EXP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4" style={{ color: 'hsl(var(--sky))' }} />
                <span className="text-sm font-medium">+{earnedCoin} coin</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <Flame className="w-4 h-4" style={{ color: 'hsl(var(--peach))' }} />
                <span className="text-xs text-muted-foreground">
                  {pct >= 50 ? 'Streak sẽ được lưu' : `Cần ≥50% để lưu streak`}
                </span>
              </div>
            </div>
          </div>

          {/* Mascot */}
          {mascot && (
            <div className="flex flex-col items-center gap-3">
              <div className="text-xs font-medium text-muted-foreground text-center">
                {mascot.name} đang học cùng bạn
              </div>
              <MascotSVG
                personaId={mascot.personaId}
                stage={mascot.stage}
                mascotState="studying"
                size={110}
                animate
              />
              {speech && (
                <SpeechBubble text={speech} direction="left" />
              )}
            </div>
          )}
        </div>
      </div>

      <QuitWarningModal
        open={showQuitWarning}
        completionPct={pct}
        onKeepStudying={() => setShowQuitWarning(false)}
        onEndAnyway={handleComplete}
      />
    </AppLayout>
  );
}
