import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rooms, roomParticipants } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/simple-session';
import { eq, and } from 'drizzle-orm';

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
        { error: 'Cannot leave a room that is not open' },
        { status: 409 }
      );
    }

    const deleted = await db
      .delete(roomParticipants)
      .where(
        and(
          eq(roomParticipants.roomId, roomId),
          eq(roomParticipants.userId, user.id)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Not a participant in this room' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Retire from room error:', error);
    return NextResponse.json(
      { error: 'Failed to leave room' },
      { status: 500 }
    );
  }
}
