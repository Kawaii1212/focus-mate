import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendInAppNotification } from '@/lib/inapp';
import { sendWebPushToUser, isPushConfigured } from '@/lib/webpush';
import { sendReminderEmail, isEmailConfigured } from '@/lib/mailer';

/**
 * POST /api/notification/test — gửi notification test qua các kênh user bật.
 * Body: { userId }
 */
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const setting =
      (await prisma.notificationSetting.findUnique({ where: { userId } })) ??
      (await prisma.notificationSetting.create({ data: { userId } }));

    const channels: string[] = [];
    const promises: Promise<unknown>[] = [];

    if (setting.inAppEnabled) {
      channels.push('In-app');
      promises.push(
        sendInAppNotification(userId, {
          title: '🔔 Notification test',
          body: 'Đây là notification test từ FocusMate. Nếu bạn thấy nó thì kênh In-app hoạt động!',
          url: '/settings',
          type: 'info',
        })
      );
    }
    if (setting.pushEnabled) {
      if (!isPushConfigured) {
        channels.push('Push (chưa cấu hình VAPID)');
      } else {
        channels.push('Push');
        promises.push(
          sendWebPushToUser(userId, {
            title: '🔔 Notification test',
            body: 'Đây là Web Push test từ FocusMate.',
            url: '/settings',
            tag: 'test',
          })
        );
      }
    }
    if (setting.emailEnabled) {
      if (!isEmailConfigured) {
        channels.push('Email (chưa cấu hình Gmail SMTP)');
      } else {
        channels.push('Email');
        promises.push(
          sendReminderEmail({
            to: user.email,
            userName: user.name,
            blockTitle: 'Notification test',
            date: new Date().toISOString().split('T')[0],
            startTime: new Date().toTimeString().slice(0, 5),
            endTime: new Date(Date.now() + 60 * 60 * 1000).toTimeString().slice(0, 5),
            minutesBefore: 0,
          })
        );
      }
    }

    await Promise.all(promises);

    return NextResponse.json({
      ok: true,
      sentVia: channels.length ? channels : ['(không kênh nào bật)'],
    });
  } catch (err) {
    console.error('[notification/test] failed:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
