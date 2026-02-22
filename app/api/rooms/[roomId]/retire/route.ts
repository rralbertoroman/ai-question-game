import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { roomParticipants } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { apiHandler } from '@/lib/api/handler';
import { conflict, notFound } from '@/lib/api/errors';

export const POST = apiHandler(
  { auth: 'user', room: true },
  async (ctx) => {
    if (ctx.room!.status !== 'open') {
      conflict('Cannot leave a room that is not open');
    }

    const deleted = await db
      .delete(roomParticipants)
      .where(
        and(
          eq(roomParticipants.roomId, ctx.roomId!),
          eq(roomParticipants.userId, ctx.user!.id)
        )
      )
      .returning();

    if (deleted.length === 0) {
      notFound('Not a participant in this room');
    }

    return NextResponse.json({ success: true });
  }
);
