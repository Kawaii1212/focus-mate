# FocusMate - Screens & Functions Reference

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.9 |
| UI | React 19 + shadcn/ui (49 components) |
| Styling | Tailwind CSS 3.4 |
| State | React Context + useReducer (localStorage persistence) |
| Database | PostgreSQL via Prisma ORM (Supabase) |
| Realtime | Supabase Realtime (Broadcast + Presence) for Co-Study chat/presence/calls |
| WebRTC | Full-mesh P2P group calls (chat + voice/video signaling via Supabase Broadcast) |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |

---

## All Screens/Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `src/app/page.tsx` | Landing page with hero, features, CTA |
| `/login` | `src/app/login/page.tsx` | Login form (email + password) |
| `/signup` | `src/app/signup/page.tsx` | Signup form (name, email, password) |
| `/onboarding` | `src/app/onboarding/page.tsx` | 6-step wizard: role, habits, goals, time, egg, mascot intro |
| `/dashboard` | `src/app/dashboard/page.tsx` | Main hub: stats, sessions, planner preview, deadlines, quick actions |
| `/study` | `src/app/study/page.tsx` | Pomodoro setup (task, focus/break times, solo/co-study) |
| `/study/active` | `src/app/study/active/page.tsx` | Active timer with SVG ring, mascot, EXP/coin preview |
| `/study/pause` | `src/app/study/pause/page.tsx` | Paused session (resume or end) |
| `/study/complete` | `src/app/study/complete/page.tsx` | Completion summary (rewards, level-up, certificates) |
| `/planner` | `src/app/planner/page.tsx` | AI Planner with 5 tabs: Overview, Fixed Schedule, Deadlines, Preferences, Weekly Calendar |
| `/mascot-room` | `src/app/mascot-room/page.tsx` | Mascot virtual room (display, states, growth stages, certificates) |
| `/costudy` | `src/app/costudy/page.tsx` | Co-study lobby (create room, join by code, active rooms list) |
| `/costudy/room/[roomId]` | `src/app/costudy/room/[roomId]/page.tsx` | Active co-study room: check-ins, shared Pomodoro, real-time chat, group video call, participant presence (plus "not found" / "room full" screens) |
| `/shop` | `src/app/shop/page.tsx` | Item shop (snacks, hats, accessories, furniture, themes, streak shields) |
| `/profile` | `src/app/profile/page.tsx` | User profile with stats, mascot progress, certificates, session history |
| `/settings` | `src/app/settings/page.tsx` | Settings (account info, Pomodoro defaults, notification toggles) |
| `/premium` | `src/app/premium/page.tsx` | Premium upgrade page (3 plans, payment mock) |
| 404 | `src/app/not-found.tsx` | Custom 404 page |

---

## API Routes

| Method | Route | File | Purpose |
|--------|-------|------|---------|
| POST | `/api/auth/login` | `src/app/api/auth/login/route.ts` | User login |
| POST | `/api/auth/signup` | `src/app/api/auth/signup/route.ts` | User registration |
| GET | `/api/user/[userId]` | `src/app/api/user/[userId]/route.ts` | Get user with all relations |
| PATCH | `/api/user/[userId]` | `src/app/api/user/[userId]/route.ts` | Update user fields |
| POST | `/api/user/[userId]/mascot` | `src/app/api/user/[userId]/mascot/route.ts` | Create/update mascot (upsert) |
| GET | `/api/deadline/[id]` | `src/app/api/deadline/[id]/route.ts` | Get deadlines by userId |
| POST | `/api/deadline` | `src/app/api/deadline/route.ts` | Create deadline |
| PUT | `/api/deadline/[id]` | `src/app/api/deadline/[id]/route.ts` | Update deadline |
| DELETE | `/api/deadline/[id]` | `src/app/api/deadline/[id]/route.ts` | Delete deadline |
| GET | `/api/plannerblock/[id]` | `src/app/api/plannerblock/[id]/route.ts` | Get planner blocks by userId |
| POST | `/api/plannerblock` | `src/app/api/plannerblock/route.ts` | Create planner block |
| PUT | `/api/plannerblock/[id]` | `src/app/api/plannerblock/[id]/route.ts` | Update planner block |
| DELETE | `/api/plannerblock/[id]` | `src/app/api/plannerblock/[id]/route.ts` | Delete planner block |
| GET | `/api/studysession/[userId]` | `src/app/api/studysession/[userId]/route.ts` | Get sessions by userId |
| POST | `/api/studysession` | `src/app/api/studysession/route.ts` | Create study session |
| GET | `/api/costudy/rooms` | `src/app/api/costudy/rooms/route.ts` | List all active rooms |
| POST | `/api/costudy/rooms` | `src/app/api/costudy/rooms/route.ts` | Create a co-study room |
| GET | `/api/costudy/rooms/[roomId]` | `src/app/api/costudy/rooms/[roomId]/route.ts` | Get one room (members, pomodoro, settings) |
| GET | `/api/costudy/rooms/[roomId]/messages` | `src/app/api/costudy/rooms/[roomId]/messages/route.ts` | Room chat history (cursor pagination, catch-up) |
| POST | `/api/costudy/rooms/[roomId]/messages` | `src/app/api/costudy/rooms/[roomId]/messages/route.ts` | Send a room chat message (persisted, then broadcast) |
| POST | `/api/costudy/action` | `src/app/api/costudy/action/route.ts` | Room actions: join (enforces `maxMembers`, 409 when full), leave (reassigns host to lowest remaining user id), poll, status, sync |

---

## Layout Components

| Component | File | Purpose |
|-----------|------|---------|
| AppLayout | `src/components/layout/AppLayout.tsx` | Main app shell: Sidebar + Header + ScrollArea + MascotPanel |
| Header | `src/components/layout/Header.tsx` | Top bar: greeting, streak badge, shields, coins, dark mode, avatar |
| Sidebar | `src/components/layout/Sidebar.tsx` | Left nav: 9 items + logout |
| MascotPanel | `src/components/layout/MascotPanel.tsx` | Right panel: mascot image, speech bubble, level/EXP bar, streak, coins |

---

## Feature Components

| Component | File | Purpose |
|-----------|------|---------|
| MascotEgg | `src/components/mascot/MascotEgg.tsx` | Egg selector (onboarding) |
| MascotSVG | `src/components/mascot/MascotSVG.tsx` | Mascot image renderer (by persona + stage + state) |
| SpeechBubble | `src/components/mascot/SpeechBubble.tsx` | Speech bubble with directional tail |
| QuitWarningModal | `src/components/pomodoro/QuitWarningModal.tsx` | Alert when quitting early |
| LanguageSwitcher | `src/components/language-switcher.tsx` | Language dropdown (i18n) |

### Co-Study Room Components (`src/components/costudy/`)

| Component | File | Purpose |
|-----------|------|---------|
| RoomHeader | `src/components/costudy/RoomHeader.tsx` | Room title, code badge, online count, in-call chip, leave button |
| CheckInCard | `src/components/costudy/CheckInCard.tsx` | Personal check-in countdown with pause/check-in actions |
| ParticipantsPanel | `src/components/costudy/ParticipantsPanel.tsx` | Live participant list with presence states (ONLINE/STUDYING/AWAY/OFFLINE/IN_VIDEO_CALL) and mic/camera flags |
| ChatPanel | `src/components/costudy/ChatPanel.tsx` | Shared room chat: history, timestamps, avatars, typing indicators, unread count, auto-scroll |
| VideoCallPanel | `src/components/costudy/VideoCallPanel.tsx` | Group video call: responsive tile grid, mic/camera controls, join/leave call |
| CoStudyPomodoro | `src/components/costudy/CoStudyPomodoro.tsx` | Shared pomodoro ring (host-controlled, wall-clock countdown) |

---

## Custom Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useTimer` | `src/hooks/useTimer.ts` | Pomodoro timer: start, pause, resume, reset, elapsed/remaining, completion% |
| `formatTime` | `src/hooks/useTimer.ts` | Format seconds to MM:SS |
| `useIsMobile` | `src/hooks/use-mobile.tsx` | Responsive breakpoint detection (< 768px) |
| `useToast` | `src/hooks/use-toast.ts` | Toast notification management |
| `useCoStudyRoom` | `src/hooks/useCoStudyRoom.ts` | Realtime room channel: presence snapshot, pomodoro broadcasts (via module-level store) |
| `useRoomChat` | `src/hooks/useRoomChat.ts` | Room chat: history, send, typing indicators, unread count, 30s catch-up |
| `useGroupCall` | `src/hooks/useGroupCall.ts` | WebRTC full-mesh group call: peers, mic/camera toggles, join/leave |
| `useApp` | `src/store/AppContext.tsx` | Access global state + dispatch |
| `useUser` | `src/store/AppContext.tsx` | Shortcut to current user |
| `useMascot` | `src/store/AppContext.tsx` | Shortcut to mascot state |
| `useStreak` | `src/store/AppContext.tsx` | Streak data (current, longest, atRisk, shields) |
| `usePlanner` | `src/store/AppContext.tsx` | Planner state |

---

## Core Libraries

### `src/lib/mascotData.ts` - Mascot System
- 6 mascot personas: Mouse, Dog, Cat, Frog, Bear, Capybara
- Each has: name, tagline, colors, image, speeches for 8 states
- `EXP_PER_LEVEL(level)` - Exponential EXP curve
- `getMascotStage(level)` - baby (<10), teen (<30), adult (30+)
- `getRandomSpeech(personaId, state)` - Random speech by persona and state
- `CERTIFICATE_MILESTONES` - 5 milestones at levels 10, 20, 30, 40, 50
- `SHOP_ITEMS` - 15 items across 8 categories

### `src/lib/plannerEngine.ts` - AI Planner
- `runPlannerEngine(deadlines, fixedBlocks, prefs, weekStartDate)` - Main scheduling function
- Computes free slots, urgency scores, fills slots by priority
- Supports study styles: spread, daily-short, cram, weekend, protect-rest
- Generates health summary (planned hours, busiest day, buffer, underplanned tasks)

### `src/lib/api.ts` - Frontend API Client
- `authApi` - login, signup
- `userApi` - updateUser, updateMascot
- `deadlineApi` - CRUD operations
- `plannerApi` - CRUD operations
- `sessionApi` - create, get sessions

### `src/lib/costudy.ts` - Co-Study API Client
- `costudyApi.getRoom` / `createRoom` / `performAction` (join, leave, status, sync, poll)
- `costudyApi.getMessages` (history, before/after cursors) / `sendMessage` (persisted)

### `src/lib/costudyRealtime.ts` - Co-Study Realtime Store
- Module-level store per room (survives React remounts; channels are single-use)
- One Supabase channel `room:{roomId}` per room: Presence + Broadcast events
- Presence payload: userId, name, mascotPersonaId, status, cameraEnabled, microphoneEnabled, joinedVideoCall
- Broadcast events: `chat-message`, `typing`, `pomodoro-sync`, `call-signal`, `call-ice`, `call-leave`
- WebRTC signaling: deterministic initiator (smaller userId offers) avoids SDP glare; ICE candidates batched

### `src/lib/supabase.ts` - Supabase Client
- `createClient` singleton using `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `isSupabaseConfigured` flag used to guard/disable realtime features gracefully

---

## State Management

**File**: `src/store/AppContext.tsx`

### App State Shape
- `user` - Current logged-in user
- `mascot` - Virtual pet (persona, stage, level, exp, coin, energy, shields)
- `streakCurrent/streakLongest/streakTodayValid/lastStudyDate/streakAtRisk` - Streak tracking
- `sessions` - Array of completed study sessions
- `plannerState` - Deadlines, fixed blocks, generated plan, user prefs, health summary
- `isDarkMode` - Dark mode toggle
- `ownedItems` - Array of purchased shop item IDs

### Reducer Actions (18 total)
1. `SIGNUP` - Create user from signup form
2. `LOGIN` - Match existing user
3. `LOGOUT` - Clear user + mascot
4. `SET_USER` - Set user from API response
5. `COMPLETE_ONBOARDING` - Create mascot, mark onboarding complete
6. `ADD_SESSION` - Add completed study session
7. `UPDATE_MASCOT_EXP` - Add EXP/coins, handle level-ups
8. `UPDATE_STREAK` - Update streak counter
9. `USE_STREAK_SHIELD` - Consume a shield to save streak
10. `ADD_STREAK_SHIELD` - Add shields (from shop)
11. `TOGGLE_DARK_MODE` - Toggle dark mode
12. `UPDATE_PLANNER_PREFS` - Update planner preferences
13. `SET_DEADLINES` / `ADD_DEADLINE` / `REMOVE_DEADLINE` - Deadline CRUD
14. `SET_FIXED_BLOCKS` / `ADD_FIXED_BLOCK` / `REMOVE_FIXED_BLOCK` - Fixed block CRUD
15. `SET_GENERATED_PLAN` - Store AI-generated weekly plan
16. `COMPLETE_PLANNER_BLOCK` - Mark a plan block as completed
17. `BUY_ITEM` - Purchase shop item (deduct coins)

---

## User Flow

1. **Landing** -> Signup -> Onboarding (6 steps: role, habits, goals, time, pick mascot egg, name mascot)
2. **Dashboard** shows: welcome, streak, stats, today's sessions, planner preview, deadlines, quick actions
3. **Study**: Setup (task name, focus/break time, solo/co-study) -> Active session (timer, mascot, EXP preview) -> Pause/Resume -> Complete (rewards, level-up, certificates)
4. **AI Planner**: Add deadlines + fixed blocks -> Configure preferences -> Generate weekly schedule -> Click blocks to start study sessions
5. **Mascot Room**: View mascot at different states, growth stages, certificates
6. **Co-Study**: Create/join rooms, shared Pomodoro (wall-clock countdown), check-in system, real-time shared chat (typing indicators, unread count, history), group video/audio call (WebRTC mesh with mic/camera controls), live participant presence and status
7. **Shop**: Buy items with coins (snacks, hats, accessories, furniture, themes, skins, streak shields)
8. **Profile**: Stats, mascot progress, certificates, session history, owned items
9. **Settings**: Account info, Pomodoro defaults, notification toggles
10. **Premium**: Upgrade plans (mock payment)

---

## Gamification System

- **EXP**: Earned per session (proportional to completion %), exponential level curve
- **Mascot Evolution**: Baby -> Teen -> Adult (at levels 10 and 30)
- **Coins**: Earned per session, spent in shop
- **Streaks**: Daily study streak tracking with streak shields (purchasable)
- **Certificates**: Unlocked at level milestones (10, 20, 30, 40, 50)
- **Shop Items**: 15 items across 8 categories (snacks, hats, accessories, furniture, decor, themes, skins, streak shields)

---

## Database Schema (Prisma)

| Model | Purpose |
|-------|---------|
| User | User accounts (name, email, passwordHash, onboarding data) |
| Mascot | Virtual pet (personaId, stage, level, exp, coin, energy, streakShields) |
| StudySession | Completed study sessions (target/actual minutes, completion%, exp/coin earned) |
| PlannerBlock | AI-generated schedule blocks |
| Deadline | User's deadlines/tasks (dueDate, difficulty, priority, estimated hours) |
| FixedBlock | Recurring schedule blocks (class, work, etc.) |
| ActiveRoom | Active co-study rooms (members, pomodoro state) |
| RoomMember | Members of a co-study room |
| RoomMessage | Persisted room chat messages (cascade-deleted with room) |
