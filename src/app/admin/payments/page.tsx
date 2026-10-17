"use client";

import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Crown,
  RefreshCw,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Manual Approval Modal
  const [approvePayment, setApprovePayment] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
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
  }, [statusFilter, planFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleUpdateStatus = async (paymentId: string, status: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi cập nhật giao dịch');

      toast.success(data.message || 'Cập nhật trạng thái thành công');
      setApprovePayment(null);
      fetchPayments();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi xử lý');
    } finally {
      setActionLoading(false);
    }
  };

  // Safe KPI Calculations
  const paymentList = Array.isArray(payments) ? payments : [];
  const totalRevenue = summaryData?.totalPaid ?? paymentList
    .filter((p) => p?.status === 'paid')
    .reduce((acc, p) => acc + (p?.amount || 0), 0);
  const pendingRevenue = summaryData?.totalPending ?? paymentList
    .filter((p) => p?.status === 'pending')
    .reduce((acc, p) => acc + (p?.amount || 0), 0);
  const paidCount = paymentList.filter((p) => p?.status === 'paid').length;
  const pendingCount = paymentList.filter((p) => p?.status === 'pending').length;
  const cancelledCount = paymentList.filter((p) => p?.status === 'cancelled').length;

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
            Theo dõi tất cả đơn hàng nâng cấp gói Premium (Tháng 49k / Năm 399k) và duyệt giao dịch
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
            <p className="text-[11px] text-slate-400">{paidCount} đơn đã quyết toán</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-slate-400 font-medium">Đơn Đã Thanh Toán</p>
            <p className="text-2xl font-bold text-white">{paidCount}</p>
            <p className="text-[11px] text-emerald-400">Tỷ lệ hoàn tất cao</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-slate-400 font-medium">Giá Trị Chờ Xử Lý</p>
            <p className="text-2xl font-bold text-amber-400">
              {(pendingRevenue || 0).toLocaleString('vi-VN')} ₫
            </p>
            <p className="text-[11px] text-amber-400/90">{pendingCount} đơn đang chờ</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-slate-400 font-medium">Đơn Hủy / Hết Hạn</p>
            <p className="text-2xl font-bold text-slate-400">{cancelledCount}</p>
            <p className="text-[11px] text-slate-500">Khách không tiếp tục</p>
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36 bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl h-9">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="paid">Đã thanh toán (Paid)</SelectItem>
                  <SelectItem value="pending">Chờ duyệt (Pending)</SelectItem>
                  <SelectItem value="cancelled">Đã hủy (Cancelled)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full sm:w-36 bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl h-9">
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
                <th className="py-3 px-4">Thời Gian</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải danh sách giao dịch...</span>
                    </div>
                  </td>
                </tr>
              ) : paymentList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Không tìm thấy giao dịch nào
                  </td>
                </tr>
              ) : (
                paymentList.map((p) => (
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
                      <Badge
                        className={`text-[10px] px-2 py-0.5 ${
                          p.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : p.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {p.status === 'paid' ? 'Đã Thanh Toán' : p.status === 'pending' ? 'Chờ Duyệt' : 'Đã Hủy'}
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
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-all"
                            title="Mở cổng thanh toán PayOS"
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
                            Duyệt Đơn
                          </Button>
                        )}

                        {p.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateStatus(p.id, 'cancelled')}
                            className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-[10px] h-7 px-2"
                          >
                            Hủy
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
              <span>Duyệt Thanh Toán Thủ Công</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Bạn có chắc chắn muốn xác nhận đơn hàng #{approvePayment?.orderCode} ({approvePayment?.amount?.toLocaleString('vi-VN')} ₫) đã thanh toán thành công?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
            <p className="text-slate-300">
              Khách hàng: <span className="font-semibold text-white">{approvePayment?.user?.name}</span>
            </p>
            <p className="text-slate-300">
              Gói: <span className="font-semibold text-amber-400">{approvePayment?.planId}</span>
            </p>
            <p className="text-emerald-400 text-[11px]">
              ⚡ Hệ thống sẽ tự động kích hoạt tài khoản Premium VIP tương ứng cho học viên ngay tức thì!
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setApprovePayment(null)}
              className="bg-slate-950 border-slate-800 text-xs rounded-xl"
            >
              Đóng
            </Button>
            <Button
              type="button"
              disabled={actionLoading}
              onClick={() => handleUpdateStatus(approvePayment.id, 'paid')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl"
            >
              {actionLoading ? 'Đang duyệt...' : 'Xác Nhận & Kích Hoạt VIP'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
