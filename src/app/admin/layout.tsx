"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Video,
  CreditCard,
  Timer,
  Bell,
  Settings,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  Activity,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useAdminAuth } from './adminAuth';
import { AdminErrorBoundary } from './AdminErrorBoundary';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const ADMIN_NAV = [
  { href: '/admin', label: 'Tổng Quan', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Người Dùng', icon: Users },
  { href: '/admin/rooms', label: 'Phòng Co-Study', icon: Video },
  { href: '/admin/payments', label: 'Giao Dịch & Thu', icon: CreditCard },
  { href: '/admin/sessions', label: 'Phiên Học Pomodoro', icon: Timer },
  { href: '/admin/notifications', label: 'Phát Thông Báo', icon: Bell },
  { href: '/admin/system', label: 'Hệ Thống & Status', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, loading, logoutAdmin } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <div className="w-12 h-12 rounded-2xl border-4 border-indigo-500 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-medium tracking-wide">Đang xác thực quyền Admin...</p>
      </div>
    );
  }

  if (!admin) {
    if (typeof window !== 'undefined') {
      router.push('/admin/login');
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white text-base">FocusMate</span>
            <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">ADMIN</span>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:static'
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight">FocusMate</span>
              </div>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/50">
                Admin Portal
              </span>
            </div>
          </div>
        </div>

        {/* Live System Indicator */}
        <div className="px-4 py-3 mx-3 my-2 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-slate-300">Hệ Thống Live</span>
          </div>
          <span className="font-mono text-slate-400 text-[11px]">{timeStr}</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Switch to User App */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all border border-slate-700/60"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại ứng dụng chính</span>
          </Link>

          {/* Admin Profile */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700/50">
                <AvatarFallback className="bg-indigo-600 text-white font-bold text-xs">
                  {admin.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{admin.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{admin.email}</p>
              </div>
            </div>
            <button
              onClick={logoutAdmin}
              title="Đăng xuất Admin"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen bg-slate-950 overflow-x-hidden">
        {/* Top Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-slate-900/60 backdrop-blur border-b border-slate-800/80 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-100 tracking-tight">
              {ADMIN_NAV.find((n) => n.href === pathname)?.label || 'Bảng Quản Trị'}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              FocusMate Admin v2.0
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Máy chủ: Supabase Tokyo</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-emerald-400">99.9% Uptime</span>
            </div>

            <Link
              href="/dashboard"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Xem App Học Viên</span>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          <AdminErrorBoundary>
            {children}
          </AdminErrorBoundary>
        </div>
      </main>
    </div>
  );
}
