import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await context.params;
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

    if (user.mascot) {
      (user.mascot as any).personaId = parseInt(user.mascot.personaId);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await context.params;
    const body = await request.json();
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: body,
      include: { mascot: true }
    });

    if (updatedUser.mascot) {
      (updatedUser.mascot as any).personaId = parseInt(updatedUser.mascot.personaId);
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
