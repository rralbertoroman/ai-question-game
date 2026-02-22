import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { conflict, badRequest } from '@/lib/api/errors';
import { initializeGame } from '@/lib/game/engine';

export const POST = apiHandler(
  { auth: 'admin', room: true },
  async (ctx) => {
    if (ctx.room!.status !== 'open') {
      conflict('Room is not open');
    }

    try {
      await initializeGame(ctx.roomId!);
    } catch (error) {
      if (error instanceof Error && error.message === 'Need at least 2 participants to start') {
        badRequest(error.message);
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  }
);
