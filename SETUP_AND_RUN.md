# FocusMate - Setup & Run Guide

## Prerequisites

- **Node.js** >= 18
- **pnpm** 8.6+
- **.NET SDK** 10 (optional, for SignalR co-study backend)
- **PostgreSQL** database (Supabase recommended)

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

# Analytics (optional)
NEXT_PUBLIC_ENTER_APP_ID=""
NEXT_PUBLIC_ENTER_WRITE_KEY=""
```

> **Tip**: Get your `DATABASE_URL` and `DIRECT_URL` from Supabase dashboard > Settings > Database.

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

## 6. Run the .NET Backend (Optional)

The SignalR backend is used for real-time co-study rooms:

```bash
cd backend/FocusMate.Backend
dotnet run
```

Backend runs at **http://localhost:5006**

> **Note**: The frontend currently uses REST polling for co-study rooms instead of SignalR. The .NET backend is optional for basic functionality.

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
│   ├── components/       # React components (layout, mascot, pomodoro, ui)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities, API client, mascot data, planner engine
│   ├── store/            # Global state (React Context + useReducer)
│   ├── i18n/             # Internationalization config
│   └── types/            # TypeScript interfaces
├── prisma/               # Database schema
├── backend/              # .NET SignalR backend (optional)
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
