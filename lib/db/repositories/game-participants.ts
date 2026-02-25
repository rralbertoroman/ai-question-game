import { db } from '@/lib/db';
import { gameParticipants } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';

export async function getPlayerCount(gameId: number): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(gameParticipants)
    .where(eq(gameParticipants.gameId, gameId));
  return result.count;
}
