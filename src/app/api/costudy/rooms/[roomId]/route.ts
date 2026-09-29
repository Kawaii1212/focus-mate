import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const DEFAULT_FOCUS_SECONDS = 25 * 60;
const IDLE_RESET_MS = 90_000;

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
    // Nếu phòng đã idle (mọi member đều quá hạn heartbeat = không ai online),
    // reset đồng hồ về focus 25p pause để người mở link thấy session mới.
    const now = Date.now();
    const idle =
      room.members.length === 0 ||
      room.members.every((m) => now - new Date(m.lastCheckIn).getTime() > IDLE_RESET_MS);
    const stale =
      room.pomodoroIsActive || room.pomodoroMode !== 'focus' || room.pomodoroTimeLeft !== DEFAULT_FOCUS_SECONDS;
    let pomodoro = {
      timeLeft: room.pomodoroTimeLeft,
      isActive: room.pomodoroIsActive,
      mode: room.pomodoroMode,
      endsAt: room.pomodoroEndsAt ? room.pomodoroEndsAt.getTime() : null,
    };
    if (idle && stale) {
      await prisma.activeRoom
        .update({
          where: { id: roomId },
          data: {
            pomodoroTimeLeft: DEFAULT_FOCUS_SECONDS,
            pomodoroIsActive: false,
            pomodoroMode: 'focus',
            pomodoroEndsAt: null,
          },
        })
        .catch(() => {});
      pomodoro = { timeLeft: DEFAULT_FOCUS_SECONDS, isActive: false, mode: 'focus', endsAt: null };
    }
    return NextResponse.json({
      id: room.id,
      name: room.name,
      hostId: room.hostId,
      maxMembers: room.maxMembers,
      checkInIntervalMinutes: room.checkInIntervalMinutes,
      sharedMinutes: room.sharedMinutes,
      pomodoro,
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
