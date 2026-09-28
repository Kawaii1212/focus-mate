import { useCallback, useEffect, useRef, useState } from 'react';
import { costudyApi } from '@/lib/costudy';
import { CoStudyRealtimeStore, RT_EVENTS, TypingPayload } from '@/lib/costudyRealtime';
import { ChatMessage, MascotPersonaId, User } from '@/types';

export interface TypingUser {
  name: string;
  until: number;
}

const TYPING_TTL_MS = 3000;
const TYPING_THROTTLE_MS = 2000;
const CATCH_UP_INTERVAL_MS = 30000;

export function useRoomChat(params: {
  store: CoStudyRealtimeStore | null;
  roomId: string;
  user: User;
  mascotPersonaId: MascotPersonaId;
}) {
  const { store, roomId, user, mascotPersonaId } = params;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingUser>>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestMessageAt, setLatestMessageAt] = useState<string | null>(null);

  const viewingLatestRef = useRef(true);
  const lastTypingSentRef = useRef(0);
  const latestCreatedAtRef = useRef<string | null>(null);

  const recordLatest = useCallback((createdAt: string) => {
    if (!latestCreatedAtRef.current || createdAt > latestCreatedAtRef.current) {
      latestCreatedAtRef.current = createdAt;
      setLatestMessageAt(createdAt);
    }
  }, []);

  // --- history ---
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    costudyApi.getMessages(roomId).then((history) => {
      if (cancelled) return;
      // Merge instead of overwrite: a broadcast may have landed while the
      // fetch was in flight and must not be wiped out.
      setMessages((live) => {
        const historyIds = new Set(history.map((m) => m.id));
        const kept = live.filter((m) => !historyIds.has(m.id));
        return [...history, ...kept];
      });
      if (history.length > 0) {
        recordLatest(history[history.length - 1].createdAt);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [roomId, recordLatest]);

  // --- live messages ---
  useEffect(() => {
    if (!store) return;
    return store.on<ChatMessage>(RT_EVENTS.CHAT_MESSAGE, (message) => {
      if (!message || typeof message.id !== 'string' || typeof message.content !== 'string') return;
      recordLatest(message.createdAt);
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      setTypingUsers((prev) => {
        if (!(message.userId in prev)) return prev;
        const next = { ...prev };
        delete next[message.userId];
        return next;
      });
      if (!viewingLatestRef.current && message.userId !== user.id) {
        setUnreadCount((count) => count + 1);
      }
    });
  }, [store, user.id, recordLatest]);

  // --- typing: receive ---
  useEffect(() => {
    if (!store) return;
    return store.on<TypingPayload>(RT_EVENTS.TYPING, ({ userId, name }) => {
      if (!userId || userId === user.id) return;
      setTypingUsers((prev) => ({ ...prev, [userId]: { name: name || 'Ai đó', until: Date.now() + TYPING_TTL_MS } }));
    });
  }, [store, user.id]);

  // --- typing: prune expired ---
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        let changed = false;
        const next: Record<string, TypingUser> = {};
        for (const [id, entry] of Object.entries(prev)) {
          if (entry.until > now) next[id] = entry;
          else changed = true;
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- catch-up backstop (broadcast drops, invisible tabs) ---
  const catchUp = useCallback(async () => {
    const after = latestCreatedAtRef.current;
    // No cursor yet (room started with an empty chat): refetch the latest
    // page so messages missed while offline are still recovered.
    const missed = await costudyApi.getMessages(roomId, after ? { after } : {});
    if (missed.length === 0) return;
    setMessages((prev) => {
      const ids = new Set(prev.map((m) => m.id));
      const addition = missed.filter((m) => !ids.has(m.id));
      if (addition.length === 0) return prev;
      return [...prev, ...addition];
    });
    for (const m of missed) recordLatest(m.createdAt);
  }, [roomId, recordLatest]);

  useEffect(() => {
    const interval = setInterval(() => {
      void catchUp();
    }, CATCH_UP_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void catchUp();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [catchUp]);

  // --- actions ---
  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const tempId = `temp-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: tempId,
        roomId,
        userId: user.id,
        senderName: user.name,
        mascotPersonaId,
        content: trimmed,
        createdAt: new Date().toISOString(),
        pending: true,
      };
      setMessages((prev) => [...prev, optimistic]);
      try {
        const saved = await costudyApi.sendMessage(roomId, {
          userId: user.id,
          name: user.name,
          mascotPersonaId,
          content: trimmed,
        });
        setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
        recordLatest(saved.createdAt);
        store?.broadcast(RT_EVENTS.CHAT_MESSAGE, saved);
      } catch (error) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        throw error;
      }
    },
    [roomId, user.id, user.name, mascotPersonaId, store, recordLatest]
  );

  const notifyTyping = useCallback(() => {
    if (!store) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_THROTTLE_MS) return;
    lastTypingSentRef.current = now;
    store.broadcast(RT_EVENTS.TYPING, { userId: user.id, name: user.name });
  }, [store, user.id, user.name]);

  /** The panel calls this on scroll: false when scrolled away from the bottom. */
  const setViewingLatest = useCallback((value: boolean) => {
    viewingLatestRef.current = value;
    if (value) setUnreadCount(0);
  }, []);

  return {
    messages,
    loading,
    typingUsers,
    unreadCount,
    latestMessageAt,
    sendMessage,
    notifyTyping,
    setViewingLatest,
  };
}
