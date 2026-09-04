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

    const data: any = {
      name,
      hostId,
      maxMembers,
      checkInIntervalMinutes
    };
    if (id) data.id = id;

    const newRoom = await prisma.activeRoom.create({
      data,
      include: { members: true }
    });

    return NextResponse.json(newRoom);
  } catch (error) {
    console.error("CREATE room error:", error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
