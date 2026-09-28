import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CallIcePayload,
  CallLeavePayload,
  CallSignalPayload,
  CoStudyRealtimeStore,
  CoStudySnapshot,
  RT_EVENTS,
} from '@/lib/costudyRealtime';
import { User } from '@/types';

export interface CallPeer {
  stream: MediaStream | null;
  connectionState: RTCPeerConnectionState;
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];

// Optional TURN relay (recommended for restrictive NATs). Configure via env:
//   NEXT_PUBLIC_TURN_URL=turn:host:3478
//   NEXT_PUBLIC_TURN_USERNAME=...   NEXT_PUBLIC_TURN_CREDENTIAL=...
function buildIceServers(): RTCIceServer[] {
  const servers = [...DEFAULT_ICE_SERVERS];
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME || undefined,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || undefined,
    });
  }
  return servers;
}

const RTC_CONFIG: RTCConfiguration = { iceServers: buildIceServers() };

/** Batch outgoing ICE candidates to stay well under realtime rate limits. */
const ICE_FLUSH_DELAY_MS = 100;

/**
 * Full-mesh group call for one Co-Study room.
 *
 * Peer discovery is presence-driven: everyone who reports `joinedVideoCall`
 * in presence is a mesh peer. To avoid SDP glare, exactly one side of each
 * pair creates the offer — the participant with the lexicographically
 * smaller user id. Track enable/disable (mic/cam toggles) never requires
 * renegotiation; remote UI indicators read the toggles from presence.
 */
export function useGroupCall(params: {
  store: CoStudyRealtimeStore | null;
  snapshot: CoStudySnapshot;
  user: User | null;
}) {
  const { store, snapshot, user } = params;

  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peers, setPeers] = useState<Record<string, CallPeer>>({});

  const joinedRef = useRef(false);
  const joiningRef = useRef(false);
  const disposedRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef(new Map<string, RTCPeerConnection>());
  const remoteDescriptionSetRef = useRef(new Map<string, boolean>());
  const pendingIceRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  const outgoingIceRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  const iceFlushTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // ------------------------------------------------------------------ peers

  const removePeer = useCallback((peerId: string) => {
    const pc = pcsRef.current.get(peerId);
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      try {
        pc.close();
      } catch {
        // already closed
      }
      pcsRef.current.delete(peerId);
    }
    remoteDescriptionSetRef.current.delete(peerId);
    pendingIceRef.current.delete(peerId);
    outgoingIceRef.current.delete(peerId);
    const timer = iceFlushTimersRef.current.get(peerId);
    if (timer) {
      clearTimeout(timer);
      iceFlushTimersRef.current.delete(peerId);
    }
    setPeers((prev) => {
      if (!(peerId in prev)) return prev;
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
  }, []);

  const ensurePeer = useCallback(
    (peerId: string, initiator: boolean): RTCPeerConnection => {
      const existing = pcsRef.current.get(peerId);
      if (existing) return existing;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcsRef.current.set(peerId, pc);
      remoteDescriptionSetRef.current.set(peerId, false);
      setPeers((prev) =>
        prev[peerId] ? prev : { ...prev, [peerId]: { stream: null, connectionState: 'new' } }
      );

      const localStream = localStreamRef.current;
      if (localStream) {
        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
      }

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        const buffer = outgoingIceRef.current.get(peerId) ?? [];
        buffer.push(event.candidate.toJSON());
        outgoingIceRef.current.set(peerId, buffer);
        if (!iceFlushTimersRef.current.has(peerId)) {
          const timer = setTimeout(() => {
            iceFlushTimersRef.current.delete(peerId);
            const candidates = outgoingIceRef.current.get(peerId);
            outgoingIceRef.current.delete(peerId);
            if (candidates && candidates.length > 0 && store && user) {
              store.broadcast(RT_EVENTS.CALL_ICE, { from: user.id, to: peerId, candidates });
            }
          }, ICE_FLUSH_DELAY_MS);
          iceFlushTimersRef.current.set(peerId, timer);
        }
      };

      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (!stream) return;
        setPeers((prev) => {
          const current = prev[peerId] ?? { stream: null, connectionState: 'connecting' as RTCPeerConnectionState };
          return { ...prev, [peerId]: { ...current, stream } };
        });
      };

      pc.onconnectionstatechange = () => {
        setPeers((prev) => {
          const current = prev[peerId];
          if (!current || current.connectionState === pc.connectionState) return prev;
          return { ...prev, [peerId]: { ...current, connectionState: pc.connectionState } };
        });
      };

      if (initiator) {
        void (async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            if (store && user) {
              store.broadcast(RT_EVENTS.CALL_SIGNAL, {
                from: user.id,
                to: peerId,
                kind: 'offer',
                sdp: pc.localDescription?.sdp ?? '',
              });
            }
          } catch (err) {
            console.error('[group-call] failed to create offer:', err);
          }
        })();
      }

      return pc;
    },
    [store, user]
  );

  const flushPendingIce = useCallback(async (peerId: string) => {
    const pc = pcsRef.current.get(peerId);
    const buffered = pendingIceRef.current.get(peerId);
    if (!pc || !buffered) return;
    pendingIceRef.current.delete(peerId);
    for (const candidate of buffered) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        // stale candidate — ignore
      }
    }
  }, []);

  // ------------------------------------------------------------------ signaling

  const handleSignal = useCallback(
    async (payload: CallSignalPayload) => {
      if (!payload || !user || payload.to !== user.id || !joinedRef.current) return;
      if (typeof payload.sdp !== 'string' || payload.sdp.length === 0) return;
      try {
        const pc = ensurePeer(payload.from, false);
        if (payload.kind === 'offer') {
          // Deterministic initiator rule means we should never receive two
          // offers; ignore any extras to avoid glare.
          if (remoteDescriptionSetRef.current.get(payload.from)) return;
          await pc.setRemoteDescription({ type: 'offer', sdp: payload.sdp });
          remoteDescriptionSetRef.current.set(payload.from, true);
          await flushPendingIce(payload.from);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          store?.broadcast(RT_EVENTS.CALL_SIGNAL, {
            from: user.id,
            to: payload.from,
            kind: 'answer',
            sdp: pc.localDescription?.sdp ?? '',
          });
        } else {
          if (pc.signalingState !== 'have-local-offer') return; // unsolicited answer
          await pc.setRemoteDescription({ type: 'answer', sdp: payload.sdp });
          remoteDescriptionSetRef.current.set(payload.from, true);
          await flushPendingIce(payload.from);
        }
      } catch (err) {
        console.error('[group-call] signaling error:', err);
      }
    },
    [ensurePeer, flushPendingIce, store, user]
  );

  const handleIce = useCallback(
    async (payload: CallIcePayload) => {
      if (!payload || !user || payload.to !== user.id || !joinedRef.current) return;
      if (!Array.isArray(payload.candidates) || payload.candidates.length === 0) return;
      const pc = pcsRef.current.get(payload.from);
      if (!pc) {
        // ICE can race ahead of the offer for a brand-new peer: buffer it.
        const buffer = pendingIceRef.current.get(payload.from) ?? [];
        buffer.push(...payload.candidates);
        pendingIceRef.current.set(payload.from, buffer);
        return;
      }
      if (!remoteDescriptionSetRef.current.get(payload.from)) {
        const buffer = pendingIceRef.current.get(payload.from) ?? [];
        buffer.push(...payload.candidates);
        pendingIceRef.current.set(payload.from, buffer);
        return;
      }
      for (const candidate of payload.candidates) {
        try {
          await pc.addIceCandidate(candidate);
        } catch {
          // stale candidate — ignore
        }
      }
    },
    [user]
  );

  // ------------------------------------------------------------------ peer discovery (presence-driven)

  useEffect(() => {
    if (!joined || !user) return;
    const myId = user.id;
    const inCallPeers = Object.values(snapshot.presence).filter(
      (p) => p.userId !== myId && p.joinedVideoCall
    );
    const inCallIds = new Set(inCallPeers.map((p) => p.userId));
    for (const peer of inCallPeers) {
      ensurePeer(peer.userId, myId < peer.userId);
    }
    for (const peerId of Array.from(pcsRef.current.keys())) {
      if (!inCallIds.has(peerId)) removePeer(peerId);
    }
  }, [joined, snapshot.presence, user, ensurePeer, removePeer]);

  // ------------------------------------------------------------------ channel event wiring

  useEffect(() => {
    if (!store || !user) return;
    const offs = [
      store.on<CallSignalPayload>(RT_EVENTS.CALL_SIGNAL, (payload) => {
        void handleSignal(payload);
      }),
      store.on<CallIcePayload>(RT_EVENTS.CALL_ICE, (payload) => {
        void handleIce(payload);
      }),
      store.on<CallLeavePayload>(RT_EVENTS.CALL_LEAVE, (payload) => {
        if (payload && payload.userId && payload.userId !== user.id) removePeer(payload.userId);
      }),
    ];
    return () => offs.forEach((off) => off());
  }, [store, handleSignal, handleIce, removePeer, user]);

  // ------------------------------------------------------------------ actions

  const joinCall = useCallback(async () => {
    if (joinedRef.current || joiningRef.current || !user) return;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Trình duyệt không hỗ trợ truy cập mic/camera.');
      return;
    }
    joiningRef.current = true;
    setJoining(true);
    setError(null);

    let stream: MediaStream;
    try {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
        });
      } catch {
        // Camera unavailable/denied — fall back to audio-only
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch {
      joiningRef.current = false;
      setJoining(false);
      setError('Không thể truy cập mic/camera. Vui lòng kiểm tra quyền truy cập của trình duyệt.');
      return;
    }

    localStreamRef.current = stream;
    if (disposedRef.current) {
      // The page unmounted while getUserMedia was resolving — stop the
      // stream immediately and never mark ourselves as in-call.
      stream.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      joiningRef.current = false;
      setJoining(false);
      return;
    }
    setLocalStream(stream);
    const hasVideo = stream.getVideoTracks().length > 0;
    const hasAudio = stream.getAudioTracks().length > 0;
    setCameraEnabled(hasVideo);
    setMicrophoneEnabled(hasAudio);

    joinedRef.current = true;
    setJoined(true);
    joiningRef.current = false;
    setJoining(false);

    store?.updateMyPresence({
      joinedVideoCall: true,
      cameraEnabled: hasVideo,
      microphoneEnabled: hasAudio,
    });
  }, [store, user]);

  const leaveCall = useCallback(() => {
    if (!joinedRef.current || !user) return;
    joinedRef.current = false;
    setJoined(false);

    store?.broadcast(RT_EVENTS.CALL_LEAVE, { userId: user.id });
    for (const peerId of Array.from(pcsRef.current.keys())) {
      removePeer(peerId);
    }
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setCameraEnabled(false);
    setMicrophoneEnabled(false);
    store?.updateMyPresence({
      joinedVideoCall: false,
      cameraEnabled: false,
      microphoneEnabled: false,
    });
  }, [removePeer, store, user]);

  const toggleMicrophone = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const tracks = stream.getAudioTracks();
    if (tracks.length === 0) return;
    const next = !microphoneEnabled;
    tracks.forEach((track) => {
      track.enabled = next;
    });
    setMicrophoneEnabled(next);
    store?.updateMyPresence({ microphoneEnabled: next });
  }, [microphoneEnabled, store]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const tracks = stream.getVideoTracks();
    if (tracks.length === 0) return;
    const next = !cameraEnabled;
    tracks.forEach((track) => {
      track.enabled = next;
    });
    setCameraEnabled(next);
    store?.updateMyPresence({ cameraEnabled: next });
  }, [cameraEnabled, store]);

  // Leave the call if the page unmounts while still in it (and abort any
  // join that is still waiting for media permissions).
  useEffect(() => {
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      leaveCall();
    };
  }, [leaveCall]);

  return {
    joined,
    joining,
    localStream,
    cameraEnabled,
    microphoneEnabled,
    error,
    peers,
    joinCall,
    leaveCall,
    toggleMicrophone,
    toggleCamera,
    clearError: useCallback(() => setError(null), []),
  };
}
