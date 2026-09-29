import { useEffect, useMemo, useRef, useState } from 'react';
import { useRoomChat } from '@/hooks/useRoomChat';
import { useToast } from '@/hooks/use-toast';
import { isSupabaseConfigured } from '@/lib/supabase';
import { CoStudyRealtimeStore } from '@/lib/costudyRealtime';
import {
  EMOJI_GROUPS,
  QUICK_REACTIONS,
  encodeFile,
  encodeImage,
  encodeReply,
  fileToChatImage,
  formatBytes,
  parseContent,
  readFileAsDataUrl,
} from '@/lib/chatFormat';
import MascotSVG from '@/components/mascot/MascotSVG';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  FileText,
  ImagePlus,
  MessageCircle,
  Paperclip,
  Reply as ReplyIcon,
  Send,
  Smile,
  X,
} from 'lucide-react';
import { ChatMessage, MascotPersonaId, User } from '@/types';

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

const TEXT_LIMIT = 500;
const IMAGE_INPUT_LIMIT_MB = 8;
// Files are embedded as data URLs in the message (no upload server), so the
// input cap must fit the server content limit (~300KB incl. base64 overhead).
const FILE_LIMIT_MB = 0.2;

interface ChatRowProps {
  message: ChatMessage;
  isOwn: boolean;
  currentUserId: string;
  reactionMap: Record<string, string[]>;
  highlighted: boolean;
  onReply: (m: ChatMessage) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onQuoteClick: (replyId: string) => void;
  onPreviewImage: (src: string) => void;
}

function ChatRow({
  message,
  isOwn,
  currentUserId,
  reactionMap,
  highlighted,
  onReply,
  onToggleReaction,
  onQuoteClick,
  onPreviewImage,
}: ChatRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const parsed = useMemo(() => parseContent(message.content), [message.content]);
  const reactionEntries = Object.entries(reactionMap ?? {});

  return (
    <div
      id={`msg-${message.id}`}
      className={`group flex items-end gap-2 scroll-mt-20 rounded-lg transition-colors ${
        isOwn ? 'flex-row-reverse' : ''
      } ${highlighted ? 'bg-amber-100/70' : ''}`}
    >
      <div className="shrink-0 mb-4">
        <MascotSVG personaId={message.mascotPersonaId} stage="baby" mascotState="idle" size={32} animate={false} />
      </div>

      <div className={`max-w-[75%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <p className="text-[11px] text-muted-foreground mb-0.5 px-1">
          {isOwn ? 'Bạn' : message.senderName} · {formatTime(message.createdAt)}
        </p>

        <div className="relative">
          <div
            className={`px-3 py-2 rounded-2xl text-sm break-words ${
              message.pending ? 'opacity-60' : ''
            } ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
            style={
              isOwn
                ? { background: 'hsl(var(--sky))', color: 'white' }
                : { background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }
            }
          >
            {parsed.reply && (
              <button
                type="button"
                onClick={() => onQuoteClick(parsed.reply!.id)}
                className={`block w-full text-left mb-1.5 rounded-lg px-2 py-1 text-xs border-l-2 cursor-pointer hover:opacity-90 ${
                  isOwn ? 'bg-white/20 border-white/70' : 'bg-background border-primary/50'
                }`}
                title="Nhấn để xem tin nhắn gốc"
              >
                <span className={`block font-semibold truncate ${isOwn ? 'text-white' : 'text-primary'}`}>
                  {parsed.reply.senderName}
                </span>
                <span className={`block truncate ${isOwn ? 'text-white/90' : 'text-muted-foreground'}`}>
                  {parsed.reply.snippet}
                </span>
              </button>
            )}

            {parsed.kind === 'image' && parsed.dataUrl ? (
              <button type="button" onClick={() => onPreviewImage(parsed.dataUrl!)} className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={parsed.dataUrl}
                  alt={parsed.fileName || 'Ảnh'}
                  className="rounded-xl max-w-[220px] max-h-[220px] object-cover hover:opacity-95 transition-opacity"
                  loading="lazy"
                />
              </button>
            ) : parsed.kind === 'file' && parsed.dataUrl ? (
              <a
                href={parsed.dataUrl}
                download={parsed.fileName || 'file'}
                className={`flex items-center gap-2 rounded-xl px-2 py-1.5 underline-offset-2 hover:underline ${
                  isOwn ? 'text-white' : 'text-primary'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-[180px]">{parsed.fileName}</span>
                {parsed.fileSize ? (
                  <span className={`text-[11px no-underline ${isOwn ? 'text-white/80' : 'text-muted-foreground'}`}>
                    {formatBytes(parsed.fileSize)}
                  </span>
                ) : null}
              </a>
            ) : (
              <span className="whitespace-pre-wrap">{parsed.text}</span>
            )}
          </div>

          {/* Hover toolbar */}
          <div
            className={`absolute top-0 flex items-center gap-0.5 rounded-full border border-border bg-background shadow-fm-sm px-1 py-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-10 ${
              isOwn ? 'right-full mr-1' : 'left-full ml-1'
            }`}
          >
            {QUICK_REACTIONS.slice(0, 3).map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onToggleReaction(message.id, emoji)}
                className="w-6 h-6 rounded-full hover:bg-muted text-sm leading-none"
                title={`Thả ${emoji}`}
              >
                {emoji}
              </button>
            ))}
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center"
                  title="Thêm reaction"
                >
                  <Smile className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="center" className="w-64 p-2">
                <div className="grid grid-cols-8 gap-0.5 max-h-40 overflow-y-auto">
                  {EMOJI_GROUPS.flatMap((g) => g.emojis).map((e) => (
                    <button
                      key={`${message.id}-${e}`}
                      type="button"
                      onClick={() => {
                        onToggleReaction(message.id, e);
                        setPickerOpen(false);
                      }}
                      className="w-7 h-7 rounded-md hover:bg-muted text-lg leading-none"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <button
              type="button"
              onClick={() => onReply(message)}
              className="w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center"
              title="Trả lời"
            >
              <ReplyIcon className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {reactionEntries.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {reactionEntries.map(([emoji, userIds]) => {
              const mine = userIds.includes(currentUserId);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onToggleReaction(message.id, emoji)}
                  className={`text-xs rounded-full px-1.5 py-0.5 border flex items-center gap-1 transition-colors ${
                    mine
                      ? 'bg-sky-100 border-sky-300 text-sky-700'
                      : 'bg-background border-border hover:bg-muted'
                  }`}
                  title={mine ? 'Bỏ reaction' : 'Thả reaction'}
                >
                  <span>{emoji}</span>
                  <span className="font-semibold">{userIds.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface ChatPanelProps {
  store: CoStudyRealtimeStore | null;
  roomId: string;
  user: User;
  mascotPersonaId: MascotPersonaId;
  onlineCount?: number;
}

export default function ChatPanel({ store, roomId, user, mascotPersonaId, onlineCount }: ChatPanelProps) {
  const { toast } = useToast();
  const {
    messages,
    loading,
    typingUsers,
    unreadCount,
    latestMessageAt,
    reactions,
    sendMessage,
    sendRawMessage,
    toggleReaction,
    notifyTyping,
    setViewingLatest,
  } = useRoomChat({ store, roomId, user, mascotPersonaId });

  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [inputEmojiOpen, setInputEmojiOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [sendingFile, setSendingFile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    const el = scrollRef.current;
    if (el && nearBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, latestMessageAt]);

  useEffect(() => {
    if (!loading) scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Clear reply target if the message disappeared
  useEffect(() => {
    if (replyTo && !messages.some((m) => m.id === replyTo.id)) setReplyTo(null);
  }, [messages, replyTo]);

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    if (!el) {
      setDraft((d) => (d + emoji).slice(0, TEXT_LIMIT));
      return;
    }
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    const next = (draft.slice(0, start) + emoji + draft.slice(end)).slice(0, TEXT_LIMIT);
    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = Math.min(start + emoji.length, next.length);
      try {
        el.setSelectionRange(pos, pos);
      } catch {
        // ignore
      }
    });
    notifyTyping();
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || sendingRef.current) return;
    if (content.length > TEXT_LIMIT) {
      toast({ title: `Tin nhắn tối đa ${TEXT_LIMIT} ký tự`, variant: 'destructive' });
      return;
    }
    sendingRef.current = true;
    try {
      await sendMessage(content, replyTo);
      setDraft('');
      setReplyTo(null);
      setInputEmojiOpen(false);
      scrollToBottom();
      inputRef.current?.focus();
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

  const handleImageFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0 || sendingFile) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Vui lòng chọn file ảnh', variant: 'destructive' });
      return;
    }
    if (file.size > IMAGE_INPUT_LIMIT_MB * 1024 * 1024) {
      toast({ title: `Ảnh tối đa ${IMAGE_INPUT_LIMIT_MB}MB`, variant: 'destructive' });
      return;
    }
    setSendingFile(true);
    try {
      const dataUrl = await fileToChatImage(file);
      const imgPart = encodeImage(file.name || 'anh.jpg', dataUrl);
      const raw = replyTo ? encodeReply(replyTo, imgPart) : imgPart;
      await sendRawMessage(raw);
      setReplyTo(null);
      scrollToBottom();
    } catch {
      toast({ title: 'Không gửi được ảnh', description: 'Vui lòng thử ảnh khác.', variant: 'destructive' });
    } finally {
      setSendingFile(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleOtherFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0 || sendingFile) return;
    const file = files[0];
    if (file.size > FILE_LIMIT_MB * 1024 * 1024) {
      toast({ title: `File tối đa ${FILE_LIMIT_MB}MB`, variant: 'destructive' });
      return;
    }
    setSendingFile(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const filePart = encodeFile(file.name || 'file', file.size, dataUrl);
      const raw = replyTo ? encodeReply(replyTo, filePart) : filePart;
      await sendRawMessage(raw);
      setReplyTo(null);
      scrollToBottom();
    } catch {
      toast({ title: 'Không gửi được file', variant: 'destructive' });
    } finally {
      setSendingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleQuoteClick = (replyId: string) => {
    const el = document.getElementById(`msg-${replyId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightId(replyId);
      setTimeout(() => setHighlightId((cur) => (cur === replyId ? null : cur)), 1600);
    } else {
      toast({ title: 'Tin nhắn gốc đã trôi khỏi lịch sử tải', description: 'Hãy cuộn lên để tải thêm.' });
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
            {typeof onlineCount === 'number' && (
              <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                {onlineCount} online
              </span>
            )}
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
          onPaste={(e) => {
            const files = e.clipboardData?.files;
            if (files && files.length > 0 && files[0].type.startsWith('image/')) {
              e.preventDefault();
              void handleImageFiles(files);
            }
          }}
          className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1"
        >
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Đang tải tin nhắn...</p>
          ) : messages.length === 0 ? (
            <div className="text-center py-6 space-y-1">
              <p className="text-3xl">👋</p>
              <p className="text-sm text-muted-foreground">Chưa có tin nhắn nào. Hãy gửi lời chào đến cả phòng!</p>
              <p className="text-xs text-muted-foreground">Mẹo: bấm 😊 để chèn emoji, di chuột lên tin nhắn để thả tim / trả lời.</p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatRow
                key={message.id}
                message={message}
                isOwn={message.userId === user.id}
                currentUserId={user.id}
                reactionMap={reactions[message.id] ?? {}}
                highlighted={highlightId === message.id}
                onReply={(m) => {
                  setReplyTo(m);
                  inputRef.current?.focus();
                }}
                onToggleReaction={toggleReaction}
                onQuoteClick={handleQuoteClick}
                onPreviewImage={setPreviewImage}
              />
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

        <div className="shrink-0 flex items-center justify-between h-4 text-[11px] text-muted-foreground px-1">
          <span className="truncate">{typingLabel}</span>
          {draft.length > 0 && (
            <span className={draft.length >= TEXT_LIMIT ? 'text-destructive font-medium' : ''}>
              {draft.length}/{TEXT_LIMIT}
            </span>
          )}
        </div>

        {replyTo && (
          <div className="shrink-0 flex items-center gap-2 rounded-xl bg-muted/70 border-l-2 border-primary px-3 py-2">
            <ReplyIcon className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0 text-xs">
              <p className="font-semibold text-primary truncate">Trả lời {replyTo.userId === user.id ? 'chính mình' : replyTo.senderName}</p>
              <p className="text-muted-foreground truncate">{parseContent(replyTo.content).text || '📷 Ảnh / tệp đính kèm'}</p>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="w-6 h-6 rounded-full hover:bg-background flex items-center justify-center shrink-0"
              title="Hủy trả lời (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="shrink-0 flex gap-1.5 items-center">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleImageFiles(e.target.files)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.csv,.zip,.rar,.xls,.xlsx,.ppt,.pptx"
            className="hidden"
            onChange={(e) => void handleOtherFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl shrink-0 h-10 w-9"
            title="Gửi ảnh (tự nén, tối đa 8MB — hoặc dán Ctrl+V)"
            onClick={() => imageInputRef.current?.click()}
            disabled={sendingFile}
          >
            <ImagePlus className="w-5 h-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl shrink-0 h-10 w-9"
            title="Gửi file (tối đa 5MB)"
            onClick={() => fileInputRef.current?.click()}
            disabled={sendingFile}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <Popover open={inputEmojiOpen} onOpenChange={setInputEmojiOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-xl shrink-0 h-10 w-9"
                title="Chèn emoji"
              >
                <Smile className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-72 p-2">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {EMOJI_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="text-[11px] font-medium text-muted-foreground px-1 mb-1">{group.label}</p>
                    <div className="grid grid-cols-8 gap-0.5">
                      {group.emojis.map((emoji) => (
                        <button
                          key={`${group.label}-${emoji}`}
                          type="button"
                          onClick={() => insertEmoji(emoji)}
                          className="w-7 h-7 rounded-md hover:bg-muted text-lg leading-none"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-[11px] font-medium text-muted-foreground px-1 mb-1">Thả nhanh</p>
                <div className="flex gap-1">
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="w-8 h-8 rounded-md hover:bg-muted text-xl leading-none"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value.slice(0, TEXT_LIMIT));
              if (e.target.value.trim()) notifyTyping();
            }}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing || e.keyCode === 229) return;
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              } else if (e.key === 'Escape') {
                if (replyTo) setReplyTo(null);
                else setInputEmojiOpen(false);
              }
            }}
            placeholder={replyTo ? `Trả lời ${replyTo.senderName}...` : 'Nhập tin nhắn...'}
            className="rounded-xl flex-1"
            maxLength={TEXT_LIMIT}
            disabled={sendingFile}
          />
          <Button
            onClick={() => void handleSend()}
            disabled={!draft.trim() || sendingFile}
            className="rounded-xl gap-1.5 shrink-0"
            style={{ background: 'hsl(var(--sky))', color: 'white' }}
          >
            <Send className="w-4 h-4" /> Gửi
          </Button>
        </div>

        <p className="shrink-0 text-[11px] text-muted-foreground px-1">
          Enter để gửi · Esc để hủy reply · Di chuột lên tin nhắn để ❤️ / trả lời · Dán ảnh (Ctrl+V) để gửi nhanh
        </p>

        {!isSupabaseConfigured && (
          <p className="shrink-0 text-[11px] text-muted-foreground">
            Realtime chưa được cấu hình (NEXT_PUBLIC_SUPABASE_*) — tin nhắn có thể không hiện ngay.
          </p>
        )}
      </CardContent>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewImage} alt="Xem ảnh" className="max-w-full max-h-full rounded-2xl shadow-2xl" />
          <button
            type="button"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center"
            onClick={() => setPreviewImage(null)}
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </Card>
  );
}
