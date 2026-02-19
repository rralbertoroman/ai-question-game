import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rooms, roomParticipants } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/simple-session';
import { eq, and, count } from 'drizzle-orm';

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
        { error: 'Room is not open for joining' },
        { status: 409 }
      );
    }

    // Check if already a participant
    const existing = await db.query.roomParticipants.findFirst({
      where: and(
        eq(roomParticipants.roomId, roomId),
        eq(roomParticipants.userId, user.id)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Already joined this room' },
        { status: 409 }
      );
    }

    // Check participant limit
    const [{ count: currentCount }] = await db
      .select({ count: count() })
      .from(roomParticipants)
      .where(eq(roomParticipants.roomId, roomId));

    if (currentCount >= room.participantLimit) {
      return NextResponse.json({ error: 'Room is full' }, { status: 409 });
    }

    await db.insert(roomParticipants).values({
      roomId,
      userId: user.id,
      ready: false,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Join room error:', error);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
