import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, adminKey } = body;

    // Master Key login or direct passcode
    const validMasterKey = process.env.ADMIN_SECRET || 'admin123';
    if (adminKey && adminKey === validMasterKey) {
      return NextResponse.json({
        success: true,
        admin: {
          id: 'master-admin',
          name: 'FocusMate SuperAdmin',
          email: 'admin@focusmate.com',
          role: 'admin',
        },
        token: 'master-admin-token-' + Date.now(),
      });
    }

    if (!email) {
      return NextResponse.json({ message: 'Vui l�ng cung c?p email ho?c m� qu?n tr?' }, { status: 400 });
    }

    const user: any = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { mascot: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'T�i kho?n qu?n tr? kh�ng t?n t?i' }, { status: 404 });
    }

    if (user.passwordHash !== password) {
      return NextResponse.json({ message: 'M?t kh?u qu?n tr? kh�ng ch�nh x�c' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'T�i kho?n n�y kh�ng c� quy?n truy c?p trang qu?n tr?' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
      },
      token: 'admin-token-' + user.id + '-' + Date.now(),
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json({ message: 'L?i x�c th?c h? th?ng' }, { status: 500 });
  }
}
