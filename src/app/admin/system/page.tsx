"use client";

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Server,
  Database,
  Cpu,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Key,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AdminSystemPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/admin/system');
      const data = await res.json();
      setHealth(data);
    } catch (err: any) {
      toast.error('Kh�ng th? ki?m tra s?c kh?e h? th?ng');
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
      if (!res.ok) throw new Error(data.message || 'L?i kh?i t?o m?u');
      toast.success(data.message || '�� t?o c�c phi�n h?c m?u th�nh c�ng!');
      fetchHealth();
    } catch (err: any) {
      toast.error(err.message || 'L?i t?o phi�n h?c m?u');
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
            <Settings className="w-5 h-5 text-indigo-400" />
            <span>Tr?ng Th�i H? Th?ng & C?u H�nh M�y Ch?</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gi�m s�t k?t n?i co s? d? li?u, c�c bi?n m�i tru?ng v� ti?n �ch b?o tr� n?n t?ng
          </p>
        </div>

        <Button
          onClick={fetchHealth}
          variant="outline"
          size="sm"
          className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs h-9"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Ki?m tra l?i
        </Button>
      </div>

      {/* Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* DB Card */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">PostgreSQL Database</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                  {health?.database?.connected ? '�ang K?t N?i T?t' : 'M?t K?t N?i'}
                </Badge>
                <span className="text-xs text-slate-400 font-mono">
                  {health?.database?.latencyMs}ms ping
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Nh� cung c?p: <span className="text-slate-200 font-medium">{health?.database?.provider}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Card */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Google Gemini AI</span>
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <div>
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-xs">
                {health?.environment?.hasGeminiKey ? '�� C?u H�nh Kh�a API' : 'Chua C� Kh�a'}
              </Badge>
              <p className="text-[11px] text-slate-400 mt-2">
                M?c d�ch: AI Chatbot gia su & Ph�n b? l?ch h?c AI Planner
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Node Runtime Card */}
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">M�i Tru?ng V?n H�nh</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-white font-mono">
                Node.js {health?.environment?.nodeVersion || 'v24'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                N?n t?ng: <span className="font-mono text-slate-300">{health?.environment?.platform}</span> � Next.js 15
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Entity Counts */}
      <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Th?ng K� B?ng D? Li?u Trong PostgreSQL</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            S? lu?ng b?n ghi th?c t? du?c d?ng b? theo th?i gian th?c
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[11px] text-slate-400">Ngu?i D�ng (User)</p>
              <p className="text-xl font-bold text-white mt-1">{health?.metrics?.userCount || 0}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[11px] text-slate-400">Linh V?t (Mascot)</p>
              <p className="text-xl font-bold text-amber-400 mt-1">{health?.metrics?.mascotCount || 0}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[11px] text-slate-400">Ph�ng H?c (ActiveRoom)</p>
              <p className="text-xl font-bold text-rose-400 mt-1">{health?.metrics?.roomCount || 0}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[11px] text-slate-400">Giao D?ch (Payment)</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">{health?.metrics?.paymentCount || 0}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[11px] text-slate-400">Phi�n H?c (StudySession)</p>
              <p className="text-xl font-bold text-violet-400 mt-1">{health?.metrics?.sessionCount || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance & Seed Utility */}
      <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Ti?n �ch Kh?i T?o D? Li?u Tr?c Quan (Demo Data Generator)</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            N?u co s? d? li?u hi?n t?i chua c� nhi?u phi�n h?c Pomodoro th?c t?, b?n c� th? t?o 15 phi�n h?c m?u d? c�c bi?u d? th?ng k� hi?n th? d?y d?, sinh d?ng.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          <Button
            onClick={handleSeedSessions}
            disabled={seeding}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs h-10 px-5 font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25"
          >
            <Sparkles className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? '�ang t?o d? li?u...' : 'Kh?i T?o 15 Phi�n H?c M?u Cho Sinh Vi�n'}</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
