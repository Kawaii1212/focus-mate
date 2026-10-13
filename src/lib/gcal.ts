/**
 * Google Calendar "Add to Calendar" link builder (Cách 1 — không cần OAuth).
 * Dùng URL template chuẩn của Google Calendar.
 */

export interface CalendarEventInput {
  title: string;
  /** ISO date "2026-10-14" */
  date: string;
  /** "09:00" */
  startTime: string;
  /** "10:30" */
  endTime: string;
  details?: string;
  location?: string;
}

function compact(dt: { date: string; time: string }): string {
  // YYYY-MM-DD + HH:mm -> YYYYMMDDTHHmmss (giờ cục bộ)
  return `${dt.date.replace(/-/g, '')}T${dt.time.replace(':', '')}00`;
}

function padEndTime(date: string, endTime: string): { date: string; time: string } {
  // Nếu end là 24:00 → chuyển sang ngày hôm sau 00:00
  const [h, m] = endTime.split(':').map(Number);
  if (h >= 24) {
    const d = new Date(`${date}T12:00:00`);
    d.setDate(d.getDate() + 1);
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { date: ymd, time: `${String(h - 24).padStart(2, '0')}:${String(m).padStart(2, '0')}` };
  }
  return { date, time: endTime };
}

export function buildGoogleCalendarUrl(ev: CalendarEventInput): string {
  const start = compact({ date: ev.date, time: ev.startTime });
  const end = compact(padEndTime(ev.date, ev.endTime));
  const params = new URLSearchParams();
  params.set('action', 'TEMPLATE');
  params.set('text', ev.title);
  params.set('dates', `${start}/${end}`);
  if (ev.details) params.set('details', ev.details);
  if (ev.location) params.set('location', ev.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
