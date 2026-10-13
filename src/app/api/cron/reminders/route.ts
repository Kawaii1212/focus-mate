import { NextResponse } from 'next/server';
import { runReminderScheduler } from '@/lib/reminderScheduler';

export const dynamic = 'force-dynamic';

/**
 * Vercel Cron endpoint — chạy mỗi 10 phút.
 * Bảo vệ bằng Authorization: Bearer CRON_SECRET.
 * GET /api/cron/reminders
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
  const secret = process.env.CRON_SECRET || '';

  // Cho phép không secret ở dev (localhost); Vercel sẽ luôn truyền header
  const isVercelCron = request.headers.get('x-vercel-cron') !== null;
  if (secret && authHeader !== expected && !isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runReminderScheduler(new Date());
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[cron/reminders] failed:', err);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
