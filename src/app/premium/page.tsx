"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, Zap, Shield, Star, Brain, TrendingUp, ExternalLink, Loader2 } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { paymentApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { PremiumPlan } from '@/types';

const BENEFITS = [
  { icon: <Crown className="w-5 h-5" />, title: 'Không quảng cáo', desc: 'Trải nghiệm học tập trung tuyệt đối' },
  { icon: <Star className="w-5 h-5" />, title: 'Mở Khóa Mọi Mascot', desc: 'Truy cập toàn bộ thú cưng và skin hiếm' },
  { icon: <Zap className="w-5 h-5" />, title: 'Focus Coin x2', desc: 'Nhân đôi phần thưởng xu sau mỗi Pomodoro' },
  { icon: <Brain className="w-5 h-5" />, title: 'AI Planner Pro', desc: 'Lên lịch thông minh không giới hạn số task' },
  { icon: <Shield className="w-5 h-5" />, title: 'Bảo vệ Streak', desc: 'Tặng 5 khiên (Shield) miễn phí mỗi tháng' },
  { icon: <TrendingUp className="w-5 h-5" />, title: 'Báo cáo chi tiết', desc: 'Thống kê tiến độ bằng biểu đồ nâng cao' },
];

const PLANS: { id: PremiumPlan; label: string; price: string; period: string; badge: string | null }[] = [
  { id: 'monthly', label: 'Hàng tháng', price: '49.000đ', period: '/tháng', badge: null },
  { id: 'yearly', label: 'Hàng năm', price: '399.000đ', period: '/năm', badge: 'Tiết kiệm 32%' },
];

function PremiumContent() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan>('monthly');
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const handlePaymentReturn = useCallback(async () => {
    const paymentStatus = searchParams?.get('payment');
    const orderCode = searchParams?.get('orderCode');

    if (paymentStatus === 'success' && orderCode && state.user) {
      try {
        const status = await paymentApi.getPremiumStatus(state.user.id);
        if (status.isPremium) {
          dispatch({ type: 'SET_PREMIUM', payload: { isPremium: true, premiumExpiry: status.premiumExpiry } });
          toast({ title: 'Nâng cấp thành công!', description: 'Bạn đã là thành viên Premium.' });
        }
      } catch {
        toast({ title: 'Lỗi xác nhận', description: 'Vui lòng liên hệ hỗ trợ nếu tiền đã bị trừ.', variant: 'destructive' });
      }
    }

    if (paymentStatus === 'cancelled') {
      toast({ title: 'Đã hủy', description: 'Bạn đã hủy thanh toán.', variant: 'destructive' });
    }
  }, [searchParams, state.user, dispatch, toast]);

  useEffect(() => {
    handlePaymentReturn();
  }, [handlePaymentReturn]);

  const handleUpgrade = async () => {
    if (!state.user) {
      toast({ title: 'Vui lòng đăng nhập', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const result = await paymentApi.createPayment(state.user.id, selectedPlan);
      setCheckoutUrl(result.checkoutUrl);
      window.location.href = result.checkoutUrl;
    } catch (err: any) {
      toast({ title: 'Lỗi tạo thanh toán', description: err.message || 'Vui lòng thử lại.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (state.isPremium) {
    return (
      <AppLayout mascotState="happy">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center py-10 rounded-3xl space-y-3" style={{ background: 'var(--gradient-sky)' }}>
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-fm-lg" style={{ background: 'hsl(var(--accent))' }}>
              <Crown className="w-8 h-8" style={{ color: 'hsl(var(--accent-foreground))' }} />
            </div>
            <h1 className="text-3xl font-bold text-foreground">FocusMate Premium</h1>
            <p className="text-muted-foreground">Bạn đã là thành viên Premium!</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {BENEFITS.map((b, i) => (
              <Card key={i} className="rounded-2xl shadow-fm-sm">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--butter) / 0.2)', color: 'hsl(var(--accent-foreground))' }}>
                    {b.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{b.title}</p>
                    <p className="text-xs text-muted-foreground">{b.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-2" style={{ background: 'hsl(var(--sky-light))', color: 'hsl(var(--sky))' }}>
            <Check className="w-5 h-5" />
            Đã Premium
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout mascotState="happy">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center py-10 rounded-3xl space-y-3" style={{ background: 'var(--gradient-sky)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-fm-lg" style={{ background: 'hsl(var(--accent))' }}>
            <Crown className="w-8 h-8" style={{ color: 'hsl(var(--accent-foreground))' }} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">FocusMate Premium</h1>
          <p className="text-muted-foreground">Mở khóa toàn bộ tiềm năng học tập của bạn</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {BENEFITS.map((b, i) => (
            <Card key={i} className="rounded-2xl shadow-fm-sm">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--butter) / 0.2)', color: 'hsl(var(--accent-foreground))' }}>
                  {b.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Chọn gói:</p>
          <div className="grid grid-cols-2 gap-3">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className="p-5 rounded-2xl text-left transition-all relative"
                style={{
                  border: `2px solid ${selectedPlan === plan.id ? 'hsl(var(--sky))' : 'hsl(var(--border))'}`,
                  background: selectedPlan === plan.id ? 'hsl(var(--sky-light))' : 'hsl(var(--card))',
                }}
              >
                {plan.badge && (
                  <Badge className="absolute -top-2.5 right-3 text-xs" style={{ background: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                    {plan.badge}
                  </Badge>
                )}
                <p className="font-semibold text-foreground">{plan.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold" style={selectedPlan === plan.id ? { color: 'hsl(var(--sky))' } : {}}>
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                {selectedPlan === plan.id && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--sky))' }}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {checkoutUrl && (
          <div className="p-6 rounded-3xl border bg-white shadow-fm-md animate-fade-in space-y-4">
            <h3 className="text-xl font-bold text-center text-slate-900">Thanh toán qua PayOS</h3>
            <p className="text-sm text-center text-slate-600">
              Hoàn tất thanh toán trên tab mới. Sau khi thanh toán, quay lại trang này để kích hoạt Premium.
            </p>
            <Button
              onClick={() => { window.location.href = checkoutUrl; }}
              className="w-full h-12 rounded-xl font-bold text-base shadow-fm-md bg-sky-500 hover:bg-sky-600 text-white"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Mở lại trang thanh toán
            </Button>
            <Button
              onClick={async () => {
                if (!state.user) return;
                try {
                  const status = await paymentApi.getPremiumStatus(state.user.id);
                  if (status.isPremium) {
                    dispatch({ type: 'SET_PREMIUM', payload: { isPremium: true, premiumExpiry: status.premiumExpiry } });
                    toast({ title: 'Nâng cấp thành công!' });
                    setCheckoutUrl(null);
                  } else {
                    toast({ title: 'Chưa nhận được thanh toán', description: 'Vui lòng hoàn tất thanh toán.', variant: 'destructive' });
                  }
                } catch {
                  toast({ title: 'Lỗi kiểm tra', variant: 'destructive' });
                }
              }}
              variant="ghost"
              className="w-full h-10 rounded-xl text-sky-600"
            >
              Tôi đã thanh toán
            </Button>
            <Button
              onClick={() => setCheckoutUrl(null)}
              variant="ghost"
              className="w-full h-10 rounded-xl text-slate-500"
            >
              Hủy
            </Button>
          </div>
        )}

        {!checkoutUrl && (
          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full h-14 rounded-2xl font-bold text-lg shadow-fm-lg mt-4"
            style={{ background: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang tạo link thanh toán...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Nâng cấp lên Premium
              </span>
            )}
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground mt-4">
          * Giao dịch được xử lý qua PayOS, bảo mật và tự động kích hoạt.
        </p>
      </div>
    </AppLayout>
  );
}

export default function PremiumPage() {
  return (
    <Suspense fallback={
      <AppLayout mascotState="happy">
        <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
        </div>
      </AppLayout>
    }>
      <PremiumContent />
    </Suspense>
  );
}
