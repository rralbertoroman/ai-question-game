# API Routes Reference

All routes are under `app/api/`. Auth level indicates the minimum required access.

## Auth Routes

| Method | Path                  | Auth     | Description                                      |
|--------|-----------------------|----------|--------------------------------------------------|
| POST   | `/api/auth/register`  | Public   | Create account (first user → admin, rest → candidate) |
| POST   | `/api/auth/login`     | Public   | Authenticate with email/password, create session |
| POST   | `/api/auth/logout`    | User     | Delete session, clear cookie                     |
| GET    | `/api/auth/session`   | User     | Return current user and session details          |

## Room Routes

| Method | Path                           | Auth  | Description                                          |
|--------|--------------------------------|-------|------------------------------------------------------|
| GET    | `/api/rooms`                   | User  | List non-finished rooms; admin also gets finished rooms |
| POST   | `/api/rooms`                   | Admin | Create new room                                      |
| GET    | `/api/rooms/[roomId]`          | User  | Get room details with participants and game state    |
| DELETE | `/api/rooms/[roomId]`          | Admin | Delete room                                          |
| POST   | `/api/rooms/[roomId]/join`     | User  | Join open room (checks capacity, no duplicates)      |
| POST   | `/api/rooms/[roomId]/ready`    | User  | Toggle ready status; auto-starts if all ready (min 2)|
| POST   | `/api/rooms/[roomId]/start`    | Admin | Manually start game (requires min 2 participants)    |
| POST   | `/api/rooms/[roomId]/retire`   | User  | Leave room (only when room is open, not mid-game)    |
| POST   | `/api/rooms/[roomId]/finish`   | Admin | Force-finish in-progress game                        |

## Game Routes

| Method | Path                                   | Auth | Description                                          |
|--------|----------------------------------------|------|------------------------------------------------------|
| GET    | `/api/rooms/[roomId]/game`             | User | Get current game state (player or admin supervision) |
| POST   | `/api/rooms/[roomId]/game/answer`      | User | Submit answer (validates phase, timing, dedup)       |
| GET    | `/api/rooms/[roomId]/game/stream`      | User | SSE stream for real-time game state updates          |
| GET    | `/api/rooms/[roomId]/game/results`     | User | Get final game results (leaderboard + per-question)  |

## Route Pattern

All routes follow a consistent pattern (see `app/api/rooms/route.ts` as canonical example):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireAdmin } from '@/lib/auth/simple-session';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();  // or requireAdmin()
    const body = await request.json();
    const validated = someSchema.parse(body);

    // ... DB operations with Drizzle ...

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
```

## Dynamic Route Params

Next.js 16 params are `Promise<{}>` — must be awaited:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  // ...
}
```
