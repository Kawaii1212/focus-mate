'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp, useMascot } from '@/store/AppContext';
import { useToast } from '@/hooks/use-toast';
import { isSupabaseConfigured } from '@/lib/supabase';
import { costudyApi, CostudyApiError, CoStudyRoomData } from '@/lib/costudy';
import { useCoStudyRoom } from '@/hooks/useCoStudyRoom';
import { useGroupCall } from '@/hooks/useGroupCall';
import AppLayout from '@/components/layout/AppLayout';
import RoomHeader from '@/components/costudy/RoomHeader';
import ParticipantsPanel from '@/components/costudy/ParticipantsPanel';
import CoStudyPomodoro from '@/components/costudy/CoStudyPomodoro';
import ChatPanel from '@/components/costudy/ChatPanel';
import VideoCallPanel from '@/components/costudy/VideoCallPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Users } from 'lucide-react';
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
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [roomData, setRoomData] = useState<CoStudyRoomData | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'notfound' | 'full' | 'ready'>('loading');

  // Personal session stat (minutes spent in this room)
  const [sessionMinutes, setSessionMinutes] = useState(0);

  // Tracks the pomodoro state this client last pushed (broadcast + REST), so
  // the 30s poll can heal a failed REST write without clobbering other members.
  const lastPushRef = useRef<{ state: PomodoroState; reconciled: boolean; at: number } | null>(null);

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

  // 30s resync backstop: roster + pomodoro (in case a broadcast was missed).
  // Anyone may control the shared pomodoro, so this also heals a failed REST
  // write: if the DB does not reflect what this client last pushed, push it
  // again — at most once per push, so near-simultaneous actors converge
  // instead of overwriting each other forever.
  useEffect(() => {
    if (loadState !== 'ready' || !roomId || !user) return;
    const interval = setInterval(() => {
      costudyApi
        .performAction('poll', roomId, user.id)
        .then((fresh) => {
          setRoomData(fresh);
          if (!store) return;
          const lastPush = lastPushRef.current;
          const diverged =
            lastPush &&
            (lastPush.state.isActive !== fresh.pomodoro.isActive ||
              lastPush.state.mode !== fresh.pomodoro.mode ||
              lastPush.state.timeLeft !== fresh.pomodoro.timeLeft);
          if (diverged && lastPush) {
            // `endsAt` is intentionally excluded from the comparison: the
            // server re-derives it with per-request latency, so exact
            // equality never holds.
            if (!lastPush.reconciled && Date.now() - lastPush.at < 120000) {
              lastPush.reconciled = true;
              costudyApi
                .performAction('sync', roomId, user.id, { pomodoro: lastPush.state })
                .catch(() => {});
            } else {
              store.applyPomodoro(fresh.pomodoro);
              lastPushRef.current = null;
            }
          } else {
            if (lastPush) lastPushRef.current = null; // DB converged with our push
            store.applyPomodoro(fresh.pomodoro);
          }
        })
        .catch(() => {});
    }, RESYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadState, roomId, user, store]);

  // Personal session timer (1s tick)
  useEffect(() => {
    if (loadState !== 'ready') return;
    const interval = setInterval(() => {
      setSessionMinutes((prev) => prev + 1 / 60);
    }, 1000);
    return () => clearInterval(interval);
  }, [loadState]);

  // Shared pomodoro: wall-clock countdown derived from `endsAt`, so the
  // display survives broadcast hiccups without tick drift. Falls back to the
  // REST-polled room state when realtime is unavailable.
  const pomodoro = snapshot.pomodoro ?? roomData?.pomodoro ?? DEFAULT_POMODORO;
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

  // Auto-switch focus <-> break when the running pomodoro hits zero.
  // Anyone in the room may advance it; the payload is deterministic so
  // simultaneous actors converge on the same state.
  useEffect(() => {
    if (loadState !== 'ready' || !roomId || !user) return;
    if (!pomodoro.isActive || displayTimeLeft > 0) return;
    const nextMode = pomodoro.mode === 'focus' ? 'break' : 'focus';
    const next: PomodoroState = {
      timeLeft: nextMode === 'focus' ? 25 * 60 : 5 * 60,
      mode: nextMode,
      isActive: false,
      endsAt: null,
    };
    lastPushRef.current = { state: next, reconciled: false, at: Date.now() };
    if (store) {
      store.setPomodoro(next);
    } else {
      setRoomData((prev) => (prev ? { ...prev, pomodoro: next } : prev));
    }
    // Failures are healed by the 30s poll reconcile (lastPushRef above).
    costudyApi.performAction('sync', roomId, user.id, { pomodoro: next }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayTimeLeft, pomodoro.isActive, pomodoro.mode, store, loadState, roomId, user]);

  // Anyone in the room may control the shared pomodoro. Works with or without
  // realtime: broadcast when the channel exists, optimistic local update +
  // REST persistence otherwise.
  const pomodoroAction = (action: 'toggle' | 'reset' | 'focus' | 'break') => {
    if (!roomId || !user) return;
    const current = snapshot.pomodoro ?? roomData?.pomodoro ?? DEFAULT_POMODORO;
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
    lastPushRef.current = { state: next, reconciled: false, at: Date.now() };
    if (store) {
      store.setPomodoro(next);
    } else {
      setRoomData((prev) => (prev ? { ...prev, pomodoro: next } : prev));
    }
    setPomodoroNow(Date.now());
    costudyApi.performAction('sync', roomId, user.id, { pomodoro: next }).catch(() => {
      toast({
        title: 'Không đồng bộ được Pomodoro',
        description: 'Thay đổi đã áp dụng. Vui lòng kiểm tra kết nối.',
        variant: 'destructive',
      });
    });
  };

  // ---------------------------------------------------------------- actions

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
        {!isSupabaseConfigured && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-foreground">
            <span className="font-semibold">Chế độ hạn chế:</span> Realtime chưa được
            cấu hình (thiếu <code className="font-mono">NEXT_PUBLIC_SUPABASE_*</code>) nên
            chat, trạng thái thành viên và video call không cập nhật trực tiếp. Hãy thêm
            biến môi trường rồi deploy lại.
          </div>
        )}
        <RoomHeader
          roomName={roomData?.name ?? 'Co-Study Room'}
          roomId={roomId}
          onlineCount={onlineCount}
          inCallCount={inCallCount}
          onLeaveRoom={handleLeaveRoom}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: participants */}
          <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
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
              onlineCount={onlineCount}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
