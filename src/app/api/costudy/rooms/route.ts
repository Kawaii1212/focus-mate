import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const rooms = await prisma.activeRoom.findMany({
      include: { members: true }
    });
    // Transform to match frontend format
    const formattedRooms = rooms.map(room => ({
      ...room,
      members: room.members.reduce((acc, m) => ({ ...acc, [m.id]: m }), {})
    }));
    return NextResponse.json(formattedRooms);
  } catch (error) {
    console.error("GET rooms error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, hostId, maxMembers, checkInIntervalMinutes } = body;

    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ message: 'Invalid room name' }, { status: 400 });
    }

    const data: any = {
      name: name.trim(),
      hostId,
      maxMembers,
      checkInIntervalMinutes
    };
    if (id) data.id = id;

    const newRoom = await prisma.activeRoom.create({
      data,
      include: { members: true }
    });

    // Shape matches CoStudyRoomData (same contract as GET /api/costudy/rooms/[roomId])
    return NextResponse.json({
      id: newRoom.id,
      name: newRoom.name,
      hostId: newRoom.hostId,
      maxMembers: newRoom.maxMembers,
      checkInIntervalMinutes: newRoom.checkInIntervalMinutes,
      sharedMinutes: newRoom.sharedMinutes,
      pomodoro: {
        timeLeft: newRoom.pomodoroTimeLeft,
        isActive: newRoom.pomodoroIsActive,
        mode: newRoom.pomodoroMode,
        endsAt: newRoom.pomodoroEndsAt ? newRoom.pomodoroEndsAt.getTime() : null,
      },
      members: newRoom.members.reduce((acc, m) => ({ ...acc, [m.id]: m }), {})
    });
  } catch (error) {
    console.error("CREATE room error:", error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
