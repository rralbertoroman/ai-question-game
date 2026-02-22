import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { findParticipant } from '@/lib/db/repositories/participants';
import { resolveGameState, resolveGameStateForAdmin } from '@/lib/game/engine';

export const GET = apiHandler(
  { auth: 'user', room: true },
  async (ctx) => {
    // Verify participant
    const participant = await findParticipant(ctx.roomId!, ctx.user!.id);

    if (participant) {
      const gameState = await resolveGameState(ctx.roomId!, ctx.user!.id);
      return NextResponse.json(gameState);
    }

    // Not a participant — allow admin supervision
    if (ctx.user!.role === 'admin') {
      const gameState = await resolveGameStateForAdmin(ctx.roomId!);
      return NextResponse.json(gameState);
    }

    return NextResponse.json(
      { error: 'Not a participant in this room' },
      { status: 403 }
    );
  }
);
