import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, body: messageBody, type = 'system', target = 'all', url } = body;

    if (!title || !messageBody) {
      return NextResponse.json({ message: 'Vui lòng nhập tiêu đề và nội dung thông báo' }, { status: 400 });
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
      return NextResponse.json({ message: 'Không có người dùng nào khớp với đối tượng nhận' }, { status: 400 });
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
      message: `Đã gửi thông báo thành công tới ${recipients.length} người dùng!`,
      sentCount: recipients.length,
    });
  } catch (error) {
    console.error('Admin broadcast notification error:', error);
    return NextResponse.json({ message: 'Lỗi phát thông báo hệ thống' }, { status: 500 });
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
    return NextResponse.json({ message: 'Lỗi tải lịch sử thông báo' }, { status: 500 });
  }
}
