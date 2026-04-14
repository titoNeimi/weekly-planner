# Weekly Planner

A focused, week-at-a-glance task manager built with Next.js 16, React 19, and Supabase. Plan your week in a clean 7-column grid, organize tasks with color-coded categories, and switch to a month overview when you need the bigger picture.

## Features

- **Week view** — 7-column desktop grid; single-day swipe navigation on mobile
- **Month view** — calendar overview of the current month
- **Task management** — create, edit, complete, and delete tasks with optional notes and time scheduling
- **Categories** — color-coded labels with inline create, rename, and delete (right-click context menu)
- **Category filter** — filter the week grid by category with a single click
- **Authentication** — Supabase SSR auth; all data is scoped per user
- **Responsive** — fully usable on phones and desktops

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Lucide React |
| Database | PostgreSQL via Prisma 7 + `@prisma/adapter-pg` |
| Auth | Supabase SSR (`@supabase/ssr`) |
| Language | TypeScript |

## Getting Started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (e.g. [Supabase](https://supabase.com))

### 1. Clone and install

```bash
git clone <repo-url>
cd weekly-planner
npm install
```

### 2. Configure environment variables

Create a `.env` file at the project root:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Apply the database schema

```bash
npx prisma db push
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login` until you authenticate via Supabase.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── task/          # CRUD endpoints for tasks
│   │   └── category/      # CRUD endpoints for categories
│   ├── dashboard/         # Week/month views and task modals
│   └── login/             # Auth page
├── components/            # Shared UI components (topbar, avatar, etc.)
├── context/               # UserContext provider
└── lib/                   # Prisma client, Supabase helpers, category colors
prisma/
└── schema.prisma          # Task, Category, and Team models
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma client and build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
