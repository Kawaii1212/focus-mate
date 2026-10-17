"use client";

import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Crown,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  const [approvePayment, setApprovePayment] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        planId: planFilter,
        search,
      });

      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      if (!res.ok) throw new Error('Kh�ng th? t?i danh s�ch thanh to�n');
      const data = await res.json();
      setPayments(data.payments || []);
      setSummary(data.summary || {});
    } catch (err: any) {
      toast.error(err.message || 'L?i t?i thanh to�n');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, planFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleUpdateStatus = async (paymentId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'L?i c?p nh?t');

      toast.success(
        newStatus === 'paid'
          ? '�� duy?t thanh to�n th�nh c�ng v� t? d?ng c?p quy?n Premium VIP cho h?c vi�n!'
          : '�� c?p nh?t tr?ng th�i giao d?ch'
      );
      setApprovePayment(null);
      fetchPayments();
    } catch (err: any) {
      toast.error(err.message || 'L?i c?p nh?t');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            <span>Qu?n L� Doanh Thu & Giao D?ch PayOS</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Theo d�i t?t c? don h�ng n�ng c?p g�i Premium (Th�ng 49k / Nam 399k) v� duy?t giao d?ch
          </p>
        </div>

        <Button
          onClick={fetchPayments}
          variant="outline"
          size="sm"
          className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs h-9"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          L�m m?i
        </Button>
      </div>

      {/* Revenue KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Doanh Thu �� Thu (Paid)</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {(summary.totalPaid || 0).toLocaleString('vi-VN')}?
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Ti?n th?c nh?n qua PayOS</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Gi� Tr? Ch? X? L� (Pending)</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                {(summary.totalPending || 0).toLocaleString('vi-VN')}?
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">H?c vi�n d� t?o link thanh to�n</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">T?ng �on �?t H�ng</p>
              <p className="text-2xl font-bold text-white mt-1">{summary.totalOrders || 0}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">To�n b? l?ch s? PayOS</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
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
                placeholder="T�m theo t�n h?c vi�n ho?c email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-indigo-500 rounded-xl text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                <SelectTrigger className="w-[140px] bg-slate-950 border-slate-800 text-xs h-9 rounded-xl">
                  <SelectValue placeholder="Tr?ng th�i" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                  <SelectItem value="all">M?i tr?ng th�i</SelectItem>
                  <SelectItem value="paid">�� thanh to�n</SelectItem>
                  <SelectItem value="pending">Ch? x? l�</SelectItem>
                  <SelectItem value="cancelled">�� h?y</SelectItem>
                </SelectContent>
              </Select>

              <Select value={planFilter} onValueChange={(v) => setPlanFilter(v)}>
                <SelectTrigger className="w-[140px] bg-slate-950 border-slate-800 text-xs h-9 rounded-xl">
                  <SelectValue placeholder="G�i dang k�" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                  <SelectItem value="all">M?i g�i</SelectItem>
                  <SelectItem value="monthly">G�i Th�ng (49k)</SelectItem>
                  <SelectItem value="yearly">G�i Nam (399k)</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 rounded-xl text-xs h-9 px-3"
              >
                L?c
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
                <th className="py-3 px-4">M� �on</th>
                <th className="py-3 px-4">Kh�ch H�ng</th>
                <th className="py-3 px-4">G�i �ang K�</th>
                <th className="py-3 px-4">S? Ti?n (VND)</th>
                <th className="py-3 px-4">Tr?ng Th�i</th>
                <th className="py-3 px-4">Th?i Gian</th>
                <th className="py-3 px-4 text-right">Thao T�c</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>�ang t?i danh s�ch giao d?ch...</span>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Kh�ng t�m th?y giao d?ch n�o
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Order code */}
                    <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                      #{p.orderCode}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      {p.user ? (
                        <div className="min-w-0 max-w-[180px]">
                          <p className="font-semibold text-slate-200 truncate">{p.user.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{p.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Kh�ch v�ng lai</span>
                      )}
                    </td>

                    {/* Plan */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-200">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>{p.planId === 'yearly' ? 'G�i 1 Nam' : 'G�i 1 Th�ng'}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {(p.amount || 0).toLocaleString('vi-VN')}?
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <Badge
                        className={`text-[10px] px-2 py-0.5 ${
                          p.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : p.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {p.status === 'paid' ? '�� Thanh To�n' : p.status === 'pending' ? 'Ch? Duy?t' : '�� H?y'}
                      </Badge>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(p.createdAt).toLocaleString('vi-VN')}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.paymentLink && p.status === 'pending' && (
                          <a
                            href={p.paymentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-all"
                            title="M? c?ng thanh to�n PayOS"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {p.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => setApprovePayment(p)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] h-7 px-2 font-semibold shadow"
                          >
                            Duy?t �on
                          </Button>
                        )}

                        {p.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateStatus(p.id, 'cancelled')}
                            className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-[10px] h-7 px-2"
                          >
                            H?y
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Approve Payment Dialog */}
      <Dialog open={Boolean(approvePayment)} onOpenChange={() => setApprovePayment(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Duy?t Thanh To�n Th? C�ng</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              B?n c� ch?c ch?n mu?n x�c nh?n don h�ng #{approvePayment?.orderCode} ({approvePayment?.amount?.toLocaleString('vi-VN')}?) d� thanh to�n th�nh c�ng?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
            <p className="text-slate-300">
              Kh�ch h�ng: <span className="font-semibold text-white">{approvePayment?.user?.name}</span>
            </p>
            <p className="text-slate-300">
              G�i: <span className="font-semibold text-amber-400">{approvePayment?.planId}</span>
            </p>
            <p className="text-emerald-400 text-[11px]">
              ? H? th?ng s? t? d?ng k�ch ho?t t�i kho?n Premium VIP tuong ?ng cho h?c vi�n ngay t?c th�!
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setApprovePayment(null)}
              className="bg-slate-950 border-slate-800 text-xs rounded-xl"
            >
              ��ng
            </Button>
            <Button
              type="button"
              disabled={actionLoading}
              onClick={() => handleUpdateStatus(approvePayment.id, 'paid')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl"
            >
              {actionLoading ? '�ang duy?t...' : 'X�c Nh?n & K�ch Ho?t VIP'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
