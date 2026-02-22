import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { roomParticipants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { apiHandler } from '@/lib/api/handler';
import { conflict } from '@/lib/api/errors';
import { getParticipantCount, getReadyCount } from '@/lib/db/repositories/participants';
import { initializeGame } from '@/lib/game/engine';

export const POST = apiHandler(
  { auth: 'user', room: true, participant: true },
  async (ctx) => {
    if (ctx.room!.status !== 'open') {
      conflict('La sala no está abierta');
    }

    // Toggle ready state
    const newReady = !ctx.participant!.ready;
    await db
      .update(roomParticipants)
      .set({ ready: newReady })
      .where(eq(roomParticipants.id, ctx.participant!.id));

    // Check if all participants are ready
    const totalCount = await getParticipantCount(ctx.roomId!);
    const readyCount = await getReadyCount(ctx.roomId!);

    const allReady = readyCount >= totalCount && totalCount >= 2;

    // Auto-start if all ready
    if (allReady) {
      try {
        await initializeGame(ctx.roomId!);
        return NextResponse.json({
          success: true,
          ready: newReady,
          allReady: true,
          gameStarted: true,
        });
      } catch {
        // If game init fails, still return the ready toggle success
      }
    }

    return NextResponse.json({
      success: true,
      ready: newReady,
      allReady,
      readyCount,
      totalCount,
      gameStarted: false,
    });
  }
);
