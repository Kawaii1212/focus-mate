"use client";

/**
 * NotificationBell — chuông thông báo In-app.
 * - Fetch notification từ /api/notification
 * - Lắng nghe Supabase Realtime channel `user:{userId}` event `notification`
 *   → thêm vào list + toast ngay (kể cả khi vừa nhận từ cron)
 * - Dropdown hiển thị list, click → navigate, "Đánh dấu tất cả đã đọc"
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useApp } from '@/store/AppContext';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  url: string | null;
  readAt: string | null;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

export default function NotificationBell() {
  const { state } = useApp();
  const { toast } = useToast();
  const router = useRouter();

  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const userId = state.user?.id;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/notification?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setUnread(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('[notifications] load failed:', err);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // Supabase Realtime listener
  useEffect(() => {
    if (!userId || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`user:${userId}`)
      .on('broadcast', { event: 'notification' }, (payload: { payload?: Partial<AppNotification> }) => {
        const p = payload.payload || {};
        const n: AppNotification = {
          id: p.id || `rt-${Date.now()}`,
          title: p.title || 'Thông báo',
          body: p.body || '',
          url: p.url ?? null,
          readAt: null,
          createdAt: new Date().toISOString(),
        };
        setItems((prev) => [n, ...prev].slice(0, 30));
        setUnread((u) => u + 1);
        toast({ title: n.title, description: n.body });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, toast]);

  const markAllRead = async () => {
    if (!userId) return;
    setUnread(0);
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt || new Date().toISOString() })));
    await fetch('/api/notification', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }).catch(() => { });
  };

  const handleItemClick = async (n: AppNotification) => {
    if (!n.readAt && userId) {
      setUnread((u) => Math.max(0, u - 1));
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, readAt: new Date().toISOString() } : i)));
      await fetch('/api/notification', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, id: n.id }),
      }).catch(() => { });
    }
    setOpen(false);
    if (n.url) router.push(n.url);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-xl w-9 h-9 relative"
        onClick={() => setOpen((o) => !o)}
        title="Thông báo"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <>
          {/* click-away overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-80 max-w-[90vw] rounded-2xl border border-border bg-popover shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
              <span className="text-sm font-semibold">Thông báo</span>
              {unread > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllRead}>
                  <CheckCheck className="w-3.5 h-3.5" />
                  Đọc tất cả
                </Button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                  <Inbox className="w-8 h-8 opacity-40" />
                  <span className="text-sm">Chưa có thông báo nào</span>
                </div>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`w-full text-left px-4 py-3 border-b border-border/40 last:border-0 hover:bg-accent/50 transition-colors ${!n.readAt ? 'bg-sky-50/60 dark:bg-sky-950/20' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium">{n.title}</span>
                      {!n.readAt && <span className="mt-1 w-2 h-2 rounded-full bg-sky-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    <span className="text-[10px] text-muted-foreground/70">{timeAgo(n.createdAt)}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
