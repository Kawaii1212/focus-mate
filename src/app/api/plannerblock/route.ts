import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, userId, title, date, startTime, endTime, type, relatedDeadlineId, status } = body;

    const newBlock = await prisma.plannerBlock.create({
      data: {
        id: id || undefined,
        userId,
        title,
        date: new Date(date),
        startTime,
        endTime,
        type,
        relatedDeadlineId,
        status: status || "pending",
      }
    });

    return NextResponse.json(newBlock, { status: 201 });
  } catch (error) {
    console.error("Error creating planner block:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
