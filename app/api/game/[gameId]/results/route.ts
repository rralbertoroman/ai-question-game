import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { apiHandler } from '@/lib/api/handler';
import { getGameResults, getLeaderboard } from '@/lib/game/engine';

export const GET = apiHandler(
  { auth: 'user' },
  async (ctx) => {
    // Extract gameId from route params
    const params = (ctx as Record<string, unknown>).params as { gameId: string } | undefined;
    if (!params?.gameId) {
      return NextResponse.json({ error: 'Game ID requerido' }, { status: 400 });
    }

    const gameId = parseInt(params.gameId, 10);
    if (isNaN(gameId)) {
      return NextResponse.json({ error: 'Game ID inválido' }, { status: 400 });
    }

    // Verify game exists
    const game = await db.query.games.findFirst({
      where: eq(games.id, gameId),
    });

    if (!game) {
      return NextResponse.json({ error: 'Juego no encontrado' }, { status: 404 });
    }

    const results = await getGameResults(gameId);
    const leaderboard = await getLeaderboard(gameId);

    return NextResponse.json({ ...results, leaderboard });
  }
);
