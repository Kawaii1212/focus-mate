# FocusMate - Setup & Run Guide

## Prerequisites

- **Node.js** >= 18
- **pnpm** 8.6+
- **PostgreSQL** database (Supabase recommended — Realtime powers Co-Study chat/presence/calls)

---

## 1. Clone the Repository

```bash
git clone <repo-url>
cd focus-mate
```

---

## 2. Install Dependencies

```bash
pnpm install
```

---

## 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:<password>@<host>:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:<password>@<host>:5432/postgres"

# Supabase Realtime (Co-Study chat, presence, video-call signaling)
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon public key>"

# Optional: TURN relay for video calls (leave empty for STUN-only)
NEXT_PUBLIC_TURN_URL=""
NEXT_PUBLIC_TURN_USERNAME=""
NEXT_PUBLIC_TURN_CREDENTIAL=""
```

> **Tip**: Get your `DATABASE_URL` and `DIRECT_URL` from Supabase dashboard > Settings > Database, and the Supabase URL / anon key from Settings > API.

> **Important**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` is required for the Co-Study real-time features (shared chat, participant presence, group video call). Without it the room still works (check-ins, shared Pomodoro, message history) but nothing updates in real time. No extra Supabase configuration is needed — Broadcast and Presence work out of the box on every Supabase project.

---

## 4. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

Optional: Open Prisma Studio to view data:

```bash
npx prisma studio
```

---

## 5. Run the Development Server

```bash
pnpm dev
```

App runs at **http://localhost:3000**

---

## 6. Co-Study Realtime Architecture (Supabase)

Co-Study rooms use **Supabase Realtime** (no separate server needed):

- **Presence** — who is online, their status (studying / online / away), and mic/camera flags, updated in real time
- **Broadcast** — shared chat messages, typing indicators, pomodoro sync, and WebRTC call signaling (offers/answers/ICE)
- **REST + Prisma** — room roster, chat history (`RoomMessage` table), and pomodoro durability; a 30s resync acts as a backstop if a broadcast is ever missed

Group calls are **WebRTC full-mesh**: every participant connects directly to every other participant (bounded by the room's `maxMembers`, 2-10). NAT traversal uses Google STUN by default; set `NEXT_PUBLIC_TURN_URL` (+ `NEXT_PUBLIC_TURN_USERNAME` / `NEXT_PUBLIC_TURN_CREDENTIAL`) to add a TURN relay when some participants are behind very restrictive networks.

The old optional .NET SignalR backend (`backend/FocusMate.Backend`) is **no longer used** by the frontend and is kept only for reference:

```bash
cd backend/FocusMate.Backend
dotnet run   # http://localhost:5006 (unused by the app)
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Generate Prisma client + build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

---

## Project Structure

```
focus-mate/
├── src/
│   ├── app/              # Next.js App Router pages + API routes
│   ├── components/       # React components (layout, mascot, pomodoro, costudy, ui)
│   ├── hooks/            # Custom React hooks (incl. realtime: useCoStudyRoom, useRoomChat, useGroupCall)
│   ├── lib/              # Utilities, API clients, supabase + realtime store, mascot data, planner engine
│   ├── store/            # Global state (React Context + useReducer)
│   ├── i18n/             # Internationalization config
│   └── types/            # TypeScript interfaces
├── prisma/               # Database schema
├── backend/              # Legacy .NET SignalR backend (unused, kept for reference)
├── public/               # Static assets, mascot images, locale files
└── configuration files   # next.config.mjs, tailwind.config.ts, etc.
```

---

## Mascot Images

Place mascot images in `public/mascots/`:

- `mouse.jpg` - Nhuat Nhat
- `dog.jpg` - Nang Dong
- `cat.jpg` - Truong Thanh
- `frog.jpg` - Thanh Lich
- `bear.jpg` - Nghiem Khac
- `capybara.jpg` - Tong Tai

---

## i18n

The app supports English and Simplified Chinese. Translation files are in:

- `public/locales/en.json`
- `public/locales/zh-CN.json`

---

## Troubleshooting

### Prisma connection errors
- Ensure `DATABASE_URL` and `DIRECT_URL` are correct in `.env`
- Check if your database is accessible from your network

### Build fails with ESLint/TypeScript errors
- The project is configured to ignore ESLint and TypeScript errors during build (`next.config.mjs` runs with `eslint: { ignoreDuringBuilds: true }` and `typescript: { ignoreBuildErrors: true }`)
- Run `pnpm lint` separately to check for issues

### Dev server port conflict
- If port 3000 is in use, Next.js will automatically try port 3001, 3002, etc.

---

## Authentication Note

This is a demo/MVP application:
- Passwords are stored in plaintext (not hashed)
- No JWT/session middleware - login stores user data in localStorage
- Not production-ready for real user data
- Co-Study APIs trust the `userId` sent in request bodies, and the realtime channel uses the public anon key — anyone who knows a room ID could interact with that room's chat/presence/calls. Consistent with the rest of the app's demo-grade auth posture; hardening would require Supabase Auth + RLS integration.
