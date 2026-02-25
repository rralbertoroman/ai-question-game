'use client';

import { useGameSSE } from '@/components/hooks/useGameSSE';
import { useHeartbeat } from '@/components/hooks/useHeartbeat';
import InlineError from '@/components/error/InlineError';
import GamePlay from '@/components/game/GamePlay';
import SpectatorView from '@/components/game/SpectatorView';

interface Props {
  currentUserId: number;
  username: string;
}

export default function CandidateView({ currentUserId, username }: Props) {
  useHeartbeat();
  const { gameState, error: sseError, refetch } = useGameSSE();

  if (!gameState) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400 animate-glow-pulse">Conectando...</div>
      </div>
    );
  }

  // Idle state — no active game
  if (gameState.phase === 'idle') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-20">
          <div className="mb-4 text-6xl animate-glow-pulse">⏳</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Hola, {username}
          </h2>
          <p className="text-gray-400 mb-2">
            Esperando que el administrador inicie el juego...
          </p>
          <p className="text-sm text-gray-600">
            Permanece en esta página. El juego comenzará automáticamente.
          </p>
        </div>
      </div>
    );
  }

  // Active game — determine if participant or spectator
  const isParticipant = gameState.isParticipant;

  return (
    <div className="max-w-2xl mx-auto">
      <InlineError message={sseError} className="mb-4" />

      {isParticipant ? (
        <GamePlay
          gameState={gameState}
          userId={currentUserId}
          refetch={refetch}
        />
      ) : (
        <SpectatorView gameState={gameState} />
      )}
    </div>
  );
}
