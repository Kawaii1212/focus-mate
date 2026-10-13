import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/** GET /api/notification-settings?userId=... — đọc settings (tạo mặc định nếu chưa có) */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  try {
    let setting = await prisma.notificationSetting.findUnique({ where: { userId } });
    if (!setting) {
      setting = await prisma.notificationSetting.create({ data: { userId } });
    }
    return NextResponse.json(setting);
  } catch (err) {
    console.error('[notification-settings GET] failed:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/** PUT /api/notification-settings — cập nhật settings */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, inAppEnabled, pushEnabled, emailEnabled, gcalEnabled, minutesBefore } = body || {};
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (typeof inAppEnabled === 'boolean') data.inAppEnabled = inAppEnabled;
    if (typeof pushEnabled === 'boolean') data.pushEnabled = pushEnabled;
    if (typeof emailEnabled === 'boolean') data.emailEnabled = emailEnabled;
    if (typeof gcalEnabled === 'boolean') data.gcalEnabled = gcalEnabled;
    if (Array.isArray(minutesBefore)) {
      data.minutesBefore = minutesBefore.filter((m: unknown) => typeof m === 'number');
    }

    const setting = await prisma.notificationSetting.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    return NextResponse.json(setting);
  } catch (err) {
    console.error('[notification-settings PUT] failed:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
