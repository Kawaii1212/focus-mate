import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        mascot: true,
        sessions: true,
        deadlines: true,
        fixedBlocks: true,
        plannerBlocks: true,
      }
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
