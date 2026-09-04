import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// In api.ts, GET is called with userId: fetch(`/api/deadline/${userId}`)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id;
    const deadlines = await prisma.deadline.findMany({
      where: { userId }
    });
    return NextResponse.json(deadlines);
  } catch (error) {
    console.error("Error fetching deadlines:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// In api.ts, PUT is called with deadlineId: fetch(`/api/deadline/${id}`)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const deadlineId = params.id;
    const body = await request.json();
    const { title, date, importance, isCompleted, estimatedHours } = body;

    const updatedDeadline = await prisma.deadline.update({
      where: { id: deadlineId },
      data: {
        title,
        date: date ? new Date(date) : undefined,
        importance,
        isCompleted,
        estimatedHours
      }
    });

    return NextResponse.json(updatedDeadline);
  } catch (error) {
    console.error("Error updating deadline:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const deadlineId = params.id;
    await prisma.deadline.delete({
      where: { id: deadlineId }
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting deadline:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
