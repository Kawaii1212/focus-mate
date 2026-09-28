import { useEffect, useRef, useState } from 'react';
import { useRoomChat } from '@/hooks/useRoomChat';
import { useToast } from '@/hooks/use-toast';
import { isSupabaseConfigured } from '@/lib/supabase';
import { CoStudyRealtimeStore } from '@/lib/costudyRealtime';
import MascotSVG from '@/components/mascot/MascotSVG';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send } from 'lucide-react';
import { ChatMessage, MascotPersonaId, User } from '@/types';

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

interface ChatRowProps {
  message: ChatMessage;
  isOwn: boolean;
}

function ChatRow({ message, isOwn }: ChatRowProps) {
  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <div className="shrink-0 mb-4">
        <MascotSVG personaId={message.mascotPersonaId} stage="baby" mascotState="idle" size={32} animate={false} />
      </div>
      <div className={`max-w-[75%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <p className="text-[11px] text-muted-foreground mb-0.5 px-1">
          {isOwn ? 'Bạn' : message.senderName} · {formatTime(message.createdAt)}
        </p>
        <div
          className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
            message.pending ? 'opacity-60' : ''
          } ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
          style={
            isOwn
              ? { background: 'hsl(var(--sky))', color: 'white' }
              : { background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }
          }
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}

interface ChatPanelProps {
  store: CoStudyRealtimeStore | null;
  roomId: string;
  user: User;
  mascotPersonaId: MascotPersonaId;
}

export default function ChatPanel({ store, roomId, user, mascotPersonaId }: ChatPanelProps) {
  const { toast } = useToast();
  const { messages, loading, typingUsers, unreadCount, latestMessageAt, sendMessage, notifyTyping, setViewingLatest } =
    useRoomChat({ store, roomId, user, mascotPersonaId });

  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const sendingRef = useRef(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    nearBottomRef.current = nearBottom;
    setViewingLatest(nearBottom);
  };

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
      nearBottomRef.current = true;
      setViewingLatest(true);
    }
  };

  // Auto-scroll on new messages when already near the bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (el && nearBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, latestMessageAt]);

  // Jump to the newest message once history loads
  useEffect(() => {
    if (!loading) scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || sendingRef.current) return;
    sendingRef.current = true;
    try {
      await sendMessage(content);
      setDraft('');
    } catch {
      toast({
        title: 'Không gửi được tin nhắn',
        description: 'Vui lòng kiểm tra kết nối và thử lại.',
        variant: 'destructive',
      });
    } finally {
      sendingRef.current = false;
    }
  };

  const typingNames = Object.values(typingUsers).map((t) => t.name);
  const typingLabel =
    typingNames.length === 0
      ? ''
      : typingNames.length === 1
        ? `${typingNames[0]} đang nhập...`
        : typingNames.length === 2
          ? `${typingNames[0]} và ${typingNames[1]} đang nhập...`
          : `${typingNames.length} người đang nhập...`;

  return (
    <Card className="rounded-2xl shadow-fm-sm h-[520px] xl:h-[calc(100vh-12.5rem)] flex flex-col overflow-hidden">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> Trò chuyện chung
          </span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} tin mới
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col gap-2 pt-0">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1"
        >
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Đang tải tin nhắn...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Chưa có tin nhắn nào. Hãy gửi lời chào đến cả phòng!
            </p>
          ) : (
            messages.map((message) => (
              <ChatRow key={message.id} message={message} isOwn={message.userId === user.id} />
            ))
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="shrink-0 mx-auto text-xs font-medium rounded-full px-3 py-1.5 shadow-fm-sm bg-background border border-border flex items-center gap-1 hover:bg-muted transition-colors"
          >
            Xem {unreadCount} tin mới
          </button>
        )}

        <p className="shrink-0 h-4 text-[11px] text-muted-foreground px-1">{typingLabel}</p>

        <div className="shrink-0 flex gap-2">
          <Input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (e.target.value.trim()) notifyTyping();
            }}
            onKeyDown={(e) => {
              // Ignore Enter while an IME composition (Vietnamese input) is active
              if (e.nativeEvent.isComposing || e.keyCode === 229) return;
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Nhập tin nhắn..."
            className="rounded-xl flex-1"
            maxLength={500}
          />
          <Button
            onClick={() => void handleSend()}
            disabled={!draft.trim()}
            className="rounded-xl gap-1.5 shrink-0"
            style={{ background: 'hsl(var(--sky))', color: 'white' }}
          >
            <Send className="w-4 h-4" /> Gửi
          </Button>
        </div>

        {!isSupabaseConfigured && (
          <p className="shrink-0 text-[11px] text-muted-foreground">
            Realtime chưa được cấu hình (NEXT_PUBLIC_SUPABASE_*) — tin nhắn có thể không hiện ngay.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
