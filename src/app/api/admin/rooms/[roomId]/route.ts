import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;

    await prisma.activeRoom.delete({
      where: { id: roomId },
    });

    return NextResponse.json({ success: true, message: 'Đã giải tán phòng thành công' });
  } catch (error) {
    console.error('Admin room DELETE error:', error);
    return NextResponse.json({ message: 'Lỗi giải tán phòng' }, { status: 500 });
  }
}
