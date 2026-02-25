import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { db } from '@/lib/db';
import { games, users, gameParticipants } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { resolveGameState, resolveGameStateForAdmin } from '@/lib/game/engine';
import { GAME_CONFIG } from '@/lib/game/config';

export const GET = apiHandler({ auth: 'user' }, async (ctx) => {
  const user = ctx.user!;

  // Update heartbeat
  await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, user.id));

  // Find active game
  const activeGame = await db.query.games.findFirst({
    where: eq(games.status, 'playing'),
  });

  if (!activeGame) {
    // No active game — return online players list
    const cutoff = new Date(Date.now() - GAME_CONFIG.HEARTBEAT_TIMEOUT_SECONDS * 1000);
    const onlinePlayers = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(and(eq(users.role, 'candidate'), gt(users.lastActiveAt, cutoff)));

    return NextResponse.json({ active: false, onlinePlayers });
  }

  // Active game exists
  if (user.role === 'admin') {
    const gameState = await resolveGameStateForAdmin(activeGame.id);
    return NextResponse.json({ active: true, gameState });
  }

  // Check if this user is a participant
  const participant = await db.query.gameParticipants.findFirst({
    where: and(eq(gameParticipants.gameId, activeGame.id), eq(gameParticipants.userId, user.id)),
  });

  if (!participant) {
    // User is not in this game, show as spectator/waiting
    return NextResponse.json({ active: true, participating: false, gameId: activeGame.id });
  }

  const gameState = await resolveGameState(activeGame.id, user.id);
  return NextResponse.json({ active: true, participating: true, gameState });
});
