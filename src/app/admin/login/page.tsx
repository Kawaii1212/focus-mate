"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  KeyRound,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Lock,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { setAdminSession } from '../adminAuth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'key' | 'email'>('key');

  // Key login
  const [adminKey, setAdminKey] = useState('');
  // Email/Pass login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleKeyLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: adminKey || 'admin123' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Mã quản trị không hợp lệ');

      setAdminSession(data.admin);
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Tài khoản không hợp lệ hoặc không có quyền Admin');

      setAdminSession(data.admin);
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl mx-auto bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 border border-indigo-400/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">FocusMate Admin Portal</h1>
            <p className="text-slate-400 text-xs mt-1">Cổng điều hành & quản trị hệ thống học tập</p>
          </div>
        </div>

        {/* Card */}
        <Card className="bg-slate-900/90 border-slate-800 text-slate-100 shadow-2xl backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>Đăng nhập quyền Quản trị</span>
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Vui lòng xác thực tài khoản có phân quyền Administrator
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid grid-cols-2 bg-slate-950 border border-slate-800">
                <TabsTrigger
                  value="key"
                  className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs"
                >
                  <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                  Mã Quản Trị
                </TabsTrigger>
                <TabsTrigger
                  value="email"
                  className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs"
                >
                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                  Email & Pass
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Admin Master Key */}
              <TabsContent value="key" className="space-y-4 pt-3">
                <form onSubmit={handleKeyLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="adminKey" className="text-xs text-slate-300">
                      Mã PIN / Master Key
                    </Label>
                    <Input
                      id="adminKey"
                      type="password"
                      placeholder="Nhập mã bí mật..."
                      value={adminKey}
                      onChange={(e) => setAdminKey(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-indigo-500 rounded-xl text-sm"
                      required
                    />
                    <p className="text-[11px] text-slate-400">
                      Mặc định hệ thống: <code className="text-indigo-400 bg-indigo-950/60 px-1 py-0.5 rounded">admin123</code>
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-10 font-semibold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Đang xác thực...' : 'Truy Cập Trang Quản Trị'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </TabsContent>

              {/* Tab 2: Email & Password */}
              <TabsContent value="email" className="space-y-4 pt-3">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="adminEmail" className="text-xs text-slate-300">
                      Email Quản Trị
                    </Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="admin@focusmate.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-indigo-500 rounded-xl text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="adminPassword" className="text-xs text-slate-300">
                      Mật khẩu
                    </Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-indigo-500 rounded-xl text-sm"
                      required
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-10 font-semibold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Đang kiểm tra...' : 'Đăng Nhập Quản Trị Viên'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Quick 1-Click Demo Login */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => handleKeyLogin()}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>1-Click Truy cập nhanh (Chế độ phát triển)</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang học viên FocusMate</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
