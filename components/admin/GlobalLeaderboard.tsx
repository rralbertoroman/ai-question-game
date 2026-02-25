'use client';

import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  userId: number;
  username: string;
  totalScore: number;
  gamesPlayed: number;
  rank: number;
}

export default function GlobalLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        Cargando clasificación...
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-4 text-gray-600 text-sm">
        Aún no hay puntuaciones registradas.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {leaderboard.map((entry, index) => {
        const medalColors: Record<number, string> = {
          1: 'border-yellow-500 bg-yellow-500/10',
          2: 'border-cyan-500 bg-cyan-500/10',
          3: 'border-purple-500 bg-purple-500/10',
        };

        return (
          <div
            key={entry.userId}
            className={`flex items-center gap-4 p-3 rounded-lg border animate-stagger-in ${
              medalColors[entry.rank] || 'border-gray-700 bg-gray-800/50'
            }`}
            style={{ '--i': index } as React.CSSProperties}
          >
            <span className="font-mono font-bold text-lg w-8 text-center text-gray-400">
              #{entry.rank}
            </span>
            <span className="flex-1 text-gray-300">
              {entry.username}
            </span>
            <span className="text-xs text-gray-500 mr-2">
              {entry.gamesPlayed} {entry.gamesPlayed === 1 ? 'juego' : 'juegos'}
            </span>
            <span className="font-mono text-lg text-yellow-400 font-bold">
              {(entry.totalScore / 10).toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
