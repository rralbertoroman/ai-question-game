'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GAME_CONFIG } from '@/lib/game/config';
import { useHeartbeat } from '@/components/hooks/useHeartbeat';
import type { GlobalLeaderboardEntry } from '@/lib/game/types';

interface Props {
  username: string;
}

interface OnlinePlayer {
  id: number;
  username: string;
}

export default function AdminDashboard({ username }: Props) {
  const router = useRouter();
  useHeartbeat();

  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [activeGameId, setActiveGameId] = useState<number | null>(null);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<GlobalLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Poll online players
  const fetchOnlinePlayers = useCallback(async () => {
    try {
      const res = await fetch('/api/game/online-players');
      if (res.ok) {
        const data = await res.json();
        setOnlinePlayers(data.players);
        setActiveGameId(data.activeGameId);
      }
    } catch {
      // Silently ignore
    }
  }, []);

  // Fetch global leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setGlobalLeaderboard(data.leaderboard);
      }
    } catch {
      // Silently ignore
    }
  }, []);

  useEffect(() => {
    fetchOnlinePlayers();
    fetchLeaderboard();
    const id = setInterval(fetchOnlinePlayers, GAME_CONFIG.PRESENCE_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchOnlinePlayers, fetchLeaderboard]);

  const handleStartGame = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/game/start', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setActiveGameId(data.gameId);
      } else {
        setError(data.error || 'Error al iniciar el juego');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishGame = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/game/finish', { method: 'POST' });
      if (res.ok) {
        setActiveGameId(null);
        // Refresh leaderboard after game ends
        fetchLeaderboard();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al terminar el juego');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-animated">Panel de Control</h1>
          <p className="text-sm text-gray-500">
            Bienvenido, {username}
            <span className="ml-2 text-xs bg-cyan-600 text-white px-2 py-0.5 rounded">Admin</span>
          </p>
        </div>
      </div>

      {/* Game Control */}
      <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
        <h2 className="text-lg font-semibold text-cyan-400 mb-4">Control de Juego</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Online Players */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            Jugadores Conectados ({onlinePlayers.length})
          </h3>
          {onlinePlayers.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No hay jugadores conectados</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {onlinePlayers.map((player) => (
                <span
                  key={player.id}
                  className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-full"
                >
                  {player.username}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!activeGameId ? (
            <button
              onClick={handleStartGame}
              disabled={loading || onlinePlayers.length < 2}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando...' : 'Iniciar Juego'}
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push('/supervise')}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Supervisar
              </button>
              <button
                onClick={handleFinishGame}
                disabled={loading}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? 'Terminando...' : 'Terminar Juego'}
              </button>
            </>
          )}
        </div>

        {activeGameId && (
          <p className="mt-3 text-sm text-yellow-400">
            Juego en curso (ID: {activeGameId})
          </p>
        )}

        {!activeGameId && onlinePlayers.length < 2 && onlinePlayers.length > 0 && (
          <p className="mt-3 text-sm text-gray-500">
            Se necesitan al menos 2 jugadores conectados para iniciar
          </p>
        )}
      </div>

      {/* Global Leaderboard */}
      <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
        <h2 className="text-lg font-semibold text-cyan-400 mb-4">Clasificación General</h2>
        {globalLeaderboard.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No se han jugado partidas aún</p>
        ) : (
          <div className="space-y-2">
            {globalLeaderboard.map((entry) => {
              const medalColors: Record<number, string> = {
                1: 'border-yellow-500 bg-yellow-500/10',
                2: 'border-cyan-500 bg-cyan-500/10',
                3: 'border-purple-500 bg-purple-500/10',
              };

              return (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-4 p-3 rounded-lg border ${
                    medalColors[entry.rank] || 'border-gray-700 bg-gray-800/30'
                  }`}
                >
                  <span className="font-mono font-bold text-lg w-8 text-center text-gray-400">
                    #{entry.rank}
                  </span>
                  <span className="flex-1 text-gray-300">{entry.username}</span>
                  <span className="text-sm text-gray-500">
                    {entry.gamesPlayed} {entry.gamesPlayed === 1 ? 'juego' : 'juegos'}
                  </span>
                  <span className="font-mono text-lg text-yellow-400 font-bold">
                    {(entry.totalScore / 10).toFixed(1)} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
