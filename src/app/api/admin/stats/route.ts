import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers7d,
      premiumUsers,
      totalRooms,
      totalPayments,
      paidPayments,
      totalSessions,
      mascots,
      allUsers,
      allPayments,
      allSessions,
      recentRooms,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { isPremium: true } }),
      prisma.activeRoom.count(),
      prisma.payment.count(),
      prisma.payment.findMany({ where: { status: 'paid' } }),
      prisma.studySession.count(),
      prisma.mascot.findMany({ select: { personaId: true, level: true, coin: true } }),
      prisma.user.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { mascot: true },
      }),
      prisma.payment.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.studySession.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.activeRoom.findMany({
        take: 5,
        include: { members: true },
      }),
    ]);

    // Calculate revenue
    const revenue = paidPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const potentialRevenue = (await prisma.payment.findMany()).reduce(
      (acc, p) => acc + (p.amount || 0),
      0
    );

    // Sum focus minutes
    const sessionsAll = await prisma.studySession.findMany({
      select: { actualMinutes: true, expEarned: true },
    });
    const totalFocusMinutes = sessionsAll.reduce((acc, s) => acc + (s.actualMinutes || 0), 0);

    // Persona breakdown
    const personaMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    mascots.forEach((m) => {
      const pid = parseInt(String(m.personaId));
      if (!isNaN(pid) && personaMap[pid] !== undefined) {
        personaMap[pid]++;
      }
    });

    const personaNames: Record<number, string> = {
      0: 'Cáo Foxy (Cân Bằng)',
      1: 'Cú Owwly (Chăm Chỉ)',
      2: 'Gấu Panda (Bền Bỉ)',
      3: 'Mèo Neko (Năng Động)',
      4: 'Thỏ BunBun (Nhẹ Nhàng)',
      5: 'Rồng Spark (Chiến Binh)',
    };

    const mascotDistribution = Object.keys(personaMap).map((key) => ({
      personaId: Number(key),
      name: personaNames[Number(key)] || `Mascot #${key}`,
      count: personaMap[Number(key)],
    }));

    // Plan distribution
    const monthlyCount = await prisma.payment.count({ where: { planId: 'monthly' } });
    const yearlyCount = await prisma.payment.count({ where: { planId: 'yearly' } });

    // User growth by day over last 14 days
    const dailyRegistrations: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyRegistrations[key] = 0;
    }

    const recent14Users = await prisma.user.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true },
    });

    recent14Users.forEach((u) => {
      const key = new Date(u.createdAt).toISOString().split('T')[0];
      if (dailyRegistrations[key] !== undefined) {
        dailyRegistrations[key]++;
      }
    });

    const growthTrend = Object.keys(dailyRegistrations).map((date) => ({
      date: date.slice(5), // MM-DD
      users: dailyRegistrations[date],
    }));

    // Habit distribution
    const habitStats = await prisma.user.groupBy({
      by: ['studyHabit'],
      _count: { id: true },
    });

    // Time preference
    const timeStats = await prisma.user.groupBy({
      by: ['preferredTime'],
      _count: { id: true },
    });

    return NextResponse.json({
      summary: {
        totalUsers,
        newUsers7d,
        premiumUsers,
        premiumPercentage: totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0,
        totalRooms,
        totalPayments,
        paidPayments: paidPayments.length,
        totalRevenue: revenue,
        potentialRevenue,
        totalSessions,
        totalFocusHours: (totalFocusMinutes / 60).toFixed(1),
        mascotCount: mascots.length,
      },
      charts: {
        growthTrend,
        mascotDistribution,
        planDistribution: [
          { name: 'Gói Tháng (49k)', count: monthlyCount, color: '#38bdf8' },
          { name: 'Gói Năm (399k)', count: yearlyCount, color: '#818cf8' },
          { name: 'Người dùng Miễn Phí', count: Math.max(0, totalUsers - premiumUsers), color: '#94a3b8' },
        ],
        habitStats: habitStats.map((h) => ({
          habit: h.studyHabit || 'Chưa chọn',
          count: h._count.id,
        })),
        timeStats: timeStats.map((t) => ({
          time: t.preferredTime || 'evening',
          count: t._count.id,
        })),
      },
      recent: {
        users: allUsers,
        payments: allPayments,
        sessions: allSessions,
        rooms: recentRooms,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ message: 'Lỗi tải dữ liệu thống kê' }, { status: 500 });
  }
}
