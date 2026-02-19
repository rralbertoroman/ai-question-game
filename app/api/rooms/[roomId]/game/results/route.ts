import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { roomParticipants } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/simple-session';
import { eq, and } from 'drizzle-orm';
import { getGameResults } from '@/lib/game/engine';

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

    if (!participant) {
      return NextResponse.json(
        { error: 'Not a participant in this room' },
        { status: 403 }
      );
    }

    const results = await getGameResults(roomId);

    return NextResponse.json(results);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Game not found') {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    console.error('Get results error:', error);
    return NextResponse.json(
      { error: 'Failed to get results' },
      { status: 500 }
    );
  }
}
