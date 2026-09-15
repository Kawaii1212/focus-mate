import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyWebhookPayload } from '@/lib/payos';
import { PLAN_CONFIG } from '@/lib/payos';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || !body.data) {
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    let verifiedData: any;
    try {
      verifiedData = await verifyWebhookPayload(body);
    } catch {
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    if (verifiedData.code !== '00' || !verifiedData.success) {
      return NextResponse.json({ message: 'Payment not successful' }, { status: 200 });
    }

    const orderCode = verifiedData.orderCode;
    if (typeof orderCode !== 'number') {
      return NextResponse.json({ message: 'Invalid orderCode' }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { orderCode },
    });

    if (!payment) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
    }

    if (payment.status === 'paid') {
      return NextResponse.json({ message: 'Already processed' }, { status: 200 });
    }

    const now = new Date();
    const config = PLAN_CONFIG[payment.planId as keyof typeof PLAN_CONFIG];

    if (!config) {
      return NextResponse.json({ message: 'Invalid planId' }, { status: 400 });
    }

    let premiumExpiry: Date | null = null;

    if (config.durationDays) {
      const user = await prisma.user.findUnique({
        where: { id: payment.userId },
        select: { isPremium: true, premiumExpiry: true },
      });

      if (user?.isPremium && user.premiumExpiry && user.premiumExpiry > now) {
        premiumExpiry = new Date(user.premiumExpiry.getTime() + config.durationDays * 24 * 60 * 60 * 1000);
      } else {
        premiumExpiry = new Date(now.getTime() + config.durationDays * 24 * 60 * 60 * 1000);
      }
    }

    await prisma.$transaction([
      prisma.payment.update({
        where: { orderCode },
        data: {
          status: 'paid',
          payosTransactionId: verifiedData.reference || null,
          paidAt: now,
        },
      }),
      prisma.user.update({
        where: { id: payment.userId },
        data: {
          isPremium: true,
          premiumExpiry,
        },
      }),
    ]);

    return NextResponse.json({ message: 'OK' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ message: 'OK' }, { status: 200 });
  }
}
