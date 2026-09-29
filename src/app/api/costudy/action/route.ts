import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, roomId, userId, name, mascotPersonaId, status, pomodoro } = body;

    const room = await prisma.activeRoom.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ message: "Room not found" }, { status: 404 });

    if (action === 'join') {
      // Capacity: only block NEW members when the room is full.
      // Existing members may always re-enter (refresh, second tab, etc.).
      const existingMembership = await prisma.roomMember.findUnique({ where: { id: userId } });
      if (existingMembership?.roomId !== roomId) {
        const memberCount = await prisma.roomMember.count({ where: { roomId } });
        if (memberCount >= room.maxMembers) {
          return NextResponse.json({ message: 'Room is full' }, { status: 409 });
        }
      }
      await prisma.roomMember.upsert({
        where: { id: userId },
        update: { roomId, name, mascotPersonaId: String(mascotPersonaId), lastCheckIn: new Date() },
        create: { id: userId, roomId, name, mascotPersonaId: String(mascotPersonaId) }
      });
    } else if (action === 'leave') {
      await prisma.roomMember.delete({ where: { id: userId } }).catch(() => {});

      const remainingMembers = await prisma.roomMember.findMany({
        where: { roomId },
        select: { id: true }
      });
      if (remainingMembers.length === 0) {
        await prisma.activeRoom.delete({ where: { id: roomId } }).catch(() => {});
      } else {
        // Re-read hostId after the delete: a concurrent leave may have already
        // reassigned it, and we must not orphan the host role.
        const roomNow = await prisma.activeRoom.findUnique({
          where: { id: roomId },
          select: { hostId: true }
        });
        if (roomNow && roomNow.hostId === userId) {
          // Reassign the host (lowest user id for determinism) so shared
          // pomodoro control is not orphaned when the original host leaves.
          const nextHostId = remainingMembers.map((m) => m.id).sort()[0];
          await prisma.activeRoom
            .update({ where: { id: roomId }, data: { hostId: nextHostId } })
            .catch(() => {});
        }
      }
    } else if (action === 'status') {
      await prisma.roomMember.update({
        where: { id: userId },
        data: { status, lastCheckIn: new Date() }
      }).catch(() => {});
    } else if (action === 'sync') {
      // Anyone in the room may control the shared pomodoro (no host gate).
      const endsAt = pomodoro?.isActive
        ? new Date(Date.now() + Math.max(0, Math.floor(pomodoro.timeLeft ?? 0)) * 1000)
        : null;
      await prisma.activeRoom.update({
        where: { id: roomId },
        data: {
          pomodoroTimeLeft: pomodoro.timeLeft,
          pomodoroIsActive: pomodoro.isActive,
          pomodoroMode: pomodoro.mode,
          pomodoroEndsAt: endsAt
        }
      });
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
        mode: updatedRoom.pomodoroMode,
        endsAt: updatedRoom.pomodoroEndsAt ? updatedRoom.pomodoroEndsAt.getTime() : null
      },
      members: updatedRoom.members.reduce((acc, m) => ({ ...acc, [m.id]: m }), {})
    });
  } catch (error) {
    console.error("Action error:", error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
