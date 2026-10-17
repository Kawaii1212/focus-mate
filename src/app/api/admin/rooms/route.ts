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
    return NextResponse.json({ message: 'L?i t?i danh s�ch ph�ng h?c' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'cleanup';

    if (action === 'cleanup') {
      // Remove rooms with 0 members
      const emptyRooms = await prisma.activeRoom.findMany({
        where: { members: { none: {} } },
      });

      const deleted = await prisma.activeRoom.deleteMany({
        where: { members: { none: {} } },
      });

      return NextResponse.json({
        success: true,
        message: `�� d?n d?p ${deleted.count} ph�ng kh�ng c� th�nh vi�n`,
        count: deleted.count,
      });
    }

    return NextResponse.json({ message: 'H�nh d?ng kh�ng h?p l?' }, { status: 400 });
  } catch (error) {
    console.error('Admin rooms POST error:', error);
    return NextResponse.json({ message: 'L?i d?n d?p ph�ng' }, { status: 500 });
  }
}
