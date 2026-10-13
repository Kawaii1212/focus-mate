import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/** GET /api/notification?userId=...&unread=1 — list notification, đếm unread */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  try {
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return NextResponse.json({ items, unreadCount });
  } catch (err) {
    console.error('[notification GET] failed:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/** PATCH /api/notification — đánh dấu đã đọc: { userId, id? } (không id = tất cả) */
export async function PATCH(request: Request) {
  try {
    const { userId, id } = await request.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    await prisma.notification.updateMany({
      where: { userId, ...(id ? { id } : {}), readAt: null },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[notification PATCH] failed:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
