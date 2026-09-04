import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, userId, title, date, importance, estimatedHours } = body;

    const newDeadline = await prisma.deadline.create({
      data: {
        id: id || undefined,
        userId,
        title,
        date: new Date(date),
        importance: importance || 'medium',
        estimatedHours,
      }
    });

    return NextResponse.json(newDeadline, { status: 201 });
  } catch (error) {
    console.error("Error creating deadline:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
