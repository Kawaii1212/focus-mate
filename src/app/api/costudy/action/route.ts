import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, roomId, userId, name, mascotPersonaId, status, pomodoro } = body;

    const room = await prisma.activeRoom.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ message: "Room not found" }, { status: 404 });

    if (action === 'join') {
      await prisma.roomMember.upsert({
        where: { id: userId },
        update: { roomId, name, mascotPersonaId: String(mascotPersonaId), lastCheckIn: new Date() },
        create: { id: userId, roomId, name, mascotPersonaId: String(mascotPersonaId) }
      });
    } else if (action === 'leave') {
      await prisma.roomMember.delete({ where: { id: userId } }).catch(() => {});
      
      const remainingMembers = await prisma.roomMember.count({ where: { roomId } });
      if (remainingMembers === 0) {
        await prisma.activeRoom.delete({ where: { id: roomId } }).catch(() => {});
      }
    } else if (action === 'status') {
      await prisma.roomMember.update({
        where: { id: userId },
        data: { status, lastCheckIn: new Date() }
      }).catch(() => {});
    } else if (action === 'sync') {
      if (room.hostId === userId) {
        await prisma.activeRoom.update({
          where: { id: roomId },
          data: {
            pomodoroTimeLeft: pomodoro.timeLeft,
            pomodoroIsActive: pomodoro.isActive,
            pomodoroMode: pomodoro.mode
          }
        });
      }
    } else if (action === 'poll') {
      // Just returning the room state below
    }

    // Return updated room state
    const updatedRoom = await prisma.activeRoom.findUnique({
      where: { id: roomId },
      include: { members: true }
    });

    if (!updatedRoom) return NextResponse.json({ message: "Room deleted" }, { status: 404 });

    return NextResponse.json({
      ...updatedRoom,
      pomodoro: {
        timeLeft: updatedRoom.pomodoroTimeLeft,
        isActive: updatedRoom.pomodoroIsActive,
        mode: updatedRoom.pomodoroMode
      },
      members: updatedRoom.members.reduce((acc, m) => ({ ...acc, [m.id]: m }), {})
    });
  } catch (error) {
    console.error("Action error:", error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
