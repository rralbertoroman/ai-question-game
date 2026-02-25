import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { db } from '@/lib/db';
import { games, gameParticipants } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { submitAnswer } from '@/lib/game/engine';
import { submitAnswerSchema } from '@/lib/utils/validation';
import { notFound, conflict } from '@/lib/api/errors';

export const POST = apiHandler({ auth: 'user', schema: submitAnswerSchema }, async (ctx) => {
  const user = ctx.user!;
  const { answerIndex } = ctx.body as { answerIndex: number };

  const activeGame = await db.query.games.findFirst({
    where: eq(games.status, 'playing'),
  });
  if (!activeGame) throw notFound('No hay juego en curso');

  const participant = await db.query.gameParticipants.findFirst({
    where: and(eq(gameParticipants.gameId, activeGame.id), eq(gameParticipants.userId, user.id)),
  });
  if (!participant) throw conflict('No eres participante de este juego');

  try {
    const result = await submitAnswer(activeGame.id, user.id, answerIndex);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof Error) {
      throw conflict(error.message);
    }
    throw error;
  }
});
