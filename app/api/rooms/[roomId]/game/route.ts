import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { roomParticipants } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/simple-session';
import { eq, and } from 'drizzle-orm';
import { resolveGameState, resolveGameStateForAdmin } from '@/lib/game/engine';

export async function GET(
  _request: NextRequest,
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

    if (participant) {
      const gameState = await resolveGameState(roomId, user.id);
      return NextResponse.json(gameState);
    }

    // Not a participant — allow admin supervision
    if (user.role === 'admin') {
      const gameState = await resolveGameStateForAdmin(roomId);
      return NextResponse.json(gameState);
    }

    return NextResponse.json(
      { error: 'Not a participant in this room' },
      { status: 403 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Game not found') {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    console.error('Get game state error:', error);
    return NextResponse.json(
      { error: 'Failed to get game state' },
      { status: 500 }
    );
  }
}
