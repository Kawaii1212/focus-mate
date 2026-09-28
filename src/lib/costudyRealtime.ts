import { supabase, isSupabaseConfigured, RealtimeChannel } from '@/lib/supabase';
import { ChatMessage, CoStudyPresence, MascotPersonaId, PomodoroState } from '@/types';

// ---------------------------------------------------------------------------
// Broadcast event contracts (shared by all room clients)
// ---------------------------------------------------------------------------

export const RT_EVENTS = {
  CHAT_MESSAGE: 'chat-message',
  TYPING: 'typing',
  POMODORO_SYNC: 'pomodoro-sync',
  CALL_SIGNAL: 'call-signal',
  CALL_ICE: 'call-ice',
  CALL_LEAVE: 'call-leave',
} as const;

export interface TypingPayload {
  userId: string;
  name: string;
}

export interface CallSignalPayload {
  from: string;
  to: string;
  kind: 'offer' | 'answer';
  sdp: string;
}

export interface CallIcePayload {
  from: string;
  to: string;
  candidates: RTCIceCandidateInit[];
}

export interface CallLeavePayload {
  userId: string;
}

// ---------------------------------------------------------------------------
// Snapshot consumed by React (useSyncExternalStore)
// ---------------------------------------------------------------------------

export interface CoStudySnapshot {
  /** Channel is subscribed and our presence is being tracked */
  ready: boolean;
  /** userId -> latest presence payload of everyone currently connected */
  presence: Record<string, CoStudyPresence>;
  /** Latest shared pomodoro state (host broadcasts on state changes) */
  pomodoro: PomodoroState | null;
}

const EMPTY_SNAPSHOT: CoStudySnapshot = { ready: false, presence: {}, pomodoro: null };
export const getEmptySnapshot = () => EMPTY_SNAPSHOT;

type StoreListener = () => void;
type EventHandler = (payload: unknown) => void;

export interface CoStudyIdentity {
  userId: string;
  name: string;
  mascotPersonaId: MascotPersonaId;
}

/**
 * Module-level realtime store for one Co-Study room.
 *
 * Why this exists outside React:
 * - supabase-js channels are single-use: once subscribed they can never be
 *   re-subscribed after leaving (phoenix `join()` throws on re-join), and
 *   channel handlers can never be unregistered.
 * - React StrictMode (enabled in this project) double-invokes effects, and
 *   page remounts (leave + re-enter a room) must not tear the channel down.
 *
 * So the channel lives for the whole browser session, this store keeps a
 * stable snapshot that React reads via useSyncExternalStore, and per-mount
 * listeners can subscribe/unsubscribe freely through the emitter below.
 */
class CoStudyRealtimeStore {
  readonly roomId: string;
  readonly identity: CoStudyIdentity;

  private channel: RealtimeChannel;
  private snapshot: CoStudySnapshot;
  private listeners = new Set<StoreListener>();
  private eventListeners = new Map<string, Set<EventHandler>>();
  private refCount = 0;
  private untrackTimer: ReturnType<typeof setTimeout> | null = null;
  private myPresence: CoStudyPresence;
  private presenceTracked = false;

  constructor(roomId: string, identity: CoStudyIdentity, initialPomodoro: PomodoroState) {
    this.roomId = roomId;
    this.identity = identity;
    this.snapshot = { ready: false, presence: {}, pomodoro: initialPomodoro };
    this.myPresence = {
      userId: identity.userId,
      name: identity.name,
      mascotPersonaId: identity.mascotPersonaId,
      status: 'studying',
      cameraEnabled: false,
      microphoneEnabled: false,
      joinedVideoCall: false,
    };

    this.channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: { key: identity.userId },
        broadcast: { self: false },
      },
    });

    // --- handlers below are registered exactly once for the channel's lifetime ---

    this.channel.on('presence', { event: 'sync' }, () => {
      this.syncPresence();
    });

    this.channel.on('broadcast', { event: RT_EVENTS.POMODORO_SYNC }, ({ payload }) => {
      const state = payload as PomodoroState;
      if (state && typeof state.timeLeft === 'number' && typeof state.isActive === 'boolean') {
        this.setSnapshot({
          pomodoro: {
            timeLeft: state.timeLeft,
            isActive: state.isActive,
            mode: state.mode === 'break' ? 'break' : 'focus',
            endsAt: typeof state.endsAt === 'number' ? state.endsAt : null,
          },
        });
      }
    });

    this.channel.on('broadcast', { event: RT_EVENTS.CHAT_MESSAGE }, ({ payload }) => {
      this.emit(RT_EVENTS.CHAT_MESSAGE, payload);
    });

    this.channel.on('broadcast', { event: RT_EVENTS.TYPING }, ({ payload }) => {
      this.emit(RT_EVENTS.TYPING, payload);
    });

    this.channel.on('broadcast', { event: RT_EVENTS.CALL_SIGNAL }, ({ payload }) => {
      this.emit(RT_EVENTS.CALL_SIGNAL, payload);
    });

    this.channel.on('broadcast', { event: RT_EVENTS.CALL_ICE }, ({ payload }) => {
      this.emit(RT_EVENTS.CALL_ICE, payload);
    });

    this.channel.on('broadcast', { event: RT_EVENTS.CALL_LEAVE }, ({ payload }) => {
      this.emit(RT_EVENTS.CALL_LEAVE, payload);
    });

    this.channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        this.setSnapshot({ ready: true });
        this.pushPresence();
      }
      // CHANNEL_ERROR / TIMED_OUT: the socket/channel auto-rejoin timers
      // handle retries; the 30s REST resync covers missed state meanwhile.
    });
  }

  // ------------------------------------------------------------------ store API

  getSnapshot = (): CoStudySnapshot => this.snapshot;

  subscribeStore = (listener: StoreListener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private setSnapshot(patch: Partial<CoStudySnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  // ------------------------------------------------------------------ presence

  private syncPresence() {
    const raw = this.channel.presenceState<CoStudyPresence>();
    const presence: Record<string, CoStudyPresence> = {};
    for (const [key, list] of Object.entries(raw)) {
      if (list.length > 0) presence[key] = list[list.length - 1];
    }
    this.setSnapshot({ presence });
  }

  private pushPresence() {
    if (!this.snapshot.ready) return;
    this.channel
      .track(this.myPresence)
      .then((status) => {
        if (status === 'ok') this.presenceTracked = true;
      })
      .catch(() => {});
  }

  /** Merge into our own presence payload and re-track. */
  updateMyPresence(partial: Partial<CoStudyPresence>) {
    this.myPresence = { ...this.myPresence, ...partial };
    if (this.snapshot.ready) {
      this.channel
        .track(this.myPresence)
        .then((status) => {
          if (status === 'ok') this.presenceTracked = true;
        })
        .catch(() => {});
    }
  }

  /** Re-track presence (e.g. after returning to the tab after a sleep). */
  refreshMyPresence() {
    this.pushPresence();
  }

  // ------------------------------------------------------------------ lifecycle

  acquire() {
    this.refCount += 1;
    if (this.untrackTimer) {
      clearTimeout(this.untrackTimer);
      this.untrackTimer = null;
    }
    if (this.snapshot.ready && !this.presenceTracked) {
      // Re-entering the room within the same browser session
      this.pushPresence();
    }
  }

  release() {
    this.refCount = Math.max(0, this.refCount - 1);
    if (this.refCount === 0) {
      // Delayed untrack: tolerates StrictMode remounts and quick back-and-forth
      // navigation without flapping presence for other participants.
      if (this.untrackTimer) clearTimeout(this.untrackTimer);
      this.untrackTimer = setTimeout(() => {
        this.untrackTimer = null;
        if (this.refCount === 0 && this.presenceTracked) {
          this.presenceTracked = false;
          this.channel.untrack().catch(() => {});
        }
      }, 2000);
    }
  }

  // ------------------------------------------------------------------ broadcasts

  /** Fire-and-forget broadcast. Drops silently when the channel is not ready. */
  broadcast(event: string, payload: unknown) {
    if (!this.snapshot.ready) return;
    this.channel.send({ type: 'broadcast', event, payload }).catch(() => {});
  }

  /**
   * Host-only: set the shared pomodoro locally AND broadcast to everyone else.
   * (With `broadcast: { self: false }` the host does not receive its own event.)
   */
  setPomodoro(next: PomodoroState) {
    this.setSnapshot({ pomodoro: next });
    this.broadcast(RT_EVENTS.POMODORO_SYNC, next);
  }

  /** Apply a pomodoro state without broadcasting (used by the 30s REST resync). */
  applyPomodoro(next: PomodoroState) {
    const current = this.snapshot.pomodoro;
    const changed =
      !current ||
      current.timeLeft !== next.timeLeft ||
      current.isActive !== next.isActive ||
      current.mode !== next.mode ||
      (current.endsAt ?? null) !== (next.endsAt ?? null);
    if (changed) {
      this.setSnapshot({ pomodoro: next });
    }
  }

  // ------------------------------------------------------------------ event emitter (removable, unlike channel handlers)

  on<T>(event: string, handler: (payload: T) => void): () => void {
    let set = this.eventListeners.get(event);
    if (!set) {
      set = new Set();
      this.eventListeners.set(event, set);
    }
    const wrapped = handler as EventHandler;
    set.add(wrapped);
    return () => {
      set.delete(wrapped);
    };
  }

  private emit(event: string, payload: unknown) {
    const set = this.eventListeners.get(event);
    if (!set) return;
    set.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`[costudy-realtime] handler error for ${event}:`, error);
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Module-level registry: one store per (room, user) for the whole browser session
// ---------------------------------------------------------------------------

const storeRegistry = new Map<string, CoStudyRealtimeStore>();

export function getCoStudyStore(
  roomId: string,
  identity: CoStudyIdentity,
  initialPomodoro: PomodoroState
): CoStudyRealtimeStore | null {
  if (!isSupabaseConfigured) return null;
  const key = `${roomId}:${identity.userId}`;
  const existing = storeRegistry.get(key);
  if (existing) return existing;
  const store = new CoStudyRealtimeStore(roomId, identity, initialPomodoro);
  storeRegistry.set(key, store);
  return store;
}

export type { CoStudyRealtimeStore };
