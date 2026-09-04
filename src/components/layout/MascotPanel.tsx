"use client";

import React, { useMemo, useState } from 'react';
import { useApp, useMascot, useStreak } from '../../store/AppContext';
import { PERSONAS, getRandomSpeech, EXP_PER_LEVEL } from '../../lib/mascotData';
import MascotSVG from '../mascot/MascotSVG';
import SpeechBubble from '../mascot/SpeechBubble';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Zap, Coins, Flame, Shield, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MascotState } from '../../types';

interface MascotPanelProps {
  forcedState?: MascotState;
}

export default function MascotPanel({ forcedState }: MascotPanelProps) {
  const mascot = useMascot();
  const streak = useStreak();
  const { dispatch } = useApp();
  const router = useRouter();
  const [speechText, setSpeechText] = useState<string>('');

  const currentState: MascotState = useMemo(() => {
    if (forcedState) return forcedState;
    if (streak.atRisk) return 'streakReminder';
    return 'idle';
  }, [forcedState, streak.atRisk]);

  const speech = useMemo(() => {
    if (!mascot) return '';
    const text = speechText || getRandomSpeech(mascot.personaId, currentState);
    return text;
  }, [mascot, currentState, speechText]);

  const handleMascotClick = () => {
    if (!mascot) return;
    setSpeechText(getRandomSpeech(mascot.personaId, currentState));
  };

  if (!mascot) return null;

  const persona = PERSONAS[mascot.personaId];
  const expPct = (mascot.exp / mascot.expToNextLevel) * 100;
  const stageLabel = mascot.stage === 'baby' ? 'Baby' : mascot.stage === 'teen' ? 'Teen' : 'Adult';

  return (
    <div className="w-64 bg-sidebar border-l border-sidebar-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mascot</span>
          <Badge variant="secondary" className="text-xs">{stageLabel}</Badge>
        </div>
        <h3 className="font-bold text-foreground">{mascot.name}</h3>
        <p className="text-xs text-lilac" style={{ color: `hsl(var(--lilac))` }}>{persona.name}</p>
      </div>

      {/* Mascot visual */}
      <div className="flex-1 flex flex-col items-center justify-start p-4 gap-3">
        {/* Speech bubble */}
        <div className="w-full">
          <SpeechBubble text={speech} direction="right" className="ml-2" />
        </div>

        {/* Mascot SVG */}
        <div
          onClick={handleMascotClick}
          className="cursor-pointer hover:scale-105 transition-transform"
          title="Nhấn để nghe mascot nói"
        >
          <MascotSVG
            personaId={mascot.personaId}
            stage={mascot.stage}
            mascotState={currentState}
            size={120}
            animate
          />
        </div>

        {/* Stats */}
        <div className="w-full space-y-3">
          {/* Level & EXP */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-accent" style={{ color: 'hsl(var(--butter))' }} />
                <span className="text-xs font-medium text-foreground">Cấp {mascot.level}</span>
              </div>
              <span className="text-xs text-muted-foreground">{mascot.exp}/{mascot.expToNextLevel} EXP</span>
            </div>
            <Progress value={expPct} className="h-2" />
          </div>

          {/* Streak */}
          <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2">
            <Flame className="w-4 h-4" style={{ color: 'hsl(var(--peach))' }} />
            <div className="flex-1">
              <span className="text-sm font-semibold text-foreground">{streak.current} ngày</span>
              {streak.atRisk && (
                <span className="ml-1 text-xs text-destructive">⚠ Sắp mất!</span>
              )}
            </div>
            {streak.shields > 0 && (
              <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5" />
                <span>{streak.shields}</span>
              </div>
            )}
          </div>

          {/* Coin */}
          <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2">
            <Zap className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} />
            <span className="text-sm font-medium text-foreground">{mascot.coin} coin</span>
          </div>
        </div>

        {/* Quick study button */}
        <Button
          className="w-full mt-2 rounded-xl font-semibold"
          onClick={() => router.push('/study')}
          style={{ background: 'hsl(var(--sky))', color: 'white' }}
        >
          Bắt đầu học
        </Button>
      </div>
    </div>
  );
}
