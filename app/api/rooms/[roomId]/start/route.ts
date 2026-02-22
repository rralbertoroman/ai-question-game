import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { conflict, badRequest } from '@/lib/api/errors';
import { initializeGame } from '@/lib/game/engine';

export const POST = apiHandler(
  { auth: 'admin', room: true },
  async (ctx) => {
    if (ctx.room!.status !== 'open') {
      conflict('La sala no está abierta');
    }

    try {
      await initializeGame(ctx.roomId!);
    } catch (error) {
      if (error instanceof Error && error.message === 'Se necesitan al menos 2 participantes para iniciar') {
        badRequest(error.message);
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  }
);
