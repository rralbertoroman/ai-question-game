import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { db } from '@/lib/db';
import { games, gameStates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from '@/lib/api/errors';

export const POST = apiHandler({ auth: 'admin' }, async () => {
  const activeGame = await db.query.games.findFirst({
    where: eq(games.status, 'playing'),
  });
  if (!activeGame) throw notFound('No hay juego en curso');

  await db.transaction(async (tx) => {
    await tx.update(gameStates).set({ phase: 'finished', updatedAt: new Date() }).where(eq(gameStates.gameId, activeGame.id));
    await tx.update(games).set({ status: 'finished' }).where(eq(games.id, activeGame.id));
  });

  return NextResponse.json({ success: true });
});
