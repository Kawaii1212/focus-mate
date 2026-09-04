import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params;
  try {
    const sessions = await prisma.studySession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching study sessions:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
