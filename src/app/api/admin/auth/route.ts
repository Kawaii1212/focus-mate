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
      return NextResponse.json({ message: 'Vui lòng cung cấp email hoặc mã quản trị' }, { status: 400 });
    }

    const user: any = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { mascot: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'Tài khoản quản trị không tồn tại' }, { status: 404 });
    }

    if (user.passwordHash !== password) {
      return NextResponse.json({ message: 'Mật khẩu quản trị không chính xác' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Tài khoản này không có quyền truy cập trang quản trị' },
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
    return NextResponse.json({ message: 'Lỗi xác thực hệ thống' }, { status: 500 });
  }
}
