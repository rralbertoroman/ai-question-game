'use client';

import { useToast } from '@/components/toast/useToast';
import QuestionPhase from './QuestionPhase';
import SummaryPhase from './SummaryPhase';
import FinishedPhase from './FinishedPhase';
import Leaderboard from './Leaderboard';
import ProgressBar from './ProgressBar';
import type { GameStateResponse } from '@/lib/game/types';

interface Props {
  gameState: GameStateResponse;
  userId: number;
  refetch: () => Promise<void>;
}

export default function GamePlay({ gameState, userId, refetch }: Props) {
  const { addToast } = useToast();

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

  if (gameState.phase === 'idle') return null;

  return (
    <>
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

      {/* Leaderboard (during question/summary) */}
      {(gameState.phase === 'question' || gameState.phase === 'summary') && (
        <Leaderboard
          entries={gameState.leaderboard}
          currentUserId={userId}
        />
      )}
    </>
  );
}
