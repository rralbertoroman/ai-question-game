import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { findParticipant } from '@/lib/db/repositories/participants';
import { resolveGameState, resolveGameStateForAdmin } from '@/lib/game/engine';
import { GAME_CONFIG } from '@/lib/game/config';
import type { SSEMessage } from '@/lib/game/types';

const encoder = new TextEncoder();

function formatSSE(message: SSEMessage): string {
  return `data: ${JSON.stringify(message)}\n\n`;
}

export const GET = apiHandler(
  { auth: 'user', room: true },
  async (ctx) => {
    // Determine if participant or admin
    const participant = await findParticipant(ctx.roomId!, ctx.user!.id);

    const isParticipant = !!participant;
    const isAdmin = ctx.user!.role === 'admin';

    if (!isParticipant && !isAdmin) {
      return NextResponse.json(
        { error: 'Not a participant in this room' },
        { status: 403 }
      );
    }

    const roomId = ctx.roomId!;
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
            // Fetch current game state
            const gameState = isParticipant
              ? await resolveGameState(roomId, userId)
              : await resolveGameStateForAdmin(roomId);

            const json = JSON.stringify(gameState);

            // Only send when state has changed
            if (json !== lastJson) {
              lastJson = json;
              const message: SSEMessage = { type: 'state', data: gameState };
              controller.enqueue(encoder.encode(formatSSE(message)));
            }

            // Stop streaming after sending final finished state
            if (gameState.phase === 'finished') {
              break;
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
