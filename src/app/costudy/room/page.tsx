"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useMascot, useApp } from '@/store/AppContext';
import { PERSONAS } from '@/lib/mascotData';
import { CoStudyMember, MascotPersonaId } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import MascotSVG from '@/components/mascot/MascotSVG';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, Hand, AlertTriangle, Trophy, Play, Pause, RotateCcw, LogOut } from 'lucide-react';

const GROUP_MILESTONES = [5 * 60, 10 * 60, 25 * 60, 50 * 60, 100 * 60]; // minutes
const GROUP_MILESTONE_LABELS = ['5h', '10h', '25h', '50h', '100h'];

export default function CoStudyRoomPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const stateStr = searchParams?.get('state');
  const roomInfo = React.useMemo(() => {
    try {
      return JSON.parse(stateStr || 'null') as { id: string; name: string; isHost?: boolean; checkInInterval?: number } | null;
    } catch {
      return null;
    }
  }, [stateStr]);
  const mascot = useMascot();
  const { state } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const checkInMinutes = roomInfo?.checkInInterval ?? 30;
  const checkInSeconds = checkInMinutes * 60;

  const [countdown, setCountdown] = useState(checkInSeconds);
  const [isStudying, setIsStudying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showCheckInAlert, setShowCheckInAlert] = useState(false);
  const [missedCheckIns, setMissedCheckIns] = useState<string[]>([]);
  const [sharedMinutes, setSharedMinutes] = useState(0); 
  const [members, setMembers] = useState<Record<string, CoStudyMember>>({});
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [pomodoroState, setPomodoroState] = useState({ timeLeft: 25 * 60, isActive: false, mode: 'focus' });

  // Personal check-in countdown
  useEffect(() => {
    if (mounted && (!mascot || !state.user)) {
      router.push('/onboarding');
    }
  }, [mascot, state.user, router]);

  // Polling Connection & Create/Join
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    if (!roomInfo || !state.user || !mascot) return;

    const performAction = async (actionStr: string, extraData = {}) => {
      try {
        const res = await fetch('/api/costudy/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: actionStr,
            roomId: roomInfo.id,
            userId: state.user?.id,
            name: state.user?.name,
            mascotPersonaId: mascot.personaId,
            ...extraData
          })
        });
        if (res.ok) {
          const roomData = await res.json();
          setMembers(roomData.members || {});
          setPomodoroState(roomData.pomodoro);
        }
      } catch (err) {
        console.error("Action error:", err);
      }
    };

    let interval: ReturnType<typeof setInterval>;
    let isMounted = true;
    
    const initRoom = async () => {
      // If host, we might need to create the room first if it doesn't exist
      if (roomInfo.isHost) {
        await fetch('/api/costudy/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: roomInfo.id,
            name: roomInfo.name || "Co-Study Room",
            hostId: state.user?.id,
            maxMembers: roomInfo.maxMembers || 4,
            checkInIntervalMinutes: roomInfo.checkInInterval || 30
          })
        });
      }
      
      // Join room
      await performAction('join');
      
      // Start polling
      if (isMounted) {
        interval = setInterval(() => performAction('poll'), 3000);
      }
    };

    initRoom();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [roomInfo, state.user, mascot]);

  // Handle browser close/navigate away
  useEffect(() => {
    if (!roomInfo || !state.user) return;
    const handleUnload = () => {
      const payload = JSON.stringify({ action: 'leave', roomId: roomInfo.id, userId: state.user?.id });
      navigator.sendBeacon('/api/costudy/action', payload);
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [roomInfo, state.user]);

  // Pomodoro Sync Effect
  useEffect(() => {
    if (!roomInfo?.id || !state.user) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    
    const syncPomodoro = (nextState: any) => {
      if (!roomInfo.isHost) return;
      fetch('/api/costudy/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', roomId: roomInfo.id, userId: state.user?.id, pomodoro: nextState })
      }).catch(console.error);
    };

    if (pomodoroState.isActive && pomodoroState.timeLeft > 0) {
      interval = setInterval(() => {
        setPomodoroState(prev => {
          const next = { ...prev, timeLeft: prev.timeLeft - 1 };
          if (roomInfo.isHost && next.timeLeft % 5 === 0) { // sync every 5s
             syncPomodoro(next);
          }
          return next;
        });
      }, 1000);
    } else if (pomodoroState.isActive && pomodoroState.timeLeft === 0) {
       // auto switch
       if (roomInfo.isHost) {
         const nextMode = pomodoroState.mode === 'focus' ? 'break' : 'focus';
         const nextTime = nextMode === 'focus' ? 25 * 60 : 5 * 60;
         const nextState = { timeLeft: nextTime, mode: nextMode, isActive: false };
         setPomodoroState(nextState);
         syncPomodoro(nextState);
       } else {
         setPomodoroState(prev => ({ ...prev, isActive: false }));
       }
    }
    return () => clearInterval(interval);
  }, [pomodoroState.isActive, pomodoroState.timeLeft, roomInfo, state.user]);

  // Personal check-in countdown
  useEffect(() => {
    if (!isStudying || isPaused) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          setShowCheckInAlert(true);
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Đã đến giờ check-in!", {
              body: "Bạn vẫn đang học chứ? Hãy vào xác nhận nhé!",
              icon: "/favicon.ico"
            });
          }
          return 0;
        }
        if (prev === 0) return 0;
        return prev - 1;
      });
      setSessionMinutes((prev) => prev + 1/60);
    }, 1000);
    return () => clearInterval(interval);
  }, [isStudying, isPaused]);

  const sendAction = async (action: string, extra = {}) => {
    if (!roomInfo || !state.user) return;
    await fetch('/api/costudy/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, roomId: roomInfo.id, userId: state.user.id, ...extra })
    });
  };

  const handleCheckIn = async () => {
    setShowCheckInAlert(false);
    setCountdown(checkInSeconds);
    await sendAction('status', { status: 'focusing' });
  };

  const handlePause = async () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    setIsStudying(!nextPaused);
    await sendAction('status', { status: nextPaused ? 'break' : 'focusing' });
  };

  const handleLeave = async () => {
    if (roomInfo && state.user) {
      await fetch('/api/costudy/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leave', roomId: roomInfo.id, userId: state.user.id })
      });
    }
    router.push('/costudy');
  };

  const pomodoroAction = async (action: 'toggle' | 'reset' | 'focus' | 'break') => {
    if (!roomInfo?.isHost || !roomInfo?.id) return;
    const nextState = { ...pomodoroState };
    if (action === 'toggle') {
      nextState.isActive = !nextState.isActive;
    } else if (action === 'reset') {
      nextState.isActive = false;
      nextState.timeLeft = nextState.mode === 'focus' ? 25 * 60 : 5 * 60;
    } else if (action === 'focus') {
      nextState.mode = 'focus';
      nextState.timeLeft = 25 * 60;
      nextState.isActive = false;
    } else if (action === 'break') {
      nextState.mode = 'break';
      nextState.timeLeft = 5 * 60;
      nextState.isActive = false;
    }
    setPomodoroState(nextState);
    if (roomInfo && state.user) {
      fetch('/api/costudy/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', roomId: roomInfo.id, userId: state.user.id, pomodoro: nextState })
      }).catch(console.error);
    }
  };

  const countdownPct = (countdown / checkInSeconds) * 100;
  const membersList = Object.values(members);
  const focusingCount = membersList.filter(m => m.status === 'focusing').length;
  const totalSharedMin = sharedMinutes + Math.round(sessionMinutes) * focusingCount;
  
  const nextMilestoneIdx = GROUP_MILESTONES.findIndex((m) => totalSharedMin < m);
  const nextMilestone = nextMilestoneIdx >= 0 ? GROUP_MILESTONES[nextMilestoneIdx] : null;
  const milestonePct = nextMilestone ? (totalSharedMin / nextMilestone) * 100 : 100;

  if (!mounted || !mascot || !state.user) return null;

  return (
    <AppLayout hideMascotPanel>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground">{roomInfo?.name ?? 'Co-Study Room'}</h1>
              <Badge variant="outline" className="text-xs bg-muted/50 font-mono">
                Mã phòng: {roomInfo?.id}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {membersList.length} thành viên · Check-in mỗi {checkInMinutes} phút
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleLeave}
              className="rounded-xl gap-2 text-sm"
              style={{ borderColor: 'hsl(var(--destructive) / 0.4)', color: 'hsl(var(--destructive))' }}
            >
              <LogOut className="w-4 h-4" /> Rời phòng
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Left: Check-in & members */}
          <div className="col-span-2 space-y-4">
            <Card className="rounded-2xl shadow-fm-sm">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Check-in tiếp theo</p>
                    <p className="text-xs text-muted-foreground">
                      {isPaused ? 'Đang tạm dừng' : `Còn ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handlePause} className="rounded-xl">
                      {isPaused ? 'Tiếp tục' : 'Tạm dừng'}
                    </Button>
                    <Button size="sm" onClick={handleCheckIn} className="rounded-xl gap-1.5" style={{ background: 'hsl(var(--sky))', color: 'white' }}>
                      <Hand className="w-3.5 h-3.5" /> Mình đây!
                    </Button>
                  </div>
                </div>
                <Progress value={countdownPct} className="h-2.5" />
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-fm-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" /> Thành viên
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {membersList.map((m) => (
                    <MemberCard
                      key={m.id}
                      name={m.name}
                      personaId={m.mascotPersonaId}
                      status={m.status}
                      isMe={m.id === state.user!.id}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Group progress */}
          <div className="space-y-4">
            <CoStudyPomodoro 
              state={pomodoroState} 
              isHost={roomInfo?.isHost ?? false} 
              onAction={pomodoroAction} 
            />
            
            <Card className="rounded-2xl shadow-fm-sm">
              <CardContent className="p-4 space-y-2 mt-4">
                <p className="text-xs font-medium text-foreground">Phiên này</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{Math.round(sessionMinutes)} phút</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {focusingCount} đang tập trung
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Check-in modal */}
        {showCheckInAlert && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="rounded-3xl shadow-fm-lg w-full max-w-sm mx-4">
              <CardContent className="p-8 text-center space-y-5">
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: 'hsl(var(--sky-light))' }}>
                  <Hand className="w-8 h-8" style={{ color: 'hsl(var(--sky))' }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Still awake?</h3>
                  <p className="text-muted-foreground text-sm mt-1">Đã đến giờ check-in! Bạn vẫn đang học chứ?</p>
                </div>
                <Button onClick={handleCheckIn} className="w-full h-12 rounded-2xl font-bold" style={{ background: 'hsl(var(--sky))', color: 'white' }}>
                  <Hand className="w-5 h-5 mr-2" /> Mình đây!
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function MemberCard({ name, personaId, status, isMe }: { name: string; personaId: MascotPersonaId; status: string; isMe?: boolean; }) {
  const persona = PERSONAS[personaId];
  if (!persona) return null;
  const statusConfig: Record<string, { label: string; color: string }> = {
    focusing: { label: 'Đang học', color: 'hsl(var(--sky))' },
    break: { label: 'Nghỉ', color: 'hsl(var(--peach))' },
    inactive: { label: 'Không hoạt động', color: 'hsl(var(--muted-foreground))' },
  };
  const sc = statusConfig[status] ?? statusConfig.inactive;

  return (
    <div
      className="p-3 rounded-2xl flex items-center gap-3"
      style={{
        background: isMe ? `${persona.colors.primary}15` : 'hsl(var(--muted) / 0.5)',
        border: isMe ? `2px solid ${persona.colors.primary}40` : '2px solid transparent',
      }}
    >
      <MascotSVG personaId={personaId} stage="baby" mascotState={status === 'focusing' ? 'studying' : status === 'break' ? 'paused' : 'idle'} size={44} animate={false} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {name} {isMe && <span className="text-xs">(bạn)</span>}
        </p>
        <p className="text-xs" style={{ color: sc.color }}>{sc.label}</p>
      </div>
    </div>
  );
}

function CoStudyPomodoro({ state, isHost, onAction }: { state: { timeLeft: number; isActive: boolean; mode: string }, isHost: boolean, onAction: (action: 'toggle' | 'reset' | 'focus' | 'break') => void }) {
  const totalTime = state.mode === 'focus' ? 25 * 60 : 5 * 60;
  const pct = ((totalTime - state.timeLeft) / totalTime) * 100;
  
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference - (pct / 100) * circumference;
  const color = state.mode === 'focus' ? 'hsl(var(--sky))' : 'hsl(var(--peach))';

  return (
    <Card className="rounded-2xl shadow-fm-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex justify-center gap-2">
          Đồng hồ Pomodoro {isHost ? '(Host)' : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          <Button 
            variant={state.mode === 'focus' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => onAction('focus')}
            disabled={!isHost}
            className="rounded-lg text-xs font-semibold"
            style={state.mode === 'focus' ? { background: 'hsl(var(--sky))', color: 'white' } : {}}
          >
            Tập trung
          </Button>
          <Button 
            variant={state.mode === 'break' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => onAction('break')}
            disabled={!isHost}
            className="rounded-lg text-xs font-semibold"
            style={state.mode === 'break' ? { background: 'hsl(var(--peach))', color: 'white' } : {}}
          >
            Giải lao
          </Button>
        </div>
        
        <div className="relative flex items-center justify-center py-2">
          <div
            className={`absolute rounded-full ${state.isActive ? 'animate-pulse-ring' : ''}`}
            style={{ width: 170, height: 170, border: `2px solid ${color}`, opacity: 0.3 }}
          />
          <svg width={170} height={170} className="-rotate-90">
            <circle cx={85} cy={85} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={8} />
            <circle
              cx={85} cy={85} r={radius} fill="none" stroke={color} strokeWidth={8}
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDash}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute text-center">
            <p className="text-3xl font-bold text-foreground font-mono" style={{ color }}>
              {String(Math.floor(state.timeLeft / 60)).padStart(2, '0')}:{String(state.timeLeft % 60).padStart(2, '0')}
            </p>
          </div>
        </div>
        
        {isHost && (
          <div className="flex gap-3">
            <Button size="icon" onClick={() => onAction('toggle')} className="rounded-full w-12 h-12 shadow-sm" style={{ background: color, color: 'white' }}>
              {state.isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
            </Button>
            <Button size="icon" variant="outline" onClick={() => onAction('reset')} className="rounded-full w-12 h-12 shadow-sm">
              <RotateCcw className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
