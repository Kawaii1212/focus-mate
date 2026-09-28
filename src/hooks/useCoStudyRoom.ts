import { useEffect, useState, useSyncExternalStore } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  CoStudyRealtimeStore,
  CoStudySnapshot,
  getCoStudyStore,
  getEmptySnapshot,
} from '@/lib/costudyRealtime';
import { MascotPersonaId, PomodoroState } from '@/types';

const noopSubscribe = () => () => {};

export interface UseCoStudyRoomResult {
  store: CoStudyRealtimeStore | null;
  snapshot: CoStudySnapshot;
}

/**
 * Connects the page to the room's realtime channel (presence + broadcasts).
 * The channel/store is owned at module level (see costudyRealtime.ts) so
 * StrictMode remounts and quick re-entries are safe.
 */
export function useCoStudyRoom(params: {
  roomId: string;
  userId: string;
  name: string;
  mascotPersonaId: MascotPersonaId;
  enabled: boolean;
  initialPomodoro: PomodoroState;
}): UseCoStudyRoomResult {
  const { roomId, userId, name, mascotPersonaId, enabled, initialPomodoro } = params;
  const [store, setStore] = useState<CoStudyRealtimeStore | null>(null);

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured) return;
    const s = getCoStudyStore(
      roomId,
      { userId, name, mascotPersonaId },
      initialPomodoro
    );
    if (!s) return;
    s.acquire();
    setStore(s);

    // Re-track presence when the tab becomes visible again (covers laptop
    // sleep / network drop scenarios where presence may have gone stale).
    const onVisible = () => {
      if (document.visibilityState === 'visible') s.refreshMyPresence();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      s.release();
      setStore(null);
    };
    // name / mascotPersonaId / initialPomodoro are constant for a session;
    // excluding them avoids tearing down the channel on unrelated re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId, enabled]);

  // Third arg (getServerSnapshot) is required — React 19 throws during SSR without it.
  const snapshot = useSyncExternalStore(
    store ? store.subscribeStore : noopSubscribe,
    store ? store.getSnapshot : getEmptySnapshot,
    store ? store.getSnapshot : getEmptySnapshot
  );

  return { store, snapshot };
}
