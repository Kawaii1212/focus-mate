import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { mascot: true }
    });

    // In a real app, you would hash passwords!
    if (!user || user.passwordHash !== password) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    if (user.mascot) {
      (user.mascot as any).personaId = parseInt(user.mascot.personaId);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
