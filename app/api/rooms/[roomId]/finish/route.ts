import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rooms, gameStates } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/simple-session';
import { eq } from 'drizzle-orm';

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

    if (room.status !== 'playing') {
      return NextResponse.json(
        { error: 'Game is not in progress' },
        { status: 409 }
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .update(gameStates)
        .set({ phase: 'finished', updatedAt: new Date() })
        .where(eq(gameStates.roomId, roomId));

      await tx
        .update(rooms)
        .set({ status: 'finished' })
        .where(eq(rooms.id, roomId));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Finish game error:', error);
    return NextResponse.json(
      { error: 'Failed to finish game' },
      { status: 500 }
    );
  }
}
