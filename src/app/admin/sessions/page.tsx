"use client";

import React, { useEffect, useState } from 'react';
import {
  Timer,
  Search,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RefreshCw,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [validFilter, setValidFilter] = useState('all');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        isValid: validFilter === 'all' ? '' : validFilter,
      });

      const res = await fetch(`/api/admin/sessions?${params.toString()}`);
      if (!res.ok) throw new Error('Kh�ng th? t?i nh?t k� phi�n h?c');
      const data = await res.json();
      setSessions(data.sessions || []);
      setSummary(data.summary || {});
    } catch (err: any) {
      toast.error(err.message || 'L?i t?i phi�n h?c');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [validFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSessions();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Timer className="w-5 h-5 text-indigo-400" />
            <span>Nh?t K� Phi�n H?c Pomodoro To�n H? Th?ng</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Theo d�i th?i lu?ng t?p trung, t? l? ho�n th�nh nhi?m v? v� EXP t�ch luy c?a h?c vi�n
          </p>
        </div>

        <Button
          onClick={fetchSessions}
          variant="outline"
          size="sm"
          className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs h-9"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          L�m m?i
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">T?ng Phi�n H?c Ghi Nh?n</p>
              <p className="text-2xl font-bold text-white mt-1">{summary.totalSessions || 0}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">C�c bu?i h?c d� ho�n th�nh</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Timer className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">T?ng Th?i Gian T?p Trung</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.totalHours || 0} gi?</p>
              <p className="text-[11px] text-slate-400 mt-0.5">T?ng s? ph�t h?c vi�n h?c b�i</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">T? L? Ho�n Th�nh Trung B�nh</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{summary.avgCompletion || 0}%</p>
              <p className="text-[11px] text-slate-400 mt-0.5">M?c d? cam k?t m?c ti�u</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="T�m theo t�n b�i h?c, t�n h?c vi�n ho?c email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-indigo-500 rounded-xl text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select value={validFilter} onValueChange={(v) => setValidFilter(v)}>
                <SelectTrigger className="w-[160px] bg-slate-950 border-slate-800 text-xs h-9 rounded-xl">
                  <SelectValue placeholder="Chu?i Streak" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                  <SelectItem value="all">T?t c? phi�n h?c</SelectItem>
                  <SelectItem value="true">�? di?u ki?n Streak (=50%)</SelectItem>
                  <SelectItem value="false">Chua d? di?u ki?n</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 rounded-xl text-xs h-9 px-3"
              >
                T�m
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-slate-900/80 border-slate-800 text-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">H?c Vi�n</th>
                <th className="py-3 px-4">T�n B�i H?c / Nhi?m V?</th>
                <th className="py-3 px-4">Th?i Lu?ng</th>
                <th className="py-3 px-4">Ti?n �? Ho�n Th�nh</th>
                <th className="py-3 px-4">Ph?n Thu?ng</th>
                <th className="py-3 px-4">Streak H?p L?</th>
                <th className="py-3 px-4 text-right">Ng�y Gi?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>�ang t?i danh s�ch phi�n h?c...</span>
                    </div>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Chua c� phi�n h?c n�o du?c ghi nh?n
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* User */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-7 h-7 rounded-lg bg-slate-800">
                          <AvatarFallback className="bg-indigo-950 text-indigo-300 font-bold text-[10px]">
                            {s.user?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 max-w-[150px]">
                          <p className="font-semibold text-slate-200 truncate">{s.user?.name || 'V� danh'}</p>
                          <p className="text-[10px] text-slate-400 truncate">{s.user?.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Task Title */}
                    <td className="py-3 px-4 font-medium text-slate-100 max-w-[200px] truncate">
                      {s.taskTitle}
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-4 font-mono">
                      <span className="text-white font-semibold">{s.actualMinutes}</span>
                      <span className="text-slate-400 text-[11px]"> / {s.targetMinutes} ph�t</span>
                    </td>

                    {/* Completion Progress */}
                    <td className="py-3 px-4">
                      <div className="space-y-1 w-28">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-300 font-mono">{s.completionPct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, s.completionPct)}%` }}
                            className={`h-full rounded-full ${
                              s.completionPct >= 100
                                ? 'bg-emerald-500'
                                : s.completionPct >= 50
                                ? 'bg-indigo-500'
                                : 'bg-amber-500'
                            }`}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Rewards */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-violet-400">+{s.expEarned} EXP</span>
                        <span className="text-amber-400">+{s.coinEarned} C</span>
                      </div>
                    </td>

                    {/* Valid Streak */}
                    <td className="py-3 px-4">
                      {s.isValid ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          H?p l?
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500 border-slate-800 text-[10px] gap-1">
                          <XCircle className="w-3 h-3" />
                          Chua d?t
                        </Badge>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {s.date || (s.createdAt ? new Date(s.createdAt).toLocaleDateString('vi-VN') : '�')}
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
