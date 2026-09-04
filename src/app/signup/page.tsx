"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useApp } from '@/store/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default function SignupPage() {
  const { dispatch } = useApp();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    try {
      const user = await authApi.signup({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        goal: '',
        studyHabit: '',
        preferredTime: 'evening'
      });
      // We log them in right away
      dispatch({ type: 'SET_USER', payload: user });
      router.push('/onboarding');
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Lỗi đăng ký. Vui lòng thử lại.');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--gradient-sky)' }}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div
            className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center shadow-fm-lg"
            style={{ background: 'hsl(var(--sky))' }}
          >
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">FocusMate</h1>
          <p className="text-muted-foreground text-sm">Bắt đầu hành trình học tập của bạn</p>
        </div>

        <Card className="shadow-fm-lg border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Đăng Ký</CardTitle>
            <CardDescription>Tạo tài khoản để gặp mascot của bạn!</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Tên của bạn</Label>
                <Input
                  id="name"
                  placeholder="Nguyễn Văn An"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ban@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full rounded-xl font-semibold h-11"
                style={{ background: 'hsl(var(--sky))' }}
              >
                Đăng Ký
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Đã có tài khoản?{' '}
              <Link href="/login" className="font-semibold hover:underline" style={{ color: 'hsl(var(--sky))' }}>
                Đăng nhập
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
