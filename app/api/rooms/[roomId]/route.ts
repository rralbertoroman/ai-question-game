import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rooms } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { apiHandler } from '@/lib/api/handler';
import { notFound } from '@/lib/api/errors';

export const GET = apiHandler(
  { auth: 'user', room: false },
  async (ctx) => {
    const room = await db.query.rooms.findFirst({
      where: eq(rooms.id, ctx.roomId!),
      with: {
        participants: {
          with: { user: { columns: { id: true, username: true } } },
        },
        admin: { columns: { id: true, username: true } },
        gameState: true,
      },
    });

    if (!room) {
      notFound('Room not found');
    }

    return NextResponse.json({ room });
  }
);

export const DELETE = apiHandler(
  { auth: 'admin', room: true },
  async (ctx) => {
    await db.delete(rooms).where(eq(rooms.id, ctx.roomId!));

    return NextResponse.json({ success: true });
  }
);
