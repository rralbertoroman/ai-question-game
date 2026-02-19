# LLM Quiz Game

A multiplayer quiz web application for testing knowledge about Large Language Models, AI, and related topics. Players join rooms, answer timed questions, and compete on leaderboards.

## Features

- **Authentication** — Register/login with email and password. First user becomes admin automatically.
- **Game Rooms** — Create and join multiplayer quiz rooms with configurable participant limits.
- **Quiz Questions** — Multiple-choice questions across categories (LLM Basics, Training, Architecture, Prompting, AI History) with easy/medium/hard difficulty levels.
- **Real-time Gameplay** — Timed question phases with live scoring and answer tracking.
- **Role-based Access** — Admin and candidate roles with protected routes.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM |
| Auth | Argon2 + session cookies |
| Validation | Zod 4 |
| Package Manager | pnpm |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Docker (for PostgreSQL)

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ai-question-game
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your database credentials and session secret.

4. **Start PostgreSQL**

   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**

   ```bash
   pnpm db:migrate
   ```

6. **Seed quiz questions**

   ```bash
   pnpm db:seed
   ```

7. **Start the development server**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Create production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:seed` | Seed quiz questions into database |

## Project Structure

```
app/
  api/auth/            # Auth endpoints (login, register, logout, session)
  (auth)/              # Auth pages (login, register) with shared layout
  page.tsx             # Home page (protected)
  layout.tsx           # Root layout
components/
  auth/                # LoginForm, RegisterForm
lib/
  auth/                # Session management, password hashing
  db/                  # Database connection and schema
  utils/               # Zod validation schemas
scripts/               # Database seeding and utilities
drizzle/               # Migration files
docs/                  # Implementation documentation
middleware.ts          # Route protection
```

## Database Schema

- **users** — Accounts with username, email, password hash, and role (admin/candidate)
- **sessions** — Auth sessions with 30-day expiry
- **rooms** — Game rooms with status (closed/open/playing/finished)
- **roomParticipants** — Room membership (many-to-many)
- **questions** — Multiple-choice questions with category and difficulty
- **gameStates** — Per-room game phase tracking
- **playerAnswers** — Individual answer submissions
- **scores** — Per-room player scores

## License

Private
