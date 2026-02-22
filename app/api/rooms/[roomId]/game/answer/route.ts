import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { conflict } from '@/lib/api/errors';
import { submitAnswer } from '@/lib/game/engine';
import { submitAnswerSchema } from '@/lib/utils/validation';

export const POST = apiHandler(
  { auth: 'user', room: true, participant: true, schema: submitAnswerSchema },
  async (ctx) => {
    const { answerIndex } = ctx.body as { answerIndex: number };

    try {
      const result = await submitAnswer(ctx.roomId!, ctx.user!.id, answerIndex);

      return NextResponse.json({
        success: true,
        isCorrect: result.isCorrect,
        pointsAwarded: result.pointsAwarded,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'Ya respondiste esta pregunta' ||
          error.message === 'Tiempo agotado' ||
          error.message === 'No está en fase de pregunta'
        ) {
          conflict(error.message);
        }
      }
      throw error;
    }
  }
);
