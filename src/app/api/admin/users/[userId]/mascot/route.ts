import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { coin, streakShields, level, exp, name, personaId, energy } = body;

    const updateData: any = {};
    if (coin !== undefined) updateData.coin = parseInt(coin);
    if (streakShields !== undefined) updateData.streakShields = parseInt(streakShields);
    if (level !== undefined) updateData.level = parseInt(level);
    if (exp !== undefined) updateData.exp = parseInt(exp);
    if (energy !== undefined) updateData.energy = parseInt(energy);
    if (name !== undefined) updateData.name = name;
    if (personaId !== undefined) updateData.personaId = String(personaId);

    const mascot = await prisma.mascot.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        personaId: String(personaId || '0'),
        stage: 'baby',
        level: level || 1,
        exp: exp || 0,
        expToNextLevel: 100,
        coin: coin !== undefined ? parseInt(coin) : 100,
        energy: energy !== undefined ? parseInt(energy) : 100,
        streakShields: streakShields !== undefined ? parseInt(streakShields) : 2,
        name: name || 'Mascot',
      },
    });

    return NextResponse.json(mascot);
  } catch (error) {
    console.error('Admin mascot update error:', error);
    return NextResponse.json({ message: 'L?i c?p nh?t linh v?t' }, { status: 500 });
  }
}
