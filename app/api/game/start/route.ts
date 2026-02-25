import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { db } from '@/lib/db';
import { games, users } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { initializeGame } from '@/lib/game/engine';
import { GAME_CONFIG } from '@/lib/game/config';
import { conflict, badRequest } from '@/lib/api/errors';

export const POST = apiHandler({ auth: 'admin' }, async () => {
  // Check no game is already playing
  const activeGame = await db.query.games.findFirst({
    where: eq(games.status, 'playing'),
  });
  if (activeGame) throw conflict('Ya hay un juego en curso');

  // Get online candidates (lastActiveAt within HEARTBEAT_TIMEOUT_SECONDS)
  const cutoff = new Date(Date.now() - GAME_CONFIG.HEARTBEAT_TIMEOUT_SECONDS * 1000);
  const onlineCandidates = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, 'candidate'), gt(users.lastActiveAt, cutoff)));

  if (onlineCandidates.length < 2) throw badRequest('Se necesitan al menos 2 candidatos en línea');

  const playerIds = onlineCandidates.map(c => c.id);
  const gameId = await initializeGame(playerIds);

  return NextResponse.json({ success: true, gameId });
});
