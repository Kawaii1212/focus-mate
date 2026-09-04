"use client";

import React, { createContext, useContext, useEffect, useReducer } from 'react';
import {
  AppState,
  User,
  Mascot,
  StudySession,
  Deadline,
  FixedBlock,
  PlannerBlock,
  UserPlannerPrefs,
  PlanningHealthSummary,
  MascotPersonaId,
} from '../types';
import { PERSONAS, EXP_PER_LEVEL, getMascotStage, FULL_EXP_PER_SESSION, FULL_COIN_PER_SESSION } from '../lib/mascotData';

const STORAGE_KEY = 'focusmate_state';

const defaultPlannerPrefs: UserPlannerPrefs = {
  dailyMaxHours: 6,
  sessionLengthPref: 45,
  breakLengthPref: 10,
  bestFocusTime: 'evening',
  studyStyle: 'spread',
  keepBufferBeforeDeadline: true,
  reserveCatchupSlots: false,
  prioritizeUrgentFirst: true,
};

const initialState: AppState = {
  user: null,
  mascot: null,
  streakCurrent: 0,
  streakLongest: 0,
  streakTodayValid: false,
  lastStudyDate: null,
  streakAtRisk: false,
  sessions: [],
  plannerState: {
    deadlines: [],
    fixedBlocks: [],
    generatedPlan: [],
    userPrefs: defaultPlannerPrefs,
    healthSummary: null,
    lastGenerated: null,
  },
  isDarkMode: false,
  ownedItems: [],
};

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...initialState, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return initialState;
}

type Action =
  | { type: 'SIGNUP'; payload: { name: string; email: string; studyHabit: string; goal: string; preferredTime: 'morning' | 'afternoon' | 'evening' | 'night' } }
  | { type: 'LOGIN'; payload: { email: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'COMPLETE_ONBOARDING'; payload: { personaId: MascotPersonaId; mascotName: string; role: string } }
  | { type: 'ADD_SESSION'; payload: StudySession }
  | { type: 'UPDATE_MASCOT_EXP'; payload: { expGained: number; coinGained: number } }
  | { type: 'UPDATE_STREAK'; payload: { isValid: boolean } }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'UPDATE_PLANNER_PREFS'; payload: Partial<UserPlannerPrefs> }
  | { type: 'SET_DEADLINES'; payload: Deadline[] }
  | { type: 'ADD_DEADLINE'; payload: Deadline }
  | { type: 'REMOVE_DEADLINE'; payload: string }
  | { type: 'SET_FIXED_BLOCKS'; payload: FixedBlock[] }
  | { type: 'ADD_FIXED_BLOCK'; payload: FixedBlock }
  | { type: 'REMOVE_FIXED_BLOCK'; payload: string }
  | { type: 'SET_GENERATED_PLAN'; payload: { blocks: PlannerBlock[]; summary: PlanningHealthSummary } }
  | { type: 'COMPLETE_PLANNER_BLOCK'; payload: string }
  | { type: 'BUY_ITEM'; payload: { itemId: string; price: number } }
  | { type: 'USE_STREAK_SHIELD' }
  | { type: 'ADD_STREAK_SHIELD'; payload: number };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SIGNUP': {
      const user: User = {
        id: Date.now().toString(),
        name: action.payload.name,
        email: action.payload.email,
        onboardingComplete: false,
        studyHabit: action.payload.studyHabit,
        goal: action.payload.goal,
        preferredTime: action.payload.preferredTime,
        createdAt: new Date().toISOString(),
      };
      return { ...state, user };
    }
    case 'LOGIN': {
      if (state.user && state.user.email === action.payload.email) {
        return state;
      }
      return state;
    }
    case 'LOGOUT':
      return { ...state, user: null, mascot: null };
    case 'SET_USER':
      return { ...state, user: action.payload };

    case 'COMPLETE_ONBOARDING': {
      const persona = PERSONAS[action.payload.personaId];
      const mascot: Mascot = {
        personaId: action.payload.personaId,
        stage: 'baby',
        level: 1,
        exp: 0,
        expToNextLevel: EXP_PER_LEVEL(1),
        coin: 50, // starter coins
        energy: 100,
        streakShields: 1,
        name: action.payload.mascotName || persona.defaultMascotName,
      };
      return {
        ...state,
        user: state.user ? { ...state.user, onboardingComplete: true, role: action.payload.role } : state.user,
        mascot,
      };
    }

    case 'ADD_SESSION': {
      return { ...state, sessions: [action.payload, ...state.sessions] };
    }

    case 'UPDATE_MASCOT_EXP': {
      if (!state.mascot) return state;
      const { expGained, coinGained } = action.payload;
      let { exp, level, coin } = state.mascot;
      exp += expGained;
      coin += coinGained;
      // Level up loop
      while (exp >= EXP_PER_LEVEL(level)) {
        exp -= EXP_PER_LEVEL(level);
        level++;
      }
      const stage = getMascotStage(level);
      return {
        ...state,
        mascot: {
          ...state.mascot,
          exp,
          level,
          coin,
          stage,
          expToNextLevel: EXP_PER_LEVEL(level),
        },
      };
    }

    case 'UPDATE_STREAK': {
      const today = new Date().toISOString().split('T')[0];
      if (action.payload.isValid) {
        const newStreak = state.lastStudyDate === today
          ? state.streakCurrent
          : (() => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yStr = yesterday.toISOString().split('T')[0];
              if (state.lastStudyDate === yStr) return state.streakCurrent + 1;
              return 1; // restart
            })();
        return {
          ...state,
          streakCurrent: newStreak,
          streakLongest: Math.max(state.streakLongest, newStreak),
          streakTodayValid: true,
          lastStudyDate: today,
          streakAtRisk: false,
        };
      }
      return state;
    }

    case 'USE_STREAK_SHIELD': {
      if (!state.mascot || state.mascot.streakShields <= 0) return state;
      return {
        ...state,
        mascot: { ...state.mascot, streakShields: state.mascot.streakShields - 1 },
        streakCurrent: state.streakCurrent, // shield saves streak
      };
    }

    case 'ADD_STREAK_SHIELD': {
      if (!state.mascot) return state;
      return {
        ...state,
        mascot: { ...state.mascot, streakShields: state.mascot.streakShields + action.payload },
      };
    }

    case 'TOGGLE_DARK_MODE':
      return { ...state, isDarkMode: !state.isDarkMode };

    case 'UPDATE_PLANNER_PREFS':
      return {
        ...state,
        plannerState: { ...state.plannerState, userPrefs: { ...state.plannerState.userPrefs, ...action.payload } },
      };

    case 'SET_DEADLINES':
      return { ...state, plannerState: { ...state.plannerState, deadlines: action.payload } };

    case 'ADD_DEADLINE':
      return { ...state, plannerState: { ...state.plannerState, deadlines: [...state.plannerState.deadlines, action.payload] } };

    case 'REMOVE_DEADLINE':
      return { ...state, plannerState: { ...state.plannerState, deadlines: state.plannerState.deadlines.filter((d) => d.id !== action.payload) } };

    case 'SET_FIXED_BLOCKS':
      return { ...state, plannerState: { ...state.plannerState, fixedBlocks: action.payload } };

    case 'ADD_FIXED_BLOCK':
      return { ...state, plannerState: { ...state.plannerState, fixedBlocks: [...state.plannerState.fixedBlocks, action.payload] } };

    case 'REMOVE_FIXED_BLOCK':
      return { ...state, plannerState: { ...state.plannerState, fixedBlocks: state.plannerState.fixedBlocks.filter((b) => b.id !== action.payload) } };

    case 'SET_GENERATED_PLAN':
      return {
        ...state,
        plannerState: {
          ...state.plannerState,
          generatedPlan: action.payload.blocks,
          healthSummary: action.payload.summary,
          lastGenerated: new Date().toISOString(),
        },
      };

    case 'COMPLETE_PLANNER_BLOCK':
      return {
        ...state,
        plannerState: {
          ...state.plannerState,
          generatedPlan: state.plannerState.generatedPlan.map((b) =>
            b.id === action.payload ? { ...b, status: 'completed' } : b
          ),
        },
      };

    case 'BUY_ITEM': {
      if (!state.mascot || state.mascot.coin < action.payload.price) return state;
      return {
        ...state,
        mascot: { ...state.mascot, coin: state.mascot.coin - action.payload.price },
        ownedItems: [...state.ownedItems, action.payload.itemId],
      };
    }

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Apply dark mode class
  useEffect(() => {
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.isDarkMode]);

  // Check streak at risk (afternoon onward, no study today)
  useEffect(() => {
    const checkStreakRisk = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const hour = now.getHours();
      if (
        state.streakCurrent > 0 &&
        !state.streakTodayValid &&
        state.lastStudyDate !== today &&
        hour >= 14
      ) {
        // Would dispatch streakAtRisk but we check it via computed state
      }
    };
    checkStreakRisk();
  }, [state.streakCurrent, state.streakTodayValid, state.lastStudyDate]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Convenience hooks
export function useUser() {
  return useApp().state.user;
}

export function useMascot() {
  return useApp().state.mascot;
}

export function useStreak() {
  const { state } = useApp();
  return {
    current: state.streakCurrent,
    longest: state.streakLongest,
    todayValid: state.streakTodayValid,
    atRisk: !state.streakTodayValid && state.streakCurrent > 0 && (() => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      return state.lastStudyDate !== today && now.getHours() >= 14;
    })(),
    shields: state.mascot?.streakShields ?? 0,
  };
}

export function usePlanner() {
  return useApp().state.plannerState;
}

export { FULL_EXP_PER_SESSION, FULL_COIN_PER_SESSION };
