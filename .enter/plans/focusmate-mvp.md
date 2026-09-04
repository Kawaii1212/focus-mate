# Focus Mate MVP — Implementation Plan

## Context
Building a full desktop web app (React + TypeScript + Tailwind) for high-school/college students to gamify studying via a mascot system, Pomodoro timer, AI rule-based planner, and co-study rooms. No real backend — all state via React Context + localStorage. UI language: Vietnamese. Mascots: SVG-based React components.

---

## Architecture

### State Management
- `src/store/AppContext.tsx` — global provider wrapping entire app
  - `user`: name, avatar, onboardingComplete, preferences
  - `mascot`: personaId (0-5), stage (baby/teen/adult), level, exp, coin, energy, streakShields
  - `streak`: current, longestEver, todayValid, lastStudyDate
  - `sessions`: StudySession[]
  - `plannerState`: deadlines[], fixedBlocks[], generatedPlan[], userPrefs
  - All persisted to localStorage via `useEffect`

### TypeScript Types (`src/types/index.ts`)
```
User, Mascot, StudySession, StreakRecord,
Deadline, PlannerBlock, FixedBlock, UserPlannerPrefs,
MascotPersona, MascotStage, MascotState
```

### Custom Hooks
- `src/hooks/useTimer.ts` — countdown logic, pause/resume, completion %
- `src/hooks/usePlannerEngine.ts` — full rule-based engine (Steps 1–5)
- `src/hooks/useStreak.ts` — streak update logic, shield consumption

### Planner Engine (`src/lib/plannerEngine.ts`)
Implements the exact formula from spec §3.3:
- Step 1: compute free_slots (168h − fixed − sleep)
- Step 2: urgency_score = (priority×2 + difficulty) × (remaining_hours / days_left)
- Step 3: fill slots by urgency, respecting daily_max, study_style, best_focus_time, buffer
- Step 4: generate explanation string from template
- Step 5: planning health summary

---

## Design System (`src/index.css` + `tailwind.config.ts`)
Custom tokens matching spec color roles:
- `--sky`: powder blue primary background
- `--cloud`: creamy white surfaces
- `--aqua`: pale aqua cards
- `--lavender`: secondary cards
- `--butter`: butter yellow accent/CTA
- `--peach`: peach badge/highlight
- `--navy`: deep text
- `--lilac`: secondary text
- Soft dark mode: deep blue-gray backgrounds, pastels still visible
- Custom keyframes: `float`, `egg-shake`, `mascot-bounce`, `level-up-pop`, `confetti`

---

## File Structure

```
src/
  types/index.ts
  store/AppContext.tsx
  hooks/useTimer.ts
  hooks/usePlannerEngine.ts
  hooks/useStreak.ts
  lib/plannerEngine.ts
  lib/mascotData.ts           ← persona definitions, speech templates, EXP tables
  components/
    layout/
      AppLayout.tsx           ← sidebar + header + mascot panel + main content
      Sidebar.tsx
      Header.tsx
      MascotPanel.tsx         ← right panel shown on most screens
    mascot/
      MascotSVG.tsx           ← renders correct SVG by (personaId, stage, state)
      MascotEgg.tsx           ← 6 egg variants with persona silhouette
      SpeechBubble.tsx
    pomodoro/
      TimerRing.tsx           ← circular countdown animation
      RewardModal.tsx         ← session complete overlay
      QuitWarningModal.tsx
      LevelUpModal.tsx
    planner/
      WeekCalendar.tsx        ← 7-column calendar grid with blocks
      PlannerBlock.tsx        ← individual block with click/start
      HealthSummary.tsx
    costudy/
      RoomCard.tsx
      MemberAvatar.tsx
      CheckInModal.tsx
  pages/
    auth/
      LoginPage.tsx
      SignupPage.tsx
    onboarding/
      OnboardingFlow.tsx      ← multi-step wizard (habits → goals → schedule → egg select → mascot intro)
    dashboard/
      DashboardPage.tsx
    mascot-room/
      MascotRoomPage.tsx
    pomodoro/
      PomodoroSetupPage.tsx
      ActiveSessionPage.tsx
      PausePage.tsx
      SessionCompletePage.tsx
    planner/
      PlannerPage.tsx         ← tabs: Overview / Fixed Schedule / Deadlines / Calendar
    costudy/
      CoStudyLobbyPage.tsx
      CoStudyRoomPage.tsx
    shop/
      ShopPage.tsx
    premium/
      PremiumPage.tsx
    profile/
      ProfilePage.tsx
```

---

## Screens & Flows (mapped to routes)

| Route | Screen | Tier |
|---|---|---|
| `/login` | Login | 1 |
| `/signup` | Signup | 1 |
| `/onboarding` | Onboarding wizard (5 steps) | 1 |
| `/dashboard` | Dashboard | 1 |
| `/mascot-room` | Mascot Room | 1 |
| `/study` | Pomodoro Setup | 1 |
| `/study/active` | Active Session | 1 |
| `/study/pause` | Paused | 1 |
| `/study/complete` | Reward Screen | 1 |
| `/planner` | Planner (tabbed) | 2 |
| `/costudy` | Co-study Lobby | 2 |
| `/costudy/room` | Active Co-study Room | 2 |
| `/shop` | Shop | 3 |
| `/premium` | Premium | 3 |
| `/profile` | Profile | 3 |

Route guard: if `!user.onboardingComplete` → redirect to `/onboarding`; if not logged in → redirect to `/login`.

---

## Mascot SVG System

6 personas × 3 stages × ~6 states = SVG components with props:
```tsx
<MascotSVG personaId={0-5} stage="baby|teen|adult" mascotState="idle|studying|happy|sad|waiting|levelup" />
```
Color palettes per persona:
1. Shy — soft pink/lavender
2. Energetic — orange/yellow
3. Mature — sky blue/gray
4. Elegant — purple/gold
5. Strict — red/coral
6. CEO — dark navy/gold

Each SVG: round body, large expressive eyes, small limbs, glossy gradient fill. States differ by: eye shape, mouth curve, body tilt, small animations via CSS.

---

## Key Logic Details

### Pomodoro End Logic
```
completionPct = actualTime / targetTime
if completionPct >= 0.5:  show Session Complete (no warning)
else:                      show Quit Warning → "End Anyway" → Session Complete
EXP earned = completionPct × fullEXP
Coin earned = completionPct × fullCoin
Streak valid only if completionPct >= 0.5
```

### Streak Shield
- Stored in `mascot.streakShields`
- Auto-consumed when a day is missed (lastStudyDate < yesterday)
- Shown in Header and Dashboard

### Planner: Pre-fill Pomodoro
When user clicks "Start Session" on a planner block, navigate to `/study` with block data in router state: `{ taskTitle, focusMinutes, blockId }`. Setup page reads this and pre-fills fields.

### Planner: Mark Complete
After session complete, if `session.plannerBlockId` exists → update that block's status to "completed" in `plannerState.generatedPlan`.

### Co-study Check-in
- `checkInInterval`: 15/30/45 min configurable
- Countdown shown as a progress bar
- On "I'm here" click → reset countdown
- If Pomodoro is paused → countdown paused too
- Miss check-in → show alert, other members see "(name) có thể đã ngủ quên"

---

## Critical Files to Create/Modify

**Modify:**
- `src/index.css` — new design tokens
- `src/tailwind.config.ts` — new color mappings
- `src/App.tsx` — wrap with AppProvider
- `src/router.tsx` — all routes

**Create (in order):**
1. `src/types/index.ts`
2. `src/lib/mascotData.ts`
3. `src/lib/plannerEngine.ts`
4. `src/store/AppContext.tsx`
5. `src/hooks/useTimer.ts`
6. `src/hooks/useStreak.ts`
7. Layout components (AppLayout, Sidebar, Header, MascotPanel)
8. Mascot components (MascotSVG, MascotEgg, SpeechBubble)
9. Auth pages
10. Onboarding flow
11. Dashboard
12. Pomodoro pages + modals
13. Planner page + engine
14. Co-study pages
15. Shop, Premium, Profile

---

## Verification
- Auth flow: login → redirects to onboarding if new user, else dashboard
- Onboarding: completes 5 steps, selects egg, sees mascot intro, lands on dashboard
- Pomodoro: full flow (setup → active → pause → resume → complete ≥50% no warning, <50% shows warning)
- Reward screen: shows correct % completion, EXP, coin, streak update
- Mascot panel: level/EXP updates after session complete
- AI Planner: enter deadlines + fixed schedule → generate → calendar shows blocks with explanations
- Co-study: join mock room, check-in countdown works, pause/resume syncs
- Shop: click item → coin deducted from global state
- Dark mode toggle in header applies to entire app
- localStorage persistence: refresh browser → state preserved
