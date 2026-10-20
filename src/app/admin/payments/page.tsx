"use client";

import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Crown,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (planFilter !== 'all') params.append('planId', planFilter);

      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      if (!res.ok) throw new Error('Không thể tải lịch sử thanh toán');
      const data = await res.json();

      // Defensively parse array from either { payments: [...] } or direct array [...]
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.payments)
        ? data.payments
        : [];
      setPayments(list);
      if (data?.summary) {
        setSummaryData(data.summary);
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tải giao dịch');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [planFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  // KPI Calculations — chỉ tính trên giao dịch đã thanh toán thành công
  const paymentList = Array.isArray(payments) ? payments : [];
  const totalRevenue = summaryData?.totalPaid ?? paymentList.reduce(
    (acc, p) => acc + (p?.amount || 0),
    0
  );
  const paidCount = summaryData?.totalOrders ?? paymentList.length;
  const monthRevenue = summaryData?.paidThisMonth ?? 0;
  const customerCount = summaryData?.customers ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span>Quản Lý Doanh Thu & Giao Dịch PayOS</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Các giao dịch nâng cấp gói Premium (Tháng 49k / Năm 399k) đã thanh toán thành công qua PayOS
          </p>
        </div>

        <Button
          onClick={fetchPayments}
          variant="outline"
          size="sm"
          className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs h-9"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Làm mới
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-slate-400 font-medium">Doanh Thu Đã Thu</p>
            <p className="text-2xl font-bold text-emerald-400">
              {(totalRevenue || 0).toLocaleString('vi-VN')} ₫
            </p>
            <p className="text-[11px] text-slate-400">{paidCount} đơn thành công</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-slate-400 font-medium">Đơn Đã Thanh Toán</p>
            <p className="text-2xl font-bold text-white">{paidCount}</p>
            <p className="text-[11px] text-emerald-400">Tự động qua PayOS Webhook</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-slate-400 font-medium">Doanh Thu Tháng Này</p>
            <p className="text-2xl font-bold text-sky-400">
              {(monthRevenue || 0).toLocaleString('vi-VN')} ₫
            </p>
            <p className="text-[11px] text-sky-400/90">Tính theo thời điểm quyết toán</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-slate-400 font-medium">Khách Hàng Nâng Cấp</p>
            <p className="text-2xl font-bold text-amber-400">{customerCount}</p>
            <p className="text-[11px] text-slate-400">Học viên đã mua Premium</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm theo mã đơn (#123456), tên hoặc email khách hàng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs rounded-xl h-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl h-9">
                  <SelectValue placeholder="Gói" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                  <SelectItem value="all">Tất cả các gói</SelectItem>
                  <SelectItem value="monthly">Gói 1 Tháng (49k)</SelectItem>
                  <SelectItem value="yearly">Gói 1 Năm (399k)</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="submit"
                className="bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs h-9 px-4 font-semibold"
              >
                Lọc
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="bg-slate-900/90 border-slate-800 text-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">Mã Đơn</th>
                <th className="py-3 px-4">Khách Hàng</th>
                <th className="py-3 px-4">Gói Đăng Ký</th>
                <th className="py-3 px-4">Số Tiền (VND)</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4">Thời Gian Quyết Toán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải danh sách giao dịch...</span>
                    </div>
                  </td>
                </tr>
              ) : paymentList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Không tìm thấy giao dịch thành công nào
                  </td>
                </tr>
              ) : (
                paymentList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Order code */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-slate-200">#{p.orderCode}</div>
                      {p.payosTransactionId && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          GD: {p.payosTransactionId}
                        </div>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      {p.user ? (
                        <div className="min-w-0 max-w-[180px]">
                          <p className="font-semibold text-slate-200 truncate">{p.user.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{p.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Khách vãng lai</span>
                      )}
                    </td>

                    {/* Plan */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-200">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>{p.planId === 'yearly' ? 'Gói 1 Năm' : 'Gói 1 Tháng'}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {(p.amount || 0).toLocaleString('vi-VN')} ₫
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <Badge className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Đã Thanh Toán
                      </Badge>
                    </td>

                    {/* Paid date */}
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(p.paidAt || p.createdAt).toLocaleString('vi-VN')}
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
