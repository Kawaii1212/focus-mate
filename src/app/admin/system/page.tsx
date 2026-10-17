"use client";

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Database,
  Key,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AdminSystemPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/system');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (err) {
      toast.error('Không thể kiểm tra sức khỏe hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleSeedSessions = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed_sessions' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khởi tạo mẫu');
      toast.success(data.message || 'Đã tạo các phiên học mẫu thành công!');
      fetchHealth();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tạo phiên học mẫu');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-400" />
            <span>Trạng Thái Hệ Thống & Cấu Hình Máy Chủ</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Giám sát kết nối cơ sở dữ liệu, các biến môi trường và tiện ích bảo trì nền tảng
          </p>
        </div>

        <Button
          onClick={fetchHealth}
          variant="outline"
          size="sm"
          className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs h-9"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Kiểm tra lại
        </Button>
      </div>

      {/* Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PostgreSQL */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Cơ Sở Dữ Liệu PostgreSQL</span>
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white text-base">
                {health?.database?.connected ? 'Đang Kết Nối Tốt' : 'Mất Kết Nối'}
              </span>
              <span className="text-xs font-mono text-emerald-400">
                {health?.database?.latencyMs}ms ping
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Nhà cung cấp: <span className="text-slate-200 font-medium">{health?.database?.provider}</span>
            </p>
          </CardContent>
        </Card>

        {/* Gemini API Key */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Cấu Hình Google Gemini AI</span>
              <Key className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="font-bold text-white text-base">
                {health?.environment?.hasGeminiKey ? 'Đã Cấu Hình Khóa API' : 'Chưa Có Khóa'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Mục đích: AI Chatbot gia sư & Phân bổ lịch học AI Planner
            </p>
          </CardContent>
        </Card>

        {/* Environment */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Môi Trường Vận Hành</span>
              <Cpu className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white text-base">
                Node.js {health?.environment?.nodeVersion || 'v24'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Nền tảng: <span className="font-mono text-slate-300">{health?.environment?.platform}</span> • Next.js 15
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table Counts */}
      <Card className="bg-slate-900/90 border-slate-800 text-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Thống Kê Bảng Dữ Liệu Trong PostgreSQL</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Số lượng bản ghi thực tế được đồng bộ theo thời gian thực
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[11px] text-slate-400">Người Dùng (User)</p>
              <p className="text-xl font-bold text-white mt-1">{health?.metrics?.userCount || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[11px] text-slate-400">Linh Vật (Mascot)</p>
              <p className="text-xl font-bold text-amber-400 mt-1">{health?.metrics?.mascotCount || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[11px] text-slate-400">Phòng Học (ActiveRoom)</p>
              <p className="text-xl font-bold text-rose-400 mt-1">{health?.metrics?.roomCount || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[11px] text-slate-400">Giao Dịch (Payment)</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">{health?.metrics?.paymentCount || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[11px] text-slate-400">Phiên Học (StudySession)</p>
              <p className="text-xl font-bold text-violet-400 mt-1">{health?.metrics?.sessionCount || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Seeder Tool */}
      <Card className="bg-slate-900/90 border-slate-800 text-slate-100">
        <CardHeader>
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Tiện Ích Khởi Tạo Dữ Liệu Trực Quan (Demo Data Generator)</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Nếu cơ sở dữ liệu hiện tại chưa có nhiều phiên học Pomodoro thực tế, bạn có thể tạo 15 phiên học mẫu để các biểu đồ thống kê hiển thị đầy đủ, sinh động.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleSeedSessions}
            disabled={seeding}
            className="bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs h-10 px-5 font-semibold shadow-lg shadow-sky-500/20 flex items-center gap-2"
          >
            <Sparkles className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? 'Đang tạo dữ liệu...' : 'Khởi Tạo 15 Phiên Học Mẫu Cho Sinh Viên'}</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
