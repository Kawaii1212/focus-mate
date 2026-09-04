"use client";

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, Zap, Shield, Users, Palette, Star, Brain, TrendingUp } from 'lucide-react';

const BENEFITS = [
  { icon: <Crown className="w-5 h-5" />, title: 'Không quảng cáo', desc: 'Trải nghiệm học tập trung tuyệt đối' },
  { icon: <Star className="w-5 h-5" />, title: 'Mở Khóa Mọi Mascot', desc: 'Truy cập toàn bộ thú cưng và skin hiếm' },
  { icon: <Zap className="w-5 h-5" />, title: 'Focus Coin x2', desc: 'Nhân đôi phần thưởng xu sau mỗi Pomodoro' },
  { icon: <Brain className="w-5 h-5" />, title: 'AI Planner Pro', desc: 'Lên lịch thông minh không giới hạn số task' },
  { icon: <Shield className="w-5 h-5" />, title: 'Bảo vệ Streak', desc: 'Tặng 5 khiên (Shield) miễn phí mỗi tháng' },
  { icon: <TrendingUp className="w-5 h-5" />, title: 'Báo cáo chi tiết', desc: 'Thống kê tiến độ bằng biểu đồ nâng cao' },
];

const PLANS = [
  { id: 'vip', label: 'Combo VIP', price: '39.000đ', period: '/trọn đời', badge: 'Bán chạy' },
  { id: 'monthly', label: 'Hàng tháng', price: '49.000đ', period: '/tháng', badge: null },
  { id: 'yearly', label: 'Hàng năm', price: '399.000đ', period: '/năm', badge: 'Tiết kiệm 32%' },
];

export default function PremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState('vip');
  const [showPayment, setShowPayment] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);

  const handleUpgrade = () => {
    setShowPayment(true);
  };

  const confirmPayment = () => {
    setUpgrading(true);
    setTimeout(() => {
      setUpgrading(false);
      setShowPayment(false);
      setUpgraded(true);
    }, 2000);
  };

  return (
    <AppLayout mascotState="happy">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Hero */}
        <div
          className="text-center py-10 rounded-3xl space-y-3"
          style={{ background: 'var(--gradient-sky)' }}
        >
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-fm-lg"
            style={{ background: 'hsl(var(--accent))' }}
          >
            <Crown className="w-8 h-8" style={{ color: 'hsl(var(--accent-foreground))' }} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">FocusMate Premium</h1>
          <p className="text-muted-foreground">Mở khóa toàn bộ tiềm năng học tập của bạn</p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-3">
          {BENEFITS.map((b, i) => (
            <Card key={i} className="rounded-2xl shadow-fm-sm">
              <CardContent className="p-4 flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'hsl(var(--butter) / 0.2)', color: 'hsl(var(--accent-foreground))' }}
                >
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

        {/* Plans */}
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
                  <Badge
                    className="absolute -top-2.5 right-3 text-xs"
                    style={{ background: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}
                  >
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

        {/* Payment Section */}
        {showPayment && !upgraded && (
          <div className="p-6 rounded-3xl border bg-white shadow-fm-md animate-fade-in mt-6 space-y-4">
            <h3 className="text-xl font-bold text-center text-slate-900">Thanh toán chuyển khoản</h3>
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm text-center">
              <p>Ngân hàng: <strong>Vietcombank</strong></p>
              <p>Số tài khoản: <strong>0123456789</strong></p>
              <p>Chủ tài khoản: <strong>FOCUS MATE</strong></p>
              <p>Số tiền: <strong className="text-sky-600">{PLANS.find(p => p.id === selectedPlan)?.price}</strong></p>
              <p>Nội dung: <strong>FOCUSMATE {selectedPlan.toUpperCase()}</strong></p>
            </div>
            <div className="flex justify-center p-4">
              <div className="w-40 h-40 bg-slate-200 flex items-center justify-center rounded-xl">
                <span className="text-xs text-slate-500 font-medium">[QR Code Ngân Hàng]</span>
              </div>
            </div>
            <Button
              onClick={confirmPayment}
              disabled={upgrading}
              className="w-full h-12 rounded-xl font-bold text-base shadow-fm-md bg-sky-500 hover:bg-sky-600 text-white"
            >
              {upgrading ? (
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5 animate-pulse" />
                  Đang xác nhận...
                </span>
              ) : (
                "Tôi đã chuyển khoản"
              )}
            </Button>
            <Button
              onClick={() => setShowPayment(false)}
              variant="ghost"
              className="w-full h-10 rounded-xl text-slate-500"
            >
              Hủy
            </Button>
          </div>
        )}

        {/* Upgrade button */}
        {!showPayment && !upgraded && (
          <Button
            onClick={handleUpgrade}
            className="w-full h-14 rounded-2xl font-bold text-lg shadow-fm-lg mt-4"
            style={{ background: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}
          >
            <span className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Nâng cấp lên Premium
            </span>
          </Button>
        )}

        {upgraded && (
          <div
            className="w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 mt-4"
            style={{ background: 'hsl(var(--sky-light))', color: 'hsl(var(--sky))' }}
          >
            <Check className="w-5 h-5" />
            Đã nâng cấp thành công!
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-4">
          * Giao dịch được bảo mật và tự động kích hoạt.
        </p>
      </div>
    </AppLayout>
  );
}
