import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Hand } from 'lucide-react';

interface CheckInCardProps {
  countdown: number;
  checkInMinutes: number;
  isPaused: boolean;
  onCheckIn: () => void;
  onTogglePause: () => void;
}

export default function CheckInCard({ countdown, checkInMinutes, isPaused, onCheckIn, onTogglePause }: CheckInCardProps) {
  const checkInSeconds = checkInMinutes * 60;
  const countdownPct = Math.min(100, (countdown / checkInSeconds) * 100);

  return (
    <Card className="rounded-2xl shadow-fm-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Check-in tiếp theo</p>
            <p className="text-xs text-muted-foreground">
              {isPaused
                ? 'Đang tạm dừng'
                : countdown === 0
                  ? 'Đã đến giờ check-in!'
                  : `Còn ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onTogglePause} className="rounded-xl">
              {isPaused ? 'Tiếp tục' : 'Tạm dừng'}
            </Button>
            <Button
              size="sm"
              onClick={onCheckIn}
              className="rounded-xl gap-1.5"
              style={{ background: 'hsl(var(--sky))', color: 'white' }}
            >
              <Hand className="w-3.5 h-3.5" /> Mình đây!
            </Button>
          </div>
        </div>
        <Progress value={countdownPct} className="h-2.5" />
      </CardContent>
    </Card>
  );
}
