import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rooms = await prisma.activeRoom.findMany({
      include: {
        members: true,
        _count: {
          select: {
            messages: true,
            reactions: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Admin rooms GET error:', error);
    return NextResponse.json({ message: 'Lỗi tải danh sách phòng học' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'cleanup';

    if (action === 'cleanup') {
      // Remove rooms with 0 members
      const deleted = await prisma.activeRoom.deleteMany({
        where: { members: { none: {} } },
      });

      return NextResponse.json({
        success: true,
        message: `Đã dọn dẹp ${deleted.count} phòng không có thành viên`,
        count: deleted.count,
      });
    }

    return NextResponse.json({ message: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (error) {
    console.error('Admin rooms POST error:', error);
    return NextResponse.json({ message: 'Lỗi dọn dẹp phòng' }, { status: 500 });
  }
}
