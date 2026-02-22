import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { rooms } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, requireAdmin, type SessionUser } from '@/lib/auth/simple-session';
import { findParticipant } from '@/lib/db/repositories/participants';
import { ApiError } from '@/lib/api/errors';

type RoomRow = typeof rooms.$inferSelect;
type ParticipantRow = NonNullable<Awaited<ReturnType<typeof findParticipant>>>;

// Context built by the handler based on options
export type HandlerContext<
  TAuth extends 'none' | 'user' | 'admin' = 'none',
  TRoom extends boolean = false,
  TParticipant extends boolean = false,
  TBody = unknown,
> = {
  request: NextRequest;
} & (TAuth extends 'user' | 'admin' ? { user: SessionUser } : { user?: undefined })
  & (TRoom extends true ? { roomId: string; room: RoomRow } : { roomId?: undefined; room?: undefined })
  & (TParticipant extends true ? { participant: ParticipantRow } : { participant?: undefined })
  & (TBody extends unknown ? { body?: TBody } : { body: TBody });

// Simplified context used in practice (avoids complex conditional types for the handler fn)
export interface ApiContext {
  request: NextRequest;
  user: SessionUser;
  roomId: string;
  room: RoomRow;
  participant: ParticipantRow;
  body: unknown;
}

export type HandlerOptions = {
  auth: 'none' | 'user' | 'admin';
  room?: boolean;
  participant?: boolean;
  schema?: z.ZodType;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteParams = { params: Promise<any> };

type HandlerFn = (ctx: Partial<ApiContext>) => Promise<NextResponse | Response>;

export function apiHandler(
  options: HandlerOptions,
  handler: HandlerFn
): (request: NextRequest, props?: RouteParams) => Promise<NextResponse | Response> {
  return async (request: NextRequest, props?: RouteParams) => {
    try {
      const ctx: Partial<ApiContext> = { request };

      // Auth
      if (options.auth === 'admin') {
        ctx.user = await requireAdmin();
      } else if (options.auth === 'user') {
        ctx.user = await requireAuth();
      }

      // Room lookup
      if (options.room && props) {
        const { roomId } = await props.params;
        ctx.roomId = roomId;

        const room = await db.query.rooms.findFirst({
          where: eq(rooms.id, roomId),
        });

        if (!room) {
          return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        ctx.room = room;
      } else if (props) {
        // Even without room: true, extract roomId if params exist
        const { roomId } = await props.params;
        ctx.roomId = roomId;
      }

      // Participant check
      if (options.participant && ctx.roomId && ctx.user) {
        const participant = await findParticipant(ctx.roomId, ctx.user.id);

        if (!participant) {
          return NextResponse.json(
            { error: 'Not a participant in this room' },
            { status: 403 }
          );
        }

        ctx.participant = participant;
      }

      // Body parsing + validation
      if (options.schema) {
        const body = await request.json();
        ctx.body = options.schema.parse(body);
      }

      return await handler(ctx);
    } catch (error) {
      // ApiError (domain errors)
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }

      // Zod validation errors
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.issues },
          { status: 400 }
        );
      }

      // Auth errors thrown by requireAuth / requireAdmin
      if (error instanceof Error) {
        if (error.message === 'Unauthorized') {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message === 'Forbidden: Admin access required') {
          return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          );
        }
      }

      // Fallback
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
