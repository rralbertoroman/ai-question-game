# Architecture Reference

## Project Structure

```
app/                          # Next.js App Router
  api/auth/                   # Auth API routes (login, register, logout, session)
  api/rooms/                  # Room & game API routes
  api/rooms/[roomId]/         # Room-specific routes (join, ready, start, retire, finish)
  api/rooms/[roomId]/game/    # Game routes (state, answer, SSE stream, results)
  (auth)/                     # Auth pages layout group (login, register)
  rooms/[roomId]/play/        # Game play page
  rooms/[roomId]/results/     # Game results page
  rooms/[roomId]/supervise/   # Admin-only live game monitoring (read-only)
  page.tsx                    # Home page (protected, shows room list)
components/
  auth/                       # LoginForm, RegisterForm, LogoutButton, PasswordInput, PasswordRequirements, FieldError
  game/                       # GamePlay, QuestionPhase, SummaryPhase, FinishedPhase, TimerDisplay, ProgressBar, Leaderboard, ResultsView, AdminSupervision
  hooks/                      # useGameSSE (SSE streaming), usePolling (visibility-aware polling)
  icons/                      # SVG icon components (AiChip, Brain, CircuitBoard, NeuralNetwork, Eye, EyeOff)
  layout/                     # Header, Footer (with index.ts barrel)
  rooms/                      # RoomList, RoomCard, CreateRoomButton
lib/
  auth/simple-session.ts      # Session management (create, validate, delete, cookies)
  auth/password.ts            # Argon2 hashing
  db/index.ts                 # Database connection (global singleton in dev)
  db/schema.ts                # Drizzle schema (8 tables + relations)
  game/engine.ts              # Core game logic (init, submit, resolve state, results)
  game/config.ts              # Game constants
  game/types.ts               # TypeScript types (GameStateResponse discriminated union)
  game/shuffle.ts             # Deterministic answer shuffling (seeded PRNG)
  utils/validation.ts         # Zod schemas (register, login, createRoom, submitAnswer)
data/questions.json           # Quiz questions for import
scripts/
  seed-questions.ts           # Seed hardcoded questions to DB
  import-questions.ts         # Import questions from JSON file
  test-db-connection.ts       # Verify DB connectivity
drizzle/                      # Migration SQL files
middleware.ts                 # Route protection (cookie-presence check only)
```

## Database Schema

Schema defined in `lib/db/schema.ts`. All 8 tables:

### users
| Column       | Type         | Notes                                    |
|-------------|--------------|------------------------------------------|
| id          | serial PK    |                                          |
| username    | varchar(50)  | unique, indexed                          |
| email       | varchar(255) | unique, indexed                          |
| passwordHash| text         | Argon2                                   |
| role        | varchar(20)  | `'candidate'` (default) or `'admin'`     |
| createdAt   | timestamp    |                                          |

First registered user automatically becomes admin.

### sessions
| Column    | Type         | Notes                      |
|-----------|--------------|----------------------------|
| id        | text PK      | nanoid(40)                 |
| userId    | integer FK   | → users.id, cascade delete |
| expiresAt | timestamptz  | 30-day expiry              |

### rooms
| Column           | Type         | Notes                                        |
|-----------------|--------------|----------------------------------------------|
| id              | varchar(21) PK | nanoid                                     |
| name            | varchar(100) |                                              |
| adminId         | integer FK   | → users.id                                   |
| participantLimit| integer      | default 6                                    |
| status          | varchar(20)  | `closed` → `open` → `playing` → `finished`  |
| createdAt       | timestamp    |                                              |

### roomParticipants
| Column   | Type         | Notes                          |
|----------|--------------|--------------------------------|
| id       | serial PK    |                                |
| roomId   | varchar(21) FK | → rooms.id                   |
| userId   | integer FK   | → users.id                     |
| ready    | boolean      | default false (vote-to-start)  |
| joinedAt | timestamp    |                                |

Composite index on (roomId, userId).

### questions
| Column       | Type         | Notes                         |
|-------------|--------------|-------------------------------|
| id          | serial PK    |                               |
| questionText| text         |                               |
| answers     | jsonb        | Array of 4 strings            |
| correctIndex| integer      | 0–3                           |
| difficulty  | varchar(20)  | `easy` / `medium` / `hard`    |
| category    | varchar(50)  | indexed                       |
| createdAt   | timestamp    |                               |

Categories: Architecture, AI History, Training, Prompting, LLM Basics.

### gameStates
| Column              | Type         | Notes                                        |
|--------------------|--------------|----------------------------------------------|
| id                 | serial PK    |                                              |
| roomId             | varchar(21) FK | unique, → rooms.id                         |
| currentQuestionIndex| integer     | default 0                                    |
| questionOrder      | jsonb        | Array of question IDs (shuffled selection)   |
| questionStartTime  | timestamptz  | nullable, set when phase starts              |
| phase              | varchar(20)  | `waiting` → `question` → `summary` → `finished` |
| updatedAt          | timestamp    |                                              |

### playerAnswers
| Column      | Type         | Notes                              |
|------------|--------------|-------------------------------------|
| id         | serial PK    |                                     |
| roomId     | varchar(21) FK | → rooms.id                        |
| userId     | integer FK   | → users.id                          |
| questionId | integer FK   | → questions.id                      |
| answerIndex| integer      | nullable (null = timed out/passed)  |
| isCorrect  | boolean      | default false                       |
| timestamp  | timestamp    |                                     |

`answerIndex` is stored in **original DB space** (not shuffled).

### scores
| Column    | Type         | Notes                              |
|-----------|--------------|-------------------------------------|
| id        | serial PK    |                                     |
| roomId    | varchar(21) FK | → rooms.id                        |
| userId    | integer FK   | → users.id                          |
| score     | integer      | stored as ×10 (3.5 pts = 35)       |
| updatedAt | timestamp    |                                     |

## Game Engine

Core logic in `lib/game/engine.ts`. Uses **lazy state resolution** — transitions happen on read, not on a timer.

### Game Flow

```
Create room → Players join → Players vote ready → Admin starts → Gameplay → Results
```

### Phase State Machine

```
waiting → question ⇄ summary → finished
              ↑          |
              └──────────┘  (loops per question)
```

- **question phase**: Players see a question, have 20s to answer. Transitions to summary when all answer OR timer expires.
- **summary phase**: Shows correct answer + who got it right for 8s. Transitions to next question or finished.
- **finished phase**: Game over. Room status set to `finished`.

### Lazy State Resolution

`resolveGameState()` is called on every SSE poll/API request. It:
1. Calls `handleTimeExpiry()` — if question timer expired, inserts null answers for non-responders, transitions to summary
2. Calls `handleSummaryExpiry()` — if summary timer expired, advances to next question or finished
3. Builds and returns the current `GameStateResponse`

No background timers — all transitions are triggered lazily.

### Scoring

```
Base points:  10 × 10 = 100 (stored value)
Speed bonus:  up to 5 × 10 = 50 (stored value), scales linearly with remaining time
Total range:  0–150 per question (stored), displayed as 0–15.0
```

Formula: `base + round(maxBonus × (1 - elapsed/timeLimit))`

### Game Config (`lib/game/config.ts`)

| Constant                  | Value  |
|--------------------------|--------|
| QUESTIONS_PER_GAME       | 10     |
| QUESTION_TIME_LIMIT_SECONDS | 20  |
| SUMMARY_DISPLAY_SECONDS  | 8      |
| SSE_POLL_INTERVAL_MS     | 2000   |
| ROOM_LIST_POLL_INTERVAL_MS | 10000 |
| POINTS_CORRECT           | 10     |
| POINTS_SPEED_BONUS_MAX   | 5      |

## Answer Shuffling

Deterministic per-room shuffling ensures all players in a room see the same randomized answer order. Defined in `lib/game/shuffle.ts`.

### Algorithm

1. **Seed**: `djb2("questionId:roomId")` → unsigned 32-bit integer
2. **PRNG**: Mulberry32 seeded with the hash
3. **Shuffle**: Fisher-Yates on `[0, 1, 2, 3]` using the PRNG → permutation array

### Data Flow

```
DB stores:     answers = ["A", "B", "C", "D"], correctIndex = 1 (B)
Permutation:   [2, 0, 3, 1]  (for this question+room)
Display order: ["C", "A", "D", "B"]  (shuffled)

Player picks index 3 (display) → shuffledToOriginal(3, perm) → original index 1 → stored in DB
Engine serves:  originalToShuffled(storedIndex, perm) → display index for client
```

Key functions:
- `getShufflePermutation(questionId, roomId)` → `number[]`
- `shuffleAnswers(answers, permutation)` → reordered answers
- `originalToShuffled(dbIndex, permutation)` → display index
- `shuffledToOriginal(displayIndex, permutation)` → DB index

## Real-Time Updates (SSE)

SSE endpoint: `GET /api/rooms/[roomId]/game/stream`

- Server polls DB every `SSE_POLL_INTERVAL_MS` (2s)
- Compares JSON-stringified state; only pushes on change
- Client uses `useGameSSE` hook (`components/hooks/useGameSSE.ts`)
- Message format: `{ type: 'state', data: GameStateResponse }` or `{ type: 'error', error: string }`
- Optimistic UI: `QuestionPhase` applies answer selection styling immediately before server confirmation

## Auth System

Custom session-based auth in `lib/auth/simple-session.ts`:

- **Password hashing**: Argon2 (`lib/auth/password.ts`)
- **Sessions**: nanoid(40) IDs, HTTP-only cookies, 30-day expiry
- **Middleware** (`middleware.ts`): Cookie-presence check only for route protection; full DB validation via `validateRequest()`
- **Request caching**: `validateRequest()` is wrapped in React `cache()` to avoid duplicate DB calls per request
- **Auth helpers**: `requireAuth()` (throws if not logged in), `requireAdmin()` (throws if not admin)

## Admin Supervision

Read-only game monitoring at `/rooms/[roomId]/supervise`:
- Uses `resolveGameStateForAdmin()` which doesn't require a userId
- Shows question, answers, timer, and live leaderboard
- Admin cannot answer questions through this view
