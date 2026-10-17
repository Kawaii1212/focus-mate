"use client";

import React, { useEffect, useState } from 'react';
import {
  Timer,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Award,
  Flame,
  Calendar,
  Clock,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [validFilter, setValidFilter] = useState('all');

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        isValid: validFilter === 'all' ? '' : validFilter,
        limit: '100',
      });
      const res = await fetch(`/api/admin/sessions?${params.toString()}`);
      if (!res.ok) throw new Error('Không thể tải nhật ký phiên học');
      const data = await res.json();
      setSessions(data || []);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tải phiên học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [validFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSessions();
  };

  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const avgCompletion = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + (s.completionPct || 0), 0) / sessions.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Timer className="w-5 h-5 text-purple-400" />
            <span>Nhật Ký Phiên Học Pomodoro Toàn Hệ Thống</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Theo dõi thời lượng tập trung, tỷ lệ hoàn thành nhiệm vụ và EXP tích lũy của học viên
          </p>
        </div>

        <Button
          onClick={fetchSessions}
          variant="outline"
          size="sm"
          className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs h-9"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Làm mới
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Tổng Phiên Học Ghi Nhận</p>
              <p className="text-2xl font-bold text-white mt-1">{sessions.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Các buổi học đã hoàn thành</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Tổng Thời Gian Tập Trung</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {(totalMinutes / 60).toFixed(1)} giờ
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tổng số phút học viên học bài</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Timer className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Tỷ Lệ Hoàn Thành Trung Bình</p>
              <p className="text-2xl font-bold text-indigo-400 mt-1">{avgCompletion}%</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Mức độ cam kết mục tiêu</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm theo tên bài học, tên học viên hoặc email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl h-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={validFilter} onValueChange={setValidFilter}>
                <SelectTrigger className="w-full sm:w-44 bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl h-9">
                  <SelectValue placeholder="Chuỗi Streak" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                  <SelectItem value="all">Tất cả phiên học</SelectItem>
                  <SelectItem value="true">Đủ điều kiện Streak (≥50%)</SelectItem>
                  <SelectItem value="false">Chưa đủ điều kiện</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs h-9 px-4 font-semibold"
              >
                Lọc
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card className="bg-slate-900/90 border-slate-800 text-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">Học Viên</th>
                <th className="py-3 px-4">Tên Bài Học / Nhiệm Vụ</th>
                <th className="py-3 px-4">Thời Lượng</th>
                <th className="py-3 px-4">Tiến Độ Hoàn Thành</th>
                <th className="py-3 px-4">Phần Thưởng</th>
                <th className="py-3 px-4">Streak Hợp Lệ</th>
                <th className="py-3 px-4 text-right">Ngày Giờ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải danh sách phiên học...</span>
                    </div>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Chưa có phiên học nào được ghi nhận
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* User */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7 bg-slate-800 border border-slate-700">
                          <AvatarFallback className="bg-indigo-950 text-indigo-300 text-[10px] font-bold">
                            {s.user?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 max-w-[140px]">
                          <p className="font-semibold text-slate-200 truncate">{s.user?.name || 'Vô danh'}</p>
                          <p className="text-[10px] text-slate-400 truncate">{s.user?.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {s.subject || 'Phiên Pomodoro tự do'}
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-4 font-mono font-semibold text-white">
                      {s.duration} phút
                    </td>

                    {/* Completion Pct */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${s.completionPct || 0}%` }}
                            className={`h-full rounded-full ${
                              (s.completionPct || 0) >= 80
                                ? 'bg-emerald-500'
                                : (s.completionPct || 0) >= 50
                                ? 'bg-indigo-500'
                                : 'bg-amber-500'
                            }`}
                          />
                        </div>
                        <span className="font-mono text-slate-300 text-[11px] font-medium">
                          {s.completionPct || 0}%
                        </span>
                      </div>
                    </td>

                    {/* Rewards */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-amber-400">+{s.expEarned || 0} EXP</span>
                        <span className="text-yellow-400">+{s.coinsEarned || 0} 🪙</span>
                      </div>
                    </td>

                    {/* Valid */}
                    <td className="py-3 px-4">
                      {s.isValid ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          Hợp lệ
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-800 text-slate-400 border-slate-700 text-[10px] flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" />
                          Chưa đạt
                        </Badge>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] text-right">
                      {s.date || (s.createdAt ? new Date(s.createdAt).toLocaleDateString('vi-VN') : '—')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
