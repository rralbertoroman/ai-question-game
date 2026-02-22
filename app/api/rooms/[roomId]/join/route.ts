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
      conflict('La sala no está abierta para unirse');
    }

    // Check if already a participant
    const existing = await findParticipant(ctx.roomId!, ctx.user!.id);
    if (existing) {
      conflict('Ya estás en esta sala');
    }

    // Check participant limit
    const currentCount = await getParticipantCount(ctx.roomId!);
    if (currentCount >= ctx.room!.participantLimit) {
      conflict('La sala está llena');
    }

    await db.insert(roomParticipants).values({
      roomId: ctx.roomId!,
      userId: ctx.user!.id,
      ready: false,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  }
);
