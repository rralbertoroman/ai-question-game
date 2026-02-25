import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { db } from '@/lib/db';
import { scores, users } from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

export const GET = apiHandler({ auth: 'user' }, async () => {
  const leaderboard = await db
    .select({
      userId: scores.userId,
      username: users.username,
      totalScore: sql<number>`SUM(${scores.score})`,
      gamesPlayed: sql<number>`COUNT(DISTINCT ${scores.gameId})`,
    })
    .from(scores)
    .innerJoin(users, eq(scores.userId, users.id))
    .groupBy(scores.userId, users.username)
    .orderBy(desc(sql`SUM(${scores.score})`));

  return NextResponse.json({
    leaderboard: leaderboard.map((entry, i) => ({
      ...entry,
      totalScore: Number(entry.totalScore),
      gamesPlayed: Number(entry.gamesPlayed),
      rank: i + 1,
    })),
  });
});
