import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rooms } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/simple-session';
import { eq } from 'drizzle-orm';
import { initializeGame } from '@/lib/game/engine';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    await requireAdmin();
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

    await initializeGame(roomId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Need at least 2 participants to start') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Start game error:', error);
    return NextResponse.json(
      { error: 'Failed to start game' },
      { status: 500 }
    );
  }
}
