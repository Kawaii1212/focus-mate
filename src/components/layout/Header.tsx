import React from 'react';
import { useApp, useMascot, useStreak } from '../../store/AppContext';
import { PERSONAS } from '../../lib/mascotData';
import { Flame, Moon, Sun, Shield, Zap, Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export default function Header() {
  const { state, dispatch } = useApp();
  const mascot = useMascot();
  const streak = useStreak();

  const user = state.user;
  const persona = mascot ? PERSONAS[mascot.personaId] : null;

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <header className="h-14 bg-background border-b border-border flex items-center justify-between px-5 shrink-0">
      {/* Left: greeting */}
      <div>
        <p className="text-sm text-muted-foreground">
          {mounted ? (
            <>
              {greeting()},{' '}
              <span className="font-semibold text-foreground">{user?.name ?? 'bạn'}</span>!
            </>
          ) : (
            <>
              Đang tải...
            </>
          )}
        </p>
      </div>

      {/* Right: stats + controls */}
      <div className="flex items-center gap-3">
        {/* Streak */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold"
          style={{
            background: streak.atRisk ? 'hsl(var(--destructive) / 0.12)' : 'hsl(var(--peach-soft))',
            color: streak.atRisk ? 'hsl(var(--destructive))' : 'hsl(var(--peach))',
          }}
        >
          <Flame className="w-4 h-4" />
          <span>{mounted ? streak.current : 0}</span>
          {mounted && streak.atRisk && <span className="text-xs">⚠</span>}
        </div>

        {/* Shield */}
        {mounted && streak.shields > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Streak Shield">
            <Shield className="w-4 h-4" style={{ color: 'hsl(var(--sky))' }} />
            <span>{streak.shields}</span>
          </div>
        )}

        {/* Coin */}
        {mounted && mascot && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold"
            style={{ background: 'hsl(var(--butter) / 0.2)', color: 'hsl(var(--accent-foreground))' }}
          >
            <Zap className="w-4 h-4" style={{ color: 'hsl(var(--butter))' }} />
            <span>{mascot.coin}</span>
          </div>
        )}

        {/* Divider */}
        <div className="w-px h-5 bg-border" />

        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl w-9 h-9"
          onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
          title={mounted && state.isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}
        >
          {mounted && state.isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* Notification (mock) */}
        <Button variant="ghost" size="icon" className="rounded-xl w-9 h-9 relative">
          <Bell className="w-4 h-4" />
          {mounted && streak.atRisk && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
          )}
        </Button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-fm-sm"
          style={{ background: mounted && persona ? persona.colors.primary : 'hsl(var(--sky))' }}
        >
          {mounted ? (user?.name?.[0]?.toUpperCase() ?? 'U') : 'U'}
        </div>
      </div>
    </header>
  );
}
