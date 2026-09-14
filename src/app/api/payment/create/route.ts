import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createPaymentLink } from '@/lib/payos';
import type { PremiumPlan } from '@/types';

const VALID_PLANS: PremiumPlan[] = ['vip', 'monthly', 'yearly'];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, planId } = body;

    if (!userId || !planId) {
      return NextResponse.json({ message: 'userId and planId are required' }, { status: 400 });
    }

    if (typeof userId !== 'string' || userId.length < 10) {
      return NextResponse.json({ message: 'Invalid userId' }, { status: 400 });
    }

    if (!VALID_PLANS.includes(planId)) {
      return NextResponse.json({ message: 'Invalid planId' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const result = await createPaymentLink({ userId, planId });

    const payment = await prisma.payment.create({
      data: {
        orderCode: result.orderCode,
        userId,
        planId,
        amount: result.amount,
        status: 'pending',
        paymentLink: result.checkoutUrl,
      },
    });

    return NextResponse.json({
      paymentId: payment.id,
      orderCode: result.orderCode,
      checkoutUrl: result.checkoutUrl,
      qrCode: result.qrCode,
      amount: result.amount,
      description: result.description,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
