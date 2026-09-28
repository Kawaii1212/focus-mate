'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp, useMascot } from '@/store/AppContext';
import { costudyApi, CostudyApiError, CoStudyRoomData } from '@/lib/costudy';
import { useCoStudyRoom } from '@/hooks/useCoStudyRoom';
import { useGroupCall } from '@/hooks/useGroupCall';
import AppLayout from '@/components/layout/AppLayout';
import RoomHeader from '@/components/costudy/RoomHeader';
import CheckInCard from '@/components/costudy/CheckInCard';
import ParticipantsPanel from '@/components/costudy/ParticipantsPanel';
import CoStudyPomodoro from '@/components/costudy/CoStudyPomodoro';
import ChatPanel from '@/components/costudy/ChatPanel';
import VideoCallPanel from '@/components/costudy/VideoCallPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Hand, Users } from 'lucide-react';
import { PomodoroState } from '@/types';

const DEFAULT_POMODORO: PomodoroState = { timeLeft: 25 * 60, isActive: false, mode: 'focus' };
const RESYNC_INTERVAL_MS = 30000;

export default function CoStudyRoomPage() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const roomId = params?.roomId ?? '';
  const { state } = useApp();
  const user = state.user;
  const mascot = useMascot();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [roomData, setRoomData] = useState<CoStudyRoomData | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'notfound' | 'full' | 'ready'>('loading');

  // Personal study state
  const [countdown, setCountdown] = useState(30 * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [showCheckInAlert, setShowCheckInAlert] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(0);

  const isHost = Boolean(roomData && user && roomData.hostId === user.id);
  const checkInMinutes = roomData?.checkInIntervalMinutes ?? 30;

  // Auth guard (client-side session lives in localStorage)
  useEffect(() => {
    if (mounted && (!user || !mascot)) {
      router.push('/onboarding');
    }
  }, [mounted, user, mascot, router]);

  // Load room from DB
  useEffect(() => {
    if (!mounted || !roomId || !user) return;
    let cancelled = false;
    setLoadState('loading');
    costudyApi
      .getRoom(roomId)
      .then((room) => {
        if (cancelled) return;
        setRoomData(room);
        setCountdown(room.checkInIntervalMinutes * 60);
        setLoadState('ready');
      })
      .catch(() => {
        if (!cancelled) setLoadState('notfound');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, roomId, user?.id]);

  // Register membership in the room roster
  useEffect(() => {
    if (loadState !== 'ready' || !roomId || !user || !mascot) return;
    let cancelled = false;
    costudyApi
      .performAction('join', roomId, user.id, {
        name: user.name,
        mascotPersonaId: mascot.personaId,
      })
      .then((fresh) => {
        if (cancelled) return;
        setRoomData(fresh);
      })
      .catch((error) => {
        if (cancelled) return;
        const status = error instanceof CostudyApiError ? error.status : undefined;
        if (status === 409) setLoadState('full');
        else if (status === 404) setLoadState('notfound');
        // Transient failures: keep the room open (roster is best-effort).
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadState, roomId, user?.id, mascot?.personaId]);

  // Realtime channel: presence, pomodoro broadcasts, chat/call signaling
  const { store, snapshot } = useCoStudyRoom({
    roomId,
    userId: user?.id ?? '',
    name: user?.name ?? '',
    mascotPersonaId: mascot?.personaId ?? 0,
    enabled: loadState === 'ready' && Boolean(user && mascot && roomId),
    initialPomodoro: roomData?.pomodoro ?? DEFAULT_POMODORO,
  });

  const call = useGroupCall({ store, snapshot, user });

  // Ask for notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Persist leave to DB when the tab closes/navigates away
  useEffect(() => {
    if (loadState !== 'ready' || !roomId || !user) return;
    const handleUnload = () => {
      navigator.sendBeacon(
        '/api/costudy/action',
        JSON.stringify({ action: 'leave', roomId, userId: user.id })
      );
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [loadState, roomId, user]);

  // 30s resync backstop: roster + pomodoro (in case a broadcast was missed)
  useEffect(() => {
    if (loadState !== 'ready' || !roomId || !user) return;
    const interval = setInterval(() => {
      costudyApi
        .performAction('poll', roomId, user.id)
        .then((fresh) => {
          setRoomData(fresh);
          if (!store) return;
          if (isHost) {
            // Self-healing: if an earlier `sync` write failed, the DB drifted
            // from the host's local truth — push it again. Comparison ignores
            // `endsAt` (server re-derives it with per-request latency).
            const local = store.getSnapshot().pomodoro;
            const db = fresh.pomodoro;
            const inSync =
              local &&
              local.isActive === db.isActive &&
              local.mode === db.mode &&
              local.timeLeft === db.timeLeft;
            if (local && !inSync) {
              costudyApi.performAction('sync', roomId, user.id, { pomodoro: local }).catch(() => {});
            }
          } else {
            // Members follow the host's DB-synced pomodoro; the host's local
            // ticking is the live source of truth and must not be rewound.
            store.applyPomodoro(fresh.pomodoro);
          }
        })
        .catch(() => {});
    }, RESYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadState, roomId, user, store, isHost]);

  // Personal check-in countdown (1s tick)
  useEffect(() => {
    if (loadState !== 'ready' || isPaused) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      setSessionMinutes((prev) => prev + 1 / 60);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, loadState]);

  // Check-in deadline reached → alert + mark self away
  useEffect(() => {
    if (loadState !== 'ready' || isPaused || countdown !== 0) return;
    setShowCheckInAlert(true);
    store?.updateMyPresence({ status: 'away' });
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Đã đến giờ check-in!', {
        body: 'Bạn vẫn đang học chứ? Hãy vào xác nhận nhé!',
        icon: '/favicon.ico',
      });
    }
  }, [countdown, isPaused, loadState, store]);

  // Shared pomodoro: wall-clock countdown derived from `endsAt`, so the
  // display survives broadcast hiccups without tick drift.
  const pomodoro = snapshot.pomodoro ?? DEFAULT_POMODORO;
  const [pomodoroNow, setPomodoroNow] = useState(() => Date.now());

  useEffect(() => {
    if (!pomodoro.isActive) return;
    const tick = () => setPomodoroNow(Date.now());
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [pomodoro.isActive]);

  const displayTimeLeft = React.useMemo(() => {
    if (pomodoro.isActive && typeof pomodoro.endsAt === 'number' && pomodoro.endsAt > 0) {
      return Math.max(0, Math.ceil((pomodoro.endsAt - pomodoroNow) / 1000));
    }
    return pomodoro.timeLeft;
  }, [pomodoro, pomodoroNow]);

  // Host: auto-switch focus <-> break when the running pomodoro hits zero
  useEffect(() => {
    if (!store || !isHost || loadState !== 'ready' || !roomId || !user) return;
    if (!pomodoro.isActive || displayTimeLeft > 0) return;
    const nextMode = pomodoro.mode === 'focus' ? 'break' : 'focus';
    const next: PomodoroState = {
      timeLeft: nextMode === 'focus' ? 25 * 60 : 5 * 60,
      mode: nextMode,
      isActive: false,
      endsAt: null,
    };
    store.setPomodoro(next);
    costudyApi.performAction('sync', roomId, user.id, { pomodoro: next }).catch(() => {});
  }, [displayTimeLeft, pomodoro.isActive, pomodoro.mode, store, isHost, loadState, roomId, user]);

  const pomodoroAction = (action: 'toggle' | 'reset' | 'focus' | 'break') => {
    if (!store || !isHost || !roomId || !user) return;
    const current = snapshot.pomodoro ?? DEFAULT_POMODORO;
    let next: PomodoroState;
    if (action === 'toggle') {
      if (current.isActive) {
        next = { ...current, timeLeft: displayTimeLeft, isActive: false, endsAt: null };
      } else {
        const left =
          current.timeLeft > 0 ? current.timeLeft : current.mode === 'focus' ? 25 * 60 : 5 * 60;
        next = { ...current, timeLeft: left, isActive: true, endsAt: Date.now() + left * 1000 };
      }
    } else if (action === 'reset') {
      next = {
        mode: current.mode,
        timeLeft: current.mode === 'focus' ? 25 * 60 : 5 * 60,
        isActive: false,
        endsAt: null,
      };
    } else if (action === 'focus') {
      next = { mode: 'focus', timeLeft: 25 * 60, isActive: false, endsAt: null };
    } else {
      next = { mode: 'break', timeLeft: 5 * 60, isActive: false, endsAt: null };
    }
    store.setPomodoro(next);
    setPomodoroNow(Date.now());
    costudyApi.performAction('sync', roomId, user.id, { pomodoro: next }).catch(() => {});
  };

  // ---------------------------------------------------------------- actions

  const handleCheckIn = () => {
    setShowCheckInAlert(false);
    setCountdown(checkInMinutes * 60);
    store?.updateMyPresence({ status: 'studying' });
    if (roomId && user) {
      costudyApi.performAction('status', roomId, user.id, { status: 'focusing' }).catch(() => {});
    }
  };

  const handleTogglePause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    store?.updateMyPresence({ status: nextPaused ? 'online' : 'studying' });
    if (roomId && user) {
      costudyApi
        .performAction('status', roomId, user.id, { status: nextPaused ? 'break' : 'focusing' })
        .catch(() => {});
    }
  };

  const handleLeaveRoom = async () => {
    call.leaveCall();
    if (roomId && user) {
      try {
        await costudyApi.performAction('leave', roomId, user.id);
      } catch {
        // best-effort — presence clears itself when the socket drops
      }
    }
    router.push('/costudy');
  };

  // ---------------------------------------------------------------- render

  if (!mounted) return null;

  if (loadState === 'loading') {
    return (
      <AppLayout hideMascotPanel>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground text-sm animate-pulse">Đang tải phòng...</p>
        </div>
      </AppLayout>
    );
  }

  if (loadState === 'notfound') {
    return (
      <AppLayout hideMascotPanel>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="rounded-3xl shadow-fm-lg w-full max-w-sm mx-4">
            <CardContent className="p-8 text-center space-y-4">
              <h3 className="text-xl font-bold text-foreground">Phòng không tồn tại</h3>
              <p className="text-muted-foreground text-sm">
                Phòng đã giải tán hoặc mã phòng không đúng.
              </p>
              <Button
                onClick={() => router.push('/costudy')}
                className="w-full h-11 rounded-2xl font-bold"
                style={{ background: 'hsl(var(--sky))', color: 'white' }}
              >
                Về sảnh Co-Study
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (loadState === 'full') {
    return (
      <AppLayout hideMascotPanel>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="rounded-3xl shadow-fm-lg w-full max-w-sm mx-4">
            <CardContent className="p-8 text-center space-y-4">
              <h3 className="text-xl font-bold text-foreground">Phòng đã đầy</h3>
              <p className="text-muted-foreground text-sm">
                Phòng đã đủ số thành viên. Hãy thử lại sau hoặc vào phòng khác nhé!
              </p>
              <Button
                onClick={() => router.push('/costudy')}
                className="w-full h-11 rounded-2xl font-bold"
                style={{ background: 'hsl(var(--sky))', color: 'white' }}
              >
                Về sảnh Co-Study
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!user || !mascot) return null;

  const presenceList = Object.values(snapshot.presence);
  const onlineCount = presenceList.length;
  const inCallCount = presenceList.filter((p) => p.joinedVideoCall).length;
  const focusingCount = presenceList.filter((p) => p.status === 'studying').length;

  return (
    <AppLayout hideMascotPanel>
      <div className="space-y-5">
        <RoomHeader
          roomName={roomData?.name ?? 'Co-Study Room'}
          roomId={roomId}
          onlineCount={onlineCount}
          checkInIntervalMinutes={checkInMinutes}
          inCallCount={inCallCount}
          onLeaveRoom={handleLeaveRoom}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: check-in + participants */}
          <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
            <CheckInCard
              countdown={countdown}
              checkInMinutes={checkInMinutes}
              isPaused={isPaused}
              onCheckIn={handleCheckIn}
              onTogglePause={handleTogglePause}
            />
            <ParticipantsPanel
              presence={snapshot.presence}
              roster={roomData?.members ?? {}}
              currentUserId={user.id}
            />
          </div>

          {/* Middle: group call + shared pomodoro + session stats */}
          <div className="lg:col-span-5 space-y-4 order-1 lg:order-2">
            <VideoCallPanel call={call} presence={snapshot.presence} currentUserId={user.id} />
            <CoStudyPomodoro
              state={{ timeLeft: displayTimeLeft, isActive: pomodoro.isActive, mode: pomodoro.mode }}
              isHost={isHost}
              onAction={pomodoroAction}
            />
            <Card className="rounded-2xl shadow-fm-sm">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-medium text-foreground">Phiên này</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{Math.round(sessionMinutes)} phút</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{focusingCount} đang tập trung</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: shared chat */}
          <div className="lg:col-span-4 order-3">
            <ChatPanel
              store={store}
              roomId={roomId}
              user={user}
              mascotPersonaId={mascot.personaId}
            />
          </div>
        </div>

        {/* Check-in modal */}
        {showCheckInAlert && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="rounded-3xl shadow-fm-lg w-full max-w-sm mx-4">
              <CardContent className="p-8 text-center space-y-5">
                <div
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                  style={{ background: 'hsl(var(--sky-light))' }}
                >
                  <Hand className="w-8 h-8" style={{ color: 'hsl(var(--sky))' }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Bạn vẫn thức chứ?</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Đã đến giờ check-in! Bạn vẫn đang học chứ?
                  </p>
                </div>
                <Button
                  onClick={handleCheckIn}
                  className="w-full h-12 rounded-2xl font-bold"
                  style={{ background: 'hsl(var(--sky))', color: 'white' }}
                >
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
