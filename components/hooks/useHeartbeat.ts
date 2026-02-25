'use client';

import { useEffect } from 'react';
import { GAME_CONFIG } from '@/lib/game/config';

export function useHeartbeat({ enabled = true }: { enabled?: boolean } = {}) {
  useEffect(() => {
    if (!enabled) return;

    const send = () => {
      fetch('/api/game/heartbeat', { method: 'POST' }).catch(() => {
        // Silently ignore heartbeat failures
      });
    };

    send(); // immediate on mount
    const id = setInterval(send, GAME_CONFIG.HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled]);
}
