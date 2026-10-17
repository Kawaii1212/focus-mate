import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const isValid = searchParams.get('isValid');

    const where: any = {};
    if (isValid === 'true') where.isValid = true;
    if (isValid === 'false') where.isValid = false;

    if (search.trim()) {
      where.OR = [
        { taskTitle: { contains: search.trim(), mode: 'insensitive' } },
        { user: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { user: { email: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    const sessions = await prisma.studySession.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            mascot: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const totalMinutes = sessions.reduce((acc, s) => acc + (s.actualMinutes || 0), 0);
    const avgCompletion =
      sessions.length > 0
        ? Math.round(sessions.reduce((acc, s) => acc + (s.completionPct || 0), 0) / sessions.length)
        : 0;

    return NextResponse.json({
      sessions,
      summary: {
        totalSessions: sessions.length,
        totalHours: (totalMinutes / 60).toFixed(1),
        avgCompletion,
      },
    });
  } catch (error) {
    console.error('Admin sessions GET error:', error);
    return NextResponse.json({ message: 'Lỗi tải danh sách phiên học' }, { status: 500 });
  }
}
