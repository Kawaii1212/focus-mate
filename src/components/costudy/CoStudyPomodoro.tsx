import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react';
import { CoStudySettings, PomodoroState } from '@/types';

interface CoStudyPomodoroProps {
  state: PomodoroState;
  settings: CoStudySettings;
  onAction: (action: 'toggle' | 'reset' | 'focus' | 'break') => void;
  onSettingsChange: (focusMinutes: number, breakMinutes: number) => void;
}

export default function CoStudyPomodoro({ state, settings, onAction, onSettingsChange }: CoStudyPomodoroProps) {
  const totalTime = state.mode === 'focus' ? settings.focusMinutes * 60 : settings.breakMinutes * 60;
  const pct = Math.max(0, Math.min(100, ((totalTime - state.timeLeft) / totalTime) * 100));

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference - (pct / 100) * circumference;
  const color = state.mode === 'focus' ? 'hsl(var(--sky))' : 'hsl(var(--peach))';

  return (
    <Card className="rounded-2xl shadow-fm-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex justify-center gap-2">
          Đồng hồ Pomodoro chung
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          <Button
            variant={state.mode === 'focus' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onAction('focus')}
            className="rounded-lg text-xs font-semibold"
            style={state.mode === 'focus' ? { background: 'hsl(var(--sky))', color: 'white' } : {}}
          >
            Tập trung
          </Button>
          <Button
            variant={state.mode === 'break' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onAction('break')}
            className="rounded-lg text-xs font-semibold"
            style={state.mode === 'break' ? { background: 'hsl(var(--peach))', color: 'white' } : {}}
          >
            Giải lao
          </Button>
        </div>

        <div className="relative flex items-center justify-center py-2">
          <div
            className={`absolute rounded-full ${state.isActive ? 'animate-pulse-ring' : ''}`}
            style={{ width: 170, height: 170, border: `2px solid ${color}`, opacity: 0.3 }}
          />
          <svg width={170} height={170} className="-rotate-90">
            <circle cx={85} cy={85} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={8} />
            <circle
              cx={85}
              cy={85}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDash}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute text-center">
            <p className="text-3xl font-bold text-foreground font-mono" style={{ color }}>
              {String(Math.max(0, Math.floor(state.timeLeft / 60))).padStart(2, '0')}:
              {String(Math.max(0, state.timeLeft % 60)).padStart(2, '0')}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            size="icon"
            onClick={() => onAction('toggle')}
            className="rounded-full w-12 h-12 shadow-sm"
            style={{ background: color, color: 'white' }}
          >
            {state.isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
          </Button>
          <Button size="icon" variant="outline" onClick={() => onAction('reset')} className="rounded-full w-12 h-12 shadow-sm">
            <RotateCcw className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>

        <div className="w-full space-y-2 pt-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Tập trung</span>
            <span className="flex items-center gap-1.5">
              <Button
                size="icon"
                variant="outline"
                className="w-7 h-7 rounded-lg"
                disabled={settings.focusMinutes <= 5}
                onClick={() => onSettingsChange(settings.focusMinutes - 5, settings.breakMinutes)}
                title="Giảm 5 phút"
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <span className="w-12 text-center text-xs font-semibold text-foreground">
                {settings.focusMinutes}p
              </span>
              <Button
                size="icon"
                variant="outline"
                className="w-7 h-7 rounded-lg"
                disabled={settings.focusMinutes >= 180}
                onClick={() => onSettingsChange(settings.focusMinutes + 5, settings.breakMinutes)}
                title="Tăng 5 phút"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Giải lao</span>
            <span className="flex items-center gap-1.5">
              <Button
                size="icon"
                variant="outline"
                className="w-7 h-7 rounded-lg"
                disabled={settings.breakMinutes <= 5}
                onClick={() => onSettingsChange(settings.focusMinutes, settings.breakMinutes - 5)}
                title="Giảm 5 phút"
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <span className="w-12 text-center text-xs font-semibold text-foreground">
                {settings.breakMinutes}p
              </span>
              <Button
                size="icon"
                variant="outline"
                className="w-7 h-7 rounded-lg"
                disabled={settings.breakMinutes >= 60}
                onClick={() => onSettingsChange(settings.focusMinutes, settings.breakMinutes + 5)}
                title="Tăng 5 phút"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            Ai cũng chỉnh được. Đổi thời lượng sẽ đặt lại đồng hồ.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
