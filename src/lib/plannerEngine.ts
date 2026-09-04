import { Deadline, FixedBlock, PlannerBlock, UserPlannerPrefs, PlanningHealthSummary } from '../types';

// Day names in Vietnamese
const DAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const SESSION_NAMES: Record<string, string> = {
  morning: 'sáng',
  afternoon: 'chiều',
  evening: 'tối',
  night: 'khuya',
};

// Time ranges for focus periods
const FOCUS_TIME_RANGES: Record<string, { start: number; end: number }> = {
  morning: { start: 6, end: 12 },
  afternoon: { start: 12, end: 18 },
  evening: { start: 18, end: 22 },
  night: { start: 22, end: 24 },
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getDateFromOffset(baseDate: Date, daysOffset: number): Date {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + daysOffset);
  return d;
}

function isoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function daysUntil(dueDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}

interface FreeSlot {
  date: string;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  focusPeriod: 'morning' | 'afternoon' | 'evening' | 'night';
}

// Step 1: Compute free slots for the current week
function computeFreeSlots(
  fixedBlocks: FixedBlock[],
  prefs: UserPlannerPrefs,
  weekStartDate: Date
): FreeSlot[] {
  const slots: FreeSlot[] = [];
  const WEEK_DAYS = 7;

  for (let day = 0; day < WEEK_DAYS; day++) {
    const date = getDateFromOffset(weekStartDate, day);
    const dayOfWeek = date.getDay();
    const dateStr = isoDate(date);

    // Collect blocked intervals for this day
    const blocked: { start: number; end: number }[] = [];

    // Add fixed blocks for this day
    fixedBlocks
      .filter((b) => b.dayOfWeek === dayOfWeek)
      .forEach((b) => {
        blocked.push({
          start: timeToMinutes(b.startTime),
          end: timeToMinutes(b.endTime),
        });
      });

    // Sort blocked intervals
    blocked.sort((a, b) => a.start - b.start);

    // Day goes from 6am to midnight (360 to 1440)
    const dayStart = 6 * 60;
    const dayEnd = 24 * 60;

    // Find free intervals
    let cursor = dayStart;
    for (const block of blocked) {
      if (block.start > cursor) {
        addSlots(slots, dateStr, dayOfWeek, cursor, block.start, prefs.sessionLengthPref);
      }
      cursor = Math.max(cursor, block.end);
    }
    if (cursor < dayEnd) {
      addSlots(slots, dateStr, dayOfWeek, cursor, dayEnd, prefs.sessionLengthPref);
    }
  }

  return slots;
}

function getFocusPeriod(startMinute: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = Math.floor(startMinute / 60);
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'night';
}

function addSlots(
  slots: FreeSlot[],
  date: string,
  dayOfWeek: number,
  start: number,
  end: number,
  sessionLength: number
): void {
  let cur = start;
  while (cur + sessionLength <= end) {
    const slotEnd = cur + sessionLength;
    slots.push({
      date,
      dayOfWeek,
      startMinute: cur,
      endMinute: slotEnd,
      focusPeriod: getFocusPeriod(cur),
    });
    cur = slotEnd;
  }
}

// Step 2: Compute urgency scores
export function computeUrgencyScore(deadline: Deadline): number {
  const remaining = deadline.estimatedHours * (1 - deadline.progressDone / 100);
  const daysLeft = daysUntil(deadline.dueDate);
  return (deadline.priority * 2 + deadline.difficulty) * (remaining / daysLeft);
}

// Main engine
export function runPlannerEngine(
  deadlines: Deadline[],
  fixedBlocks: FixedBlock[],
  prefs: UserPlannerPrefs,
  weekStartDate?: Date
): { blocks: PlannerBlock[]; summary: PlanningHealthSummary } {
  const startDate = weekStartDate ?? getMonday(new Date());

  // Step 1
  let freeSlots = computeFreeSlots(fixedBlocks, prefs, startDate);

  // Step 2: Sort deadlines by urgency
  const sorted = [...deadlines]
    .map((d) => ({ deadline: d, urgency: computeUrgencyScore(d) }))
    .sort((a, b) => b.urgency - a.urgency);

  const blocks: PlannerBlock[] = [];
  const underplanned: string[] = [];

  // Track daily usage
  const dailyMinutes: Record<string, number> = {};

  // Step 3: Fill slots
  for (const { deadline, urgency } of sorted) {
    const remaining = deadline.estimatedHours * (1 - deadline.progressDone / 100);
    let hoursLeft = remaining;
    const sessionsNeeded = deadline.splittable
      ? Math.ceil((hoursLeft * 60) / prefs.sessionLengthPref)
      : 1;
    const sessionDuration = deadline.splittable
      ? prefs.sessionLengthPref
      : Math.min(hoursLeft * 60, prefs.sessionLengthPref * 3);

    // Get slots before deadline
    const dueDate = new Date(deadline.dueDate);
    const bufferDate = prefs.keepBufferBeforeDeadline
      ? new Date(dueDate.getTime() - 24 * 60 * 60 * 1000)
      : dueDate;

    // Filter and sort slots by preference
    const validSlots = freeSlots.filter((s) => {
      const slotDate = new Date(s.date);
      return slotDate <= bufferDate;
    });

    // Sort slots by study style
    const sortedSlots = sortSlotsByStyle(validSlots, prefs);

    let sessionsPlaced = 0;

    for (const slot of sortedSlots) {
      if (sessionsPlaced >= sessionsNeeded || hoursLeft <= 0) break;

      // Check daily max
      const dayUsed = dailyMinutes[slot.date] ?? 0;
      if (dayUsed + sessionDuration > prefs.dailyMaxHours * 60) continue;

      // Check focus time preference (soft preference)
      const isPrefTime = slot.focusPeriod === prefs.bestFocusTime;

      // Apply protect-rest style
      if (prefs.studyStyle === 'protect-rest') {
        // Simple heuristic: skip if day already has 2+ sessions
        const dayBlocks = blocks.filter((b) => b.date === slot.date);
        if (dayBlocks.length >= 2) continue;
      }

      const daysLeft = daysUntil(deadline.dueDate);
      const explanation = generateExplanation(
        deadline.taskName,
        slot,
        prefs.bestFocusTime,
        daysLeft,
        hoursLeft,
        false
      );

      blocks.push({
        id: `block-${deadline.id}-${blocks.length}`,
        deadlineId: deadline.id,
        taskName: deadline.taskName,
        date: slot.date,
        startTime: minutesToTime(slot.startMinute),
        endTime: minutesToTime(slot.startMinute + sessionDuration),
        durationMinutes: sessionDuration,
        explanation,
        status: 'pending',
        urgencyScore: urgency,
        isBuffer: false,
      });

      dailyMinutes[slot.date] = dayUsed + sessionDuration;

      // Remove used slot from free slots
      freeSlots = freeSlots.filter((s) => s !== slot);

      sessionsPlaced++;
      hoursLeft -= sessionDuration / 60;
    }

    // Buffer slot
    if (prefs.keepBufferBeforeDeadline && hoursLeft <= 0) {
      const bufferDateStr = isoDate(bufferDate);
      const bufferSlots = freeSlots.filter((s) => s.date === bufferDateStr);
      if (bufferSlots.length > 0) {
        const bs = bufferSlots[0];
        blocks.push({
          id: `buffer-${deadline.id}`,
          deadlineId: deadline.id,
          taskName: `Dự phòng: ${deadline.taskName}`,
          date: bs.date,
          startTime: minutesToTime(bs.startMinute),
          endTime: minutesToTime(bs.startMinute + prefs.sessionLengthPref),
          durationMinutes: prefs.sessionLengthPref,
          explanation: `Mình để trống 1 buổi trước deadline ${deadline.taskName} để bạn có thời gian dự phòng.`,
          status: 'pending',
          urgencyScore: urgency,
          isBuffer: true,
        });
        freeSlots = freeSlots.filter((s) => s !== bs);
      }
    }

    if (hoursLeft > 0.1) {
      underplanned.push(deadline.taskName);
    }
  }

  // Step 5: Health summary
  const totalPlannedHours = blocks.reduce((sum, b) => sum + b.durationMinutes / 60, 0);

  const dayTotals: Record<string, number> = {};
  blocks.forEach((b) => {
    dayTotals[b.date] = (dayTotals[b.date] ?? 0) + b.durationMinutes;
  });

  const busiestDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  const busiestDayName = busiestDay
    ? DAY_NAMES[new Date(busiestDay + 'T12:00:00').getDay()]
    : 'N/A';

  const bufferRemaining = freeSlots.length * (prefs.sessionLengthPref / 60);

  return {
    blocks,
    summary: {
      totalPlannedHours: Math.round(totalPlannedHours * 10) / 10,
      busiestDay: busiestDayName,
      bufferRemaining: Math.round(bufferRemaining * 10) / 10,
      underplannedTasks: underplanned,
    },
  };
}

function sortSlotsByStyle(slots: FreeSlot[], prefs: UserPlannerPrefs): FreeSlot[] {
  return [...slots].sort((a, b) => {
    switch (prefs.studyStyle) {
      case 'weekend': {
        // Sat=6, Sun=0 first
        const aIsWeekend = a.dayOfWeek === 0 || a.dayOfWeek === 6;
        const bIsWeekend = b.dayOfWeek === 0 || b.dayOfWeek === 6;
        if (aIsWeekend && !bIsWeekend) return -1;
        if (!aIsWeekend && bIsWeekend) return 1;
        break;
      }
      case 'cram':
        // Later dates first
        if (a.date > b.date) return -1;
        if (a.date < b.date) return 1;
        break;
      case 'spread':
      case 'daily-short':
      default:
        // Earlier dates first
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        break;
    }
    // Prefer best focus time
    const aPref = a.focusPeriod === prefs.bestFocusTime ? 0 : 1;
    const bPref = b.focusPeriod === prefs.bestFocusTime ? 0 : 1;
    return aPref - bPref;
  });
}

function generateExplanation(
  taskName: string,
  slot: FreeSlot,
  bestFocusTime: string,
  daysLeft: number,
  remainingHours: number,
  isBuffer: boolean
): string {
  if (isBuffer) {
    return `Mình để trống 1 buổi trước deadline ${taskName} để bạn có thời gian dự phòng.`;
  }
  const dayName = DAY_NAMES[slot.dayOfWeek];
  const periodName = SESSION_NAMES[slot.focusPeriod] ?? slot.focusPeriod;
  const isPrefTime = slot.focusPeriod === bestFocusTime;
  const timeReason = isPrefTime
    ? `đây là khung giờ ${SESSION_NAMES[bestFocusTime]} của bạn`
    : `đây là slot trống phù hợp nhất`;
  return `Mình xếp ${taskName} vào ${dayName} ${periodName} vì ${timeReason}, deadline còn ${daysLeft} ngày và bạn còn ${Math.round(remainingHours * 10) / 10}h cần hoàn thành.`;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export { getMonday, isoDate };
