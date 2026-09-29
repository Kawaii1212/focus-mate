import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Khi không còn ai online, đồng hồ chung reset về session focus mặc định 25p (pause).
const DEFAULT_FOCUS_SECONDS = 25 * 60;
// Phòng được coi là "không ai online" khi mọi member đều không heartbeat
// quá ngưỡng này. Client poll mỗi 30s nên 90s chịu được 2 lần poll lỗi / lag.
const IDLE_RESET_MS = 90_000;

function isIdle(lastCheckIns: Date[], now: number): boolean {
  if (lastCheckIns.length === 0) return true;
  return lastCheckIns.every((d) => now - new Date(d).getTime() > IDLE_RESET_MS);
}

function needsPomodoroReset(room: {
  pomodoroTimeLeft: number;
  pomodoroIsActive: boolean;
  pomodoroMode: string;
}): boolean {
  return (
    room.pomodoroIsActive ||
    room.pomodoroMode !== 'focus' ||
    room.pomodoroTimeLeft !== DEFAULT_FOCUS_SECONDS
  );
}

async function resetPomodoroToDefault(roomId: string) {
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
}

export async function POST(request: Request) {
  // Parse defensively: some clients (e.g. sendBeacon on unload) may deliver
  // an empty or non-JSON body, which must be a 400 — never a 500.
  let body: Record<string, any> | null = null;
  try {
    const text = await request.text();
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  try {
    const { action, roomId, userId, name, mascotPersonaId, status, pomodoro, focusMinutes, breakMinutes } = body;

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
      // Nếu trước khi join mà phòng đã idle (không ai online — mọi
      // lastCheckIn đều quá hạn), reset đồng hồ về focus 25p pause để người
      // vào thấy session mới thay vì timer cũ còn dở.
      const membersBefore = await prisma.roomMember.findMany({
        where: { roomId },
        select: { id: true, lastCheckIn: true },
      });
      const othersBefore = membersBefore.filter((m) => m.id !== userId);
      const wasIdle =
        existingMembership?.roomId !== roomId &&
        (othersBefore.length === 0 || isIdle(othersBefore.map((m) => m.lastCheckIn), Date.now()));
      await prisma.roomMember.upsert({
        where: { id: userId },
        update: { roomId, name, mascotPersonaId: String(mascotPersonaId), lastCheckIn: new Date() },
        create: { id: userId, roomId, name, mascotPersonaId: String(mascotPersonaId) }
      });
      if (wasIdle && needsPomodoroReset(room)) {
        await resetPomodoroToDefault(roomId);
      }
    } else if (action === 'leave') {
      await prisma.roomMember.delete({ where: { id: userId } }).catch(() => {});

      const remainingMembers = await prisma.roomMember.findMany({
        where: { roomId },
        select: { id: true, lastCheckIn: true }
      });
      if (remainingMembers.length === 0) {
        await prisma.activeRoom.delete({ where: { id: roomId } }).catch(() => {});
      } else {
        // Re-read hostId after the delete: a concurrent leave may have already
        // reassigned it, and we must not orphan the host role.
        const roomNow = await prisma.activeRoom.findUnique({
          where: { id: roomId },
          select: { hostId: true, pomodoroTimeLeft: true, pomodoroIsActive: true, pomodoroMode: true }
        });
        if (roomNow && roomNow.hostId === userId) {
          // Reassign the host (lowest user id for determinism) so shared
          // pomodoro control is not orphaned when the original host leaves.
          const nextHostId = remainingMembers.map((m) => m.id).sort()[0];
          await prisma.activeRoom
            .update({ where: { id: roomId }, data: { hostId: nextHostId } })
            .catch(() => {});
        }
        // Người rời đi là người online cuối cùng (các member còn lại đều
        // stale) -> reset đồng hồ về focus 25p pause cho lượt vào sau.
        if (
          isIdle(remainingMembers.map((m) => m.lastCheckIn), Date.now()) &&
          roomNow &&
          needsPomodoroReset(roomNow)
        ) {
          await resetPomodoroToDefault(roomId);
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
      // Heartbeat: caller vẫn online nên giữ lastCheckIn tươi để không bị
      // tính là idle và reset nhầm khi người khác rời phòng.
      await prisma.roomMember
        .update({ where: { id: userId }, data: { lastCheckIn: new Date() } })
        .catch(() => {});
    } else if (action === 'settings') {
      // Anyone in the room may adjust the shared session lengths.
      const nextFocus = Math.min(180, Math.max(5, Math.floor(Number(focusMinutes) || 25)));
      const nextBreak = Math.min(60, Math.max(5, Math.floor(Number(breakMinutes) || 5)));
      await prisma.activeRoom.update({
        where: { id: roomId },
        data: { focusMinutes: nextFocus, breakMinutes: nextBreak }
      });
      await prisma.roomMember
        .update({ where: { id: userId }, data: { lastCheckIn: new Date() } })
        .catch(() => {});
    } else if (action === 'poll') {
      // Heartbeat cho poll 30s của client đang online. Nhờ đó server biết
      // phòng còn người (không idle) và không reset đồng hồ nhầm.
      await prisma.roomMember
        .update({ where: { id: userId }, data: { lastCheckIn: new Date() } })
        .catch(() => {});
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
      settings: {
        focusMinutes: updatedRoom.focusMinutes,
        breakMinutes: updatedRoom.breakMinutes
      },
      members: updatedRoom.members.reduce((acc, m) => ({ ...acc, [m.id]: m }), {})
    });
  } catch (error) {
    console.error("Action error:", error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
