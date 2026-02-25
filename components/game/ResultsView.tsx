'use client';

import { useRouter } from 'next/navigation';
import type { LeaderboardEntry } from '@/lib/game/types';

interface QuestionResult {
  index: number;
  questionId: number;
  questionText: string;
  answers: string[];
  correctIndex: number;
  difficulty: string;
  category: string;
  playerResults: {
    userId: number;
    username: string;
    answerIndex: number | null;
    isCorrect: boolean;
  }[];
}

interface Props {
  results: {
    leaderboard: LeaderboardEntry[];
    questions: QuestionResult[];
    phase: string;
  };
  leaderboard: LeaderboardEntry[];
  currentUserId: number;
}

const answerLabels = ['A', 'B', 'C', 'D'];

export default function ResultsView({
  results,
  leaderboard,
  currentUserId,
}: Props) {
  const router = useRouter();
  const winner = leaderboard[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900/95 to-black/95 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto animate-fade-in-up">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Resultados del Juego</h1>
            <p className="text-sm text-gray-500">
              {winner && `Ganador: ${winner.username}`}
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors cursor-pointer text-sm"
          >
            Volver al Inicio
          </button>
        </div>

        {/* Leaderboard */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-cyan-400 mb-4">
            Clasificación Final
          </h2>
          <div className="space-y-2">
            {leaderboard.map((entry, index) => {
              const isMe = entry.userId === currentUserId;
              const medalColors: Record<number, string> = {
                1: 'border-yellow-500 bg-yellow-500/10',
                2: 'border-cyan-500 bg-cyan-500/10',
                3: 'border-purple-500 bg-purple-500/10',
              };

              return (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-4 p-4 rounded-lg border card-hover-lift animate-stagger-in ${
                    medalColors[entry.rank] || 'border-gray-700 bg-gray-800/50'
                  } ${isMe ? 'ring-1 ring-cyan-400' : ''}`}
                  style={{ '--i': index } as React.CSSProperties}
                >
                  <span className="font-mono font-bold text-lg w-8 text-center text-gray-400">
                    #{entry.rank}
                  </span>
                  <span
                    className={`flex-1 ${isMe ? 'text-white font-semibold' : 'text-gray-300'}`}
                  >
                    {entry.username}
                    {isMe && (
                      <span className="ml-2 text-xs text-cyan-400">(tú)</span>
                    )}
                  </span>
                  <span className="font-mono text-lg text-yellow-400 font-bold">
                    {(entry.score / 10).toFixed(1)} pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question breakdown */}
        <div>
          <h2 className="text-lg font-semibold text-purple-400 mb-4">
            Desglose de Preguntas
          </h2>
          <div className="space-y-4">
            {results.questions.map((q, index) => (
              <div
                key={q.questionId}
                className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg animate-stagger-in"
                style={{ '--i': index } as React.CSSProperties}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm text-white flex-1">
                    <span className="text-gray-500 mr-2">
                      Q{q.index + 1}.
                    </span>
                    {q.questionText}
                  </p>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                      {q.category}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">
                      {q.difficulty}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-green-400 mb-2">
                  Correcta: {answerLabels[q.correctIndex]}. {q.answers[q.correctIndex]}
                </p>

                <div className="flex flex-wrap gap-2">
                  {q.playerResults.map((pr) => (
                    <span
                      key={pr.userId}
                      className={`text-xs px-2 py-0.5 rounded ${
                        pr.isCorrect
                          ? 'bg-green-500/20 text-green-400'
                          : pr.answerIndex === null
                            ? 'bg-gray-700 text-gray-500'
                            : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {pr.username}:{' '}
                      {pr.answerIndex === null
                        ? 'sin respuesta'
                        : answerLabels[pr.answerIndex]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
