"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, Mail, CheckCircle2, ArrowLeft, Eye, EyeOff, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';

type Step = 'EMAIL' | 'OTP_RESET' | 'SUCCESS';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Form states
  const [step, setStep] = useState<Step>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Resend OTP countdown effect
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Success auto-redirect effect
  useEffect(() => {
    if (step !== 'SUCCESS') return;
    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, router]);

  // Handle Step 1: Request OTP
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email của bạn.');
      return;
    }
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const res = await authApi.forgotPassword(email.trim());
      setInfoMessage(res.message);
      if (res.demoOtp) {
        setDemoOtp(res.demoOtp);
      }
      setStep('OTP_RESET');
      setCountdown(60); // 60s cooldown for resend
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Không thể gửi mã xác nhận. Vui lòng kiểm tra lại email.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Submit OTP & Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!otp.trim()) {
      setError('Vui lòng nhập mã xác thực (OTP).');
      return;
    }
    if (otp.trim().length !== 6) {
      setError('Mã xác thực phải bao gồm đúng 6 chữ số.');
      return;
    }
    if (!newPassword) {
      setError('Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setStep('SUCCESS');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoOtp = () => {
    if (demoOtp) {
      setOtp(demoOtp);
      setError('');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 selection:bg-sky-500 selection:text-white"
      style={{ background: 'var(--gradient-sky)' }}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div
            className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center shadow-fm-lg text-white"
            style={{ background: 'hsl(var(--sky))' }}
          >
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">FocusMate</h1>
          <p className="text-muted-foreground text-sm">
            Khôi phục quyền truy cập vào tài khoản của bạn
          </p>
        </div>

        <Card className="shadow-fm-lg border-border/50 backdrop-blur-sm bg-card/95">
          {/* STEP 1: Email Form */}
          {step === 'EMAIL' && (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Quên Mật Khẩu</CardTitle>
                <CardDescription>
                  Nhập địa chỉ email đã đăng ký. Chúng tôi sẽ gửi mã xác thực (OTP) để bạn đặt lại mật khẩu.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Địa chỉ Email</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="ban@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="rounded-xl pl-10"
                        required
                        autoFocus
                      />
                      <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3.5 py-2.5 rounded-xl">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl font-semibold h-11 text-white shadow-sm transition-all"
                    style={{ background: 'hsl(var(--sky))' }}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Đang gửi mã...
                      </span>
                    ) : (
                      'Gửi Mã Xác Thực'
                    )}
                  </Button>
                </form>

                <div className="mt-5 text-center text-sm">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Quay lại Đăng nhập
                  </Link>
                </div>
              </CardContent>
            </>
          )}

          {/* STEP 2: OTP & New Password Form */}
          {step === 'OTP_RESET' && (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Nhập Mã Xác Thực</CardTitle>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('EMAIL');
                      setError('');
                    }}
                    className="text-xs text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    Đổi email
                  </button>
                </div>
                <CardDescription>
                  Mã OTP 6 chữ số đã được tạo cho <span className="font-semibold text-foreground">{email}</span>.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* Demo OTP Banner if email wasn't dispatched through external SMTP */}
                {demoOtp && (
                  <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      Mã OTP thử nghiệm (Demo Mode):
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-mono font-bold tracking-widest text-amber-700 dark:text-amber-300">
                        {demoOtp}
                      </span>
                      <button
                        type="button"
                        onClick={fillDemoOtp}
                        className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
                      >
                        Tự động điền
                      </button>
                    </div>
                  </div>
                )}

                {infoMessage && (
                  <div className="mb-4 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                    {infoMessage}
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  {/* OTP Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="otp">Mã xác thực (OTP - 6 chữ số)</Label>
                      <button
                        type="button"
                        disabled={countdown > 0 || loading}
                        onClick={() => handleRequestOtp()}
                        className="text-xs text-sky-600 dark:text-sky-400 hover:underline disabled:opacity-50 disabled:no-underline"
                      >
                        {countdown > 0 ? `Gửi lại sau (${countdown}s)` : 'Gửi lại mã'}
                      </button>
                    </div>
                    <Input
                      id="otp"
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="rounded-xl text-center text-xl tracking-[0.4em] font-mono font-semibold"
                      required
                      autoFocus
                    />
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Tối thiểu 6 ký tự"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="rounded-xl pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Nhập lại mật khẩu mới"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="rounded-xl pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-destructive">Mật khẩu xác nhận chưa khớp.</p>
                    )}
                  </div>

                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3.5 py-2 rounded-xl">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl font-semibold h-11 text-white shadow-sm transition-all"
                    style={{ background: 'hsl(var(--sky))' }}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Đang lưu mật khẩu...
                      </span>
                    ) : (
                      'Đặt Lại Mật Khẩu'
                    )}
                  </Button>
                </form>

                <div className="mt-4 text-center text-sm">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Hủy bỏ & Quay lại
                  </Link>
                </div>
              </CardContent>
            </>
          )}

          {/* STEP 3: Success Screen */}
          {step === 'SUCCESS' && (
            <CardContent className="pt-8 pb-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 animate-pulse" />
              </div>

              <div className="space-y-2">
                <CardTitle className="text-2xl text-emerald-600 dark:text-emerald-400">
                  Thành Công!
                </CardTitle>
                <CardDescription className="text-sm">
                  Mật khẩu tài khoản của bạn đã được cập nhật thành công.
                </CardDescription>
              </div>

              <div className="p-3.5 bg-muted/60 rounded-xl text-xs text-muted-foreground flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Tự động chuyển hướng về trang Đăng nhập sau{' '}
                <span className="font-bold text-foreground font-mono">{redirectCountdown}s</span>
              </div>

              <Button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full rounded-xl font-semibold h-11 text-white shadow-sm"
                style={{ background: 'hsl(var(--sky))' }}
              >
                Đăng Nhập Ngay
              </Button>
            </CardContent>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          FocusMate &copy; 2026 &mdash; Đồng hành chinh phục mục tiêu học tập
        </p>
      </div>
    </div>
  );
}
