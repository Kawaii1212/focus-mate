"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Crown,
  CreditCard,
  Timer,
  Video,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  PlusCircle,
  Bell,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Kh�ng th? t?i d? li?u th?ng k�');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      toast.error(err.message || 'L?i k?t n?i m�y ch?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">�ang t?ng h?p d? li?u to�n h? th?ng...</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const charts = data?.charts || {};
  const recent = data?.recent || {};

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Ch�o m?ng quay tr? l?i, Admin! ??</h2>
            <Badge className="bg-indigo-600/30 text-indigo-300 border-indigo-500/30 text-xs">
              Live Monitor
            </Badge>
          </div>
          <p className="text-slate-400 text-sm">
            H? th?ng FocusMate dang v?n h�nh ?n d?nh. Du?i d�y l� b?c tranh t?ng quan h�m nay.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white rounded-xl text-xs flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>L�m m?i s? li?u</span>
          </Button>

          <Link href="/admin/users">
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Qu?n l� User</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Users */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100 shadow-md">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">T?ng Ngu?i D�ng</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight">{summary.totalUsers || 0}</p>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                <TrendingUp className="w-3 h-3" />
                <span>+{summary.newUsers7d || 0} user (7 ng�y)</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Premium */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100 shadow-md">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">H?i Vi�n VIP</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Crown className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-300 tracking-tight">{summary.premiumUsers || 0}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                T? l?: <span className="text-indigo-400 font-semibold">{summary.premiumPercentage || 0}%</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Revenue */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100 shadow-md">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Doanh Thu PayOS</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-400 tracking-tight">
                {(summary.totalRevenue || 0).toLocaleString('vi-VN')}?
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {summary.paidPayments || 0} don th�nh c�ng
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Study Hours */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100 shadow-md">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Gi? H?c Pomodoro</span>
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                <Timer className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight">{summary.totalFocusHours || 0}h</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {summary.totalSessions || 0} bu?i h?c ho�n t?t
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: CoStudy Rooms */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100 shadow-md">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Ph�ng Co-Study</span>
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight">{summary.totalRooms || 0}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Ph�ng dang tr?c tuy?n</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 6: Mascots */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100 shadow-md">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Linh V?t Mascot</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight">{summary.mascotCount || 0}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">�� n? v� n�ng c?p</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Trend Chart (SVG visual bar) */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100 lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span>Tang Tru?ng Ngu?i D�ng M?i (14 ng�y g?n nh?t)</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  S? lu?ng t�i kho?n dang k� theo t?ng ng�y
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs border-indigo-500/30 text-indigo-400 bg-indigo-500/10">
                14 ng�y
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-56 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-800">
              {charts.growthTrend && charts.growthTrend.length > 0 ? (
                charts.growthTrend.map((item: any, idx: number) => {
                  const maxVal = Math.max(...charts.growthTrend.map((t: any) => t.users), 5);
                  const heightPct = Math.max(8, Math.round((item.users / maxVal) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[10px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.users}
                      </span>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md hover:from-indigo-500 hover:to-indigo-300 transition-all cursor-pointer relative"
                      >
                        <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded shadow whitespace-nowrap z-20 border border-slate-700">
                          {item.date}: {item.users} users
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate max-w-[32px]">{item.date}</span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                  Chua c� d? li?u bi?u d?
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mascot Persona Distribution */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Ph�n B? Mascot H?c T?p</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Linh v?t du?c h?c vi�n l?a ch?n
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 space-y-3">
            {charts.mascotDistribution && charts.mascotDistribution.length > 0 ? (
              charts.mascotDistribution.map((m: any, idx: number) => {
                const total = summary.mascotCount || 1;
                const pct = Math.round((m.count / total) * 100);
                const colors = [
                  'bg-orange-500',
                  'bg-indigo-500',
                  'bg-emerald-500',
                  'bg-pink-500',
                  'bg-sky-500',
                  'bg-amber-500',
                ];
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">{m.name}</span>
                      <span className="text-slate-400 font-mono">
                        {m.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full ${colors[m.personaId % colors.length]}`}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">Chua c� mascot n�o</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Hub */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          L?i T?t H�nh �?ng Qu?n Tr? Nhanh
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
              <p className="text-xs font-semibold">Qu?n l� User</p>
              <p className="text-[11px] text-slate-400">Xem {summary.totalUsers} t�i kho?n</p>
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
              <p className="text-xs font-semibold">Ph�t Th�ng B�o</p>
              <p className="text-[11px] text-slate-400">G?i tin to�n h? th?ng</p>
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
              <p className="text-xs font-semibold">Gi�m S�t Ph�ng</p>
              <p className="text-[11px] text-slate-400">{summary.totalRooms} ph�ng m?</p>
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
              <p className="text-xs font-semibold">Duy?t �on H�ng</p>
              <p className="text-[11px] text-slate-400">{summary.pendingPayments || 0} don ch?</p>
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
              <CardTitle className="text-base text-slate-100">Ngu?i D�ng M?i Nh?t</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                C�c h?c vi�n v?a gia nh?p FocusMate
              </CardDescription>
            </div>
            <Link
              href="/admin/users"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <span>Xem t?t c?</span>
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
                          <p className="text-sm font-semibold text-slate-200 truncate">{u.name}</p>
                          {u.isPremium && (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] px-1 py-0 h-4">
                              VIP
                            </Badge>
                          )}
                          {u.role === 'admin' && (
                            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] px-1 py-0 h-4">
                              ADMIN
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400 font-mono">
                        {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-[11px] text-indigo-400">
                        {u.mascot ? `Lv.${u.mascot.level || 1} � ${u.mascot.name}` : 'Chua ch?n mascot'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">Chua c� ngu?i d�ng</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base text-slate-100">Giao D?ch G?n ��y</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Thanh to�n PayOS & N�ng c?p Premium
              </CardDescription>
            </div>
            <Link
              href="/admin/payments"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <span>Xem t?t c?</span>
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
                        <span className="text-xs text-slate-400">�</span>
                        <span className="text-xs text-slate-300 truncate">
                          {p.user?.name || 'Kh�ch h�ng'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        G�i {p.planId === 'yearly' ? 'Nam (12 th�ng)' : 'Th�ng'}
                      </p>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-xs font-bold text-white font-mono">
                        {(p.amount || 0).toLocaleString('vi-VN')}?
                      </p>
                      <Badge
                        className={`text-[10px] px-1.5 py-0 ${
                          p.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : p.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {p.status === 'paid' ? '�� Thanh To�n' : p.status === 'pending' ? 'Ch? Duy?t' : '�� H?y'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">Chua c� giao d?ch</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
