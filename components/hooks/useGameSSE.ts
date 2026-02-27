'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameStateResponse, SSEMessage } from '@/lib/game/types';

interface UseGameSSEOptions {
  enabled?: boolean;
}

interface UseGameSSEResult {
  gameState: GameStateResponse | null;
  error: string;
  refetch: () => Promise<void>;
}

export function useGameSSE({
  enabled = true,
}: UseGameSSEOptions = {}): UseGameSSEResult {
  const [gameState, setGameState] = useState<GameStateResponse | null>(null);
  const [error, setError] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);

  // One-off fetch for immediate feedback (e.g., after answer submission)
  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/game/state');
      if (res.ok) {
        const data: GameStateResponse = await res.json();
        setGameState((prev) => {
          // Don't let idle overwrite an active game — user must manually leave scoreboard
          if (prev?.phase === 'finished' && data.phase === 'idle') {
            return prev;
          }
          return data;
        });
        setError('');
      }
    } catch {
      // SSE stream will catch up
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      // Close any existing connection when disabled
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const es = new EventSource('/api/game/stream');
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const message: SSEMessage = JSON.parse(event.data);
        if (message.type === 'state') {
          setGameState((prev) => {
            // Don't let idle overwrite an active game — user must manually leave scoreboard
            if (prev?.phase === 'finished' && message.data.phase === 'idle') {
              return prev;
            }
            return message.data;
          });
          setError('');
        } else if (message.type === 'error') {
          setError(message.error);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    es.onerror = () => {
      // EventSource auto-reconnects on error.
      // Only set error if connection is fully closed.
      if (es.readyState === EventSource.CLOSED) {
        setError('Conexión perdida');
      }
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [enabled]);

  return { gameState, error, refetch };
}
