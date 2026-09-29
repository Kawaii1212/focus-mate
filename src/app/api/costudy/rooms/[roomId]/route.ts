import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const room = await prisma.activeRoom.findUnique({
      where: { id: roomId },
      include: { members: true },
    });
    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: room.id,
      name: room.name,
      hostId: room.hostId,
      maxMembers: room.maxMembers,
      checkInIntervalMinutes: room.checkInIntervalMinutes,
      sharedMinutes: room.sharedMinutes,
      pomodoro: {
        timeLeft: room.pomodoroTimeLeft,
        isActive: room.pomodoroIsActive,
        mode: room.pomodoroMode,
        endsAt: room.pomodoroEndsAt ? room.pomodoroEndsAt.getTime() : null,
      },
      settings: {
        focusMinutes: room.focusMinutes,
        breakMinutes: room.breakMinutes,
      },
      members: room.members.reduce((acc, m) => ({ ...acc, [m.id]: m }), {}),
    });
  } catch (error) {
    console.error('GET room error:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
