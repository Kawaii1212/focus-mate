"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  CreditCard,
  Timer,
  Video,
  Sparkles,
  TrendingUp,
  Award,
  Crown,
  ChevronRight,
  RefreshCw,
  Bell,
  ArrowUpRight,
  Flame,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Không thể tải dữ liệu thống kê');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-slate-400">Đang tổng hợp dữ liệu toàn hệ thống...</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const charts = data?.charts || {};
  const recent = data?.recent || {};

  return (
    <div className="space-y-8">
      {/* Header Welcome banner */}
      <div className="relative overflow-hidden p-6 md:p-8 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-slate-900 border border-indigo-800/40 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Chào mừng quay trở lại, Admin! 👋</h2>
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] uppercase">
                Live Monitor
              </Badge>
            </div>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl">
              Hệ thống FocusMate đang vận hành ổn định. Dưới đây là bức tranh tổng quan hôm nay.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={refreshing}
              className="bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Làm mới số liệu</span>
            </Button>

            <Link href="/admin/users">
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs h-9 shadow-lg shadow-indigo-600/25 font-semibold flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Quản lý User</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
        {/* Total Users */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100 hover:border-slate-700 transition-all">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Tổng Người Dùng</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight">{summary.totalUsers || 0}</p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-0.5">
                <TrendingUp className="w-3 h-3" />
                <span>+{summary.newUsersLast7Days || 0} user (7 ngày)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Premium VIP Users */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100 hover:border-slate-700 transition-all">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Hội Viên VIP</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Crown className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400 tracking-tight">{summary.premiumUsers || 0}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tỷ lệ: <span className="text-indigo-400 font-semibold">{summary.premiumPercentage || 0}%</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Revenue PayOS */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100 hover:border-slate-700 transition-all">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Doanh Thu PayOS</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-400 tracking-tight">
                {(summary.totalRevenue || 0).toLocaleString('vi-VN')} ₫
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {summary.paidPayments || 0} đơn thành công
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pomodoro Sessions */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100 hover:border-slate-700 transition-all">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Giờ Học Pomodoro</span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Timer className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400 tracking-tight">{summary.totalHours || '0.0'}h</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {summary.totalSessions || 0} buổi học hoàn tất
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Active Co-Study Rooms */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100 hover:border-slate-700 transition-all">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Phòng Co-Study</span>
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-400 tracking-tight">{summary.totalRooms || 0}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Phòng đang trực tuyến</p>
            </div>
          </CardContent>
        </Card>

        {/* Active Mascots */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100 hover:border-slate-700 transition-all">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Linh Vật Mascot</span>
              <div className="w-7 h-7 rounded-lg bg-yellow-500/10 text-yellow-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400 tracking-tight">{summary.totalMascots || 0}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Đã nở và nâng cấp</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two visual charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Trend Chart */}
        <Card className="lg:col-span-2 bg-slate-900/80 border-slate-800 text-slate-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span>Tăng Trưởng Người Dùng Mới (14 ngày gần nhất)</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-0.5">
                  Số lượng tài khoản đăng ký theo từng ngày
                </CardDescription>
              </div>
              <span className="text-[11px] font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                14 ngày
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {charts.growthTrend && charts.growthTrend.length > 0 ? (
              <div className="h-56 flex items-end gap-2 pt-6 pb-2 px-2">
                {charts.growthTrend.map((item: any, idx: number) => {
                  const maxCount = Math.max(...charts.growthTrend.map((i: any) => i.count), 1);
                  const heightPct = Math.max(12, Math.round((item.count / maxCount) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                        {item.count}
                      </span>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 via-indigo-500 to-violet-400 group-hover:from-indigo-500 group-hover:to-violet-300 transition-all shadow-md shadow-indigo-600/20"
                      />
                      <span className="text-[9px] text-slate-400 truncate max-w-full font-mono mt-1">
                        {item.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
                Chưa có dữ liệu biểu đồ
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mascot Distribution */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Phân Bố Mascot Học Tập</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-0.5">
              Linh vật được học viên lựa chọn
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {charts.mascotDistribution && charts.mascotDistribution.length > 0 ? (
              <div className="space-y-3 pt-2">
                {charts.mascotDistribution.map((m: any, idx: number) => {
                  const total = charts.mascotDistribution.reduce((acc: number, cur: any) => acc + cur.count, 0) || 1;
                  const pct = Math.round((m.count / total) * 100);
                  const colors = ['bg-amber-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-rose-500', 'bg-orange-500'];
                  const color = colors[idx % colors.length];

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium truncate max-w-[170px]">{m.name}</span>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-slate-200 font-semibold">{m.count}</span>
                          <span className="text-slate-400">({pct}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full ${color} rounded-full transition-all`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
                Chưa có dữ liệu mascot
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Hub */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          LỐI TẮT HÀNH ĐỘNG QUẢN TRỊ NHANH
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-white transition-all border border-slate-700/60 group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold">Quản lý User</p>
              <p className="text-[11px] text-slate-400">Xem {summary.totalUsers} tài khoản</p>
            </div>
          </Link>

          <Link
            href="/admin/notifications"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-white transition-all border border-slate-700/60 group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold">Phát Thông Báo</p>
              <p className="text-[11px] text-slate-400">Gửi tin toàn hệ thống</p>
            </div>
          </Link>

          <Link
            href="/admin/rooms"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-white transition-all border border-slate-700/60 group"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold">Giám Sát Phòng</p>
              <p className="text-[11px] text-slate-400">{summary.totalRooms} phòng mở</p>
            </div>
          </Link>

          <Link
            href="/admin/payments"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-white transition-all border border-slate-700/60 group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold">Duyệt Đơn Hàng</p>
              <p className="text-[11px] text-slate-400">{summary.pendingPayments || 0} đơn chờ</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Two Columns: Recent Registrations & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base text-slate-100">Người Dùng Mới Nhất</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Các học viên vừa gia nhập FocusMate
              </CardDescription>
            </div>
            <Link
              href="/admin/users"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-800">
              {recent.users && recent.users.length > 0 ? (
                recent.users.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="w-9 h-9 bg-slate-800 border border-slate-700">
                        <AvatarFallback className="bg-indigo-950 text-indigo-300 text-xs font-bold">
                          {u.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-slate-200 truncate">{u.name}</p>
                          {u.isPremium && (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px] px-1 py-0">
                              VIP
                            </Badge>
                          )}
                          {u.role === 'admin' && (
                            <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[9px] px-1 py-0">
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] text-slate-400 font-mono">
                        {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-[11px] text-indigo-400">
                        {u.mascot ? `Lv.${u.mascot.level || 1} • ${u.mascot.name}` : 'Chưa chọn mascot'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">Chưa có người dùng</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base text-slate-100">Giao Dịch Gần Đây</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Thanh toán PayOS & Nâng cấp Premium
              </CardDescription>
            </div>
            <Link
              href="/admin/payments"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-800">
              {recent.payments && recent.payments.length > 0 ? (
                recent.payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-800/40 transition-colors">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-300">#{p.orderCode}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-300 truncate">
                          {p.user?.name || 'Khách hàng'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Gói {p.planId === 'yearly' ? 'Năm (12 tháng)' : 'Tháng'}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="font-mono font-bold text-xs text-emerald-400">
                        {(p.amount || 0).toLocaleString('vi-VN')} ₫
                      </p>
                      <Badge
                        className={`text-[9px] px-1.5 py-0 ${
                          p.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : p.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {p.status === 'paid' ? 'Đã Thanh Toán' : p.status === 'pending' ? 'Chờ Duyệt' : 'Đã Hủy'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">Chưa có giao dịch</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
