import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { roomParticipants } from '@/lib/db/schema';
import { apiHandler } from '@/lib/api/handler';
import { conflict } from '@/lib/api/errors';
import { findParticipant, getParticipantCount } from '@/lib/db/repositories/participants';

export const POST = apiHandler(
  { auth: 'user', room: true },
  async (ctx) => {
    if (ctx.room!.status !== 'open') {
      conflict('Room is not open for joining');
    }

    // Check if already a participant
    const existing = await findParticipant(ctx.roomId!, ctx.user!.id);
    if (existing) {
      conflict('Already joined this room');
    }

    // Check participant limit
    const currentCount = await getParticipantCount(ctx.roomId!);
    if (currentCount >= ctx.room!.participantLimit) {
      conflict('Room is full');
    }

    await db.insert(roomParticipants).values({
      roomId: ctx.roomId!,
      userId: ctx.user!.id,
      ready: false,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  }
);
