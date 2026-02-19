'use client';

import { useRouter } from 'next/navigation';
import type { LeaderboardEntry } from '@/lib/game/types';

interface Props {
  roomId: string;
  leaderboard: LeaderboardEntry[];
  currentUserId: number;
}

export default function FinishedPhase({
  roomId,
  leaderboard,
  currentUserId,
}: Props) {
  const router = useRouter();

  const winner = leaderboard[0];
  const isWinner = winner?.userId === currentUserId;

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-cyan-400 mb-2">Game Over</h2>

      {winner && (
        <p className="text-lg text-gray-300 mb-8">
          {isWinner ? (
            <span className="text-yellow-400">You won!</span>
          ) : (
            <>
              Winner:{' '}
              <span className="text-yellow-400 font-semibold">
                {winner.username}
              </span>{' '}
              with {(winner.score / 10).toFixed(1)} points
            </>
          )}
        </p>
      )}

      {/* Podium */}
      <div className="space-y-2 mb-8 max-w-md mx-auto">
        {leaderboard.map((entry) => {
          const isMe = entry.userId === currentUserId;
          const medalColors: Record<number, string> = {
            1: 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_20px_rgba(255,200,0,0.15)]',
            2: 'border-cyan-500 bg-cyan-500/10',
            3: 'border-purple-500 bg-purple-500/10',
          };
          const medalEmojis: Record<number, string> = {
            1: '\uD83E\uDD47',
            2: '\uD83E\uDD48',
            3: '\uD83E\uDD49',
          };

          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-4 p-4 rounded-lg border ${
                medalColors[entry.rank] || 'border-gray-700 bg-gray-800/50'
              } ${isMe ? 'ring-1 ring-cyan-400' : ''}`}
            >
              <span className="text-2xl w-10 text-center">
                {medalEmojis[entry.rank] || `#${entry.rank}`}
              </span>
              <span
                className={`flex-1 text-left ${isMe ? 'text-white font-semibold' : 'text-gray-300'}`}
              >
                {entry.username}
              </span>
              <span className="font-mono text-lg text-yellow-400 font-bold">
                {(entry.score / 10).toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={() => router.push(`/rooms/${roomId}/results`)}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors cursor-pointer"
        >
          Detailed Results
        </button>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Back to Rooms
        </button>
      </div>
    </div>
  );
}
