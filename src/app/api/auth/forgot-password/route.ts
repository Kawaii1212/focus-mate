import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail, isEmailConfigured } from '@/lib/mailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ message: 'Vui lòng nhập địa chỉ email hợp lệ.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Không tìm thấy tài khoản với email này trong hệ thống.' },
        { status: 404 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: otp,
        resetTokenExpiry: expiry,
      },
    });

    let emailSent = false;
    if (isEmailConfigured) {
      try {
        emailSent = await sendPasswordResetEmail({
          to: user.email,
          userName: user.name,
          otp,
        });
      } catch (err) {
        console.error('Failed to send reset email:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? 'Mã xác thực đặt lại mật khẩu đã được gửi đến hòm thư của bạn.'
        : 'Mã xác thực đã được tạo thành công.',
      emailSent,
      // Provide demoOtp if email is not configured or fails to send
      demoOtp: emailSent ? undefined : otp,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ message: 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.' }, { status: 500 });
  }
}
