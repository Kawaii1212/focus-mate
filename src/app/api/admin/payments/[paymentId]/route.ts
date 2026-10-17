import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  try {
    const { paymentId } = await params;
    const body = await request.json();
    const { status } = body;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json({ message: 'Không tìm thấy giao dịch' }, { status: 404 });
    }

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        paidAt: status === 'paid' ? new Date() : payment.paidAt,
      },
    });

    // If marked as paid, automatically grant premium to the user!
    if (status === 'paid' && payment.userId) {
      const now = new Date();
      const expiry = new Date();
      if (payment.planId === 'yearly') {
        expiry.setFullYear(now.getFullYear() + 1);
      } else {
        expiry.setMonth(now.getMonth() + 1);
      }

      await prisma.user.update({
        where: { id: payment.userId },
        data: {
          isPremium: true,
          premiumExpiry: expiry,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật trạng thái đơn hàng sang ${status}`,
      payment: updated,
    });
  } catch (error) {
    console.error('Admin payment PATCH error:', error);
    return NextResponse.json({ message: 'Lỗi cập nhật giao dịch' }, { status: 500 });
  }
}
