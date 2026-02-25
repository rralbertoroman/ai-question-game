import { apiHandler } from '@/lib/api/handler';
import { db } from '@/lib/db';
import { games, users, gameParticipants } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { resolveGameState, resolveGameStateForAdmin } from '@/lib/game/engine';
import { GAME_CONFIG } from '@/lib/game/config';

export const GET = apiHandler({ auth: 'user' }, async (ctx) => {
  const user = ctx.user!;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let lastJson = '';

      const poll = async () => {
        try {
          // Update heartbeat
          await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, user.id));

          const activeGame = await db.query.games.findFirst({
            where: eq(games.status, 'playing'),
          });

          if (!activeGame) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'No hay juego en curso' })}\n\n`));
            controller.close();
            return;
          }

          let gameState;
          if (user.role === 'admin') {
            gameState = await resolveGameStateForAdmin(activeGame.id);
          } else {
            const participant = await db.query.gameParticipants.findFirst({
              where: and(eq(gameParticipants.gameId, activeGame.id), eq(gameParticipants.userId, user.id)),
            });
            if (!participant) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'No eres participante' })}\n\n`));
              controller.close();
              return;
            }
            gameState = await resolveGameState(activeGame.id, user.id);
          }

          const json = JSON.stringify(gameState);
          if (json !== lastJson) {
            lastJson = json;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'state', data: gameState })}\n\n`));
          }

          if (gameState.phase === 'finished') {
            controller.close();
            return;
          }

          setTimeout(poll, GAME_CONFIG.SSE_POLL_INTERVAL_MS);
        } catch {
          controller.close();
        }
      };

      poll();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
});
