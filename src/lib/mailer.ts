import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';

export const isEmailConfigured = Boolean(GMAIL_USER && GMAIL_APP_PASSWORD);

let transporter: Transporter | null = null;

export function getMailer(): Transporter | null {
  if (!isEmailConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

export interface ReminderEmailPayload {
  to: string;
  userName: string;
  blockTitle: string;
  date: string; // "2026-10-14"
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  minutesBefore: number;
}

const DAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

function prettifyDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  return `${DAY_NAMES[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function prettifyLead(minutes: number): string {
  if (minutes >= 1440) {
    const days = Math.round(minutes / 1440);
    return days === 1 ? '1 ngày' : `${days} ngày`;
  }
  return `${minutes} phút`;
}

export async function sendReminderEmail(p: ReminderEmailPayload): Promise<boolean> {
  const mailer = getMailer();
  if (!mailer) return false;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const when = `${prettifyDate(p.date)} · ${p.startTime}–${p.endTime}`;
  const lead = prettifyLead(p.minutesBefore);

  const subject = `🔔 FocusMate: ${p.blockTitle} — còn ${lead} nữa!`;

  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#38bdf8,#818cf8);padding:24px 32px;color:#fff">
      <div style="font-size:22px;font-weight:700">🦊 FocusMate</div>
      <div style="opacity:.9;margin-top:4px">Đến giờ sắp học rồi!</div>
    </div>
    <div style="padding:28px 32px">
      <p style="margin:0 0 16px;color:#334155;font-size:15px">Chào <b>${p.userName}</b>,</p>
      <div style="background:#f0f9ff;border-left:4px solid #38bdf8;border-radius:12px;padding:16px 20px;margin-bottom:20px">
        <div style="font-size:17px;font-weight:700;color:#0c4a6e">📚 ${p.blockTitle}</div>
        <div style="color:#0369a1;margin-top:6px;font-size:14px">📅 ${when}</div>
        <div style="color:#64748b;margin-top:4px;font-size:13px">⏰ Bắt đầu sau ${lead}</div>
      </div>
      <p style="color:#475569;font-size:14px;margin:0 0 24px">
        Chuẩn bị sẵn sách vở và mở FocusMate để bắt đầu phiên học nhé — giữ streak của bạn!
      </p>
      <a href="${appUrl}/planner" style="display:inline-block;background:#38bdf8;color:#fff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:12px;font-size:14px">
        Xem AI Planner →
      </a>
    </div>
    <div style="padding:16px 32px;background:#f8fafc;color:#94a3b8;font-size:12px">
      Bạn nhận được email này vì đã bật nhắc email trong Cài đặt của FocusMate.
    </div>
  </div>`;

  try {
    await mailer.sendMail({
      from: `FocusMate <${GMAIL_USER}>`,
      to: p.to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('[mailer] send failed:', err);
    return false;
  }
}

export interface PasswordResetEmailPayload {
  to: string;
  userName: string;
  otp: string;
}

export async function sendPasswordResetEmail(p: PasswordResetEmailPayload): Promise<boolean> {
  const mailer = getMailer();
  if (!mailer) return false;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const subject = `[FocusMate] Mã xác thực đặt lại mật khẩu: ${p.otp}`;

  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;background:#ffffff">
    <div style="background:linear-gradient(135deg,#0284c7,#38bdf8);padding:28px 32px;color:#ffffff;text-align:center">
      <div style="font-size:26px;font-weight:800;letter-spacing:-0.5px">FocusMate</div>
      <div style="opacity:.92;margin-top:6px;font-size:15px">Yêu cầu đặt lại mật khẩu</div>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 16px;color:#1e293b;font-size:15px">
        Xin chào <b>${p.userName || 'bạn'}</b>,
      </p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px">
        Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản FocusMate của bạn. Vui lòng sử dụng mã xác thực (OTP) dưới đây để tiếp tục:
      </p>
      <div style="background:#f0f9ff;border:2px dashed #38bdf8;border-radius:14px;padding:20px;text-align:center;margin-bottom:24px">
        <div style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:8px">Mã xác thực (OTP) của bạn</div>
        <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#0284c7;font-family:monospace">${p.otp}</div>
        <div style="color:#94a3b8;font-size:12px;margin-top:8px">Mã có hiệu lực trong vòng 15 phút</div>
      </div>
      <p style="color:#64748b;font-size:13px;line-height:1.5;margin:0 0 24px">
        Nếu bạn không thực hiện yêu cầu này, bạn có thể an tâm bỏ qua email này. Mật khẩu hiện tại của bạn sẽ không thay đổi.
      </p>
      <div style="text-align:center">
        <a href="${appUrl}/forgot-password" style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:10px;font-size:14px">
          Nhập mã xác thực ngay
        </a>
      </div>
    </div>
    <div style="padding:16px 32px;background:#f8fafc;color:#94a3b8;font-size:12px;text-align:center;border-top:1px solid #f1f5f9">
      FocusMate &copy; 2026 &mdash; Đồng hành học tập cùng Mascot
    </div>
  </div>`;

  try {
    await mailer.sendMail({
      from: `FocusMate <${GMAIL_USER}>`,
      to: p.to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('[mailer] sendPasswordResetEmail failed:', err);
    return false;
  }
}
