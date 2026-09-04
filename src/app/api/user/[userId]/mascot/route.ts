import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params;
  try {
    const body = await request.json();
    const { personaId, stage, level, exp, expToNextLevel, coin, energy, streakShields, name } = body;

    const mascot = await prisma.mascot.upsert({
      where: { userId },
      update: {
        personaId: personaId.toString(),
        stage,
        level,
        exp,
        expToNextLevel,
        coin,
        energy,
        streakShields,
        name
      },
      create: {
        userId,
        personaId: personaId.toString(),
        stage: stage || 'baby',
        level: level || 1,
        exp: exp || 0,
        expToNextLevel: expToNextLevel || 100,
        coin: coin || 50,
        energy: energy || 100,
        streakShields: streakShields || 1,
        name: name || "My Mascot"
      }
    });

    (mascot as any).personaId = parseInt(mascot.personaId);
    return NextResponse.json(mascot);
  } catch (error) {
    console.error("Error updating mascot:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
