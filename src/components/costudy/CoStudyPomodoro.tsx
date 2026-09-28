import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { PomodoroState } from '@/types';

interface CoStudyPomodoroProps {
  state: PomodoroState;
  isHost: boolean;
  onAction: (action: 'toggle' | 'reset' | 'focus' | 'break') => void;
}

export default function CoStudyPomodoro({ state, isHost, onAction }: CoStudyPomodoroProps) {
  const totalTime = state.mode === 'focus' ? 25 * 60 : 5 * 60;
  const pct = Math.min(100, ((totalTime - state.timeLeft) / totalTime) * 100);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference - (pct / 100) * circumference;
  const color = state.mode === 'focus' ? 'hsl(var(--sky))' : 'hsl(var(--peach))';

  return (
    <Card className="rounded-2xl shadow-fm-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex justify-center gap-2">
          Đồng hồ Pomodoro {isHost ? '(Host)' : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          <Button
            variant={state.mode === 'focus' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onAction('focus')}
            disabled={!isHost}
            className="rounded-lg text-xs font-semibold"
            style={state.mode === 'focus' ? { background: 'hsl(var(--sky))', color: 'white' } : {}}
          >
            Tập trung
          </Button>
          <Button
            variant={state.mode === 'break' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onAction('break')}
            disabled={!isHost}
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

        {isHost && (
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
        )}
      </CardContent>
    </Card>
  );
}
