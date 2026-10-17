import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'all';
    const isPremium = searchParams.get('isPremium') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10')));
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const where: any = {};

    if (search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    if (role !== 'all') {
      where.role = role;
    }

    if (isPremium === 'true') {
      where.isPremium = true;
    } else if (isPremium === 'false') {
      where.isPremium = false;
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          mascot: true,
          _count: {
            select: {
              sessions: true,
              deadlines: true,
              payments: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ message: 'L?i t?i danh s�ch ngu?i d�ng' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role = 'user', isPremium = false, studyHabit = 'Pomodoro', goal = 'T?p trung h?c t?p', preferredTime = 'evening' } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Vui l�ng di?n d?y d? t�n, email v� m?t kh?u' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return NextResponse.json({ message: 'Email n�y d� du?c s? d?ng' }, { status: 409 });
    }

    const createData: any = {
        name,
        email: email.trim().toLowerCase(),
        passwordHash: password,
        role,
        isPremium: Boolean(isPremium),
        studyHabit,
        goal,
        preferredTime,
        onboardingComplete: true,
        mascot: {
          create: {
            personaId: '0',
            stage: 'baby',
            level: 1,
            exp: 0,
            expToNextLevel: 100,
            coin: 100,
            energy: 100,
            streakShields: 2,
            name: 'Mascot c?a ' + name,
          },
        },
      };
    const user = await prisma.user.create({
      data: createData,

      include: { mascot: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Admin user create error:', error);
    return NextResponse.json({ message: 'L?i t?o ngu?i d�ng m?i' }, { status: 500 });
  }
}
