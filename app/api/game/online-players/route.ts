import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { getOnlinePlayers, getActiveGame } from '@/lib/game/engine';

export const GET = apiHandler(
  { auth: 'admin' },
  async () => {
    const players = await getOnlinePlayers();
    const activeGame = await getActiveGame();

    return NextResponse.json({
      players,
      count: players.length,
      activeGameId: activeGame?.id ?? null,
    });
  }
);
