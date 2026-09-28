import { CoStudyDisplayState, CoStudyMember, CoStudyPresence, MascotPersonaId } from '@/types';
import MascotSVG from '@/components/mascot/MascotSVG';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Video, VideoOff, Mic, MicOff } from 'lucide-react';

function displayStateOf(presence: CoStudyPresence): CoStudyDisplayState {
  if (presence.joinedVideoCall) return 'IN_VIDEO_CALL';
  if (presence.status === 'studying') return 'STUDYING';
  if (presence.status === 'away') return 'AWAY';
  return 'ONLINE';
}

const STATE_CONFIG: Record<CoStudyDisplayState, { label: string; color: string; dot: string }> = {
  IN_VIDEO_CALL: { label: 'Trong cuộc gọi', color: 'hsl(var(--lilac))', dot: 'bg-[hsl(var(--lilac))]' },
  STUDYING: { label: 'Đang học', color: 'hsl(var(--sky))', dot: 'bg-[hsl(var(--sky))]' },
  ONLINE: { label: 'Đang online', color: 'hsl(var(--navy))', dot: 'bg-[hsl(var(--navy))]' },
  AWAY: { label: 'Vắng mặt', color: 'hsl(var(--peach))', dot: 'bg-[hsl(var(--peach))]' },
  OFFLINE: { label: 'Ngoại tuyến', color: 'hsl(var(--muted-foreground))', dot: 'bg-[hsl(var(--muted-foreground))]' },
};

interface ParticipantRowProps {
  name: string;
  personaId: MascotPersonaId;
  isMe: boolean;
  state: CoStudyDisplayState;
  cameraEnabled?: boolean;
  microphoneEnabled?: boolean;
  joinedVideoCall?: boolean;
}

function ParticipantRow({ name, personaId, isMe, state, cameraEnabled, microphoneEnabled, joinedVideoCall }: ParticipantRowProps) {
  const config = STATE_CONFIG[state];
  return (
    <div
      className="p-3 rounded-2xl flex items-center gap-3"
      style={{ background: isMe ? 'hsl(var(--sky) / 0.08)' : 'hsl(var(--muted) / 0.5)' }}
    >
      <MascotSVG personaId={personaId} stage="baby" mascotState={state === 'STUDYING' ? 'studying' : state === 'AWAY' ? 'paused' : 'idle'} size={44} animate={false} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {name} {isMe && <span className="text-xs">(bạn)</span>}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-block w-2 h-2 rounded-full ${config.dot}`} />
          <span className="text-xs" style={{ color: config.color }}>
            {config.label}
          </span>
          {joinedVideoCall ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {cameraEnabled ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
              {microphoneEnabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground hidden sm:inline">· Không tham gia gọi</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface ParticipantsPanelProps {
  presence: Record<string, CoStudyPresence>;
  roster: Record<string, CoStudyMember>;
  currentUserId: string;
}

export default function ParticipantsPanel({ presence, roster, currentUserId }: ParticipantsPanelProps) {
  const online = Object.values(presence).sort((a, b) => {
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    return a.name.localeCompare(b.name);
  });
  const offline = Object.values(roster).filter((m) => !presence[m.id]);

  return (
    <Card className="rounded-2xl shadow-fm-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4" /> Thành viên ({online.length}
          {offline.length > 0 ? `+${offline.length} ngoại tuyến` : ''})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {online.map((p) => (
          <ParticipantRow
            key={p.userId}
            name={p.name}
            personaId={p.mascotPersonaId}
            isMe={p.userId === currentUserId}
            state={displayStateOf(p)}
            cameraEnabled={p.cameraEnabled}
            microphoneEnabled={p.microphoneEnabled}
            joinedVideoCall={p.joinedVideoCall}
          />
        ))}
        {offline.map((m) => (
          <ParticipantRow
            key={m.id}
            name={m.name}
            personaId={(Number(m.mascotPersonaId) || 0) as MascotPersonaId}
            isMe={m.id === currentUserId}
            state="OFFLINE"
          />
        ))}
        {online.length === 0 && offline.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-3">Chưa có ai trong phòng</p>
        )}
      </CardContent>
    </Card>
  );
}
