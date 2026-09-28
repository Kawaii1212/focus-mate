import { useEffect, useRef } from 'react';
import { CallPeer, useGroupCall } from '@/hooks/useGroupCall';
import { CoStudyPresence, MascotPersonaId } from '@/types';
import MascotSVG from '@/components/mascot/MascotSVG';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Mic, MicOff, PhoneOff, Users, Video, VideoOff } from 'lucide-react';

export type GroupCall = ReturnType<typeof useGroupCall>;

interface VideoTileProps {
  stream: MediaStream | null;
  name: string;
  isSelf: boolean;
  personaId: MascotPersonaId;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  connectionState?: RTCPeerConnectionState;
}

function VideoTile({ stream, name, isSelf, personaId, cameraEnabled, microphoneEnabled, connectionState }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (el && stream && el.srcObject !== stream) {
      el.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream && stream.getVideoTracks().length > 0 && cameraEnabled;
  const connecting = connectionState === 'connecting' || connectionState === 'new';

  const connectionFailed = connectionState === 'failed' || connectionState === 'disconnected';

  return (
    <div className="relative rounded-2xl overflow-hidden bg-muted aspect-video flex items-center justify-center">
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf}
          className={`absolute inset-0 w-full h-full object-cover ${isSelf ? 'scale-x-[-1]' : ''} ${hasVideo ? '' : 'opacity-0'}`}
        />
      )}
      {(!hasVideo || !stream) && (
        <div className={`flex flex-col items-center gap-1 py-4 ${connecting && !connectionFailed ? 'animate-pulse' : ''}`}>
          <MascotSVG personaId={personaId} stage="baby" mascotState="idle" size={64} animate={false} />
          <p className="text-xs text-muted-foreground font-medium">
            {!stream && !isSelf ? (connectionFailed ? 'Mất kết nối' : 'Đang kết nối...') : 'Camera đã tắt'}
          </p>
        </div>
      )}
      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between">
        <span className="text-white text-xs font-medium truncate">
          {name} {isSelf && <span className="opacity-80">(bạn)</span>}
        </span>
        <span className="flex items-center gap-1">
          {microphoneEnabled ? <Mic className="w-3.5 h-3.5 text-white" /> : <MicOff className="w-3.5 h-3.5 text-white/70" />}
          {cameraEnabled ? <Video className="w-3.5 h-3.5 text-white" /> : <VideoOff className="w-3.5 h-3.5 text-white/70" />}
        </span>
      </div>
    </div>
  );
}

interface VideoCallPanelProps {
  call: GroupCall;
  presence: Record<string, CoStudyPresence>;
  currentUserId: string;
}

export default function VideoCallPanel({ call, presence, currentUserId }: VideoCallPanelProps) {
  const inCallParticipants = Object.values(presence).filter((p) => p.joinedVideoCall);

  if (!call.joined) {
    return (
      <Card className="rounded-2xl shadow-fm-sm">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--lilac) / 0.15)' }}>
              <Video className="w-5 h-5" style={{ color: 'hsl(var(--lilac))' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Cuộc gọi nhóm</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                {inCallParticipants.length > 0
                  ? `${inCallParticipants.length} người đang trong cuộc gọi`
                  : 'Chưa có ai trong cuộc gọi'}
              </p>
              {call.error && (
                <p className="text-xs mt-1" style={{ color: 'hsl(var(--destructive))' }}>
                  {call.error}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={() => void call.joinCall()}
            disabled={call.joining}
            className="rounded-xl gap-2 shrink-0 w-full sm:w-auto"
            style={{ background: 'hsl(var(--lilac))', color: 'white' }}
          >
            {call.joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
            {call.joining ? 'Đang tham gia...' : 'Tham gia cuộc gọi'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const tiles: Array<{
    key: string;
    peer: CallPeer | null;
    presenceEntry: CoStudyPresence | null;
  }> = [];

  const myPresence = presence[currentUserId];
  tiles.push({
    key: currentUserId,
    peer: null,
    presenceEntry: myPresence ?? null,
  });

  const peerEntries = Object.entries(call.peers) as Array<[string, CallPeer]>;
  peerEntries.sort(([a], [b]) => (a < b ? -1 : 1));
  for (const [peerId, peer] of peerEntries) {
    tiles.push({ key: peerId, peer, presenceEntry: presence[peerId] ?? null });
  }

  const count = tiles.length;
  const gridClass = count <= 1 ? 'grid-cols-1' : count <= 4 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3';

  return (
    <Card className="rounded-2xl shadow-fm-sm">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Video className="w-4 h-4" style={{ color: 'hsl(var(--lilac))' }} /> Trong cuộc gọi
            </span>
            <Badge variant="secondary" className="text-xs">
              {inCallParticipants.length} người
            </Badge>
          </div>
          {call.error && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{call.error}</p>}
        </div>

        <div className={`grid ${gridClass} gap-3`}>
          {tiles.map(({ key, peer, presenceEntry }) => (
            <VideoTile
              key={key}
              stream={peer ? peer.stream : call.localStream}
              name={presenceEntry?.name ?? (peer ? 'Thành viên' : 'Bạn')}
              isSelf={key === currentUserId}
              personaId={presenceEntry?.mascotPersonaId ?? 0}
              cameraEnabled={key === currentUserId ? call.cameraEnabled : presenceEntry?.cameraEnabled ?? false}
              microphoneEnabled={key === currentUserId ? call.microphoneEnabled : presenceEntry?.microphoneEnabled ?? false}
              connectionState={peer ? peer.connectionState : 'connected'}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={call.toggleMicrophone}
            disabled={!call.localStream}
            className="rounded-full w-11 h-11"
            title={call.microphoneEnabled ? 'Tắt mic' : 'Bật mic'}
          >
            {call.microphoneEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" style={{ color: 'hsl(var(--destructive))' }} />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={call.toggleCamera}
            disabled={!call.localStream || call.localStream.getVideoTracks().length === 0}
            className="rounded-full w-11 h-11"
            title={call.cameraEnabled ? 'Tắt camera' : 'Bật camera'}
          >
            {call.cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" style={{ color: 'hsl(var(--destructive))' }} />}
          </Button>
          <Button
            size="icon"
            onClick={call.leaveCall}
            className="rounded-full w-11 h-11"
            style={{ background: 'hsl(var(--destructive))', color: 'white' }}
            title="Rời cuộc gọi"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
