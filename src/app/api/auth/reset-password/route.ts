import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp, newPassword } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ message: 'Vui lòng cung cấp địa chỉ email.' }, { status: 400 });
    }
    if (!otp || typeof otp !== 'string' || !otp.trim()) {
      return NextResponse.json({ message: 'Vui lòng nhập mã xác thực (OTP).' }, { status: 400 });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({ message: 'Không tìm thấy tài khoản người dùng.' }, { status: 404 });
    }

    if (!user.resetToken || user.resetToken !== cleanOtp) {
      return NextResponse.json(
        { message: 'Mã xác thực (OTP) không chính xác. Vui lòng kiểm tra lại.' },
        { status: 400 }
      );
    }

    if (!user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
      return NextResponse.json(
        { message: 'Mã xác thực (OTP) đã hết hạn (15 phút). Vui lòng yêu cầu mã mới.' },
        { status: 400 }
      );
    }

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công! Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.' }, { status: 500 });
  }
}
