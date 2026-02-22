'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameSSE } from '@/components/hooks/useGameSSE';
import QuestionPhase from './QuestionPhase';
import SummaryPhase from './SummaryPhase';
import FinishedPhase from './FinishedPhase';
import Leaderboard from './Leaderboard';
import ProgressBar from './ProgressBar';

interface Props {
  roomId: string;
  userId: number;
}

export default function GamePlay({ roomId, userId }: Props) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState('');

  const { gameState, error: sseError, refetch } = useGameSSE({
    roomId,
    enabled: true,
  });

  const error = submitError || sseError;

  const handleSubmitAnswer = async (answerIndex: number) => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/game/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerIndex }),
      });

      if (res.ok) {
        await refetch();
      }
    } catch {
      setSubmitError('Failed to submit answer');
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900/95 to-black/95 flex items-center justify-center">
        <div className="text-gray-400 animate-glow-pulse">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900/95 to-black/95 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">{gameState.roomName}</h1>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
          >
            Exit
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Progress bar (during question/summary) */}
        {(gameState.phase === 'question' || gameState.phase === 'summary') && (
          <ProgressBar
            current={gameState.currentQuestionIndex + 1}
            total={gameState.totalQuestions}
          />
        )}

        {/* Phase content */}
        {gameState.phase === 'question' && (
          <QuestionPhase
            question={gameState.question}
            timeRemainingMs={gameState.timeRemainingMs}
            hasAnswered={gameState.hasAnswered}
            selectedAnswerIndex={gameState.selectedAnswerIndex}
            answeredCount={gameState.answeredCount}
            totalPlayers={gameState.totalPlayers}
            onSubmitAnswer={handleSubmitAnswer}
          />
        )}

        {gameState.phase === 'summary' && (
          <SummaryPhase
            summary={gameState.summary}
            timeRemainingMs={gameState.timeRemainingMs}
          />
        )}

        {gameState.phase === 'finished' && (
          <FinishedPhase
            roomId={roomId}
            leaderboard={gameState.leaderboard}
            currentUserId={userId}
          />
        )}

        {gameState.phase === 'waiting' && (
          <div className="text-center py-12 text-gray-400">
            Waiting for game to start...
          </div>
        )}

        {/* Leaderboard (during question/summary) */}
        {(gameState.phase === 'question' || gameState.phase === 'summary') && (
          <Leaderboard
            entries={gameState.leaderboard}
            currentUserId={userId}
          />
        )}
      </div>
    </div>
  );
}
