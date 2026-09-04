"use client";

import React from 'react';
import { useApp, useMascot, useStreak } from '@/store/AppContext';
import { PERSONAS, CERTIFICATE_MILESTONES, SHOP_ITEMS } from '@/lib/mascotData';
import AppLayout from '@/components/layout/AppLayout';
import MascotSVG from '@/components/mascot/MascotSVG';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Flame, Clock, Star, Zap, Shield, BarChart3, Coffee, HardHat, Sparkles } from 'lucide-react';

export default function ProfilePage() {
  const { state } = useApp();
  const mascot = useMascot();
  const streak = useStreak();
  const user = state.user;

  if (!mascot || !user) return null;

  const persona = PERSONAS[mascot.personaId];
  const totalMinutes = state.sessions.reduce((sum, s) => sum + s.actualMinutes, 0);
  const validSessions = state.sessions.filter((s) => s.isValid).length;
  const totalSessions = state.sessions.length;
  const avgCompletion = totalSessions > 0
    ? state.sessions.reduce((sum, s) => sum + s.completionPct, 0) / totalSessions
    : 0;

  const unlockedCerts = CERTIFICATE_MILESTONES.filter((c) => c.level <= mascot.level);
  const ownedItems = SHOP_ITEMS.filter((item) => state.ownedItems.includes(item.id));

  const expPct = (mascot.exp / mascot.expToNextLevel) * 100;

  return (
    <AppLayout mascotState="idle">
      <div className="space-y-6">
        {/* Profile header */}
        <div
          className="rounded-3xl p-6 flex items-center gap-6"
          style={{ background: 'var(--gradient-sky)' }}
        >
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-bold text-white shadow-fm-md flex-shrink-0"
            style={{ background: persona.colors.primary }}
          >
            {user.name[0].toUpperCase()}
          </div>

          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
            <p className="text-muted-foreground text-sm">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">Cấp {mascot.level}</Badge>
              <Badge variant="secondary">{mascot.stage === 'baby' ? 'Baby' : mascot.stage === 'teen' ? 'Teen' : 'Adult'}</Badge>
              <Badge style={{ background: persona.colors.primary, color: 'white' }}>{persona.name}</Badge>
            </div>
          </div>

          <MascotSVG
            personaId={mascot.personaId}
            stage={mascot.stage}
            mascotState="idle"
            size={100}
            animate
          />
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Stats */}
          <div className="col-span-2 space-y-5">
            {/* Key stats */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard icon={<Clock />} label="Tổng giờ học" value={`${(totalMinutes / 60).toFixed(1)}h`} color="hsl(var(--sky))" bg="hsl(var(--sky-light))" />
              <StatCard icon={<Flame />} label="Streak dài nhất" value={`${streak.longest} ngày`} color="hsl(var(--peach))" bg="hsl(var(--peach-soft))" />
              <StatCard icon={<Star />} label="Tổng phiên học" value={`${totalSessions}`} color="hsl(var(--butter))" bg="hsl(var(--butter) / 0.15)" />
              <StatCard icon={<BarChart3 />} label="% Hoàn thành TB" value={`${Math.round(avgCompletion)}%`} color="hsl(var(--lilac))" bg="hsl(var(--lavender))" />
            </div>

            {/* Mascot progress */}
            <Card className="rounded-2xl shadow-fm-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tiến độ mascot — {mascot.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">Cấp {mascot.level} → {mascot.level + 1}</span>
                    <span className="text-muted-foreground">{mascot.exp}/{mascot.expToNextLevel} EXP</span>
                  </div>
                  <Progress value={expPct} className="h-3" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
                    <Zap className="w-5 h-5 mx-auto mb-1" style={{ color: 'hsl(var(--butter))' }} />
                    <p className="text-base font-bold text-foreground">{mascot.coin}</p>
                    <p className="text-xs text-muted-foreground">Coin</p>
                  </div>
                  <div className="text-center p-3 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
                    <Shield className="w-5 h-5 mx-auto mb-1" style={{ color: 'hsl(var(--sky))' }} />
                    <p className="text-base font-bold text-foreground">{mascot.streakShields}</p>
                    <p className="text-xs text-muted-foreground">Shields</p>
                  </div>
                  <div className="text-center p-3 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
                    <Flame className="w-5 h-5 mx-auto mb-1" style={{ color: 'hsl(var(--peach))' }} />
                    <p className="text-base font-bold text-foreground">{streak.current}</p>
                    <p className="text-xs text-muted-foreground">Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent sessions */}
            {state.sessions.length > 0 && (
              <Card className="rounded-2xl shadow-fm-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Lịch sử học tập</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {state.sessions.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: s.isValid ? 'hsl(var(--sky))' : 'hsl(var(--muted-foreground))' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.taskTitle}</p>
                        <p className="text-xs text-muted-foreground">{s.date} · {s.actualMinutes}ph</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-foreground">+{s.expEarned} EXP</p>
                        <p className="text-xs text-muted-foreground">{Math.round(s.completionPct)}%</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Certificates & items */}
          <div className="space-y-4">
            {/* Certificates */}
            <Card className="rounded-2xl shadow-fm-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4" style={{ color: 'hsl(var(--butter))' }} />
                  Chứng chỉ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {CERTIFICATE_MILESTONES.map((cert) => {
                  const unlocked = cert.level <= mascot.level;
                  return (
                    <div
                      key={cert.level}
                      className="p-3 rounded-xl transition-all"
                      style={{
                        background: unlocked ? `${persona.colors.primary}15` : 'hsl(var(--muted))',
                        opacity: unlocked ? 1 : 0.5,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Trophy
                          className="w-4 h-4 shrink-0"
                          style={{ color: unlocked ? 'hsl(var(--butter))' : 'hsl(var(--muted-foreground))' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {cert.title}
                          </p>
                          <p className="text-xs text-muted-foreground">Cấp {cert.level}</p>
                        </div>
                      </div>
                      {unlocked && (
                        <div className="mt-2 flex gap-1.5">
                          <Badge variant="secondary" className="text-xs">
                            {user.name}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {mascot.name}
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Owned items */}
            {ownedItems.length > 0 && (
              <Card className="rounded-2xl shadow-fm-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Vật phẩm đã có ({ownedItems.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {ownedItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 flex items-center justify-center text-muted-foreground">
                        {item.category === 'snack' ? <Coffee className="w-4 h-4" /> :
                         item.category === 'hat' ? <HardHat className="w-4 h-4" /> :
                         item.category === 'streak-shield' ? <Shield className="w-4 h-4" /> :
                         <Sparkles className="w-4 h-4" />}
                      </span>
                      <span className="text-foreground">{item.name}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ icon, label, value, color, bg }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <Card className="rounded-2xl shadow-fm-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg, color }}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
