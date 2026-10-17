"use client";

import React, { useEffect, useState } from 'react';
import {
  Bell,
  Send,
  Users,
  Crown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  const [type, setType] = useState('system');
  const [target, setTarget] = useState('all');
  const [url, setUrl] = useState('/dashboard');
  const [sending, setSending] = useState(false);

  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/admin/notifications/broadcast');
      if (res.ok) {
        const data = await res.json();
        setHistory(data || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Vui l�ng nh?p d?y d? ti�u d? v� n?i dung');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          type,
          target,
          url: url.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'L?i g?i th�ng b�o');

      toast.success(data.message || '�� ph�t th�ng b�o th�nh c�ng!');
      setTitle('');
      setBody('');
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message || 'L?i ph�t th�ng b�o');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-400" />
          <span>Trung T�m Ph�t Th�ng B�o To�n H? Th?ng</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          G?i th�ng b�o in-app tr?c ti?p t?i h?p thu th�ng b�o c?a h?c vi�n tr�n FocusMate
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white">So?n Th�ng B�o M?i</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              N?i dung s? xu?t hi?n tr�n thanh chu�ng th�ng b�o c?a ngu?i nh?n
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Ti�u d? th�ng b�o</Label>
                <Input
                  placeholder="V� d?: ?? S? ki?n �n thi: Nh�n d�i EXP cu?i tu?n!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">N?i dung chi ti?t</Label>
                <Textarea
                  rows={4}
                  placeholder="Nh?p th�ng di?p g?i t?i c?ng d?ng h?c vi�n..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs rounded-xl resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">�?i tu?ng nh?n</Label>
                  <Select value={target} onValueChange={setTarget}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <SelectItem value="all">To�n b? h?c vi�n (All)</SelectItem>
                      <SelectItem value="premium">Ch? h?i vi�n Premium VIP</SelectItem>
                      <SelectItem value="free">Ch? h?c vi�n Mi?n ph�</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Lo?i th�ng b�o</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <SelectItem value="system">H? th?ng (System)</SelectItem>
                      <SelectItem value="reminder">Nh?c nh? (Reminder)</SelectItem>
                      <SelectItem value="event">S? ki?n (Event)</SelectItem>
                      <SelectItem value="promo">Khuy?n m�i (Promo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">�u?ng d?n khi nh?p v�o</Label>
                  <Input
                    placeholder="/dashboard"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-xs rounded-xl"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={sending}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs h-10 font-semibold px-6 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? '�ang g?i th�ng b�o...' : 'Ph�t Th�ng B�o Ngay'}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Live Preview Card */}
        <div className="space-y-4">
          <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-semibold tracking-wider text-slate-400">
                Xem Tru?c Tr�n App H?c Vi�n
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 shadow-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                      {type}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">V?a xong</span>
                </div>

                <p className="text-xs font-bold text-white">
                  {title || 'Ti�u d? th�ng b�o m?u...'}
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {body || 'N?i dung th�ng b�o s? hi?n th? ? d�y nhu h?c vi�n nh�n th?y tr�n chu�ng th�ng b�o...'}
                </p>

                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800">
                  <span>�?i tu?ng: {target === 'all' ? 'T?t c?' : target}</span>
                  <span className="text-indigo-400">{url || '/dashboard'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History Table */}
      <Card className="bg-slate-900/80 border-slate-800 text-slate-100 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">L?ch S? Th�ng B�o �� G?i G?n ��y</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Danh s�ch c�c th�ng b�o in-app d� g?i v�o t�i kho?n h?c vi�n
          </CardDescription>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">Ti�u �?</th>
                <th className="py-3 px-4">N?i Dung</th>
                <th className="py-3 px-4">Lo?i</th>
                <th className="py-3 px-4">Ngu?i Nh?n</th>
                <th className="py-3 px-4 text-right">Th?i Gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loadingHistory ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    �ang t?i l?ch s?...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Chua c� th�ng b�o n�o du?c luu
                  </td>
                </tr>
              ) : (
                history.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white max-w-[200px] truncate">
                      {n.title}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-[300px] truncate">{n.body}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {n.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {n.user?.name || 'H?c vi�n'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px]">
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
