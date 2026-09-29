import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { ChatMessage } from '@/types';

const MAX_PAGE_SIZE = 100;

const sendSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).max(60),
  mascotPersonaId: z.coerce.number().int().min(0).max(5),
  // 500 chars for text + reply-quote overhead; media data URLs up to ~300KB
  // (client fits images/files under MAX_MEDIA_CHARS; stays broadcast-safe).
  content: z.string().trim().min(1).max(300000),
});

function toChatMessage(row: {
  id: string;
  roomId: string;
  userId: string;
  senderName: string;
  mascotPersonaId: string;
  content: string;
  createdAt: Date;
}): ChatMessage {
  return {
    id: row.id,
    roomId: row.roomId,
    userId: row.userId,
    senderName: row.senderName,
    mascotPersonaId: (Number(row.mascotPersonaId) || 0) as ChatMessage['mascotPersonaId'],
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  };
}

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { searchParams } = request.nextUrl;

    const room = await prisma.activeRoom.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), MAX_PAGE_SIZE);
    const before = parseDateParam(searchParams.get('before'));
    const after = parseDateParam(searchParams.get('after'));

    let messages;
    if (after) {
      // Catch-up sync: everything newer than the client's newest message
      messages = await prisma.roomMessage.findMany({
        where: { roomId, createdAt: { gt: after } },
        orderBy: { createdAt: 'asc' },
        take: MAX_PAGE_SIZE,
      });
    } else if (before) {
      // Backward pagination: load older history
      const rows = await prisma.roomMessage.findMany({
        where: { roomId, createdAt: { lt: before } },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      messages = rows.reverse();
    } else {
      // Default: latest messages, returned oldest-first
      const rows = await prisma.roomMessage.findMany({
        where: { roomId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      messages = rows.reverse();
    }

    return NextResponse.json(messages.map(toChatMessage));
  } catch (error) {
    console.error('GET messages error:', error);
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

    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid message', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const room = await prisma.activeRoom.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    const created = await prisma.roomMessage.create({
      data: {
        roomId,
        userId: parsed.data.userId,
        senderName: parsed.data.name,
        mascotPersonaId: String(parsed.data.mascotPersonaId),
        content: parsed.data.content,
      },
    });

    return NextResponse.json(toChatMessage(created), { status: 201 });
  } catch (error) {
    console.error('POST message error:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
