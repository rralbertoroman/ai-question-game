import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { roomParticipants } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/simple-session';
import { eq, and } from 'drizzle-orm';
import { submitAnswer } from '@/lib/game/engine';
import { submitAnswerSchema } from '@/lib/utils/validation';
import { z } from 'zod';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await requireAuth();
    const { roomId } = await params;

    // Verify participant
    const participant = await db.query.roomParticipants.findFirst({
      where: and(
        eq(roomParticipants.roomId, roomId),
        eq(roomParticipants.userId, user.id)
      ),
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Not a participant in this room' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { answerIndex } = submitAnswerSchema.parse(body);

    const result = await submitAnswer(roomId, user.id, answerIndex);

    return NextResponse.json({
      success: true,
      isCorrect: result.isCorrect,
      pointsAwarded: result.pointsAwarded,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid answer', details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (
        error.message === 'Already answered this question' ||
        error.message === 'Time expired' ||
        error.message === 'Not in question phase'
      ) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }
    console.error('Submit answer error:', error);
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    );
  }
}
