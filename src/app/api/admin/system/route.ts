import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - start;

    const [userCount, roomCount, sessionCount, paymentCount, mascotCount] = await Promise.all([
      prisma.user.count(),
      prisma.activeRoom.count(),
      prisma.studySession.count(),
      prisma.payment.count(),
      prisma.mascot.count(),
    ]);

    return NextResponse.json({
      status: 'healthy',
      database: {
        connected: true,
        latencyMs: dbLatency,
        provider: 'PostgreSQL (Supabase)',
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        hasGeminiKey: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
        hasCronSecret: Boolean(process.env.CRON_SECRET),
      },
      metrics: {
        userCount,
        roomCount,
        sessionCount,
        paymentCount,
        mascotCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'degraded',
        database: { connected: false, error: error.message },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action === 'seed_sessions') {
      const users = await prisma.user.findMany({ take: 10 });
      if (users.length === 0) {
        return NextResponse.json({ message: 'Chua c� user d? t?o m?u' }, { status: 400 });
      }

      const tasks = [
        '�n thi Gi?a K? Gi?i T�ch',
        'L?p tr�nh Web Next.js & Prisma',
        'Luy?n nghe IELTS Cambridge 18',
        '�?c s�ch Clean Code Chuong 4',
        'Th?c h�nh Thu?t To�n LeetCode',
        'L�m ti?u lu?n Kinh T? Lu?ng',
        'H?c t? v?ng HSK 4',
      ];

      const createdSessions = [];
      const now = new Date();

      for (let i = 0; i < 15; i++) {
        const u = users[Math.floor(Math.random() * users.length)];
        const targetMin = [25, 45, 50, 60][Math.floor(Math.random() * 4)];
        const actualMin = Math.round(targetMin * (0.8 + Math.random() * 0.4));
        const pct = Math.min(100, Math.round((actualMin / targetMin) * 100));
        const exp = Math.round(actualMin * 2);
        const coin = Math.round(actualMin / 2);
        const dayOffset = Math.floor(Math.random() * 10);
        const d = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);

        const sess = await prisma.studySession.create({
          data: {
            userId: u.id,
            taskTitle: tasks[Math.floor(Math.random() * tasks.length)],
            targetMinutes: targetMin,
            actualMinutes: actualMin,
            completionPct: pct,
            expEarned: exp,
            coinEarned: coin,
            isValid: pct >= 50,
            streakSaved: pct >= 80,
            date: d.toISOString().split('T')[0],
            createdAt: d.toISOString(),
          },
        });
        createdSessions.push(sess);
      }

      return NextResponse.json({
        success: true,
        message: `�� t?o th�nh c�ng ${createdSessions.length} phi�n h?c m?u!`,
      });
    }

    return NextResponse.json({ message: 'Action kh�ng x�c d?nh' }, { status: 400 });
  } catch (error) {
    console.error('System POST error:', error);
    return NextResponse.json({ message: 'L?i th?c hi?n t�c v?' }, { status: 500 });
  }
}
