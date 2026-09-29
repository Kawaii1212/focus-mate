import { useCallback, useEffect, useRef, useState } from 'react';
import { costudyApi } from '@/lib/costudy';
import {
  ChatReactionPayload,
  CoStudyRealtimeStore,
  RT_EVENTS,
  TypingPayload,
} from '@/lib/costudyRealtime';
import { encodeReply } from '@/lib/chatFormat';
import { ChatMessage, MascotPersonaId, User } from '@/types';

export type MessageReactions = Record<string, Record<string, string[]>>;

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
  const [reactions, setReactions] = useState<MessageReactions>({});

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

  const refetchReactions = useCallback(async () => {
    const rows = await costudyApi.getReactions(roomId);
    if (!rows || rows.length === 0) return;
    setReactions(() => {
      const aggregated: MessageReactions = {};
      for (const r of rows) {
        if (!r.messageId || !r.emoji || !r.userId) continue;
        (aggregated[r.messageId] ??= {})[r.emoji] ??= [];
        if (!aggregated[r.messageId][r.emoji].includes(r.userId)) {
          aggregated[r.messageId][r.emoji].push(r.userId);
        }
      }
      return aggregated;
    });
  }, [roomId]);

  // --- catch-up backstop (broadcast drops, invisible tabs) ---
  const catchUp = useCallback(async () => {
    const after = latestCreatedAtRef.current;
    // No cursor yet (room started with an empty chat): refetch the latest
    // page so messages missed while offline are still recovered.
    const missed = await costudyApi.getMessages(roomId, after ? { after } : {});
    if (missed.length > 0) {
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const addition = missed.filter((m) => !ids.has(m.id));
        if (addition.length === 0) return prev;
        return [...prev, ...addition];
      });
      for (const m of missed) recordLatest(m.createdAt);
    }
    // Reactions have no realtime catch-up, so re-sync from DB periodically.
    void refetchReactions();
  }, [roomId, recordLatest, refetchReactions]);

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

  // --- reactions: DB is source of truth, localStorage is fast-paint cache ---
  useEffect(() => {
    let cancelled = false;
    // 1. Instant paint from cache (covers offline / slow network)
    try {
      const raw = localStorage.getItem(`chat-reactions:${roomId}`);
      if (raw) setReactions(JSON.parse(raw));
      else setReactions({});
    } catch {
      // ignore corrupted cache
    }
    // 2. Overwrite with DB state
    costudyApi.getReactions(roomId).then((rows) => {
      if (cancelled) return;
      if (!rows || rows.length === 0) return; // keep cache (fresh room or DB unreachable)
      const aggregated: MessageReactions = {};
      for (const r of rows) {
        if (!r.messageId || !r.emoji || !r.userId) continue;
        (aggregated[r.messageId] ??= {})[r.emoji] ??= [];
        if (!aggregated[r.messageId][r.emoji].includes(r.userId)) {
          aggregated[r.messageId][r.emoji].push(r.userId);
        }
      }
      setReactions(aggregated);
    });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  useEffect(() => {
    try {
      localStorage.setItem(`chat-reactions:${roomId}`, JSON.stringify(reactions));
    } catch {
      // quota exceeded: reactions stay in-memory (DB still has them)
    }
  }, [reactions, roomId]);

  useEffect(() => {
    if (!store) return;
    return store.on<ChatReactionPayload>(RT_EVENTS.CHAT_REACTION, (payload) => {
      if (!payload || typeof payload.messageId !== 'string' || typeof payload.emoji !== 'string') return;
      if (!payload.userId) return;
      setReactions((prev) => {
        const forMsg = prev[payload.messageId] ?? {};
        const users = forMsg[payload.emoji] ?? [];
        const has = users.includes(payload.userId);
        // Toggle semantics over realtime: if sender already reacted, remove.
        const nextUsers = has ? users.filter((u) => u !== payload.userId) : [...users, payload.userId];
        const nextForMsg = { ...forMsg };
        if (nextUsers.length === 0) delete nextForMsg[payload.emoji];
        else nextForMsg[payload.emoji] = nextUsers;
        return { ...prev, [payload.messageId]: nextForMsg };
      });
    });
  }, [store]);

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      const clean = emoji.trim();
      if (!clean || !messageId) return;
      // Optimistic update for instant UI
      setReactions((prev) => {
        const forMsg = prev[messageId] ?? {};
        const users = forMsg[clean] ?? [];
        const has = users.includes(user.id);
        const nextUsers = has ? users.filter((u) => u !== user.id) : [...users, user.id];
        const nextForMsg = { ...forMsg };
        if (nextUsers.length === 0) delete nextForMsg[clean];
        else nextForMsg[clean] = nextUsers;
        return { ...prev, [messageId]: nextForMsg };
      });
      store?.broadcast(RT_EVENTS.CHAT_REACTION, {
        messageId,
        emoji: clean,
        userId: user.id,
        name: user.name,
      } satisfies ChatReactionPayload);
      // Persist to DB (best-effort: realtime + localStorage keep UI working
      // even if the table hasn't been pushed yet; skip temp optimistic ids)
      if (!messageId.startsWith('temp-')) {
        costudyApi.toggleReaction(roomId, { messageId, emoji: clean, userId: user.id }).catch(() => {});
      }
    },
    [store, roomId, user.id, user.name]
  );

  // --- actions ---
  const sendMessage = useCallback(
    async (content: string, replyTo?: ChatMessage | null): Promise<void> => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const finalContent = replyTo ? encodeReply(replyTo, trimmed) : trimmed;
      const tempId = `temp-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: tempId,
        roomId,
        userId: user.id,
        senderName: user.name,
        mascotPersonaId,
        content: finalContent,
        createdAt: new Date().toISOString(),
        pending: true,
      };
      setMessages((prev) => [...prev, optimistic]);
      try {
        const saved = await costudyApi.sendMessage(roomId, {
          userId: user.id,
          name: user.name,
          mascotPersonaId,
          content: finalContent,
        });
        setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
        // Carry over any reactions made on the optimistic message (rare)
        setReactions((prev) => {
          if (!prev[tempId]) return prev;
          const next = { ...prev, [saved.id]: prev[tempId] };
          delete next[tempId];
          return next;
        });
        recordLatest(saved.createdAt);
        store?.broadcast(RT_EVENTS.CHAT_MESSAGE, saved);
      } catch (error) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        throw error;
      }
    },
    [roomId, user.id, user.name, mascotPersonaId, store, recordLatest]
  );

  /** Send pre-encoded content (image / file data URL, optionally with reply prefix). */
  const sendRawMessage = useCallback(
    async (rawContent: string): Promise<void> => {
      if (!rawContent) return;
      const tempId = `temp-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: tempId,
        roomId,
        userId: user.id,
        senderName: user.name,
        mascotPersonaId,
        content: rawContent,
        createdAt: new Date().toISOString(),
        pending: true,
      };
      setMessages((prev) => [...prev, optimistic]);
      try {
        const saved = await costudyApi.sendMessage(roomId, {
          userId: user.id,
          name: user.name,
          mascotPersonaId,
          content: rawContent,
        });
        setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
        setReactions((prev) => {
          if (!prev[tempId]) return prev;
          const next = { ...prev, [saved.id]: prev[tempId] };
          delete next[tempId];
          return next;
        });
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
    reactions,
    sendMessage,
    sendRawMessage,
    toggleReaction,
    notifyTyping,
    setViewingLatest,
  };
}
