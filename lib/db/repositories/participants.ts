import { db } from '@/lib/db';
import { roomParticipants } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';

export async function findParticipant(roomId: string, userId: number) {
  return db.query.roomParticipants.findFirst({
    where: and(
      eq(roomParticipants.roomId, roomId),
      eq(roomParticipants.userId, userId)
    ),
  });
}

export async function getParticipantCount(roomId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(roomParticipants)
    .where(eq(roomParticipants.roomId, roomId));
  return result.count;
}

export async function getReadyCount(roomId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(roomParticipants)
    .where(and(
      eq(roomParticipants.roomId, roomId),
      eq(roomParticipants.ready, true)
    ));
  return result.count;
}
