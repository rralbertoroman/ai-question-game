'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameStateResponse, SSEMessage } from '@/lib/game/types';

interface UseGameSSEOptions {
  roomId: string;
  enabled?: boolean;
}

interface UseGameSSEResult {
  gameState: GameStateResponse | null;
  error: string;
  refetch: () => Promise<void>;
}

export function useGameSSE({
  roomId,
  enabled = true,
}: UseGameSSEOptions): UseGameSSEResult {
  const [gameState, setGameState] = useState<GameStateResponse | null>(null);
  const [error, setError] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);

  // One-off fetch for immediate feedback (e.g., after answer submission)
  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/game`);
      if (res.ok) {
        const data: GameStateResponse = await res.json();
        setGameState(data);
        setError('');
      }
    } catch {
      // SSE stream will catch up
    }
  }, [roomId]);

  useEffect(() => {
    if (!enabled) {
      // Close any existing connection when disabled
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const es = new EventSource(`/api/rooms/${roomId}/game/stream`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const message: SSEMessage = JSON.parse(event.data);
        if (message.type === 'state') {
          setGameState(message.data);
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
        setError('Connection lost');
      }
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [roomId, enabled]);

  return { gameState, error, refetch };
}
