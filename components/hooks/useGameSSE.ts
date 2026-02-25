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
      const res = await fetch('/api/game/current');
      if (res.ok) {
        const data = await res.json();
        if (data.active && data.gameState) {
          setGameState(data.gameState);
          setError('');
        }
      }
    } catch {
      // SSE stream will catch up
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
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
