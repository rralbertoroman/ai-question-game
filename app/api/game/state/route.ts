import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { getActiveGame, resolveGameState } from '@/lib/game/engine';
import type { IdleState } from '@/lib/game/types';

export const GET = apiHandler(
  { auth: 'user' },
  async (ctx) => {
    const activeGame = await getActiveGame();

    if (!activeGame) {
      const idle: IdleState = { phase: 'idle' };
      return NextResponse.json(idle);
    }

    const state = await resolveGameState(activeGame.id, ctx.user!.id);
    return NextResponse.json(state);
  }
);
