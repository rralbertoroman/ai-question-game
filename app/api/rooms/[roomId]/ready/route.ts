import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rooms, roomParticipants } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/simple-session';
import { eq, and, count } from 'drizzle-orm';
import { initializeGame } from '@/lib/game/engine';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await requireAuth();
    const { roomId } = await params;

    const room = await db.query.rooms.findFirst({
      where: eq(rooms.id, roomId),
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.status !== 'open') {
      return NextResponse.json(
        { error: 'Room is not open' },
        { status: 409 }
      );
    }

    // Find participant record
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

    // Toggle ready state
    const newReady = !participant.ready;
    await db
      .update(roomParticipants)
      .set({ ready: newReady })
      .where(eq(roomParticipants.id, participant.id));

    // Check if all participants are ready
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(roomParticipants)
      .where(eq(roomParticipants.roomId, roomId));

    const [{ count: readyCount }] = await db
      .select({ count: count() })
      .from(roomParticipants)
      .where(
        and(
          eq(roomParticipants.roomId, roomId),
          eq(roomParticipants.ready, true)
        )
      );

    const allReady = readyCount >= totalCount && totalCount >= 2;

    // Auto-start if all ready
    if (allReady) {
      try {
        await initializeGame(roomId);
        return NextResponse.json({
          success: true,
          ready: newReady,
          allReady: true,
          gameStarted: true,
        });
      } catch {
        // If game init fails, still return the ready toggle success
      }
    }

    return NextResponse.json({
      success: true,
      ready: newReady,
      allReady,
      readyCount,
      totalCount,
      gameStarted: false,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Toggle ready error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle ready state' },
      { status: 500 }
    );
  }
}
