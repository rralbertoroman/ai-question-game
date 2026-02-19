import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { rooms } from '@/lib/db/schema';
import { requireAuth, requireAdmin } from '@/lib/auth/simple-session';
import { createRoomSchema } from '@/lib/utils/validation';
import { ne } from 'drizzle-orm';
import { z } from 'zod';

export async function GET() {
  try {
    const user = await requireAuth();

    const allRooms = await db.query.rooms.findMany({
      where: ne(rooms.status, 'finished'),
      with: {
        participants: {
          with: { user: { columns: { id: true, username: true } } },
        },
        admin: { columns: { id: true, username: true } },
      },
      orderBy: (rooms, { desc }) => [desc(rooms.createdAt)],
    });

    return NextResponse.json({ rooms: allRooms, currentUserId: user.id });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('List rooms error:', error);
    return NextResponse.json({ error: 'Failed to list rooms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const { name, participantLimit } = createRoomSchema.parse(body);

    const roomId = nanoid();
    const [newRoom] = await db
      .insert(rooms)
      .values({
        id: roomId,
        name,
        adminId: user.id,
        participantLimit,
        status: 'open',
      })
      .returning();

    return NextResponse.json({ success: true, room: newRoom }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Create room error:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
