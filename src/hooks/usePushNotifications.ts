"use client";

/**
 * usePushNotifications — hook đăng ký Web Push cho user.
 * - Xin quyền Notification
 * - Đăng ký service worker /sw.js + subscription
 * - POST subscription lên /api/push/subscribe
 */

import { useCallback, useState } from 'react';

export type PushStatus = 'unsupported' | 'default' | 'granted' | 'denied' | 'loading';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const outputArray = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    outputArray[i] = raw.charCodeAt(i);
  }
  return outputArray;
}

export function getPushStatus(): PushStatus {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'default';
}

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>('loading');

  const refresh = useCallback(() => {
    setStatus(getPushStatus());
  }, []);

  const enablePush = useCallback(async (userId: string): Promise<{ ok: boolean; error?: string }> => {
    if (typeof window === 'undefined') return { ok: false, error: 'unsupported' };
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      return { ok: false, error: 'Trình duyệt không hỗ trợ Web Push.' };
    }

    try {
      // 1. Xin quyền
      const permission = await Notification.requestPermission();
      setStatus(permission === 'granted' ? 'granted' : permission === 'denied' ? 'denied' : 'default');
      if (permission !== 'granted') {
        return { ok: false, error: permission === 'denied' ? 'Bạn đã chặn thông báo — mở lại trong cài đặt trình duyệt.' : 'Chưa cấp quyền.' };
      }

      // 2. Đăng ký service worker
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // 3. Lấy VAPID public key
      const res = await fetch('/api/push/vapid');
      if (!res.ok) return { ok: false, error: 'Server chưa cấu hình push (thiếu VAPID key).' };
      const { publicKey } = await res.json();

      // 4. Subscribe
      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
        }));

      // 5. Gửi subscription lên server
      const subJson = sub.toJSON();
      const saveRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, endpoint: subJson.endpoint, keys: subJson.keys }),
      });
      if (!saveRes.ok) return { ok: false, error: 'Không lưu được subscription.' };

      return { ok: true };
    } catch (err) {
      console.error('[push] enable failed:', err);
      return { ok: false, error: 'Đăng ký push thất bại.' };
    }
  }, []);

  const disablePush = useCallback(async (userId: string): Promise<void> => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
    } catch (err) {
      console.error('[push] disable failed:', err);
    }
  }, []);

  return { status, refresh, enablePush, disablePush };
}
