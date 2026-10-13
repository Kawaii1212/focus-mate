import prisma from '@/lib/prisma';
import { sendReminderEmail, isEmailConfigured } from '@/lib/mailer';
import { sendWebPushToUser, isPushConfigured } from '@/lib/webpush';
import { sendInAppNotification } from '@/lib/inapp';

/**
 * ReminderScheduler — trái tim của hệ thống notification.
 *
 * Cron gọi hàm này mỗi 10 phút. Với mỗi PlannerBlock sắp tới,
 * check từng mốc (minutesBefore) có rơi vào cửa sổ chạy hiện tại không,
 * rồi gửi qua các kênh user đã bật (in-app / push / email).
 * Bảng SentNotification chặn gửi trùng.
 */

// Độ dài cửa sổ quét (phút) — nên >= tần suất cron gọi
const WINDOW_MINUTES = 10;

interface ReminderTarget {
  userId: string;
  blockId: string;
  minutesBefore: number;
}

function parseStartTime(t: string): { h: number; m: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(t || '');
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 47 || m < 0 || m > 59) return null;
  return { h, m };
}

/** Chuẩn hoá block date thành "YYYY-MM-DD" theo múi giờ VN (+07).
 *  Cột date lưu timestamp (nửa đêm theo múi giờ lúc tạo), nên extract ngày
 *  trong UTC+7 để ra đúng ngày mà user thấy trên UI. */
function blockDateToYmd(d: Date): string {
  const shifted = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return shifted.toISOString().split('T')[0];
}

/** Tính thời điểm bắt đầu block (epoch ms).
 *  Giờ block ("09:00") được hiểu theo múi giờ Việt Nam (+07:00) —
 *  tránh lệch khi server chạy UTC (Vercel) hoặc local khác múi giờ. */
const USER_TZ_OFFSET_MINUTES = 420; // UTC+7

function blockStartEpoch(dateYmd: string, startTime: string): number | null {
  const st = parseStartTime(startTime);
  if (!st) return null;
  const [y, m, d] = dateYmd.split('-').map(Number);
  if (!y || !m || !d) return null;
  return Date.UTC(y, m - 1, d, st.h, st.m, 0, 0) - USER_TZ_OFFSET_MINUTES * 60000;
}

function vietDateLabel(dateYmd: string): string {
  const [y, m, d] = dateYmd.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

function leadLabel(minutes: number): string {
  if (minutes >= 1440) {
    const days = minutes / 1440;
    return days === 1 ? '1 ngày' : `${days} ngày`;
  }
  if (minutes === 0) return 'bây giờ';
  return `${minutes} phút`;
}

export interface RemindersRunResult {
  checked: number;
  sent: number;
  skipped: number;
  errors: number;
}

/**
 * Chạy 1 "shot" của scheduler:
 * - Quét PlannerBlock có start trong [now - 25h, now + max(minutesBefore) + WINDOW]
 * - Với từng minutesBefore của user: nếu (blockStart - minutesBefore) trong
 *   [now - WINDOW, now + WINDOW], gửi notification qua các channel đã bật.
 */
export async function runReminderScheduler(now: Date = new Date()): Promise<RemindersRunResult> {
  const result: RemindersRunResult = { checked: 0, sent: 0, skipped: 0, errors: 0 };
  const windowMs = WINDOW_MINUTES * 60 * 1000;

  // Quét các block có ngày bắt đầu trong khoảng ±25h quanh now
  const scanFrom = new Date(now.getTime() - 25 * 60 * 60 * 1000);
  const scanTo = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const blocks = await prisma.plannerBlock.findMany({
    where: {
      status: 'pending',
      date: {
        gte: scanFrom,
        lte: scanTo,
      },
    },
  });

  if (blocks.length === 0) return result;

  // Lấy settings của các user có block — để tránh N+1
  const userIds = Array.from(new Set(blocks.map((b) => b.userId)));
  const settingsList = await prisma.notificationSetting.findMany({
    where: { userId: { in: userIds } },
  });
  const settingsByUser = new Map(settingsList.map((s) => [s.userId, s]));
  const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
  const usersById = new Map(users.map((u) => [u.id, u]));

  for (const block of blocks) {
    result.checked++;
    const dateYmd = blockDateToYmd(block.date);
    const startEpoch = blockStartEpoch(dateYmd, block.startTime);
    if (startEpoch === null) {
      result.skipped++;
      continue;
    }

    const setting = settingsByUser.get(block.userId);
    // Mặc định nếu user chưa cài: in-app + 1 ngày/1 giờ trước
    const minutesBeforeList: number[] = Array.isArray(setting?.minutesBefore)
      ? (setting.minutesBefore as number[])
      : [1440, 60];

    for (const minutesBefore of minutesBeforeList) {
      const targetEpoch = startEpoch - minutesBefore * 60 * 1000;
      if (targetEpoch < now.getTime() - windowMs || targetEpoch > now.getTime() + windowMs) {
        continue; // không thuộc cửa sổ chạy hiện tại
      }

      const target: ReminderTarget = {
        userId: block.userId,
        blockId: block.id,
        minutesBefore,
      };

      // Chống gửi trùng: chèn cùng lúc thì 1 channel thắng, rồi skip
      let claimed = true;
      try {
        await prisma.sentNotification.create({
          data: {
            userId: target.userId,
            blockId: target.blockId,
            minutesBefore: target.minutesBefore,
            channel: 'batch',
          },
        });
      } catch {
        claimed = false; // đã có — đã gửi trước đó
      }
      if (!claimed) {
        result.skipped++;
        continue;
      }

      const user = usersById.get(block.userId);
      if (!user) {
        result.errors++;
        continue;
      }

      const title = block.title || 'Buổi học';
      const whenText = `${vietDateLabel(dateYmd)} lúc ${block.startTime}`;
      const leadText = leadLabel(minutesBefore);

      const setting2 = settingsByUser.get(block.userId);
      const channels = {
        inApp: setting2?.inAppEnabled ?? true,
        push: setting2?.pushEnabled ?? false,
        email: setting2?.emailEnabled ?? false,
      };

      const promises: Promise<unknown>[] = [];

      if (channels.inApp) {
        promises.push(
          sendInAppNotification(user.id, {
            title: `⏰ Sắp đến giờ học`,
            body: `${title} — ${leadText === 'bây giờ' ? 'bắt đầu ngay bây giờ' : `bắt đầu sau ${leadText}`} (${whenText}).`,
            url: '/planner',
            type: 'reminder',
          })
        );
      }

      if (channels.push && isPushConfigured) {
        promises.push(
          sendWebPushToUser(user.id, {
            title: `⏰ ${title}`,
            body: `${leadText === 'bây giờ' ? 'Bắt đầu ngay bây giờ' : `Bắt đầu sau ${leadText}`} — ${whenText}`,
            url: '/planner',
            tag: `block-${block.id}-${minutesBefore}`,
          })
        );
      }

      if (channels.email && isEmailConfigured) {
        promises.push(
          sendReminderEmail({
            to: user.email,
            userName: user.name,
            blockTitle: title,
            date: dateYmd,
            startTime: block.startTime,
            endTime: block.endTime,
            minutesBefore,
          })
        );
      }

      try {
        await Promise.all(promises);
        result.sent++;
      } catch (err) {
        console.error('[scheduler] send failed for block', block.id, err);
        result.errors++;
      }
    }
  }

  return result;
}
