"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/store/AppContext';
import { runPlannerEngine, computeUrgencyScore, getMonday, isoDate } from '@/lib/plannerEngine';
import { deadlineApi, plannerApi } from '@/lib/api';
import { Deadline, FixedBlock, PlannerBlock, UserPlannerPrefs } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Brain, Plus, Trash2, CalendarDays, Clock, AlertCircle, CheckCircle2, Play, Zap, BarChart3
} from 'lucide-react';

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const FULL_DAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const HOURS = Array.from({ length: 18 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);

const BLOCK_COLORS: Record<string, string> = {
  class: '#60a5fa',
  work: '#fb923c',
  club: '#c084fc',
  commute: '#94a3b8',
  sleep: '#1e293b',
  meal: '#34d399',
  other: '#f472b6',
};

const TASK_COLORS = [
  '#60a5fa', '#fb923c', '#c084fc', '#f472b6', '#34d399',
  '#fbbf24', '#f87171', '#a78bfa', '#2dd4bf', '#f97316',
];

export default function PlannerPage() {
  const { state: appState, dispatch } = useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (appState.user) {
      deadlineApi.getDeadlines(appState.user?.id || 'unknown').then(dls => {
        dispatch({ type: 'SET_DEADLINES', payload: dls });
      }).catch(console.error);
      
      plannerApi.getBlocks(appState.user?.id || 'unknown').then(blocks => {
        // Here we could store blocks, but planner engine generates them locally in MVP.
      }).catch(console.error);
    }
  }, [appState.user, dispatch]);

  // Deadline form state
  const [dlForm, setDlForm] = useState<Partial<Deadline>>({
    type: 'assignment',
    difficulty: 3,
    priority: 3,
    progressDone: 0,
    splittable: true,
    minSessionLength: 45,
    estimatedHours: 2,
  });

  // Fixed block form
  const [fbForm, setFbForm] = useState<Partial<FixedBlock>>({
    type: 'class',
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '10:00',
  });

  const prefs = appState.plannerState.userPrefs;
  const deadlines = appState.plannerState.deadlines;
  const fixedBlocks = appState.plannerState.fixedBlocks;
  const plan = appState.plannerState.generatedPlan;
  const health = appState.plannerState.healthSummary;

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const startDate = getMonday(new Date());
      const result = runPlannerEngine(deadlines, fixedBlocks, prefs, startDate);
      dispatch({ type: 'SET_GENERATED_PLAN', payload: result });
      setGenerating(false);
      setActiveTab('calendar');
    }, 800);
  };

  const handleAddDeadline = async () => {
    if (!dlForm.taskName || !dlForm.dueDate || !dlForm.estimatedHours || !appState.user) return;
    try {
      const dl: Deadline = {
        id: '', // Backend will generate
        taskName: dlForm.taskName!,
        type: dlForm.type as Deadline['type'] || 'assignment',
        dueDate: dlForm.dueDate!,
        dueTime: dlForm.dueTime,
        estimatedHours: dlForm.estimatedHours!,
        difficulty: dlForm.difficulty ?? 3,
        priority: dlForm.priority ?? 3,
        progressDone: dlForm.progressDone ?? 0,
        splittable: dlForm.splittable ?? true,
        minSessionLength: dlForm.minSessionLength ?? 45,
        notes: dlForm.notes,
      };
      const savedDl = await deadlineApi.createDeadline(dl);
      dispatch({ type: 'ADD_DEADLINE', payload: savedDl });
      setDlForm({ type: 'assignment', difficulty: 3, priority: 3, progressDone: 0, splittable: true, minSessionLength: 45, estimatedHours: 2 });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddFixedBlock = () => {
    if (!fbForm.label) return;
    const fb: FixedBlock = {
      id: Date.now().toString(),
      label: fbForm.label!,
      type: fbForm.type as FixedBlock['type'] || 'other',
      dayOfWeek: fbForm.dayOfWeek ?? 1,
      startTime: fbForm.startTime ?? '08:00',
      endTime: fbForm.endTime ?? '10:00',
    };
    dispatch({ type: 'ADD_FIXED_BLOCK', payload: fb });
    setFbForm({ type: 'class', dayOfWeek: 1, startTime: '08:00', endTime: '10:00' });
  };

  const updatePref = (key: keyof UserPlannerPrefs, value: unknown) => {
    dispatch({ type: 'UPDATE_PLANNER_PREFS', payload: { [key]: value } });
  };

  // Generate week dates for calendar
  const monday = getMonday(new Date());
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return isoDate(d);
  });

  return (
    <AppLayout mascotState="idle">
      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Brain className="w-6 h-6" style={{ color: 'hsl(var(--lilac))' }} />
              AI Planner
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Lên kế hoạch tuần tự động theo mức độ ưu tiên
            </p>
          </div>
          {activeTab === 'calendar' && (
            <Button
              onClick={handleGenerate}
              disabled={generating || deadlines.length === 0}
              style={{ background: 'hsl(var(--sky))', color: 'white' }}
              className="rounded-xl"
            >
              <Zap className="w-4 h-4 mr-2" />
              {generating ? 'Đang tạo...' : 'Tạo lại'}
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg">Tổng quan</TabsTrigger>
            <TabsTrigger value="fixed" className="rounded-lg">Lịch cố định</TabsTrigger>
            <TabsTrigger value="deadlines" className="rounded-lg">Deadline</TabsTrigger>
            <TabsTrigger value="preferences" className="rounded-lg">Tùy chỉnh</TabsTrigger>
            <TabsTrigger value="calendar" className="rounded-lg">Lịch tuần</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <OverviewStat icon={<CalendarDays />} label="Deadline" value={`${deadlines.length} môn`} />
              <OverviewStat icon={<Clock />} label="Lịch cố định" value={`${fixedBlocks.length} block`} />
              <OverviewStat icon={<Brain />} label="Phiên đã xếp" value={`${plan.length} phiên`} />
            </div>

            {deadlines.length === 0 && (
              <Card className="rounded-2xl shadow-fm-sm border-dashed">
                <CardContent className="p-8 text-center space-y-3">
                  <Brain className="w-10 h-10 mx-auto text-muted-foreground" />
                  <p className="font-medium text-foreground">Chưa có deadline nào</p>
                  <p className="text-sm text-muted-foreground">
                    Thêm deadline và lịch cố định, rồi để AI Planner tự động xếp lịch học cho bạn!
                  </p>
                  <Button onClick={() => setActiveTab('deadlines')} style={{ background: 'hsl(var(--sky))', color: 'white' }} className="rounded-xl">
                    Thêm deadline
                  </Button>
                </CardContent>
              </Card>
            )}

            {deadlines.length > 0 && (
              <>
                <Card className="rounded-2xl shadow-fm-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Danh sách deadline (theo urgency)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[...deadlines]
                      .map((d) => ({ ...d, urgency: computeUrgencyScore(d) }))
                      .sort((a, b) => b.urgency - a.urgency)
                      .map((d, i) => {
                        const daysLeft = Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        const remaining = d.estimatedHours * (1 - d.progressDone / 100);
                        return (
                          <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                              style={{ background: TASK_COLORS[i % TASK_COLORS.length] }}
                            >
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{d.taskName}</p>
                              <p className="text-xs text-muted-foreground">
                                Còn {daysLeft}ngày · {remaining.toFixed(1)}h cần học · ưu tiên {d.priority}/5
                              </p>
                            </div>
                            <Badge variant={daysLeft <= 3 ? 'destructive' : 'secondary'} className="text-xs shrink-0">
                              {d.type}
                            </Badge>
                          </div>
                        );
                      })}
                  </CardContent>
                </Card>

                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full h-12 rounded-2xl font-bold shadow-fm-md"
                  style={{ background: 'hsl(var(--sky))', color: 'white' }}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {generating ? 'Đang tạo kế hoạch...' : 'Tạo kế hoạch tuần'}
                </Button>
              </>
            )}
          </TabsContent>

          {/* FIXED SCHEDULE */}
          <TabsContent value="fixed" className="space-y-4 mt-4">
            <Card className="rounded-2xl shadow-fm-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Thêm lịch cố định</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Tên block</Label>
                    <Input placeholder="Lớp Toán / Làm thêm..." value={fbForm.label ?? ''} onChange={(e) => setFbForm({ ...fbForm, label: e.target.value })} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Loại</Label>
                    <Select value={fbForm.type} onValueChange={(v) => setFbForm({ ...fbForm, type: v as FixedBlock['type'] })}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="class">Lớp học</SelectItem>
                        <SelectItem value="work">Làm thêm</SelectItem>
                        <SelectItem value="club">CLB</SelectItem>
                        <SelectItem value="commute">Di chuyển</SelectItem>
                        <SelectItem value="sleep">Ngủ</SelectItem>
                        <SelectItem value="meal">Ăn uống</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Thứ</Label>
                    <Select value={String(fbForm.dayOfWeek)} onValueChange={(v) => setFbForm({ ...fbForm, dayOfWeek: parseInt(v) })}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FULL_DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label>Từ</Label>
                      <Input type="time" value={fbForm.startTime ?? '08:00'} onChange={(e) => setFbForm({ ...fbForm, startTime: e.target.value })} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Đến</Label>
                      <Input type="time" value={fbForm.endTime ?? '10:00'} onChange={(e) => setFbForm({ ...fbForm, endTime: e.target.value })} className="rounded-xl" />
                    </div>
                  </div>
                </div>
                <Button onClick={handleAddFixedBlock} disabled={!fbForm.label} className="rounded-xl" style={{ background: 'hsl(var(--sky))', color: 'white' }}>
                  <Plus className="w-4 h-4 mr-2" /> Thêm block
                </Button>
              </CardContent>
            </Card>

            {fixedBlocks.length > 0 && (
              <Card className="rounded-2xl shadow-fm-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Lịch cố định ({fixedBlocks.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {fixedBlocks.map((fb) => (
                    <div key={fb.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: BLOCK_COLORS[fb.type] }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{fb.label}</p>
                        <p className="text-xs text-muted-foreground">{FULL_DAYS[fb.dayOfWeek]} · {fb.startTime} – {fb.endTime}</p>
                      </div>
                      <button onClick={() => dispatch({ type: 'REMOVE_FIXED_BLOCK', payload: fb.id })} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* DEADLINES */}
          <TabsContent value="deadlines" className="space-y-4 mt-4">
            <Card className="rounded-2xl shadow-fm-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Thêm deadline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label>Tên môn/task *</Label>
                    <Input placeholder="Toán Giải Tích / Essay Tiếng Anh..." value={dlForm.taskName ?? ''} onChange={(e) => setDlForm({ ...dlForm, taskName: e.target.value })} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Loại</Label>
                    <Select value={dlForm.type} onValueChange={(v) => setDlForm({ ...dlForm, type: v as Deadline['type'] })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assignment">Bài tập</SelectItem>
                        <SelectItem value="exam">Thi</SelectItem>
                        <SelectItem value="project">Đồ án</SelectItem>
                        <SelectItem value="reading">Đọc</SelectItem>
                        <SelectItem value="revision">Ôn tập</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Hạn nộp *</Label>
                    <Input type="date" value={dlForm.dueDate ?? ''} onChange={(e) => setDlForm({ ...dlForm, dueDate: e.target.value })} className="rounded-xl" min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tổng số giờ cần *</Label>
                    <Input type="number" min={0.5} max={100} step={0.5} value={dlForm.estimatedHours ?? 2} onChange={(e) => setDlForm({ ...dlForm, estimatedHours: parseFloat(e.target.value) })} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Đã hoàn thành (%)</Label>
                    <Input type="number" min={0} max={100} value={dlForm.progressDone ?? 0} onChange={(e) => setDlForm({ ...dlForm, progressDone: parseInt(e.target.value) })} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Độ khó (1–5): {dlForm.difficulty}</Label>
                    <input type="range" min={1} max={5} value={dlForm.difficulty ?? 3} onChange={(e) => setDlForm({ ...dlForm, difficulty: parseInt(e.target.value) })} className="w-full accent-sky-500" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ưu tiên (1–5): {dlForm.priority}</Label>
                    <input type="range" min={1} max={5} value={dlForm.priority ?? 3} onChange={(e) => setDlForm({ ...dlForm, priority: parseInt(e.target.value) })} className="w-full accent-sky-500" />
                  </div>
                  <div className="flex items-center gap-3 col-span-2">
                    <Switch checked={dlForm.splittable ?? true} onCheckedChange={(v) => setDlForm({ ...dlForm, splittable: v })} />
                    <Label>Có thể chia thành nhiều session</Label>
                  </div>
                </div>
                <Button
                  onClick={handleAddDeadline}
                  disabled={!dlForm.taskName || !dlForm.dueDate || !dlForm.estimatedHours}
                  className="rounded-xl"
                  style={{ background: 'hsl(var(--sky))', color: 'white' }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Thêm deadline
                </Button>
              </CardContent>
            </Card>

            {deadlines.length > 0 && (
              <Card className="rounded-2xl shadow-fm-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Danh sách deadline ({deadlines.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {deadlines.map((d) => {
                    const daysLeft = Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{d.taskName}</p>
                          <p className="text-xs text-muted-foreground">
                            {daysLeft}ngày · {d.estimatedHours}h · khó: {d.difficulty}/5 · ưu tiên: {d.priority}/5
                          </p>
                          <div className="mt-1.5">
                            <Progress value={d.progressDone} className="h-1.5" />
                          </div>
                        </div>
                        <button onClick={async () => {
                          try {
                            await deadlineApi.deleteDeadline(d.id);
                            dispatch({ type: 'REMOVE_DEADLINE', payload: d.id });
                          } catch (e) {
                            console.error(e);
                          }
                        }} className="text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* PREFERENCES */}
          <TabsContent value="preferences" className="space-y-4 mt-4">
            <Card className="rounded-2xl shadow-fm-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tùy chỉnh kế hoạch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Giới hạn giờ/ngày: {prefs.dailyMaxHours}h</Label>
                    <input type="range" min={1} max={12} value={prefs.dailyMaxHours} onChange={(e) => updatePref('dailyMaxHours', parseInt(e.target.value))} className="w-full accent-sky-500" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Độ dài session ưa thích</Label>
                    <Select value={String(prefs.sessionLengthPref)} onValueChange={(v) => updatePref('sessionLengthPref', parseInt(v))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 phút</SelectItem>
                        <SelectItem value="45">45 phút</SelectItem>
                        <SelectItem value="60">60 phút</SelectItem>
                        <SelectItem value="90">90 phút</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Khung giờ tập trung tốt nhất</Label>
                    <Select value={prefs.bestFocusTime} onValueChange={(v) => updatePref('bestFocusTime', v)}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Buổi sáng</SelectItem>
                        <SelectItem value="afternoon">Buổi chiều</SelectItem>
                        <SelectItem value="evening">Buổi tối</SelectItem>
                        <SelectItem value="night">Đêm khuya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phong cách học</Label>
                    <Select value={prefs.studyStyle} onValueChange={(v) => updatePref('studyStyle', v)}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spread">Trải đều cả tuần</SelectItem>
                        <SelectItem value="daily-short">Session ngắn mỗi ngày</SelectItem>
                        <SelectItem value="cram">Dồn gần deadline</SelectItem>
                        <SelectItem value="weekend">Ưu tiên cuối tuần</SelectItem>
                        <SelectItem value="protect-rest">Bảo vệ giờ nghỉ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <PrefSwitch label="Để buffer trước deadline" checked={prefs.keepBufferBeforeDeadline} onChange={(v) => updatePref('keepBufferBeforeDeadline', v)} />
                  <PrefSwitch label="Dự trữ slot bắt kịp tiến độ" checked={prefs.reserveCatchupSlots} onChange={(v) => updatePref('reserveCatchupSlots', v)} />
                  <PrefSwitch label="Ưu tiên môn khó/cấp bách trước" checked={prefs.prioritizeUrgentFirst} onChange={(v) => updatePref('prioritizeUrgentFirst', v)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WEEKLY CALENDAR */}
          <TabsContent value="calendar" className="space-y-4 mt-4">
            {plan.length === 0 ? (
              <Card className="rounded-2xl shadow-fm-sm border-dashed">
                <CardContent className="p-10 text-center space-y-3">
                  <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="font-medium text-foreground">Chưa có kế hoạch nào</p>
                  <p className="text-sm text-muted-foreground">Thêm deadline và nhấn "Tạo kế hoạch tuần"</p>
                  <Button onClick={() => setActiveTab('deadlines')} style={{ background: 'hsl(var(--sky))', color: 'white' }} className="rounded-xl">
                    Thêm deadline
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Health summary */}
                {health && (
                  <div className="grid grid-cols-4 gap-3">
                    <HealthCard label="Tổng giờ xếp" value={`${health.totalPlannedHours}h`} icon={<Clock className="w-4 h-4" />} color="hsl(var(--sky))" />
                    <HealthCard label="Ngày bận nhất" value={health.busiestDay} icon={<AlertCircle className="w-4 h-4" />} color="hsl(var(--peach))" />
                    <HealthCard label="Giờ trống còn lại" value={`${health.bufferRemaining}h`} icon={<CheckCircle2 className="w-4 h-4" />} color="hsl(var(--butter))" />
                    <HealthCard
                      label="Thiếu giờ"
                      value={health.underplannedTasks.length === 0 ? 'Không có' : `${health.underplannedTasks.length} môn`}
                      icon={<BarChart3 className="w-4 h-4" />}
                      color={health.underplannedTasks.length > 0 ? 'hsl(var(--destructive))' : 'hsl(var(--sky))'}
                    />
                  </div>
                )}

                {health?.underplannedTasks && health.underplannedTasks.length > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: 'hsl(var(--destructive) / 0.1)' }}>
                    <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--destructive))' }} />
                    <span className="text-foreground">Thiếu giờ cho: <strong>{health.underplannedTasks.join(', ')}</strong>. Cần giảm lịch cố định hoặc tăng daily max.</span>
                  </div>
                )}

                {/* Calendar grid */}
                <Card className="rounded-2xl shadow-fm-sm overflow-hidden">
                  <CardContent className="p-0">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b border-border">
                      {weekDates.map((date, i) => {
                        const d = new Date(date + 'T12:00:00');
                        const isToday = date === new Date().toISOString().split('T')[0];
                        return (
                          <div
                            key={date}
                            className="p-3 text-center border-r border-border last:border-0"
                            style={isToday ? { background: 'hsl(var(--sky-light))' } : {}}
                          >
                            <p className="text-xs font-medium text-muted-foreground">{DAYS[(i + 1) % 7]}</p>
                            <p className={`text-sm font-bold ${isToday ? 'text-sky' : 'text-foreground'}`}
                               style={isToday ? { color: 'hsl(var(--sky))' } : {}}>
                              {d.getDate()}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Blocks per day */}
                    <div className="grid grid-cols-7 min-h-[300px]">
                      {weekDates.map((date, i) => {
                        const dayBlocks = plan.filter((b) => b.date === date);
                        return (
                          <div key={date} className="p-2 border-r border-border last:border-0 space-y-1.5 min-h-[200px]">
                            {dayBlocks.map((block, bi) => (
                              <PlanBlock
                                key={block.id}
                                block={block}
                                colorIndex={deadlines.findIndex((d) => d.id === block.deadlineId)}
                                onStartSession={() => {
                                  const state = {
                                    taskTitle: block.taskName,
                                    focusMinutes: block.durationMinutes,
                                    plannerBlockId: block.id,
                                  };
                                  router.push(`/study?state=${encodeURIComponent(JSON.stringify(state))}`);
                                }}
                              />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function OverviewStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="rounded-2xl shadow-fm-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--sky-light))' }}>
          <span style={{ color: 'hsl(var(--sky))' }}>{icon}</span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-base font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function HealthCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="rounded-2xl shadow-fm-sm">
      <CardContent className="p-3 text-center space-y-1">
        <div style={{ color }}>{icon}</div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function PlanBlock({ block, colorIndex, onStartSession }: {
  block: PlannerBlock;
  colorIndex: number;
  onStartSession: () => void;
}) {
  const [showExplain, setShowExplain] = useState(false);
  const color = TASK_COLORS[Math.max(0, colorIndex) % TASK_COLORS.length];

  return (
    <div
      className="rounded-lg p-2 text-xs cursor-pointer hover:opacity-90 transition-opacity relative group"
      style={{
        background: `${color}25`,
        borderLeft: `3px solid ${color}`,
        opacity: block.status === 'completed' ? 0.6 : 1,
      }}
      onClick={() => setShowExplain(!showExplain)}
      title={block.explanation}
    >
      <p className="font-semibold truncate text-foreground">{block.taskName}</p>
      <p className="text-muted-foreground">{block.startTime} · {block.durationMinutes}ph</p>
      {block.isBuffer && <Badge variant="outline" className="text-xs mt-0.5">Buffer</Badge>}
      {block.status === 'completed' && (
        <CheckCircle2 className="w-3 h-3 absolute top-1 right-1" style={{ color: 'hsl(var(--sky))' }} />
      )}
      {showExplain && (
        <div
          className="absolute z-10 top-full left-0 mt-1 p-2.5 rounded-xl text-xs shadow-fm-md w-52"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
        >
          <p className="mb-2 leading-relaxed">{block.explanation}</p>
          {block.status !== 'completed' && (
            <button
              className="w-full flex items-center justify-center gap-1 py-1 rounded-lg text-white font-medium"
              style={{ background: 'hsl(var(--sky))' }}
              onClick={(e) => { e.stopPropagation(); onStartSession(); }}
            >
              <Play className="w-3 h-3" /> Bắt đầu học
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PrefSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="cursor-pointer">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
