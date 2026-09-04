import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// In api.ts, GET is called with userId: fetch(`/api/plannerblock/${userId}`)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id;
    const blocks = await prisma.plannerBlock.findMany({
      where: { userId }
    });
    return NextResponse.json(blocks);
  } catch (error) {
    console.error("Error fetching planner blocks:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// In api.ts, PUT is called with blockId: fetch(`/api/plannerblock/${id}`)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const blockId = params.id;
    const body = await request.json();
    const { title, date, startTime, endTime, type, relatedDeadlineId, status } = body;

    const updatedBlock = await prisma.plannerBlock.update({
      where: { id: blockId },
      data: {
        title,
        date: date ? new Date(date) : undefined,
        startTime,
        endTime,
        type,
        relatedDeadlineId,
        status,
      }
    });

    return NextResponse.json(updatedBlock);
  } catch (error) {
    console.error("Error updating planner block:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const blockId = params.id;
    await prisma.plannerBlock.delete({
      where: { id: blockId }
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting planner block:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
