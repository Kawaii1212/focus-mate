"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, useMascot } from '@/store/AppContext';
import { PERSONAS, getRandomSpeech, CERTIFICATE_MILESTONES, getMascotStage } from '@/lib/mascotData';
import AppLayout from '@/components/layout/AppLayout';
import MascotSVG from '@/components/mascot/MascotSVG';
import SpeechBubble from '@/components/mascot/SpeechBubble';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MascotState } from '@/types';
import { Star, Flame, Zap, Shield, Heart, Trophy } from 'lucide-react';

const STATES: { value: MascotState; label: string }[] = [
  { value: 'idle', label: 'Bình thường' },
  { value: 'studying', label: 'Học' },
  { value: 'happy', label: 'Vui' },
  { value: 'sad', label: 'Buồn' },
  { value: 'paused', label: 'Nghỉ' },
  { value: 'levelUp', label: 'Lên cấp' },
  { value: 'itemRequest', label: 'Xin đồ' },
];

export default function MascotRoomPage() {
  const router = useRouter();
  const mascot = useMascot();
  const { state } = useApp();
  const [currentState, setCurrentState] = useState<MascotState>('idle');

  useEffect(() => {
    if (!mascot) {
      router.push('/onboarding');
    }
  }, [mascot, router]);

  if (!mascot) return null;

  const persona = PERSONAS[mascot.personaId];
  const expPct = (mascot.exp / mascot.expToNextLevel) * 100;
  const speech = getRandomSpeech(mascot.personaId, currentState);

  const totalStudyMinutes = state.sessions.reduce((sum, s) => sum + s.actualMinutes, 0);
  const unlockedCerts = CERTIFICATE_MILESTONES.filter((c) => c.level <= mascot.level);

  const stageProgresses = [
    { label: 'Baby', range: 'Cấp 1–9', unlocked: true },
    { label: 'Teen', range: 'Cấp 10–29', unlocked: mascot.level >= 10 },
    { label: 'Adult', range: 'Cấp 30+', unlocked: mascot.level >= 30 },
  ];

  return (
    <AppLayout mascotState={currentState}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Phòng Mascot</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Tương tác và xem tiến độ của {mascot.name}</p>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Main mascot display */}
          <div className="col-span-2 space-y-4">
            {/* Stage display */}
            <Card className="rounded-2xl shadow-fm-sm overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="p-8 flex flex-col items-center gap-4"
                  style={{ background: 'var(--gradient-sky)' }}
                >
                  <div className="relative">
                    <div
                      className="absolute inset-0 rounded-full blur-3xl opacity-30"
                      style={{ background: persona.colors.glow }}
                    />
                    <MascotSVG
                      personaId={mascot.personaId}
                      stage={mascot.stage}
                      mascotState={currentState}
                      size={180}
                      animate
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <SpeechBubble text={speech} direction="top" />
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge style={{ background: persona.colors.primary, color: 'white' }}>
                      {mascot.name}
                    </Badge>
                    <Badge variant="secondary">
                      {persona.name}
                    </Badge>
                    <Badge variant="outline">
                      {mascot.stage === 'baby' ? 'Baby' : mascot.stage === 'teen' ? 'Teen' : 'Adult'}
                    </Badge>
                  </div>
                </div>

                {/* State control */}
                <div className="p-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Biểu cảm mascot:</p>
                  <div className="flex flex-wrap gap-2">
                    {STATES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setCurrentState(s.value)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                        style={
                          currentState === s.value
                            ? { background: persona.colors.primary, color: 'white', borderColor: persona.colors.primary }
                            : { borderColor: 'hsl(var(--border))' }
                        }
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Growth stages */}
            <Card className="rounded-2xl shadow-fm-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Các giai đoạn trưởng thành</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {stageProgresses.map((sp, i) => (
                    <div key={i} className="flex-1 text-center space-y-2">
                      <div
                        className="rounded-xl p-3 flex justify-center"
                        style={{
                          background: sp.unlocked ? `${persona.colors.primary}20` : 'hsl(var(--muted))',
                          opacity: sp.unlocked ? 1 : 0.5,
                        }}
                      >
                        <MascotSVG
                          personaId={mascot.personaId}
                          stage={i === 0 ? 'baby' : i === 1 ? 'teen' : 'adult'}
                          mascotState="idle"
                          size={70}
                          animate={false}
                        />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{sp.label}</p>
                      <p className="text-xs text-muted-foreground">{sp.range}</p>
                      {sp.unlocked ? (
                        <Badge variant="secondary" className="text-xs">Đã mở khóa</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Chưa mở</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats column */}
          <div className="space-y-4">
            {/* Level & stats */}
            <Card className="rounded-2xl shadow-fm-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Chỉ số</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium flex items-center gap-1.5">
                      <Star className="w-4 h-4" style={{ color: 'hsl(var(--butter))' }} />
                      Cấp {mascot.level}
                    </span>
                    <span className="text-muted-foreground">{mascot.exp}/{mascot.expToNextLevel}</span>
                  </div>
                  <Progress value={expPct} className="h-2.5" />
                </div>

                <StatRow icon={<Flame className="w-4 h-4" style={{ color: 'hsl(var(--peach))' }} />} label="Streak" value={`${state.streakCurrent} ngày`} />
                <StatRow icon={<Zap className="w-4 h-4" style={{ color: 'hsl(var(--sky))' }} />} label="Coin" value={`${mascot.coin}`} />
                <StatRow icon={<Shield className="w-4 h-4" style={{ color: 'hsl(var(--sky))' }} />} label="Streak Shield" value={`${mascot.streakShields}`} />
                <StatRow icon={<Heart className="w-4 h-4" style={{ color: 'hsl(var(--destructive))' }} />} label="Energy" value={`${mascot.energy}%`} />
                <StatRow icon={<Star className="w-4 h-4" style={{ color: 'hsl(var(--butter))' }} />} label="Tổng giờ học" value={`${(totalStudyMinutes / 60).toFixed(1)}h`} />
              </CardContent>
            </Card>

            {/* Persona info */}
            <Card className="rounded-2xl shadow-fm-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tính cách</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ background: persona.colors.primary }}
                />
                <p className="text-sm font-semibold text-foreground">{persona.name}</p>
                <p className="text-xs text-muted-foreground">{persona.description}</p>
                <div
                  className="p-2.5 rounded-xl text-xs italic text-foreground"
                  style={{ background: 'hsl(var(--muted))' }}
                >
                  "{persona.speeches.idle[0]}"
                </div>
              </CardContent>
            </Card>

            {/* Certificates */}
            <Card className="rounded-2xl shadow-fm-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4" style={{ color: 'hsl(var(--butter))' }} />
                  Certificate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {CERTIFICATE_MILESTONES.map((cert) => {
                  const unlocked = cert.level <= mascot.level;
                  return (
                    <div
                      key={cert.level}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl"
                      style={{ background: unlocked ? `${persona.colors.primary}15` : 'hsl(var(--muted))' }}
                    >
                      <Trophy
                        className="w-4 h-4 shrink-0"
                        style={{ color: unlocked ? 'hsl(var(--butter))' : 'hsl(var(--muted-foreground))' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {cert.title}
                        </p>
                        <p className="text-xs text-muted-foreground">Cấp {cert.level}</p>
                      </div>
                      {!unlocked && (
                        <span className="text-xs text-muted-foreground">🔒</span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
