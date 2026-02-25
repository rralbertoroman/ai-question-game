import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { db } from '@/lib/db';
import { games } from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

export const GET = apiHandler({ auth: 'admin' }, async () => {
  const pastGames = await db
    .select({
      id: games.id,
      status: games.status,
      createdAt: games.createdAt,
      participantCount: sql<number>`(SELECT COUNT(*) FROM game_participants WHERE game_id = ${games.id})`,
    })
    .from(games)
    .where(eq(games.status, 'finished'))
    .orderBy(desc(games.createdAt))
    .limit(50);

  return NextResponse.json({ games: pastGames });
});
