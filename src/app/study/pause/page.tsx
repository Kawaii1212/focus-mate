"use client";

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useMascot, useApp } from '@/store/AppContext';
import { getRandomSpeech } from '@/lib/mascotData';
import { sessionApi } from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';
import MascotSVG from '@/components/mascot/MascotSVG';
import SpeechBubble from '@/components/mascot/SpeechBubble';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Square } from 'lucide-react';
import { formatTime } from '@/hooks/useTimer';
import { StudySession } from '@/types';

export default function PausePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const location = { pathname, state: (() => { try { return JSON.parse(searchParams?.get('state') || 'null'); } catch { return null; } })() };;
  const sessionState = (() => { try { return JSON.parse(searchParams?.get('state') || 'null'); } catch { return null; } })() as {
    taskTitle: string;
    focusMinutes: number;
    breakMinutes: number;
    mode: string;
    plannerBlockId?: string;
    elapsedSeconds: number;
  };
  const mascot = useMascot();
  const { state: appState, dispatch } = useApp();

  const elapsedSeconds = sessionState?.elapsedSeconds ?? 0;
  const pct = sessionState
    ? Math.round((elapsedSeconds / (sessionState.focusMinutes * 60)) * 100)
    : 0;

  const speech = mascot ? getRandomSpeech(mascot.personaId, 'paused') : '';

  const handleResume = () => {
    router.push(`/study/active?state=${encodeURIComponent(JSON.stringify(sessionState))}`);
  };

  const handleEnd = async () => {
    const fullExp = Math.round((sessionState?.focusMinutes ?? 25) * 1.1);
    const fullCoin = Math.round((sessionState?.focusMinutes ?? 25) * 0.44);
    const completedSession: StudySession = {
      id: '', // let backend generate
      taskTitle: sessionState?.taskTitle ?? '',
      targetMinutes: sessionState?.focusMinutes ?? 0,
      actualMinutes: Math.round(elapsedSeconds / 60),
      completionPct: pct,
      expEarned: Math.round((pct / 100) * fullExp),
      coinEarned: Math.round((pct / 100) * fullCoin),
      isValid: pct >= 50,
      streakSaved: pct >= 50,
      plannerBlockId: sessionState?.plannerBlockId,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    try {
      if (appState.user?.id) {
        const savedSession = await sessionApi.createSession(completedSession);
        completedSession.id = savedSession.id;
      }
    } catch (error) {
      console.error('Failed to save session to backend', error);
      completedSession.id = Date.now().toString(); // fallback
    }

    dispatch({ type: 'ADD_SESSION', payload: completedSession });
    dispatch({ type: 'UPDATE_MASCOT_EXP', payload: { expGained: completedSession.expEarned, coinGained: completedSession.coinEarned } });
    if (completedSession.isValid) {
      dispatch({ type: 'UPDATE_STREAK', payload: { isValid: true } });
    }
    if (completedSession.plannerBlockId) {
      dispatch({ type: 'COMPLETE_PLANNER_BLOCK', payload: completedSession.plannerBlockId });
    }
    router.push(`/study/complete?state=${encodeURIComponent(JSON.stringify(completedSession))}`);
  };

  return (
    <AppLayout hideMascotPanel mascotState="paused">
      <div className="max-w-md mx-auto space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Đã Tạm Dừng</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bạn đã học được <strong>{formatTime(elapsedSeconds)}</strong> ({pct}%)
          </p>
        </div>

        {/* Mascot */}
        {mascot && (
          <div className="flex flex-col items-center gap-3">
            <MascotSVG
              personaId={mascot.personaId}
              stage={mascot.stage}
              mascotState="paused"
              size={130}
              animate
            />
            <SpeechBubble text={speech} />
            <p className="text-xs text-muted-foreground">
              {mascot.name} đang chờ bạn quay lại...
            </p>
          </div>
        )}

        <Card className="rounded-2xl shadow-fm-sm">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-muted-foreground">
              Reward chỉ nhận được sau khi hoàn thành hợp lệ (≥50% thời lượng).
            </p>
            {pct < 50 && (
              <p className="text-xs text-destructive">
                Nếu kết thúc ngay, streak hôm nay sẽ không được tính.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleResume}
            className="h-12 rounded-2xl font-bold text-base shadow-fm-md"
            style={{ background: 'hsl(var(--sky))', color: 'white' }}
          >
            <Play className="w-5 h-5 mr-2" /> Tiếp tục học
          </Button>
          <Button
            variant="outline"
            onClick={handleEnd}
            className="h-11 rounded-2xl"
          >
            <Square className="w-4 h-4 mr-2" /> Kết thúc phiên
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
