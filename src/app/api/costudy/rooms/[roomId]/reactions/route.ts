import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const toggleSchema = z.object({
  messageId: z.string().min(1).max(100),
  emoji: z.string().trim().min(1).max(20),
  userId: z.string().min(1).max(100),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const room = await prisma.activeRoom.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }
    const rows = await prisma.roomReaction.findMany({
      where: { roomId },
      select: { messageId: true, emoji: true, userId: true },
      take: 2000,
    });
    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET reactions error:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const parsed = toggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid reaction', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { messageId, emoji, userId } = parsed.data;

    const room = await prisma.activeRoom.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }
    const message = await prisma.roomMessage.findUnique({ where: { id: messageId } });
    if (!message || message.roomId !== roomId) {
      return NextResponse.json({ message: 'Message not found' }, { status: 404 });
    }

    const existing = await prisma.roomReaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });
    if (existing) {
      await prisma.roomReaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ added: false, messageId, emoji, userId });
    }

    await prisma.roomReaction.create({
      data: { roomId, messageId, userId, emoji },
    });
    return NextResponse.json({ added: true, messageId, emoji, userId }, { status: 201 });
  } catch (error) {
    console.error('POST reaction error:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
