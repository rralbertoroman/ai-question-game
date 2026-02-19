import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rooms } from '@/lib/db/schema';
import { requireAuth, requireAdmin } from '@/lib/auth/simple-session';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    await requireAuth();
    const { roomId } = await params;

    const room = await db.query.rooms.findFirst({
      where: eq(rooms.id, roomId),
      with: {
        participants: {
          with: { user: { columns: { id: true, username: true } } },
        },
        admin: { columns: { id: true, username: true } },
        gameState: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get room error:', error);
    return NextResponse.json({ error: 'Failed to get room' }, { status: 500 });
  }
}

export async function DELETE(
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

    await db.delete(rooms).where(eq(rooms.id, roomId));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Delete room error:', error);
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}
