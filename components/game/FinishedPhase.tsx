'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { LeaderboardEntry } from '@/lib/game/types';

// ============================================
// Types
// ============================================

interface Props {
  gameId: number;
  leaderboard: LeaderboardEntry[];
  currentUserId: number;
}

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

interface DetailedResults {
  leaderboard: LeaderboardEntry[];
  questions: QuestionResult[];
  phase: string;
}

interface PlayerStats {
  userId: number;
  username: string;
  score: number;
  rank: number;
  correctCount: number;
  totalAnswered: number;
  totalQuestions: number;
  accuracy: number;
  unansweredCount: number;
}

// ============================================
// Hooks
// ============================================

function useCountUp(target: number, duration: number = 1500): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

// ============================================
// Constants
// ============================================

const answerLabels = ['A', 'B', 'C', 'D'];

const medalEmojis: Record<number, string> = {
  1: '\uD83E\uDD47',
  2: '\uD83E\uDD48',
  3: '\uD83E\uDD49',
};

const medalColors: Record<number, string> = {
  1: 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_20px_rgba(255,200,0,0.15)]',
  2: 'border-cyan-500 bg-cyan-500/10',
  3: 'border-purple-500 bg-purple-500/10',
};

const podiumColors: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: 'bg-yellow-500/10', border: 'border-yellow-500', text: 'text-yellow-400' },
  2: { bg: 'bg-cyan-500/10', border: 'border-cyan-500', text: 'text-cyan-400' },
  3: { bg: 'bg-purple-500/10', border: 'border-purple-500', text: 'text-purple-400' },
};

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-500/20 text-green-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  hard: 'bg-red-500/20 text-red-400',
};

// ============================================
// Skeleton component
// ============================================

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-700/50 rounded animate-pulse ${className}`} />;
}

// ============================================
// Main component
// ============================================

export default function FinishedPhase({
  gameId,
  leaderboard,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [detailedResults, setDetailedResults] = useState<DetailedResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [barsVisible, setBarsVisible] = useState(false);

  // Fetch detailed results on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchResults() {
      try {
        const res = await fetch(`/api/game/${gameId}/results`);
        if (!res.ok) throw new Error('Error al cargar resultados');
        const data = await res.json();
        if (!cancelled) {
          setDetailedResults(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setFetchError('No se pudieron cargar los resultados detallados');
          setLoading(false);
        }
      }
    }
    fetchResults();
    return () => { cancelled = true; };
  }, [gameId]);

  // Trigger bar grow animation after data loads
  useEffect(() => {
    if (detailedResults) {
      const timer = setTimeout(() => setBarsVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, [detailedResults]);

  // Derive player stats from detailed results
  const playerStats: PlayerStats[] = useMemo(() => {
    if (!detailedResults) return [];
    const statsMap = new Map<number, PlayerStats>();

    for (const entry of leaderboard) {
      statsMap.set(entry.userId, {
        userId: entry.userId,
        username: entry.username,
        score: entry.score,
        rank: entry.rank,
        correctCount: 0,
        totalAnswered: 0,
        totalQuestions: detailedResults.questions.length,
        accuracy: 0,
        unansweredCount: 0,
      });
    }

    for (const q of detailedResults.questions) {
      for (const pr of q.playerResults) {
        const stats = statsMap.get(pr.userId);
        if (!stats) continue;
        if (pr.isCorrect) stats.correctCount++;
        if (pr.answerIndex !== null) {
          stats.totalAnswered++;
        } else {
          stats.unansweredCount++;
        }
      }
    }

    for (const stats of statsMap.values()) {
      stats.accuracy = stats.totalAnswered > 0
        ? (stats.correctCount / stats.totalAnswered) * 100
        : 0;
    }

    return Array.from(statsMap.values()).sort((a, b) => a.rank - b.rank);
  }, [detailedResults, leaderboard]);

  const toggleQuestion = useCallback((index: number) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const winner = leaderboard[0];
  const isWinner = winner?.userId === currentUserId;
  const maxScore = leaderboard[0]?.score ?? 1;
  const animatedWinnerScore = useCountUp(winner?.score ?? 0, 1500);

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up pb-12">
      {/* Confetti celebration */}
      <div className="confetti-container">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="confetti-piece" />
        ))}
      </div>

      {/* ========== Section 1: Hero / Winner ========== */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gradient-animated animate-glow-pulse mb-2">
          Desafio Completado
        </h2>

        {winner && (
          <p className="text-lg text-gray-300 animate-trophy-bounce">
            {isWinner ? (
              <span className="text-yellow-400">!Ganaste!</span>
            ) : (
              <>
                Ganador:{' '}
                <span className="text-yellow-400 font-semibold">
                  {winner.username}
                </span>{' '}
                con{' '}
                <span className="font-mono text-yellow-400">
                  {(animatedWinnerScore / 10).toFixed(1)}
                </span>{' '}
                puntos
              </>
            )}
          </p>
        )}
      </div>

      {/* ========== Section 2: Visual Podium (Top 3) ========== */}
      {leaderboard.length >= 2 && (
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row items-end justify-center gap-3 sm:gap-4">
            {/* 2nd place */}
            {leaderboard[1] && (
              <PodiumBlock
                entry={leaderboard[1]}
                position={2}
                height="h-20"
                currentUserId={currentUserId}
                delay={1}
              />
            )}
            {/* 1st place */}
            <PodiumBlock
              entry={leaderboard[0]}
              position={1}
              height="h-28"
              currentUserId={currentUserId}
              delay={0}
            />
            {/* 3rd place */}
            {leaderboard[2] && (
              <PodiumBlock
                entry={leaderboard[2]}
                position={3}
                height="h-16"
                currentUserId={currentUserId}
                delay={2}
              />
            )}
          </div>
        </div>
      )}

      {/* ========== Section 3: Full Leaderboard ========== */}
      <div className="mb-10">
        <h3 className="text-lg font-semibold text-cyan-400 uppercase tracking-wider mb-4">
          Clasificacion Final
        </h3>
        <div className="space-y-2">
          {leaderboard.map((entry, index) => {
            const isMe = entry.userId === currentUserId;
            return (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 p-4 rounded-lg border card-hover-lift animate-stagger-in ${
                  medalColors[entry.rank] || 'border-gray-700 bg-gray-800/50'
                } ${isMe ? 'ring-1 ring-cyan-400' : ''}`}
                style={{ '--i': index } as React.CSSProperties}
              >
                <span className="text-2xl w-10 text-center">
                  {medalEmojis[entry.rank] || `#${entry.rank}`}
                </span>
                <span
                  className={`flex-1 text-left ${isMe ? 'text-white font-semibold' : 'text-gray-300'}`}
                >
                  {entry.username}
                  {isMe && (
                    <span className="ml-2 text-xs text-cyan-400">(tu)</span>
                  )}
                </span>
                {/* Score bar */}
                <div className="hidden sm:block flex-1 max-w-32">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-700"
                      style={{ width: `${(entry.score / maxScore) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="font-mono text-lg text-yellow-400 font-bold">
                  {(entry.score / 10).toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========== Sections 4-6: Detailed (after fetch) ========== */}
      {loading && (
        <div className="space-y-6 mb-10">
          <div>
            <Skeleton className="h-5 w-48 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {fetchError && (
        <p className="text-center text-gray-500 text-sm mb-8">{fetchError}</p>
      )}

      {detailedResults && (
        <div className="animate-fade-in-up">
          {/* ========== Section 4: Player Stats Cards ========== */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-purple-400 uppercase tracking-wider mb-4">
              Estadisticas de Jugadores
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {playerStats.map((stats, index) => {
                const isMe = stats.userId === currentUserId;
                return (
                  <div
                    key={stats.userId}
                    className={`p-4 bg-gray-800/50 border rounded-lg animate-stagger-in ${
                      isMe ? 'ring-1 ring-cyan-400 border-cyan-500/30' : 'border-gray-700'
                    }`}
                    style={{ '--i': index } as React.CSSProperties}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`font-semibold ${isMe ? 'text-white' : 'text-gray-200'}`}>
                        {stats.username}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        podiumColors[stats.rank]
                          ? `${podiumColors[stats.rank].bg} ${podiumColors[stats.rank].text}`
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        #{stats.rank}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Correctas</span>
                        <span className="text-green-400 font-mono">
                          {stats.correctCount}/{stats.totalQuestions}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Precision</span>
                        <span className="text-cyan-400 font-mono">
                          {stats.totalAnswered > 0 ? `${stats.accuracy.toFixed(0)}%` : 'N/A'}
                        </span>
                      </div>
                      {stats.unansweredCount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Sin respuesta</span>
                          <span className="text-gray-500 font-mono">{stats.unansweredCount}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Puntuacion</span>
                        <span className="text-yellow-400 font-mono font-bold">
                          {(stats.score / 10).toFixed(1)} pts
                        </span>
                      </div>
                      {/* Accuracy bar */}
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-700"
                          style={{ width: barsVisible ? `${stats.totalAnswered > 0 ? stats.accuracy : 0}%` : '0%' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========== Section 5: Question Breakdown ========== */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-purple-400 uppercase tracking-wider mb-4">
              Desglose de Preguntas
            </h3>
            <div className="space-y-2">
              {detailedResults.questions.map((q, index) => {
                const correctCount = q.playerResults.filter(pr => pr.isCorrect).length;
                const totalPlayers = q.playerResults.length;
                const isExpanded = expandedQuestions.has(index);

                return (
                  <div
                    key={q.questionId}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden animate-stagger-in"
                    style={{ '--i': index } as React.CSSProperties}
                  >
                    {/* Collapsed header — always visible */}
                    <button
                      onClick={() => toggleQuestion(index)}
                      className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-700/30 transition-colors cursor-pointer"
                    >
                      <span className="text-gray-500 text-sm font-mono shrink-0">
                        Q{q.index + 1}.
                      </span>
                      <span className="text-white text-sm flex-1 line-clamp-1">
                        {q.questionText}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${difficultyColors[q.difficulty] || 'bg-gray-700 text-gray-400'}`}>
                          {q.difficulty}
                        </span>
                        <span className={`text-xs font-mono ${
                          correctCount > totalPlayers / 2 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {correctCount}/{totalPlayers}
                        </span>
                        <span className={`text-gray-500 text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </div>
                    </button>

                    {/* Expanded detail */}
                    <div className={`question-collapse ${isExpanded ? 'expanded' : ''}`}>
                      <div>
                        <div className="px-4 pb-4 border-t border-gray-700/50 pt-3">
                          <p className="text-sm text-white mb-2">{q.questionText}</p>
                          <div className="flex gap-1 mb-3">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                              {q.category}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${difficultyColors[q.difficulty] || 'bg-gray-700 text-gray-400'}`}>
                              {q.difficulty}
                            </span>
                          </div>
                          <p className="text-xs text-green-400 mb-3">
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
                                {pr.isCorrect ? ' \u2713' : pr.answerIndex !== null ? ' \u2717' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========== Section 6: Player Comparison ========== */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-cyan-400 uppercase tracking-wider mb-4">
              Comparacion de Rendimiento
            </h3>
            <div className="space-y-6">
              {/* Correct answers */}
              <ComparisonMetric
                label="Respuestas Correctas"
                players={playerStats}
                getValue={(s) => s.correctCount}
                getMax={(s) => s.totalQuestions}
                formatValue={(s) => `${s.correctCount}/${s.totalQuestions}`}
                colorClass="from-green-500 to-green-400"
                currentUserId={currentUserId}
                barsVisible={barsVisible}
              />

              {/* Total score */}
              <ComparisonMetric
                label="Puntuacion Total"
                players={playerStats}
                getValue={(s) => s.score}
                getMax={() => maxScore || 1}
                formatValue={(s) => `${(s.score / 10).toFixed(1)}`}
                colorClass="from-cyan-500 to-purple-500"
                currentUserId={currentUserId}
                barsVisible={barsVisible}
              />

              {/* Accuracy */}
              <ComparisonMetric
                label="Precision"
                players={playerStats}
                getValue={(s) => s.accuracy}
                getMax={() => 100}
                formatValue={(s) => s.totalAnswered > 0 ? `${s.accuracy.toFixed(0)}%` : 'N/A'}
                colorClass="from-yellow-500 to-yellow-400"
                currentUserId={currentUserId}
                barsVisible={barsVisible}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========== Footer ========== */}
      <div className="text-center">
        <button
          onClick={() => router.push('/')}
          className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Volver a la Sala de Espera
        </button>
      </div>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function PodiumBlock({
  entry,
  position,
  height,
  currentUserId,
  delay,
}: {
  entry: LeaderboardEntry;
  position: number;
  height: string;
  currentUserId: number;
  delay: number;
}) {
  const colors = podiumColors[position] ?? { bg: 'bg-gray-800', border: 'border-gray-700', text: 'text-gray-400' };
  const isMe = entry.userId === currentUserId;
  const animatedScore = useCountUp(entry.score, 1500);

  return (
    <div
      className={`flex flex-col items-center w-full sm:w-28 animate-stagger-in`}
      style={{ '--i': delay } as React.CSSProperties}
    >
      <span className="text-2xl mb-1">{medalEmojis[position]}</span>
      <span className={`text-sm font-semibold truncate max-w-full ${isMe ? 'text-white' : 'text-gray-300'}`}>
        {entry.username}
      </span>
      <span className="text-xs font-mono text-yellow-400 mb-1">
        {(animatedScore / 10).toFixed(1)}
      </span>
      <div
        className={`w-full ${height} rounded-t-lg border-t-2 ${colors.border} ${colors.bg} ${
          isMe ? 'ring-1 ring-cyan-400' : ''
        }`}
      />
    </div>
  );
}

function ComparisonMetric({
  label,
  players,
  getValue,
  getMax,
  formatValue,
  colorClass,
  currentUserId,
  barsVisible,
}: {
  label: string;
  players: PlayerStats[];
  getValue: (s: PlayerStats) => number;
  getMax: (s: PlayerStats) => number;
  formatValue: (s: PlayerStats) => string;
  colorClass: string;
  currentUserId: number;
  barsVisible: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="space-y-1.5">
        {players.map((stats) => {
          const value = getValue(stats);
          const max = getMax(stats);
          const pct = max > 0 ? (value / max) * 100 : 0;
          const isMe = stats.userId === currentUserId;

          return (
            <div key={stats.userId} className="flex items-center gap-2">
              <span className={`w-20 truncate text-xs ${isMe ? 'text-white font-semibold' : 'text-gray-400'}`}>
                {stats.username}
              </span>
              <div className="flex-1 h-5 bg-gray-700/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-700 ease-out ${
                    isMe ? 'shadow-[0_0_8px_rgba(0,255,255,0.3)]' : ''
                  }`}
                  style={{ width: barsVisible ? `${Math.max(pct, 2)}%` : '0%' }}
                />
              </div>
              <span className="text-xs font-mono text-gray-300 w-12 text-right">
                {formatValue(stats)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
