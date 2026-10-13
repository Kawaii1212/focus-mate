import prisma from '@/lib/prisma';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * In-app notification: lưu vào DB + broadcast qua Supabase Realtime
 * để toast hiện ngay nếu user đang mở web.
 */

export interface InAppPayload {
  title: string;
  body: string;
  url?: string;
  type?: 'reminder' | 'info' | 'deadline';
}

// Bảng Notification dùng cột text JSON-lite: lưu trực tiếp trường.
// Nếu Supabase không chạy, vẫn fallback đọc từ DB theo polling của client.
export async function sendInAppNotification(userId: string, payload: InAppPayload): Promise<void> {
  await prisma.notification.create({
    data: {
      userId,
      title: payload.title,
      body: payload.body,
      url: payload.url || null,
      type: payload.type || 'reminder',
    },
  });

  if (isSupabaseConfigured) {
    try {
      const channel = supabase.channel(`user:${userId}`, {
        config: { broadcast: { self: false } },
      });
      // Bản ghi realtime broadcast không cần presence.
      await new Promise<void>((resolve) => {
        channel
          .on('broadcast', { event: 'notification' }, () => { })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              channel.send({
                type: 'broadcast',
                event: 'notification',
                payload: { ...payload, userId },
              });
              resolve();
            }
          });
        // Timeout để không block cron
        setTimeout(() => resolve(), 3000);
      });
      supabase.removeChannel(channel);
    } catch (err) {
      console.error('[inapp] realtime broadcast failed:', err);
    }
  }
}

export async function notifyUser(userId: string, payload: InAppPayload): Promise<void> {
  try {
    await sendInAppNotification(userId, payload);
  } catch (err) {
    console.error('[inapp] notifyUser failed:', err);
  }
}
