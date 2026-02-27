import { apiHandler } from '@/lib/api/handler';
import { getActiveGame, resolveGameState } from '@/lib/game/engine';
import { GAME_CONFIG } from '@/lib/game/config';
import type { SSEMessage, IdleState } from '@/lib/game/types';

const encoder = new TextEncoder();

function formatSSE(message: SSEMessage): string {
  return `data: ${JSON.stringify(message)}\n\n`;
}

export const GET = apiHandler(
  { auth: 'user' },
  async (ctx) => {
    const userId = ctx.user!.id;
    const request = ctx.request!;
    let lastJson = '';
    let lastGameId: number | null = null;
    let stopped = false;

    const stream = new ReadableStream({
      async start(controller) {
        const cleanup = () => {
          stopped = true;
        };

        request.signal.addEventListener('abort', cleanup);

        try {
          while (!stopped) {
            const activeGame = await getActiveGame();

            if (!activeGame) {
              if (lastGameId) {
                // Game we were tracking just ended — send its final (finished) state
                // before transitioning to idle, so the client sees the scoreboard
                const gameState = await resolveGameState(lastGameId, userId);
                const json = JSON.stringify(gameState);

                if (json !== lastJson) {
                  lastJson = json;
                  const message: SSEMessage = { type: 'state', data: gameState };
                  controller.enqueue(encoder.encode(formatSSE(message)));
                }
                lastGameId = null;
              } else {
                // No active game and final state already sent — send idle
                const idle: IdleState = { phase: 'idle' };
                const json = JSON.stringify(idle);

                if (json !== lastJson) {
                  lastJson = json;
                  const message: SSEMessage = { type: 'state', data: idle };
                  controller.enqueue(encoder.encode(formatSSE(message)));
                }
              }
            } else {
              lastGameId = activeGame.id;
              // Active game — resolve state for this user
              const gameState = await resolveGameState(activeGame.id, userId);
              const json = JSON.stringify(gameState);

              if (json !== lastJson) {
                lastJson = json;
                const message: SSEMessage = { type: 'state', data: gameState };
                controller.enqueue(encoder.encode(formatSSE(message)));
              }
            }

            // Wait for next poll interval, but check for abort frequently
            const deadline = Date.now() + GAME_CONFIG.SSE_POLL_INTERVAL_MS;
            while (Date.now() < deadline && !stopped) {
              await new Promise((r) => setTimeout(r, 200));
            }
          }
        } catch (error) {
          if (!stopped) {
            const errMsg = error instanceof Error ? error.message : 'Internal error';
            controller.enqueue(
              encoder.encode(formatSSE({ type: 'error', error: errMsg }))
            );
          }
        } finally {
          request.signal.removeEventListener('abort', cleanup);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  }
);
