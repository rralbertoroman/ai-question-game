import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { findParticipant } from '@/lib/db/repositories/participants';
import { getGameResults } from '@/lib/game/engine';

export const GET = apiHandler(
  { auth: 'user', room: true },
  async (ctx) => {
    // Verify participant or admin
    const participant = await findParticipant(ctx.roomId!, ctx.user!.id);

    if (!participant && ctx.user!.role !== 'admin') {
      return NextResponse.json(
        { error: 'Not a participant in this room' },
        { status: 403 }
      );
    }

    const results = await getGameResults(ctx.roomId!);

    return NextResponse.json(results);
  }
);
