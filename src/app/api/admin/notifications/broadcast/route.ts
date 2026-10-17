import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, body: messageBody, type = 'system', target = 'all', url } = body;

    if (!title || !messageBody) {
      return NextResponse.json({ message: 'Vui l�ng nh?p ti�u d? v� n?i dung th�ng b�o' }, { status: 400 });
    }

    const whereUser: any = {};
    if (target === 'premium') {
      whereUser.isPremium = true;
    } else if (target === 'free') {
      whereUser.isPremium = false;
    }

    const recipients = await prisma.user.findMany({
      where: whereUser,
      select: { id: true },
    });

    if (recipients.length === 0) {
      return NextResponse.json({ message: 'Kh�ng c� ngu?i d�ng n�o kh?p v?i d?i tu?ng nh?n' }, { status: 400 });
    }

    // Insert notifications for each user
    const notificationsData = recipients.map((u) => ({
      userId: u.id,
      title,
      body: messageBody,
      type,
      url: url || '/dashboard',
    }));

    await prisma.notification.createMany({
      data: notificationsData,
    });

    return NextResponse.json({
      success: true,
      message: `�� g?i th�ng b�o th�nh c�ng t?i ${recipients.length} ngu?i d�ng!`,
      sentCount: recipients.length,
    });
  } catch (error) {
    console.error('Admin broadcast notification error:', error);
    return NextResponse.json({ message: 'L?i ph�t th�ng b�o h? th?ng' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const recent = await prisma.notification.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
      },
    });
    return NextResponse.json(recent);
  } catch (error) {
    return NextResponse.json({ message: 'L?i t?i l?ch s? th�ng b�o' }, { status: 500 });
  }
}
