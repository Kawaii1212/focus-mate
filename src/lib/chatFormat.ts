import type { ChatMessage } from '@/types';

export interface ReplyInfo {
  id: string;
  senderName: string;
  snippet: string;
}

export type ParsedKind = 'text' | 'image' | 'file';

export interface ParsedContent {
  reply?: ReplyInfo;
  kind: ParsedKind;
  /** Plain text (for text kind) or caption (rarely used for media) */
  text: string;
  fileName?: string;
  fileSize?: number;
  dataUrl?: string;
}

const REPLY_PREFIX = '[reply:';
const IMG_PREFIX = '[[img:';
const FILE_PREFIX = '[[file:';

function sanitizeSnippet(raw: string, max = 120): string {
  return raw
    .replace(/\|/g, '/')
    .replace(/\]/g, ')')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Short preview of a message to embed in a reply quote. */
export function snippetOf(message: ChatMessage): string {
  const parsed = parseContent(message.content);
  if (parsed.kind === 'image') return '📷 Ảnh';
  if (parsed.kind === 'file') return `📎 ${parsed.fileName || 'Tệp đính kèm'}`;
  if (!parsed.text) return 'Tin nhắn';
  return sanitizeSnippet(parsed.text);
}

export function encodeReply(replyTo: ChatMessage, content: string): string {
  const snippet = snippetOf(replyTo);
  return `${REPLY_PREFIX}${replyTo.id}|${sanitizeSnippet(replyTo.senderName, 40)}|${snippet}]\n${content}`;
}

export function encodeImage(fileName: string, dataUrl: string): string {
  const safeName = sanitizeSnippet(fileName, 80) || 'anh';
  return `${IMG_PREFIX}${safeName}]]${dataUrl}`;
}

export function encodeFile(fileName: string, size: number, dataUrl: string): string {
  const safeName = sanitizeSnippet(fileName, 80) || 'file';
  return `${FILE_PREFIX}${safeName}|${size}]]${dataUrl}`;
}

export function parseContent(raw: string): ParsedContent {
  let rest = raw ?? '';
  let reply: ReplyInfo | undefined;

  if (rest.startsWith(REPLY_PREFIX)) {
    const end = rest.indexOf(']\n');
    if (end > 0) {
      const inner = rest.slice(REPLY_PREFIX.length, end);
      const sep1 = inner.indexOf('|');
      const sep2 = sep1 >= 0 ? inner.indexOf('|', sep1 + 1) : -1;
      if (sep1 > 0 && sep2 > sep1) {
        reply = {
          id: inner.slice(0, sep1),
          senderName: inner.slice(sep1 + 1, sep2) || 'Ai đó',
          snippet: inner.slice(sep2 + 1) || '',
        };
        rest = rest.slice(end + 2);
      }
    }
  }

  if (rest.startsWith(IMG_PREFIX)) {
    const end = rest.indexOf(']]');
    if (end > 0) {
      const fileName = rest.slice(IMG_PREFIX.length, end) || 'anh';
      const dataUrl = rest.slice(end + 2);
      if (dataUrl.startsWith('data:image')) {
        return { reply, kind: 'image', text: '', fileName, dataUrl };
      }
      // Fall through as text if payload is not a valid image data URL
    }
  }

  if (rest.startsWith(FILE_PREFIX)) {
    const end = rest.indexOf(']]');
    if (end > 0) {
      const meta = rest.slice(FILE_PREFIX.length, end);
      const dataUrl = rest.slice(end + 2);
      const sep = meta.lastIndexOf('|');
      const fileName = (sep >= 0 ? meta.slice(0, sep) : meta) || 'file';
      const fileSize = sep >= 0 ? Number(meta.slice(sep + 1)) || 0 : 0;
      if (dataUrl.startsWith('data:')) {
        return { reply, kind: 'file', text: '', fileName, fileSize, dataUrl };
      }
    }
  }

  return { reply, kind: 'text', text: rest };
}

/** Quick reactions shown on hover. */
export const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'] as const;

export interface EmojiGroup {
  label: string;
  emojis: string[];
}

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    label: 'Mặt cười',
    emojis: ['😀', '😁', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤔', '😅', '😭', '😡', '🥳', '😴', '🤯', '🙂', '🙃', '😉', '😌', '🤩', '😇', '🤗', '🤭', '🫡'],
  },
  {
    label: 'Cử chỉ',
    emojis: ['👍', '👎', '🙏', '👏', '💪', '✌️', '🤝', '👋', '✋', '🫶', '❤️', '💯', '🔥', '🎉', '✨', '🌟'],
  },
  {
    label: 'Học tập',
    emojis: ['📚', '✏️', '📝', '💡', '🎯', '⏰', '☕', '💻', '🧠', '🏆', '🥇', '✅', '❌', '⚠️', '🚀'],
  },
  {
    label: 'Cảm xúc',
    emojis: ['❤️', '💔', '🥺', '😤', '😩', '🫠', '👀', '💤', '🍀', '🌈', '☀️', '🌙', '🎧', '🎵'],
  },
  {
    label: 'Ăn uống',
    emojis: ['🍚', '🍜', '🍕', '🍔', '🍩', '🧋', '☕', '🍵', '🍎', '🍉', '🍓'],
  },
];

/** Max data-URL chars for one media message. Must stay under the server content
 *  limit (300000) with room for the reply prefix; also keeps realtime
 *  broadcasts deliverable. `fileToChatImage` progressively downscales to fit. */
export const MAX_MEDIA_CHARS = 200000;

/** Downscale an image file to a reasonable data-URL size for chat (no upload server needed). */
export function fileToChatImage(file: File, maxDim = 1024, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        // Progressively shrink until the payload fits the media budget, so
        // typical photos never fail with a 400 from the server.
        let dim = maxDim;
        for (let attempt = 0; attempt < 4; attempt += 1) {
          const dataUrl = encodeAtDim(img, dim, quality);
          if (dataUrl.length <= MAX_MEDIA_CHARS || dim <= 256) {
            URL.revokeObjectURL(url);
            if (dataUrl.length > MAX_MEDIA_CHARS) {
              reject(new Error('Ảnh quá lớn sau khi nén'));
            } else {
              resolve(dataUrl);
            }
            return;
          }
          dim = Math.floor(dim / 1.6);
        }
        URL.revokeObjectURL(url);
        reject(new Error('Ảnh quá lớn sau khi nén'));
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không đọc được ảnh'));
    };
    img.src = url;
  });
}

function encodeAtDim(img: HTMLImageElement, maxDim: number, quality: number): string {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas');
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Không đọc được file'));
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
