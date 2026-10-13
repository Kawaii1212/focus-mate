import webpush from 'web-push';
import prisma from '@/lib/prisma';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

export const isPushConfigured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (isPushConfigured) {
  try {
    webpush.setVapidDetails(
      'mailto:focusmate@example.com',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
  } catch (err) {
    console.error('[push] invalid VAPID config:', err);
  }
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/** Send a Web Push to all subscriptions of a user. Removes dead (404/410) subscriptions. */
export async function sendWebPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!isPushConfigured) return 0;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  let delivered = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
        delivered++;
      } catch (err: unknown) {
        const statusCode =
          typeof err === 'object' && err !== null && 'statusCode' in err
            ? (err as { statusCode?: number }).statusCode
            : undefined;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => { });
        }
      }
    })
  );

  return delivered;
}
