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
              // No active game — send idle state
              const idle: IdleState = { phase: 'idle' };
              const json = JSON.stringify(idle);

              if (json !== lastJson) {
                lastJson = json;
                const message: SSEMessage = { type: 'state', data: idle };
                controller.enqueue(encoder.encode(formatSSE(message)));
              }
            } else {
              // Active game — resolve state for this user
              const gameState = await resolveGameState(activeGame.id, userId);
              const json = JSON.stringify(gameState);

              if (json !== lastJson) {
                lastJson = json;
                const message: SSEMessage = { type: 'state', data: gameState };
                controller.enqueue(encoder.encode(formatSSE(message)));
              }

              // After sending finished, reset lastJson so we can detect idle next
              if (gameState.phase === 'finished') {
                lastJson = '';
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
