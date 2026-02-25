'use client';

import { useGameSSE } from '@/components/hooks/useGameSSE';
import { useToast } from '@/components/toast/useToast';
import InlineError from '@/components/error/InlineError';
import QuestionPhase from './QuestionPhase';
import SummaryPhase from './SummaryPhase';
import FinishedPhase from './FinishedPhase';
import Leaderboard from './Leaderboard';
import ProgressBar from './ProgressBar';

interface Props {
  userId: number;
}

export default function GamePlay({ userId }: Props) {
  const { addToast } = useToast();

  const { gameState, error: sseError, refetch } = useGameSSE({
    enabled: true,
  });

  const handleSubmitAnswer = async (answerIndex: number): Promise<boolean> => {
    try {
      const res = await fetch('/api/game/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerIndex }),
      });

      if (res.ok) {
        await refetch();
        return true;
      }
      addToast('error', 'Error al enviar respuesta');
      return false;
    } catch {
      addToast('error', 'Error al enviar respuesta');
      return false;
    }
  };

  if (!gameState) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400 animate-glow-pulse">Cargando juego...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <InlineError message={sseError} className="mb-4" />

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
          gameId={gameState.gameId}
          leaderboard={gameState.leaderboard}
          currentUserId={userId}
        />
      )}

      {gameState.phase === 'waiting' && (
        <div className="text-center py-12 text-gray-400">
          Esperando a que comience el juego...
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
  );
}
