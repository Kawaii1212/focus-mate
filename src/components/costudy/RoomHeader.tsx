import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogOut, Video } from 'lucide-react';

interface RoomHeaderProps {
  roomName: string;
  roomId: string;
  onlineCount: number;
  inCallCount: number;
  onLeaveRoom: () => void;
}

export default function RoomHeader({
  roomName,
  roomId,
  onlineCount,
  inCallCount,
  onLeaveRoom,
}: RoomHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-foreground truncate">{roomName}</h1>
          <Badge variant="outline" className="text-xs bg-muted/50 font-mono">
            Mã phòng: {roomId}
          </Badge>
          {inCallCount > 0 && (
            <Badge className="text-xs gap-1" style={{ background: 'hsl(var(--lilac))', color: 'white' }}>
              <Video className="w-3 h-3" /> {inCallCount} đang gọi
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm mt-0.5">
          {onlineCount} thành viên online
        </p>
      </div>
      <Button
        variant="outline"
        onClick={onLeaveRoom}
        className="rounded-xl gap-2 text-sm shrink-0"
        style={{ borderColor: 'hsl(var(--destructive) / 0.4)', color: 'hsl(var(--destructive))' }}
      >
        <LogOut className="w-4 h-4" /> Rời phòng
      </Button>
    </div>
  );
}
