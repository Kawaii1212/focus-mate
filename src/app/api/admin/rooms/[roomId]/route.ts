import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;

    await prisma.activeRoom.delete({
      where: { id: roomId },
    });

    return NextResponse.json({ success: true, message: '�� gi?i t�n ph�ng th�nh c�ng' });
  } catch (error) {
    console.error('Admin room DELETE error:', error);
    return NextResponse.json({ message: 'L?i gi?i t�n ph�ng' }, { status: 500 });
  }
}
