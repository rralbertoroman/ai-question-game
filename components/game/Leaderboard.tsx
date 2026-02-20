'use client';

import type { LeaderboardEntry } from '@/lib/game/types';

interface Props {
  entries: LeaderboardEntry[];
  currentUserId: number;
}

export default function Leaderboard({ entries, currentUserId }: Props) {
  if (entries.length === 0) return null;

  const maxScore = Math.max(...entries.map((e) => e.score), 1);

  return (
    <div className="mt-6">
      <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-3">
        Leaderboard
      </h3>
      <div className="space-y-2">
        {entries.map((entry, index) => {
          const isMe = entry.userId === currentUserId;
          const rankColors: Record<number, string> = {
            1: 'text-yellow-400',
            2: 'text-cyan-400',
            3: 'text-purple-400',
          };
          const rankColor = rankColors[entry.rank] || 'text-gray-500';

          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 p-2 rounded card-hover-lift animate-stagger-in ${
                isMe
                  ? 'bg-cyan-500/10 border border-cyan-500/30'
                  : 'bg-gray-800/50'
              }`}
              style={{ '--i': index } as React.CSSProperties}
            >
              <span
                className={`font-mono font-bold w-6 text-center ${rankColor}`}
              >
                {entry.rank}
              </span>
              <span
                className={`flex-1 text-sm ${isMe ? 'text-white font-semibold' : 'text-gray-300'}`}
              >
                {entry.username}
              </span>
              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500 rounded-full"
                  style={{
                    width: `${(entry.score / maxScore) * 100}%`,
                  }}
                />
              </div>
              <span className="font-mono text-sm text-yellow-400 w-16 text-right">
                {(entry.score / 10).toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
