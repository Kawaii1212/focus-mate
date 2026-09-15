import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'userId is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isPremium: true,
        premiumExpiry: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const isExpired = user.premiumExpiry && new Date(user.premiumExpiry) < new Date();

    return NextResponse.json({
      isPremium: user.isPremium && !isExpired,
      premiumExpiry: user.premiumExpiry,
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
