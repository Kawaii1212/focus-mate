"use client";

import React, { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Timer, Users, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

const FOCUS_PRESETS = [25, 45, 60, 90];
const BREAK_PRESETS = [5, 10, 15, 20];

export default function PomodoroSetupPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const location = { pathname, state: (() => { try { return JSON.parse(searchParams?.get('state') || 'null'); } catch { return null; } })() };;
  const prefill = (() => { try { return JSON.parse(searchParams?.get('state') || 'null'); } catch { return null; } })() as { taskTitle?: string; focusMinutes?: number; plannerBlockId?: string } | null;

  const [taskTitle, setTaskTitle] = useState(prefill?.taskTitle ?? '');
  const [focusMin, setFocusMin] = useState(prefill?.focusMinutes ?? 45);
  const [breakMin, setBreakMin] = useState(10);
  const [customFocus, setCustomFocus] = useState('');
  const [customBreak, setCustomBreak] = useState('');
  const [mode, setMode] = useState<'solo' | 'costudy'>('solo');

  const effectiveFocus = customFocus ? parseInt(customFocus) || focusMin : focusMin;
  const effectiveBreak = customBreak ? parseInt(customBreak) || breakMin : breakMin;

  const handleStart = () => {
    if (!taskTitle.trim()) return;
    const state = {
      taskTitle: taskTitle.trim(),
      focusMinutes: effectiveFocus,
      breakMinutes: effectiveBreak,
      mode,
      plannerBlockId: prefill?.plannerBlockId,
    };
    router.push(`/study/active?state=${encodeURIComponent(JSON.stringify(state))}`);
  };

  return (
    <AppLayout mascotState="idle">
      <div className="max-w-lg mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Timer className="w-6 h-6" style={{ color: 'hsl(var(--sky))' }} />
            Thiết lập phiên học
          </h1>
          {prefill?.taskTitle && (
            <p className="text-xs text-muted-foreground mt-1 bg-secondary/60 px-3 py-1 rounded-lg inline-block">
              Từ AI Planner: {prefill.taskTitle}
            </p>
          )}
        </div>

        <Card className="rounded-2xl shadow-fm-sm">
          <CardContent className="p-6 space-y-5">
            {/* Task title */}
            <div className="space-y-1.5">
              <Label htmlFor="task">Tên nhiệm vụ *</Label>
              <Input
                id="task"
                placeholder="Ví dụ: Ôn tập Toán chương 3..."
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Focus time */}
            <div className="space-y-2">
              <Label>Thời gian tập trung (phút)</Label>
              <div className="flex gap-2 flex-wrap">
                {FOCUS_PRESETS.map((p) => (
                  <PresetButton
                    key={p}
                    label={`${p}ph`}
                    selected={focusMin === p && !customFocus}
                    onClick={() => { setFocusMin(p); setCustomFocus(''); }}
                  />
                ))}
                <Input
                  className="w-24 rounded-xl text-center h-9"
                  placeholder="Tùy chỉnh"
                  value={customFocus}
                  onChange={(e) => setCustomFocus(e.target.value)}
                  type="number"
                  min={5}
                  max={300}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                EXP tối đa: {FOCUS_PRESETS.includes(effectiveFocus) ? effectiveFocus * 1 : effectiveFocus} · Sẽ nhận theo % hoàn thành
              </p>
            </div>

            {/* Break time */}
            <div className="space-y-2">
              <Label>Thời gian nghỉ (phút)</Label>
              <div className="flex gap-2 flex-wrap">
                {BREAK_PRESETS.map((p) => (
                  <PresetButton
                    key={p}
                    label={`${p}ph`}
                    selected={breakMin === p && !customBreak}
                    onClick={() => { setBreakMin(p); setCustomBreak(''); }}
                  />
                ))}
                <Input
                  className="w-24 rounded-xl text-center h-9"
                  placeholder="Tùy chỉnh"
                  value={customBreak}
                  onChange={(e) => setCustomBreak(e.target.value)}
                  type="number"
                  min={1}
                  max={60}
                />
              </div>
            </div>

            {/* Mode */}
            <div className="space-y-2">
              <Label>Chế độ học</Label>
              <div className="flex gap-2">
                <PresetButton
                  label="Solo"
                  selected={mode === 'solo'}
                  onClick={() => setMode('solo')}
                  icon={<Timer className="w-4 h-4" />}
                />
                <PresetButton
                  label="Co-study"
                  selected={mode === 'costudy'}
                  onClick={() => setMode('costudy')}
                  icon={<Users className="w-4 h-4" />}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div
          className="p-4 rounded-2xl text-sm space-y-1"
          style={{ background: 'hsl(var(--sky-light))' }}
        >
          <p className="font-semibold text-foreground">Tóm tắt phiên:</p>
          <p className="text-muted-foreground">
            Tập trung <strong>{effectiveFocus} phút</strong> · Nghỉ{' '}
            <strong>{effectiveBreak} phút</strong> · Chế độ{' '}
            <strong>{mode === 'solo' ? 'Solo' : 'Co-study'}</strong>
          </p>
          <p className="text-muted-foreground">
            EXP tối đa: ~<strong>{Math.round(effectiveFocus * 1.1)}</strong> · Coin tối đa: ~<strong>{Math.round(effectiveFocus * 0.44)}</strong>
          </p>
        </div>

        <Button
          onClick={handleStart}
          disabled={!taskTitle.trim()}
          className="w-full h-12 rounded-2xl font-bold text-base shadow-fm-md"
          style={{ background: 'hsl(var(--sky))', color: 'white' }}
        >
          <Play className="w-5 h-5 mr-2" /> Bắt đầu học!
        </Button>
      </div>
    </AppLayout>
  );
}

function PresetButton({ label, selected, onClick, icon }: {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-medium transition-all border',
        selected
          ? 'text-white border-transparent shadow-fm-sm'
          : 'text-foreground border-border hover:border-sky/50 hover:bg-secondary/50'
      )}
      style={selected ? { background: 'hsl(var(--sky))', borderColor: 'hsl(var(--sky))' } : {}}
    >
      {icon}
      {label}
    </button>
  );
}
