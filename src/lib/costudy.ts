import { ChatMessage, CoStudyMember, MascotPersonaId, PomodoroState } from '@/types';

export interface CoStudyRoomData {
  id: string;
  name: string;
  hostId: string;
  maxMembers: number;
  checkInIntervalMinutes: number;
  sharedMinutes: number;
  pomodoro: PomodoroState;
  members: Record<string, CoStudyMember>;
}

export interface CreateRoomPayload {
  id: string;
  name: string;
  hostId: string;
  maxMembers: number;
  checkInIntervalMinutes: number;
}

export class CostudyApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'CostudyApiError';
    this.status = status;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new CostudyApiError(
      (errorData as { message?: string }).message || `Request failed (${response.status})`,
      response.status
    );
  }
  return (await response.json()) as T;
}

export const costudyApi = {
  getRoom: (roomId: string): Promise<CoStudyRoomData> =>
    request<CoStudyRoomData>(`/api/costudy/rooms/${roomId}`),

  createRoom: (payload: CreateRoomPayload): Promise<CoStudyRoomData> =>
    request<CoStudyRoomData>('/api/costudy/rooms', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  performAction: (
    action: 'join' | 'leave' | 'status' | 'sync' | 'poll',
    roomId: string,
    userId: string,
    extra: {
      name?: string;
      mascotPersonaId?: MascotPersonaId;
      status?: string;
      pomodoro?: PomodoroState;
    } = {}
  ): Promise<CoStudyRoomData> =>
    request<CoStudyRoomData>('/api/costudy/action', {
      method: 'POST',
      body: JSON.stringify({ action, roomId, userId, ...extra }),
    }),

  getMessages: async (roomId: string, params: { limit?: number; before?: string; after?: string } = {}): Promise<ChatMessage[]> => {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.before) query.set('before', params.before);
    if (params.after) query.set('after', params.after);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    try {
      return await request<ChatMessage[]>(`/api/costudy/rooms/${roomId}/messages${suffix}`);
    } catch {
      return [];
    }
  },

  sendMessage: async (
    roomId: string,
    payload: { userId: string; name: string; mascotPersonaId: MascotPersonaId; content: string }
  ): Promise<ChatMessage> =>
    request<ChatMessage>(`/api/costudy/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
