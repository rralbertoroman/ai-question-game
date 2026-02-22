import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { roomParticipants } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/simple-session';
import { eq, and } from 'drizzle-orm';
import { resolveGameState, resolveGameStateForAdmin } from '@/lib/game/engine';
import { GAME_CONFIG } from '@/lib/game/config';
import type { SSEMessage } from '@/lib/game/types';

const encoder = new TextEncoder();
const KEEPALIVE_INTERVAL_MS = 15_000;

function formatSSE(message: SSEMessage): string {
  return `data: ${JSON.stringify(message)}\n\n`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await requireAuth();
    const { roomId } = await params;

    // Determine if participant or admin
    const participant = await db.query.roomParticipants.findFirst({
      where: and(
        eq(roomParticipants.roomId, roomId),
        eq(roomParticipants.userId, user.id)
      ),
    });

    const isParticipant = !!participant;
    const isAdmin = user.role === 'admin';

    if (!isParticipant && !isAdmin) {
      return NextResponse.json(
        { error: 'Not a participant in this room' },
        { status: 403 }
      );
    }

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
              ? await resolveGameState(roomId, user.id)
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
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('SSE stream error:', error);
    return NextResponse.json(
      { error: 'Failed to establish stream' },
      { status: 500 }
    );
  }
}
