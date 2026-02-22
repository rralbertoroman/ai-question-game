import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rooms, gameStates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { apiHandler } from '@/lib/api/handler';
import { conflict } from '@/lib/api/errors';

export const POST = apiHandler(
  { auth: 'admin', room: true },
  async (ctx) => {
    if (ctx.room!.status !== 'playing') {
      conflict('El juego no está en curso');
    }

    await db.transaction(async (tx) => {
      await tx
        .update(gameStates)
        .set({ phase: 'finished', updatedAt: new Date() })
        .where(eq(gameStates.roomId, ctx.roomId!));

      await tx
        .update(rooms)
        .set({ status: 'finished' })
        .where(eq(rooms.id, ctx.roomId!));
    });

    return NextResponse.json({ success: true });
  }
);
