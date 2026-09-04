// ============ Core Entity Types ============

export type MascotPersonaId = 0 | 1 | 2 | 3 | 4 | 5;
export type MascotStage = 'baby' | 'teen' | 'adult';
export type MascotState =
  | 'idle'
  | 'studying'
  | 'paused'
  | 'happy'
  | 'sad'
  | 'streakReminder'
  | 'levelUp'
  | 'itemRequest';

export interface User {
  id: string;
  name: string;
  email: string;
  onboardingComplete: boolean;
  studyHabit: string;    // from onboarding
  goal: string;           // from onboarding
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'night'; // from onboarding
  role?: string;          // from onboarding
  createdAt: string;
}

export interface Mascot {
  personaId: MascotPersonaId;
  stage: MascotStage;
  level: number;
  exp: number;
  expToNextLevel: number;
  coin: number;
  energy: number; // 0-100
  streakShields: number;
  name: string;
}

export interface StudySession {
  id: string;
  taskTitle: string;
  targetMinutes: number;
  actualMinutes: number;
  completionPct: number;  // 0-100
  expEarned: number;
  coinEarned: number;
  isValid: boolean;        // completionPct >= 50
  streakSaved: boolean;
  plannerBlockId?: string;
  date: string;            // ISO date string
  createdAt: string;
}

export interface StreakRecord {
  date: string;
  valid: boolean;
}

export interface Deadline {
  id: string;
  taskName: string;
  type: 'assignment' | 'exam' | 'project' | 'reading' | 'revision';
  dueDate: string;        // ISO date
  dueTime?: string;
  estimatedHours: number;
  difficulty: number;     // 1-5
  priority: number;       // 1-5
  progressDone: number;   // 0-100
  splittable: boolean;
  minSessionLength: number; // minutes
  studyStyleOverride?: string;
  notes?: string;
}

export interface FixedBlock {
  id: string;
  label: string;
  type: 'class' | 'work' | 'club' | 'commute' | 'sleep' | 'meal' | 'other';
  dayOfWeek: number;      // 0=Sun, 1=Mon, ...6=Sat
  startTime: string;      // "HH:MM"
  endTime: string;        // "HH:MM"
}

export interface PlannerBlock {
  id: string;
  deadlineId: string;
  taskName: string;
  date: string;           // ISO date
  startTime: string;      // "HH:MM"
  endTime: string;        // "HH:MM"
  durationMinutes: number;
  explanation: string;
  status: 'pending' | 'completed' | 'missed';
  urgencyScore: number;
  isBuffer: boolean;
}

export interface UserPlannerPrefs {
  dailyMaxHours: number;
  sessionLengthPref: number;    // minutes: 30/45/60/90
  breakLengthPref: number;      // minutes
  bestFocusTime: 'morning' | 'afternoon' | 'evening' | 'night';
  studyStyle: 'spread' | 'daily-short' | 'cram' | 'weekend' | 'protect-rest';
  keepBufferBeforeDeadline: boolean;
  reserveCatchupSlots: boolean;
  prioritizeUrgentFirst: boolean;
}

export interface PlanningHealthSummary {
  totalPlannedHours: number;
  busiestDay: string;
  bufferRemaining: number;
  underplannedTasks: string[];
}

export interface PlannerState {
  deadlines: Deadline[];
  fixedBlocks: FixedBlock[];
  generatedPlan: PlannerBlock[];
  userPrefs: UserPlannerPrefs;
  healthSummary: PlanningHealthSummary | null;
  lastGenerated: string | null;
}

export interface CoStudyRoom {
  id: string;
  name: string;
  maxMembers: number;
  checkInInterval: 15 | 30 | 45;
  members: CoStudyMember[];
  sharedMinutes: number;
  createdAt: string;
}

export interface CoStudyMember {
  id: string;
  name: string;
  mascotPersonaId: MascotPersonaId;
  status: 'focusing' | 'break' | 'inactive' | 'missed-checkin';
  lastCheckIn: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: 'snack' | 'hat' | 'accessory' | 'furniture' | 'decor' | 'theme' | 'skin' | 'streak-shield';
  price: number;
  isPremium: boolean;
  owned: boolean;
}

// ============ App State ============

export interface AppState {
  user: User | null;
  mascot: Mascot | null;
  streakCurrent: number;
  streakLongest: number;
  streakTodayValid: boolean;
  lastStudyDate: string | null;
  streakAtRisk: boolean;
  sessions: StudySession[];
  plannerState: PlannerState;
  isDarkMode: boolean;
  ownedItems: string[];
}

// ============ Active Timer State ============

export interface ActiveTimerState {
  taskTitle: string;
  targetMinutes: number;
  breakMinutes: number;
  elapsedSeconds: number;
  isRunning: boolean;
  phase: 'focus' | 'break';
  plannerBlockId?: string;
}
