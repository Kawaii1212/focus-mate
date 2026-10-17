"use client";

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Users,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  Radio,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [type, setType] = useState('system');
  const [link, setLink] = useState('');
  const [sending, setSending] = useState(false);

  const [history, setHistory] = useState<any[]>([]);
  const historyList = Array.isArray(history) ? history : [];
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/admin/notifications/broadcast');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (Array.isArray(data?.history) ? data.history : []);
        setHistory(list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          target,
          type,
          link: link || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi gửi thông báo');

      toast.success(data.message || 'Đã phát thông báo thành công!');
      setTitle('');
      setBody('');
      setLink('');
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi phát thông báo');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Bell className="w-5 h-5 text-purple-400" />
          <span>Trung Tâm Phát Thông Báo Toàn Hệ Thống</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Gửi thông báo in-app trực tiếp tới hộp thư thông báo của học viên trên FocusMate
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Create */}
        <Card className="lg:col-span-2 bg-slate-900/90 border-slate-800 text-slate-100">
          <CardHeader>
            <CardTitle className="text-base text-white">Soạn Thông Báo Mới</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Nội dung sẽ xuất hiện trên thanh chuông thông báo của người nhận
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Tiêu đề thông báo</Label>
                <Input
                  placeholder="Ví dụ: 📢 Sự kiện ôn thi: Nhân đôi EXP cuối tuần!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl h-10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Nội dung chi tiết</Label>
                <Textarea
                  placeholder="Nhập thông điệp gửi tới cộng đồng học viên..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Đối tượng nhận</Label>
                  <Select value={target} onValueChange={setTarget}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                      <SelectItem value="all">Toàn bộ học viên (All)</SelectItem>
                      <SelectItem value="premium">Chỉ hội viên Premium VIP</SelectItem>
                      <SelectItem value="free">Chỉ học viên Miễn phí</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Loại thông báo</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                      <SelectItem value="system">Hệ thống (System)</SelectItem>
                      <SelectItem value="reminder">Nhắc nhở (Reminder)</SelectItem>
                      <SelectItem value="event">Sự kiện (Event)</SelectItem>
                      <SelectItem value="promo">Khuyến mãi (Promo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Đường dẫn khi nhấp vào (Tùy chọn)</Label>
                <Input
                  placeholder="/study hoặc /premium"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl h-9"
                />
              </div>

              <Button
                type="submit"
                disabled={sending}
                className="w-full bg-sky-500 hover:bg-sky-400 text-white rounded-xl h-10 font-semibold shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? 'Đang gửi thông báo...' : 'Phát Thông Báo Ngay'}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <div className="space-y-4">
          <Card className="bg-slate-900/90 border-slate-800 text-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Xem Trước Trên App Học Viên</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-sky-400 uppercase font-semibold">
                        {type}
                      </span>
                      <span className="text-[10px] text-slate-500">Vừa xong</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200">
                      {title || 'Tiêu đề thông báo mẫu...'}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {body || 'Nội dung thông báo sẽ hiển thị ở đây như học viên nhìn thấy trên chuông thông báo...'}
                    </p>
                    <div className="pt-1 flex items-center gap-2 text-[10px] text-slate-500">
                      <span>Đối tượng: {target === 'all' ? 'Tất cả' : target}</span>
                      {link && <span>• Đến: {link}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History Table */}
      <Card className="bg-slate-900/90 border-slate-800 text-slate-100 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Lịch Sử Thông Báo Đã Gửi Gần Đây</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Danh sách các thông báo in-app đã gửi vào tài khoản học viên
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">Nội Dung</th>
                <th className="py-3 px-4">Loại</th>
                <th className="py-3 px-4">Người Nhận</th>
                <th className="py-3 px-4 text-right">Thời Gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loadingHistory ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                    Đang tải lịch sử...
                  </td>
                </tr>
              ) : historyList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                    Chưa có thông báo nào được lưu
                  </td>
                </tr>
              ) : (
                historyList.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 max-w-sm">
                      <p className="font-semibold text-slate-200">{n.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{n.body}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px] uppercase">
                        {n.type || 'system'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {n.user?.name || 'Học viên'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] text-right">
                      {new Date(n.createdAt).toLocaleString('vi-VN')}
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
