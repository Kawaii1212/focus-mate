import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/** POST /api/push/subscribe — lưu PushSubscription cho user */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, endpoint, keys } = body || {};
    if (!userId || !endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId, p256dh: keys.p256dh, auth: keys.auth },
      create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[push/subscribe] failed:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/** DELETE /api/push/subscribe — huỷ đăng ký */
export async function DELETE(request: Request) {
  try {
    const { endpoint } = await request.json();
    if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
