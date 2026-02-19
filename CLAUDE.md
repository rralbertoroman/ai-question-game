# CLAUDE.md

## Project Overview

LLM Quiz Game — a multiplayer quiz web app for testing knowledge about Large Language Models, AI, and related topics. Built with Next.js (App Router), PostgreSQL, and Drizzle ORM. Features user authentication, game rooms, real-time gameplay, and scoring.

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19)
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS 4
- **Database:** PostgreSQL 16 (Docker)
- **ORM:** Drizzle ORM
- **Auth:** Custom session-based auth (Argon2 password hashing, HTTP-only cookies, 30-day sessions)
- **Validation:** Zod 4
- **Package Manager:** pnpm

## Commands

```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Production build
pnpm start            # Production server
pnpm lint             # ESLint
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run database migrations
pnpm db:seed          # Seed quiz questions
docker-compose up -d  # Start PostgreSQL
```

## Project Structure

```
app/                      # Next.js App Router
  api/auth/               # Auth API routes (login, register, logout, session)
  (auth)/                 # Auth pages layout group (login, register)
  page.tsx                # Home page (protected)
components/auth/          # LoginForm, RegisterForm (client components)
lib/
  auth/                   # Auth logic (session.ts, password.ts, lucia.ts)
  db/                     # Database (index.ts = connection, schema.ts = tables)
  utils/validation.ts     # Zod schemas for registration/login
scripts/                  # seed-questions.ts, test-db-connection.ts
drizzle/                  # Migration files
middleware.ts             # Route protection (cookie check)
docs/                     # Phase implementation docs
```

## Database

Schema defined in `lib/db/schema.ts`. Tables: users, sessions, rooms, roomParticipants, questions, gameStates, playerAnswers, scores.

- First registered user automatically becomes admin (role: 'admin'), subsequent users get role: 'candidate'
- Sessions use nanoid IDs with 30-day expiry
- Questions have difficulty (easy/medium/hard) and category fields
- Game state tracks phases: waiting → question → summary → finished

## Key Architecture Decisions

- **Session management:** Direct implementation in `lib/auth/session.ts` (not Lucia — Lucia config exists but `session.ts` handles sessions directly with Drizzle)
- **Middleware:** Cookie-presence check only; full DB validation happens server-side via `validateRequest()`
- **Path aliases:** `@/*` maps to project root
- **DB connection:** Global singleton pattern in dev to prevent connection exhaustion
- **Docker PostgreSQL:** Runs on port 5433 externally (5432 internally)

## Environment Variables

Defined in `.env.local` (see `.env.example` for template):
- `DATABASE_URL` — PostgreSQL connection string
- `POSTGRES_PASSWORD` — Database password
- `SESSION_SECRET` — Session signing secret

## Coding Conventions

- Server components by default; `'use client'` only when needed (forms, interactivity)
- API routes in `app/api/` using Next.js route handlers
- Zod for all input validation
- Drizzle query builder for database operations
- Dark theme UI with cyan accent colors
- Error responses use generic messages on login (no user enumeration)
