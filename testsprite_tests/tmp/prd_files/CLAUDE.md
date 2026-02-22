# CLAUDE.md

## Project Overview

LLM Quiz Game — multiplayer quiz web app for testing knowledge about LLMs, AI, and related topics. Built with Next.js (App Router), PostgreSQL, and Drizzle ORM.

## Tech Stack

Next.js 16 / React 19 / TypeScript 5 (strict) / Tailwind CSS 4 / PostgreSQL 16 / Drizzle ORM / Zod 4 / pnpm

## Commands

```bash
pnpm dev                  # Dev server (localhost:3000)
pnpm build                # Production build
pnpm lint                 # ESLint
pnpm db:generate          # Generate Drizzle migrations
pnpm db:migrate           # Run migrations
pnpm db:seed              # Seed quiz questions
pnpm db:import-questions  # Import from data/questions.json
docker-compose up -d      # Start PostgreSQL
```

## Coding Conventions

- Server components by default; `'use client'` only when needed (forms, interactivity)
- Zod for all input validation (Zod 4: use `.issues` not `.errors` on ZodError)
- Drizzle query builder for all DB operations
- Dark theme UI with cyan accent colors
- Generic error messages on login (no user enumeration)
- Next.js 16 params are `Promise<{}>` — must `await params` in route handlers
- Auth uses `lib/auth/simple-session.ts` (custom session handling, no external auth library)
- `@/*` path alias maps to project root
- Scores stored as integer x10 (e.g., 3.5 pts = 35) for precision without floats

## Semantic Commits

All commits MUST use conventional commit format:

| Prefix      | Purpose                                 |
| ----------- | --------------------------------------- |
| `feat:`     | New feature                             |
| `fix:`      | Bug fix                                 |
| `refactor:` | Code restructuring (no behavior change) |
| `style:`    | Formatting, whitespace (no code change) |
| `docs:`     | Documentation only                      |
| `chore:`    | Build, config, dependencies             |
| `test:`     | Adding or updating tests                |
| `perf:`     | Performance improvement                 |

**Format:** `<type>(<optional scope>): <short description>`

Examples:

```
feat(game): add answer timer pause on tab switch
fix(auth): prevent session expiry race condition
refactor(api): extract room validation middleware
docs: update architecture reference
```

## Architecture Reference

Detailed docs — read on-demand when working in these areas:

- `docs/architecture.md` — Project structure, DB schema, game engine, SSE, answer shuffling, scoring
- `docs/api-routes.md` — All API endpoints with methods, auth, and descriptions

## Data Files

- `data/questions.json` is **gitignored** — quiz content must not be committed to avoid leaking questions to players

## Environment

- `.env.local` (see `.env.example`): `DATABASE_URL`, `POSTGRES_PASSWORD`
- Docker PostgreSQL: port 5433 (external) → 5432 (internal)
- Node via `nvm use 22`; pnpm at `$HOME/.local/share/pnpm`
