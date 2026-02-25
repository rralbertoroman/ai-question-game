import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { getActiveGame, submitAnswer } from '@/lib/game/engine';
import { findParticipant } from '@/lib/db/repositories/participants';
import { submitAnswerSchema } from '@/lib/utils/validation';

export const POST = apiHandler(
  { auth: 'user', schema: submitAnswerSchema },
  async (ctx) => {
    const activeGame = await getActiveGame();
    if (!activeGame) {
      return NextResponse.json(
        { error: 'No hay juego en curso' },
        { status: 404 }
      );
    }

    // Verify user is a participant
    const participant = await findParticipant(activeGame.id, ctx.user!.id);
    if (!participant) {
      return NextResponse.json(
        { error: 'No eres participante de este juego' },
        { status: 403 }
      );
    }

    const { answerIndex } = ctx.body as { answerIndex: number };

    try {
      const result = await submitAnswer(activeGame.id, ctx.user!.id, answerIndex);
      return NextResponse.json({
        success: true,
        isCorrect: result.isCorrect,
        pointsAwarded: result.pointsAwarded,
      });
    } catch (error) {
      if (error instanceof Error) {
        // Known game errors → 409 Conflict
        if (
          error.message === 'Ya respondiste esta pregunta' ||
          error.message === 'Tiempo agotado' ||
          error.message === 'No está en fase de pregunta'
        ) {
          return NextResponse.json({ error: error.message }, { status: 409 });
        }
      }
      throw error;
    }
  }
);
