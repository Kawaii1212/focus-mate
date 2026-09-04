"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useApp, useMascot, useStreak } from '@/store/AppContext';
import { PERSONAS, getRandomSpeech, CERTIFICATE_MILESTONES } from '@/lib/mascotData';
import AppLayout from '@/components/layout/AppLayout';
import MascotSVG from '@/components/mascot/MascotSVG';
import SpeechBubble from '@/components/mascot/SpeechBubble';
import { StudySession } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, Zap, Flame, Home, Timer, Trophy, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SessionCompletePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const location = { pathname, state: (() => { try { return JSON.parse(searchParams?.get('state') || 'null'); } catch { return null; } })() };;
  const session = (() => { try { return JSON.parse(searchParams?.get('state') || 'null'); } catch { return null; } })() as StudySession;
  const { state } = useApp();
  const mascot = useMascot();
  const streak = useStreak();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevLevel] = useState(mascot?.level ?? 1);

  // Note: dispatch is done in ActiveSessionPage/PausePage before navigating here
  useEffect(() => {
    if (mascot && mascot.level > prevLevel) {
      setShowLevelUp(true);
    }
  }, [mascot?.level, mascot, prevLevel]);

  if (!session) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Không tìm thấy dữ liệu phiên học.</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4 rounded-xl">Về Dashboard</Button>
        </div>
      </AppLayout>
    );
  }

  const pct = Math.round(session.completionPct);
  const isValid = session.isValid;
  const speech = mascot ? getRandomSpeech(mascot.personaId, isValid ? 'happy' : 'sad') : '';

  // Check certificate milestone
  const certUnlocked = mascot
    ? CERTIFICATE_MILESTONES.find((c) => c.level === mascot.level)
    : null;

  const expPct = mascot ? (mascot.exp / mascot.expToNextLevel) * 100 : 0;

  return (
    <AppLayout hideMascotPanel mascotState={isValid ? 'happy' : 'sad'}>
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="text-center space-y-1">
          <div
            className={cn(
              'w-16 h-16 rounded-3xl mx-auto flex items-center justify-center shadow-fm-md',
              isValid ? '' : 'bg-muted'
            )}
            style={isValid ? { background: 'hsl(var(--sky))' } : {}}
          >
            {isValid ? (
              <Check className="w-8 h-8 text-white" />
            ) : (
              <X className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isValid ? 'Phiên học hoàn thành!' : 'Phiên học kết thúc sớm'}
          </h1>
          <p className="text-sm text-muted-foreground">{session.taskTitle}</p>
        </div>

        {/* Mascot reaction */}
        {mascot && (
          <div className="flex items-end gap-3 justify-center">
            <SpeechBubble text={speech} direction="right" />
            <MascotSVG
              personaId={mascot.personaId}
              stage={mascot.stage}
              mascotState={isValid ? 'happy' : 'sad'}
              size={100}
              animate
            />
          </div>
        )}

        {/* Reward breakdown */}
        <Card className="rounded-2xl shadow-fm-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Hoàn thành</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">{pct}%</span>
                <Badge variant={isValid ? 'default' : 'secondary'}>
                  {isValid ? 'Hợp lệ' : 'Không đủ'}
                </Badge>
              </div>
            </div>
            <Progress value={pct} className="h-3" />

            <div className="grid grid-cols-3 gap-3">
              <RewardItem
                icon={<Star className="w-5 h-5" />}
                label="EXP"
                value={`+${session.expEarned}`}
                color="hsl(var(--butter))"
                bgColor="hsl(var(--butter) / 0.15)"
              />
              <RewardItem
                icon={<Zap className="w-5 h-5" />}
                label="Coin"
                value={`+${session.coinEarned}`}
                color="hsl(var(--sky))"
                bgColor="hsl(var(--sky-light))"
              />
              <RewardItem
                icon={<Flame className="w-5 h-5" />}
                label="Streak"
                value={isValid ? `${streak.current + 1} ngày` : 'Không tính'}
                color={isValid ? 'hsl(var(--peach))' : 'hsl(var(--muted-foreground))'}
                bgColor={isValid ? 'hsl(var(--peach-soft))' : 'hsl(var(--muted))'}
              />
            </div>

            {/* Explanation */}
            <div className="p-3 rounded-xl text-xs text-muted-foreground" style={{ background: 'hsl(var(--muted))' }}>
              Bạn hoàn thành {pct}% thời lượng → nhận {session.expEarned} EXP, {session.coinEarned} coin.
              {!isValid && ' Cần ≥50% để streak được tính và nhận full reward.'}
            </div>
          </CardContent>
        </Card>

        {/* Mascot progress */}
        {mascot && (
          <Card className="rounded-2xl shadow-fm-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Tiến độ mascot — Cấp {mascot.level}</span>
                <span className="text-muted-foreground">{mascot.exp}/{mascot.expToNextLevel} EXP</span>
              </div>
              <Progress value={expPct} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Level up */}
        {showLevelUp && mascot && (
          <Card className="rounded-2xl shadow-fm-lg border-2 animate-level-up-pop" style={{ borderColor: 'hsl(var(--butter))' }}>
            <CardContent className="p-5 text-center space-y-2">
              <Star className="w-10 h-10 mx-auto" style={{ color: 'hsl(var(--butter))' }} />
              <p className="font-bold text-lg text-foreground">Level Up! Cấp {mascot.level}</p>
              <p className="text-sm text-muted-foreground">{mascot.name} đang lớn lên!</p>
            </CardContent>
          </Card>
        )}

        {/* Certificate unlocked */}
        {certUnlocked && (
          <Card className="rounded-2xl shadow-fm-lg border-2 animate-level-up-pop" style={{ borderColor: 'hsl(var(--accent))' }}>
            <CardContent className="p-5 text-center space-y-2">
              <Trophy className="w-10 h-10 mx-auto" style={{ color: 'hsl(var(--butter))' }} />
              <p className="font-bold text-lg text-foreground">Certificate Mới Mở Khóa!</p>
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--sky))' }}>{certUnlocked.title}</p>
              <p className="text-xs text-muted-foreground">{certUnlocked.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="flex-1 rounded-xl gap-2"
          >
            <Home className="w-4 h-4" /> Dashboard
          </Button>
          <Button
            onClick={() => router.push('/study')}
            className="flex-1 rounded-xl gap-2"
            style={{ background: 'hsl(var(--sky))', color: 'white' }}
          >
            <Timer className="w-4 h-4" /> Phiên mới
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

function RewardItem({ icon, label, value, color, bgColor }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl" style={{ background: bgColor }}>
      <div style={{ color }}>{icon}</div>
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
