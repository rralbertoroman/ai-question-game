import { db } from '@/lib/db';
import { gameParticipants } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';

export async function findParticipant(gameId: number, userId: number) {
  return db.query.gameParticipants.findFirst({
    where: and(
      eq(gameParticipants.gameId, gameId),
      eq(gameParticipants.userId, userId)
    ),
  });
}

export async function getParticipantCount(gameId: number): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(gameParticipants)
    .where(eq(gameParticipants.gameId, gameId));
  return result.count;
}
