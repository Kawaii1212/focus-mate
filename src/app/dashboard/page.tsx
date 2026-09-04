"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp, useMascot, useStreak } from '@/store/AppContext';
import { PERSONAS, CERTIFICATE_MILESTONES } from '@/lib/mascotData';
import AppLayout from '@/components/layout/AppLayout';
import { PlannerBlock, StudySession } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Timer, Flame, Star, Zap, Brain, CalendarDays, Clock, Trophy, TrendingUp, AlertCircle, Play
} from 'lucide-react';

export default function DashboardPage() {
  const { state } = useApp();
  const mascot = useMascot();
  const streak = useStreak();
  const router = useRouter();

  const user = state.user;
  const recentSessions = state.sessions.slice(0, 5);
  const hasData = state.sessions.length > 0;
  const todaySessions = state.sessions.filter(
    (s) => s.date === new Date().toISOString().split('T')[0]
  );
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.actualMinutes, 0);
  const totalMinutes = state.sessions.reduce((sum, s) => sum + s.actualMinutes, 0);

  // Upcoming deadlines
  const upcomingDeadlines = state.plannerState.deadlines
    .filter((d) => new Date(d.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  // Next certificate
  const nextCert = mascot
    ? CERTIFICATE_MILESTONES.find((c) => c.level > mascot.level)
    : null;

  const expPct = mascot ? (mascot.exp / mascot.expToNextLevel) * 100 : 0;
  const persona = mascot ? PERSONAS[mascot.personaId] : null;

  return (
    <AppLayout mascotState={streak.atRisk ? 'streakReminder' : 'idle'}>
      <div className="space-y-6">
        {/* Welcome header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Xin chào, {user?.name}!
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {streak.atRisk
                ? '⚠ Streak của bạn sắp mất! Học ngay để giữ chuỗi.'
                : hasData
                ? `Hôm nay bạn đã học ${todayMinutes} phút. Tiếp tục nào!`
                : 'Chào mừng! Hãy bắt đầu phiên học đầu tiên của bạn.'}
            </p>
          </div>
          <Button
            onClick={() => router.push('/study')}
            className="rounded-xl font-semibold shadow-fm-sm"
            style={{ background: 'hsl(var(--sky))', color: 'white' }}
          >
            <Play className="w-4 h-4 mr-2" /> Bắt đầu học
          </Button>
        </div>

        {/* Streak at risk banner */}
        {streak.atRisk && (
          <div
            className="flex items-center gap-3 p-4 rounded-2xl border animate-fade-in"
            style={{ background: 'hsl(var(--destructive) / 0.08)', borderColor: 'hsl(var(--destructive) / 0.3)' }}
          >
            <AlertCircle className="w-5 h-5 shrink-0" style={{ color: 'hsl(var(--destructive))' }} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--destructive))' }}>
                Streak {streak.current} ngày sắp mất!
              </p>
              <p className="text-xs text-muted-foreground">Học ít nhất 50% phiên hôm nay để giữ streak.</p>
            </div>
            <Button
              size="sm"
              onClick={() => router.push('/study')}
              className="rounded-xl shrink-0"
              style={{ background: 'hsl(var(--destructive))', color: 'white' }}
            >
              Học ngay
            </Button>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            icon={<Flame className="w-5 h-5" />}
            label="Streak"
            value={`${streak.current} ngày`}
            color="hsl(var(--peach))"
            bgColor="hsl(var(--peach-soft))"
          />
          <StatCard
            icon={<Star className="w-5 h-5" />}
            label="Cấp độ"
            value={`Cấp ${mascot?.level ?? 1}`}
            color="hsl(var(--butter))"
            bgColor="hsl(var(--butter) / 0.15)"
          />
          <StatCard
            icon={<Zap className="w-5 h-5" />}
            label="Coin"
            value={`${mascot?.coin ?? 0}`}
            color="hsl(var(--sky))"
            bgColor="hsl(var(--sky-light))"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Tổng giờ học"
            value={`${(totalMinutes / 60).toFixed(1)}h`}
            color="hsl(var(--lilac))"
            bgColor="hsl(var(--lavender))"
          />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-3 gap-5">
          {/* Left: Tasks + Recent Sessions */}
          <div className="col-span-2 space-y-5">
            {/* Today's sessions */}
            <Card className="rounded-2xl shadow-fm-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Timer className="w-4 h-4" style={{ color: 'hsl(var(--sky))' }} />
                    Phiên học hôm nay
                  </CardTitle>
                  <Badge variant="secondary">
                    {todaySessions.length} phiên · {todayMinutes}ph
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {todaySessions.length === 0 ? (
                  <EmptyState
                    text="Chưa có phiên học nào hôm nay!"
                    sub="Bắt đầu phiên đầu tiên để mascot vui nhé."
                    action={{ label: 'Bắt đầu ngay', onClick: () => router.push('/study') }}
                  />
                ) : (
                  <div className="space-y-2">
                    {todaySessions.map((s) => (
                      <SessionRow key={s.id} session={s} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Planner preview */}
            <Card className="rounded-2xl shadow-fm-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="w-4 h-4" style={{ color: 'hsl(var(--lilac))' }} />
                    Tổng quan tuần (AI Planner)
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/planner')}
                    className="text-xs rounded-lg"
                  >
                    Xem đầy đủ
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {state.plannerState.generatedPlan.length === 0 ? (
                  <EmptyState
                    text="Chưa có kế hoạch tuần nào"
                    sub="AI Planner sẽ giúp bạn xếp lịch học tự động."
                    action={{ label: 'Tạo kế hoạch', onClick: () => router.push('/planner') }}
                  />
                ) : (
                  <WeekPlannerMini blocks={state.plannerState.generatedPlan.slice(0, 3)} onNavigate={() => router.push('/planner')} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Mascot progress */}
            {mascot && persona && (
              <Card className="rounded-2xl shadow-fm-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" style={{ color: 'hsl(var(--sky))' }} />
                    Tiến độ mascot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: persona.colors.primary }}
                    />
                    <span className="text-sm font-medium">{mascot.name}</span>
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {mascot.stage === 'baby' ? 'Baby' : mascot.stage === 'teen' ? 'Teen' : 'Adult'}
                    </Badge>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>EXP</span>
                      <span>{mascot.exp}/{mascot.expToNextLevel}</span>
                    </div>
                    <Progress value={expPct} className="h-2" />
                  </div>
                  {nextCert && (
                    <div
                      className="p-3 rounded-xl text-xs"
                      style={{ background: 'hsl(var(--muted))' }}
                    >
                      <p className="font-medium text-foreground">Tiếp theo: {nextCert.title}</p>
                      <p className="text-muted-foreground">Đạt cấp {nextCert.level}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Upcoming deadlines */}
            <Card className="rounded-2xl shadow-fm-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" style={{ color: 'hsl(var(--peach))' }} />
                    Deadline sắp tới
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => router.push('/planner')} className="text-xs rounded-lg">
                    Xem hết
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingDeadlines.length === 0 ? (
                  <EmptyState
                    text="Chưa có deadline nào"
                    sub="Thêm deadline vào AI Planner để quản lý tốt hơn."
                  />
                ) : (
                  <div className="space-y-2.5">
                    {upcomingDeadlines.map((d) => {
                      const daysLeft = Math.ceil(
                        (new Date(d.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <div key={d.id} className="flex items-center gap-2.5">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              background: daysLeft <= 2 ? 'hsl(var(--destructive))' : daysLeft <= 5 ? 'hsl(var(--peach))' : 'hsl(var(--sky))',
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{d.taskName}</p>
                            <p className="text-xs text-muted-foreground">Còn {daysLeft} ngày</p>
                          </div>
                          <Badge
                            className="text-xs shrink-0"
                            variant={daysLeft <= 2 ? 'destructive' : 'secondary'}
                          >
                            {d.type}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card className="rounded-2xl shadow-fm-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Hành động nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full rounded-xl justify-start gap-2 text-sm"
                  onClick={() => router.push('/study')}
                >
                  <Timer className="w-4 h-4" style={{ color: 'hsl(var(--sky))' }} />
                  Bắt đầu Pomodoro
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-xl justify-start gap-2 text-sm"
                  onClick={() => router.push('/planner')}
                >
                  <Brain className="w-4 h-4" style={{ color: 'hsl(var(--lilac))' }} />
                  AI Planner
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-xl justify-start gap-2 text-sm"
                  onClick={() => router.push('/costudy')}
                >
                  <Flame className="w-4 h-4" style={{ color: 'hsl(var(--peach))' }} />
                  Co-study Room
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-xl justify-start gap-2 text-sm"
                  onClick={() => router.push('/shop')}
                >
                  <Trophy className="w-4 h-4" style={{ color: 'hsl(var(--butter))' }} />
                  Cửa hàng
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent sessions */}
        {recentSessions.length > 0 && (
          <Card className="rounded-2xl shadow-fm-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Phiên học gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentSessions.map((s) => (
                  <SessionRow key={s.id} session={s} showDate />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({ icon, label, value, color, bgColor }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="rounded-2xl shadow-fm-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: bgColor, color }}
          >
            {icon}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold text-foreground">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionRow({ session, showDate }: { session: StudySession; showDate?: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: session.isValid ? 'hsl(var(--sky))' : 'hsl(var(--muted-foreground))' }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{session.taskTitle}</p>
        <p className="text-xs text-muted-foreground">
          {session.actualMinutes}ph · {Math.round(session.completionPct)}% hoàn thành
          {showDate && ` · ${session.date}`}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-medium text-foreground">+{session.expEarned} EXP</p>
        <p className="text-xs text-muted-foreground">+{session.coinEarned} coin</p>
      </div>
      {!session.isValid && (
        <Badge variant="secondary" className="text-xs">Chưa đủ</Badge>
      )}
    </div>
  );
}

function EmptyState({ text, sub, action }: { text: string; sub: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="text-center py-6 space-y-2">
      <p className="text-sm font-medium text-foreground">{text}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
      {action && (
        <Button
          size="sm"
          onClick={action.onClick}
          className="rounded-xl mt-2"
          style={{ background: 'hsl(var(--sky))', color: 'white' }}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

function WeekPlannerMini({ blocks, onNavigate }: { blocks: PlannerBlock[]; onNavigate: () => void }) {
  return (
    <div className="space-y-2">
      {blocks.map((b) => (
        <div key={b.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/40">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              background: b.status === 'completed' ? 'hsl(var(--sky))' : b.urgencyScore > 5 ? 'hsl(var(--destructive))' : 'hsl(var(--peach))',
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{b.taskName}</p>
            <p className="text-xs text-muted-foreground">{b.date} · {b.startTime}</p>
          </div>
          <Badge variant={b.status === 'completed' ? 'secondary' : 'outline'} className="text-xs">
            {b.status === 'completed' ? 'Xong' : `${b.durationMinutes}ph`}
          </Badge>
        </div>
      ))}
      <Button variant="ghost" size="sm" className="w-full text-xs rounded-xl" onClick={onNavigate}>
        Xem tất cả trong AI Planner
      </Button>
    </div>
  );
}
