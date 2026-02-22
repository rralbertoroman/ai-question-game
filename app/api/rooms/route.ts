import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { rooms } from '@/lib/db/schema';
import { ne, eq } from 'drizzle-orm';
import { apiHandler } from '@/lib/api/handler';
import { createRoomSchema } from '@/lib/utils/validation';

export const GET = apiHandler(
  { auth: 'user' },
  async (ctx) => {
    const user = ctx.user!;

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

    let finishedRooms: typeof allRooms = [];
    if (user.role === 'admin') {
      finishedRooms = await db.query.rooms.findMany({
        where: eq(rooms.status, 'finished'),
        with: {
          participants: {
            with: { user: { columns: { id: true, username: true } } },
          },
          admin: { columns: { id: true, username: true } },
        },
        orderBy: (rooms, { desc }) => [desc(rooms.createdAt)],
        limit: 20,
      });
    }

    return NextResponse.json({ rooms: allRooms, finishedRooms, currentUserId: user.id });
  }
);

export const POST = apiHandler(
  { auth: 'admin', schema: createRoomSchema },
  async (ctx) => {
    const { name, participantLimit } = ctx.body as { name: string; participantLimit: number };

    const roomId = nanoid();
    const [newRoom] = await db
      .insert(rooms)
      .values({
        id: roomId,
        name,
        adminId: ctx.user!.id,
        participantLimit,
        status: 'open',
      })
      .returning();

    return NextResponse.json({ success: true, room: newRoom }, { status: 201 });
  }
);
