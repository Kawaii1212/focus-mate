import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        mascot: true,
        sessions: { take: 15, orderBy: { createdAt: 'desc' } },
        deadlines: { take: 10, orderBy: { date: 'asc' } },
        payments: { take: 10, orderBy: { createdAt: 'desc' } },
        fixedBlocks: true,
        notificationSetting: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Kh�ng t�m th?y ngu?i d�ng' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Admin user detail GET error:', error);
    return NextResponse.json({ message: 'L?i t?i th�ng tin chi ti?t' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { name, email, role, isPremium, premiumExpiry, password } = body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email.trim().toLowerCase();
    if (role !== undefined) data.role = role;
    if (isPremium !== undefined) data.isPremium = Boolean(isPremium);
    if (premiumExpiry !== undefined) data.premiumExpiry = premiumExpiry ? new Date(premiumExpiry) : null;
    if (password) data.passwordHash = password;

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      include: { mascot: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Admin user PATCH error:', error);
    return NextResponse.json({ message: 'L?i c?p nh?t ngu?i d�ng' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true, message: '�� x�a ngu?i d�ng th�nh c�ng' });
  } catch (error) {
    console.error('Admin user DELETE error:', error);
    return NextResponse.json({ message: 'L?i x�a ngu?i d�ng' }, { status: 500 });
  }
}
