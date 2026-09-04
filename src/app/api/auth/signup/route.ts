import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, goal, studyHabit, preferredTime } = body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ message: "Email already in use" }, { status: 400 });
    }

    const newUser = await prisma.user.create({
      data: {
        name: name || '',
        email: email || '',
        passwordHash: password || '', // Simple hash for demo
        goal: goal || '',
        studyHabit: studyHabit || '',
        preferredTime: preferredTime || '',
      }
    });

    return NextResponse.json(newUser);
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
