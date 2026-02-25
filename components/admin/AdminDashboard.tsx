'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { GAME_CONFIG } from '@/lib/game/config';
import { useGameSSE } from '@/components/hooks/useGameSSE';
import { useToast } from '@/components/toast/useToast';
import SummaryPhase from '@/components/game/SummaryPhase';
import Leaderboard from '@/components/game/Leaderboard';
import ProgressBar from '@/components/game/ProgressBar';
import TimerDisplay from '@/components/game/TimerDisplay';
import GlobalLeaderboard from '@/components/admin/GlobalLeaderboard';

interface OnlinePlayer {
  id: number;
  username: string;
}

interface GameHistoryEntry {
  id: number;
  createdAt: string;
  participantCount: number;
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/50',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  hard: 'bg-red-500/20 text-red-400 border-red-500/50',
};

const answerLabels = ['A', 'B', 'C', 'D'];

export default function AdminDashboard() {
  const { addToast } = useToast();
  const [gameActive, setGameActive] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // SSE for active game
  const { gameState, error: sseError } = useGameSSE({ enabled: gameActive });

  // ---- Lobby polling ----
  const pollCurrent = useCallback(async () => {
    try {
      const res = await fetch('/api/game/current');
      if (!res.ok) return;
      const data = await res.json();

      if (data.active) {
        setGameActive(true);
      } else {
        setOnlinePlayers(data.onlinePlayers ?? []);
      }
    } catch {
      // Silently retry on next interval
    }
  }, []);

  useEffect(() => {
    if (gameActive) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    // Start polling for lobby state after a microtask to avoid sync setState in effect
    const initialTimeout = setTimeout(pollCurrent, 0);
    pollRef.current = setInterval(pollCurrent, GAME_CONFIG.LOBBY_POLL_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimeout);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [gameActive, pollCurrent]);

  // Detect game finished via SSE — use ref to avoid setState in effect
  const gamePhase = gameState?.phase;
  useEffect(() => {
    if (gamePhase === 'finished') {
      const timeout = setTimeout(() => setGameActive(false), 0);
      return () => clearTimeout(timeout);
    }
  }, [gamePhase]);

  // ---- Fetch game history on mount ----
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/game/history');
        if (res.ok) {
          const data = await res.json();
          setGameHistory(data);
        }
      } catch {
        // Non-critical — ignore
      }
    }
    fetchHistory();
  }, []);

  // ---- Handlers ----
  const handleStartGame = async () => {
    const res = await fetch('/api/game/start', { method: 'POST' });
    if (res.ok) {
      setGameActive(true);
    } else {
      const data = await res.json();
      addToast('error', data.error || 'Error al iniciar juego');
    }
  };

  const handleFinishGame = async () => {
    const res = await fetch('/api/game/finish', { method: 'POST' });
    if (res.ok) {
      setGameActive(false);
    }
  };

  // ---- Render helpers ----
  const renderLobby = () => (
    <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Lobby</h2>
        <span className="text-sm text-gray-400">
          {onlinePlayers.length} candidato{onlinePlayers.length !== 1 ? 's' : ''} en línea
        </span>
      </div>

      {/* Online players list */}
      {onlinePlayers.length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">
          No hay candidatos conectados
        </p>
      ) : (
        <ul className="space-y-2 mb-6">
          {onlinePlayers.map((player) => (
            <li
              key={player.id}
              className="flex items-center gap-3 px-3 py-2 bg-gray-800/50 rounded-lg"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-glow-pulse" />
              <span className="text-gray-300 text-sm">{player.username}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Start button */}
      <button
        onClick={handleStartGame}
        disabled={onlinePlayers.length < 2}
        className="w-full py-3 rounded-lg font-semibold text-sm transition-all cursor-pointer
          bg-cyan-600 hover:bg-cyan-500 text-white
          disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
      >
        Iniciar Juego
      </button>
    </div>
  );

  const renderActiveGame = () => {
    if (!gameState) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-400 animate-glow-pulse">
            Cargando juego...
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg animate-fade-in-up">
        {/* Admin banner */}
        <div className="mb-4 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded">
              SUPERVISANDO
            </span>
            <span className="text-sm text-purple-300">Solo lectura</span>
          </div>
          <span className="text-xs text-gray-500">
            Fase: {gameState.phase} | Q{gameState.currentQuestionIndex + 1}/
            {gameState.totalQuestions}
          </span>
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
                <span
                  className={`text-xs px-2 py-0.5 rounded border ${difficultyColors[gameState.question.difficulty] || ''}`}
                >
                  {gameState.question.difficulty}
                </span>
              </div>
              <p className="text-lg text-white leading-relaxed">
                {gameState.question.text}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {gameState.question.answers.map((answer, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border bg-gray-800/50 border-gray-700 text-gray-300"
                >
                  <span className="text-cyan-400 font-mono mr-3">
                    {answerLabels[index]}.
                  </span>
                  {answer}
                </div>
              ))}
            </div>

            <div className="text-center text-sm text-gray-500">
              <span className="text-purple-400">
                {gameState.answeredCount}/{gameState.totalPlayers} jugadores
                respondieron
              </span>
            </div>
          </div>
        )}

        {/* Summary phase */}
        {gameState.phase === 'summary' && (
          <SummaryPhase
            summary={gameState.summary}
            timeRemainingMs={gameState.timeRemainingMs}
          />
        )}

        {/* Waiting phase */}
        {gameState.phase === 'waiting' && (
          <div className="text-center py-12 text-gray-400">
            Esperando a que comience el juego...
          </div>
        )}

        {/* Finished phase (inline results) */}
        {gameState.phase === 'finished' && (
          <div className="animate-fade-in-up">
            <div className="text-center py-6">
              <h3 className="text-xl font-bold text-white mb-2">
                Juego finalizado
              </h3>
              <p className="text-gray-400 text-sm">
                Resultados finales
              </p>
            </div>
            <Leaderboard
              entries={gameState.leaderboard}
              currentUserId={-1}
            />
          </div>
        )}

        {/* Leaderboard (during question/summary) */}
        {(gameState.phase === 'question' || gameState.phase === 'summary') && (
          <Leaderboard entries={gameState.leaderboard} currentUserId={-1} />
        )}

        {/* End game button */}
        {gameState.phase !== 'finished' && (
          <button
            onClick={handleFinishGame}
            className="w-full mt-6 py-3 rounded-lg font-semibold text-sm transition-all cursor-pointer
              bg-red-600/80 hover:bg-red-500 text-white"
          >
            Terminar Juego
          </button>
        )}
      </div>
    );
  };

  const renderGameHistory = () => (
    <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg animate-fade-in-up">
      <h2 className="text-lg font-semibold text-white mb-4">
        Historial de Juegos
      </h2>

      {gameHistory.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">
          No hay juegos anteriores
        </p>
      ) : (
        <ul className="space-y-2">
          {gameHistory.map((game) => (
            <li key={game.id}>
              <Link
                href={`/results/${game.id}`}
                className="flex items-center justify-between px-4 py-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-colors"
              >
                <span className="text-gray-300 text-sm">
                  {new Date(game.createdAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="text-cyan-400 text-sm">
                  {game.participantCount} jugador
                  {game.participantCount !== 1 ? 'es' : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // ---- Main layout ----
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* SSE error display */}
      {sseError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {sseError}
        </div>
      )}

      {/* Section 1: Lobby or Active Game */}
      {gameActive ? renderActiveGame() : renderLobby()}

      {/* Section 2: Global Leaderboard */}
      <GlobalLeaderboard />

      {/* Section 3: Game History */}
      {renderGameHistory()}
    </div>
  );
}
