import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId') || 'all';
    const search = searchParams.get('search') || '';

    // Trang admin chỉ hiển thị giao dịch đã thanh toán thành công.
    // Trạng thái đơn do PayOS webhook (/api/payment/webhook) tự cập nhật,
    // không cần admin duyệt thủ công.
    const where: any = { status: 'paid' };
    if (planId !== 'all') {
      where.planId = planId;
    }

    const q = search.trim();
    if (q) {
      const orderCode = parseInt(q.replace('#', ''), 10);
      const orFilters: any[] = [
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
      if (Number.isFinite(orderCode)) {
        orFilters.push({ orderCode });
      }
      where.OR = orFilters;
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

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const paidThisMonth = payments
      .filter((p) => new Date(p.paidAt || p.createdAt) >= monthStart)
      .reduce((acc, p) => acc + (p.amount || 0), 0);
    const customers = new Set(payments.map((p) => p.userId)).size;

    return NextResponse.json({
      payments,
      summary: {
        totalOrders: payments.length,
        totalPaid,
        paidThisMonth,
        customers,
      },
    });
  } catch (error) {
    console.error('Admin payments GET error:', error);
    return NextResponse.json({ message: 'Lỗi tải danh sách thanh toán' }, { status: 500 });
  }
}
