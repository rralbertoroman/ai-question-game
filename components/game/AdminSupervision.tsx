'use client';

import { useRouter } from 'next/navigation';
import { GAME_CONFIG } from '@/lib/game/config';
import { useGameSSE } from '@/components/hooks/useGameSSE';
import SummaryPhase from './SummaryPhase';
import FinishedPhase from './FinishedPhase';
import Leaderboard from './Leaderboard';
import ProgressBar from './ProgressBar';
import TimerDisplay from './TimerDisplay';

interface Props {
  gameId: number;
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/50',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  hard: 'bg-red-500/20 text-red-400 border-red-500/50',
};

const answerLabels = ['A', 'B', 'C', 'D'];

export default function AdminSupervision({ gameId }: Props) {
  const router = useRouter();

  const { gameState } = useGameSSE({ enabled: true });

  if (!gameState || gameState.phase === 'idle') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900/95 to-black/95 flex items-center justify-center">
        <div className="text-gray-400 animate-glow-pulse">Cargando vista de supervisión...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900/95 to-black/95 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        {/* Admin banner */}
        <div className="mb-4 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded">
              SUPERVISANDO
            </span>
            <span className="text-sm text-purple-300">Solo lectura</span>
          </div>
          <span className="text-xs text-gray-500">
            Fase: {gameState.phase} | Q{gameState.currentQuestionIndex + 1}/{gameState.totalQuestions}
          </span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">Juego en Curso</h1>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
          >
            Salir
          </button>
        </div>

        {/* Progress bar */}
        {(gameState.phase === 'question' || gameState.phase === 'summary') && (
          <ProgressBar
            current={gameState.currentQuestionIndex + 1}
            total={gameState.totalQuestions}
          />
        )}

        {/* Question phase - READ ONLY */}
        {gameState.phase === 'question' && (
          <div className="animate-fade-in-up">
            <TimerDisplay
              serverTimeRemainingMs={gameState.timeRemainingMs}
              totalSeconds={GAME_CONFIG.QUESTION_TIME_LIMIT_SECONDS}
            />

            <div className="p-6 bg-gray-800/70 border-2 border-purple-500/30 rounded-lg mb-6 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 rounded border bg-blue-500/20 text-blue-400 border-blue-500/50">
                  {gameState.question.category}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded border ${difficultyColors[gameState.question.difficulty] || ''}`}>
                  {gameState.question.difficulty}
                </span>
              </div>
              <p className="text-lg text-white leading-relaxed">{gameState.question.text}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {gameState.question.answers.map((answer, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border bg-gray-800/50 border-gray-700 text-gray-300"
                >
                  <span className="text-cyan-400 font-mono mr-3">{answerLabels[index]}.</span>
                  {answer}
                </div>
              ))}
            </div>

            <div className="text-center text-sm text-gray-500">
              <span className="text-purple-400">
                {gameState.answeredCount}/{gameState.totalPlayers} jugadores respondieron
              </span>
            </div>
          </div>
        )}

        {/* Summary phase - reuse existing component */}
        {gameState.phase === 'summary' && (
          <SummaryPhase
            summary={gameState.summary}
            timeRemainingMs={gameState.timeRemainingMs}
          />
        )}

        {/* Leaderboard */}
        {(gameState.phase === 'question' || gameState.phase === 'summary') && (
          <Leaderboard
            entries={gameState.leaderboard}
            currentUserId={-1}
          />
        )}

        {/* Finished — show comprehensive scoreboard */}
        {gameState.phase === 'finished' && (
          <FinishedPhase
            gameId={gameId}
            leaderboard={gameState.leaderboard}
            currentUserId={-1}
          />
        )}
      </div>
    </div>
  );
}
