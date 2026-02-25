import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { getGameResults } from '@/lib/game/engine';

export const GET = apiHandler({ auth: 'user' }, async (ctx) => {
  // Extract gameId from URL since handler no longer does room extraction
  const url = new URL(ctx.request!.url);
  const segments = url.pathname.split('/');
  // URL: /api/game/[gameId]/results → segments = ['', 'api', 'game', '<gameId>', 'results']
  const gameId = parseInt(segments[3], 10);

  if (isNaN(gameId)) {
    return NextResponse.json({ error: 'ID de juego inválido' }, { status: 400 });
  }

  try {
    const results = await getGameResults(gameId);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: 'Juego no encontrado' }, { status: 404 });
  }
});
