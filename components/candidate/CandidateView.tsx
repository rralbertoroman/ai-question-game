'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { GAME_CONFIG } from '@/lib/game/config';
import GamePlay from '@/components/game/GamePlay';

interface OnlinePlayer {
  id: number;
  username: string;
}

interface Props {
  userId: number;
}

export default function CandidateView({ userId }: Props) {
  const [gameActive, setGameActive] = useState(false);
  const [participating, setParticipating] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/game/current');
      if (!res.ok) return;
      const data = await res.json();

      if (data.active) {
        setGameActive(true);
        setParticipating(data.participating ?? false);
      } else {
        setGameActive(false);
        setParticipating(false);
        setOnlinePlayers(data.onlinePlayers || []);
      }
    } catch {
      // Silently retry on next poll
    }
  }, []);

  useEffect(() => {
    // Defer initial poll to avoid sync setState in effect
    const initialTimeout = setTimeout(pollStatus, 0);
    intervalRef.current = setInterval(pollStatus, GAME_CONFIG.LOBBY_POLL_INTERVAL_MS);
    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pollStatus]);

  // Stop polling when game is active and user is participating (SSE takes over)
  useEffect(() => {
    if (gameActive && participating && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [gameActive, participating]);

  // Playing state
  if (gameActive && participating) {
    return <GamePlay userId={userId} />;
  }

  // Not participating in active game
  if (gameActive && !participating) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">⏳</div>
        <h2 className="text-xl font-semibold text-gray-300 mb-2">
          Juego en curso
        </h2>
        <p className="text-gray-500">
          Hay un juego activo. Espera al próximo juego.
        </p>
      </div>
    );
  }

  // Waiting state
  return (
    <div className="text-center py-8">
      <div className="text-5xl mb-6 animate-glow-pulse">🎮</div>
      <h2 className="text-2xl font-bold text-white mb-2 animate-glow-pulse">
        Esperando próximo juego...
      </h2>
      <p className="text-gray-500 mb-8">
        El administrador iniciará el juego cuando todos estén listos.
      </p>

      {onlinePlayers.length > 0 && (
        <div className="max-w-sm mx-auto">
          <h3 className="text-sm font-semibold text-cyan-400 mb-3">
            Jugadores en línea ({onlinePlayers.length})
          </h3>
          <div className="space-y-2">
            {onlinePlayers.map((player) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${
                  player.id === userId
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-gray-700 bg-gray-800/50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className={player.id === userId ? 'text-cyan-300 font-semibold' : 'text-gray-300'}>
                  {player.username}
                  {player.id === userId && (
                    <span className="ml-2 text-xs text-cyan-500">(tú)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
