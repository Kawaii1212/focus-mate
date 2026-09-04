import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      id, userId, taskTitle, targetMinutes, actualMinutes, 
      completionPct, expEarned, coinEarned, isValid, 
      streakSaved, plannerBlockId, date, createdAt 
    } = body;

    const newSession = await prisma.studySession.create({
      data: {
        id: id || undefined,
        userId,
        taskTitle,
        targetMinutes,
        actualMinutes,
        completionPct,
        expEarned,
        coinEarned,
        isValid: isValid || false,
        streakSaved: streakSaved || false,
        plannerBlockId,
        date,
        createdAt,
      }
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Error creating study session:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
