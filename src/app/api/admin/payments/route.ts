import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const planId = searchParams.get('planId') || 'all';
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (status !== 'all') {
      where.status = status;
    }
    if (planId !== 'all') {
      where.planId = planId;
    }

    if (search.trim()) {
      where.OR = [
        { user: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { user: { email: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isPremium: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalPaid = payments
      .filter((p) => p.status === 'paid')
      .reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalPending = payments
      .filter((p) => p.status === 'pending')
      .reduce((acc, p) => acc + (p.amount || 0), 0);

    return NextResponse.json({
      payments,
      summary: {
        totalOrders: payments.length,
        totalPaid,
        totalPending,
      },
    });
  } catch (error) {
    console.error('Admin payments GET error:', error);
    return NextResponse.json({ message: 'Lỗi tải danh sách thanh toán' }, { status: 500 });
  }
}
