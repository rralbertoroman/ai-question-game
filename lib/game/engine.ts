import { db } from '@/lib/db';
import {
  games,
  gameParticipants,
  gameStates,
  questions,
  playerAnswers,
  scores,
  users,
} from '@/lib/db/schema';
import { eq, and, sql, inArray, gt } from 'drizzle-orm';
import { getParticipantCount } from '@/lib/db/repositories/participants';
import { findPlayerAnswer, getAnswerCount, getQuestionAnswersWithUsers } from '@/lib/db/repositories/answers';
import { GAME_CONFIG } from './config';
import {
  getShufflePermutation,
  shuffleAnswers,
  originalToShuffled,
  shuffledToOriginal,
} from './shuffle';
import type {
  GameStateResponse,
  QuestionState,
  SummaryState,
  LeaderboardEntry,
  PlayerQuestionResult,
  GlobalLeaderboardEntry,
} from './types';

// ============================================
// QUESTION SELECTION
// ============================================

export async function selectQuestionsForGame(
  count: number = GAME_CONFIG.QUESTIONS_PER_GAME
): Promise<number[]> {
  const allQuestions = await db
    .select({ id: questions.id })
    .from(questions);

  const ids = allQuestions.map((q) => q.id);

  // Fisher-Yates shuffle
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  return ids.slice(0, Math.min(count, ids.length));
}

// ============================================
// ACTIVE GAME LOOKUP
// ============================================

export async function getActiveGame(): Promise<{ id: number } | null> {
  const game = await db.query.games.findFirst({
    where: eq(games.status, 'playing'),
    orderBy: (games, { desc }) => [desc(games.id)],
  });
  return game ? { id: game.id } : null;
}

// ============================================
// ONLINE PLAYERS
// ============================================

export async function getOnlinePlayers(): Promise<{ id: number; username: string }[]> {
  const threshold = new Date(Date.now() - GAME_CONFIG.HEARTBEAT_TIMEOUT_SECONDS * 1000);
  return db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(and(
      eq(users.role, 'candidate'),
      gt(users.lastActiveAt, threshold)
    ));
}

// ============================================
// GAME INITIALIZATION
// ============================================

export async function initializeGame(playerIds: number[]): Promise<number> {
  if (playerIds.length < 2) {
    throw new Error('Se necesitan al menos 2 participantes para iniciar');
  }

  const questionOrder = await selectQuestionsForGame();

  return await db.transaction(async (tx) => {
    const [game] = await tx.insert(games).values({ status: 'playing' }).returning();

    await tx.insert(gameParticipants).values(
      playerIds.map((userId) => ({ gameId: game.id, userId }))
    );

    await tx.insert(gameStates).values({
      gameId: game.id,
      currentQuestionIndex: 0,
      questionOrder,
      questionStartTime: new Date(),
      phase: 'question',
    });

    await tx.insert(scores).values(
      playerIds.map((userId) => ({ gameId: game.id, userId, score: 0 }))
    );

    return game.id;
  });
}

// ============================================
// FORCE FINISH
// ============================================

export async function finishGame(gameId: number): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(gameStates)
      .set({ phase: 'finished', updatedAt: new Date() })
      .where(eq(gameStates.gameId, gameId));

    await tx
      .update(games)
      .set({ status: 'finished' })
      .where(eq(games.id, gameId));
  });
}

// ============================================
// SCORING
// ============================================

export function calculatePoints(
  isCorrect: boolean,
  elapsedSeconds: number
): number {
  if (!isCorrect) return 0;
  const base = GAME_CONFIG.POINTS_CORRECT * 10;
  const bonusFraction = Math.max(
    0,
    1 - elapsedSeconds / GAME_CONFIG.QUESTION_TIME_LIMIT_SECONDS
  );
  const bonus = Math.round(
    GAME_CONFIG.POINTS_SPEED_BONUS_MAX * 10 * bonusFraction
  );
  return base + bonus;
}

// ============================================
// ANSWER SUBMISSION
// ============================================

export async function submitAnswer(
  gameId: number,
  userId: number,
  answerIndex: number
): Promise<{ isCorrect: boolean; pointsAwarded: number }> {
  const gameState = await db.query.gameStates.findFirst({
    where: eq(gameStates.gameId, gameId),
  });

  if (!gameState || gameState.phase !== 'question') {
    throw new Error('No está en fase de pregunta');
  }

  const questionOrder = gameState.questionOrder as number[];
  const currentQuestionId = questionOrder[gameState.currentQuestionIndex];

  // Check if already answered
  const existing = await findPlayerAnswer(gameId, userId, currentQuestionId);

  if (existing) {
    throw new Error('Ya respondiste esta pregunta');
  }

  // Check time limit
  const elapsed =
    (Date.now() - new Date(gameState.questionStartTime!).getTime()) / 1000;
  if (elapsed > GAME_CONFIG.QUESTION_TIME_LIMIT_SECONDS) {
    throw new Error('Tiempo agotado');
  }

  // Get the question
  const question = await db.query.questions.findFirst({
    where: eq(questions.id, currentQuestionId),
  });

  if (!question) {
    throw new Error('Pregunta no encontrada');
  }

  // Un-shuffle the player's answer from display space back to original DB space
  const permutation = getShufflePermutation(currentQuestionId, gameId);
  const originalAnswerIndex = shuffledToOriginal(answerIndex, permutation);

  const isCorrect = originalAnswerIndex === question.correctIndex;
  const pointsAwarded = calculatePoints(isCorrect, elapsed);

  await db.transaction(async (tx) => {
    await tx.insert(playerAnswers).values({
      gameId,
      userId,
      questionId: currentQuestionId,
      answerIndex: originalAnswerIndex,
      isCorrect,
    });

    if (pointsAwarded > 0) {
      await tx
        .update(scores)
        .set({ score: sql`${scores.score} + ${pointsAwarded}`, updatedAt: new Date() })
        .where(and(eq(scores.gameId, gameId), eq(scores.userId, userId)));
    }
  });

  // Check if all players answered — if so, transition to summary
  await checkAndTransitionToSummary(gameId);

  return { isCorrect, pointsAwarded };
}

// ============================================
// STATE RESOLUTION (LAZY EVALUATION)
// ============================================

async function checkAndTransitionToSummary(gameId: number): Promise<void> {
  const gameState = await db.query.gameStates.findFirst({
    where: eq(gameStates.gameId, gameId),
  });

  if (!gameState || gameState.phase !== 'question') return;

  const questionOrder = gameState.questionOrder as number[];
  const currentQuestionId = questionOrder[gameState.currentQuestionIndex];

  const participantTotal = await getParticipantCount(gameId);
  const answerTotal = await getAnswerCount(gameId, currentQuestionId);

  if (answerTotal >= participantTotal) {
    await db
      .update(gameStates)
      .set({
        phase: 'summary',
        questionStartTime: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(gameStates.gameId, gameId));
  }
}

async function handleTimeExpiry(gameId: number): Promise<void> {
  const gameState = await db.query.gameStates.findFirst({
    where: eq(gameStates.gameId, gameId),
  });

  if (!gameState || gameState.phase !== 'question') return;

  const elapsed =
    (Date.now() - new Date(gameState.questionStartTime!).getTime()) / 1000;
  if (elapsed <= GAME_CONFIG.QUESTION_TIME_LIMIT_SECONDS) return;

  const questionOrder = gameState.questionOrder as number[];
  const currentQuestionId = questionOrder[gameState.currentQuestionIndex];

  if (currentQuestionId === undefined) {
    // Index out of bounds — transition to finished
    await finishGame(gameId);
    return;
  }

  // Get participants who haven't answered
  const participants = await db
    .select({ userId: gameParticipants.userId })
    .from(gameParticipants)
    .where(eq(gameParticipants.gameId, gameId));

  const answered = await db
    .select({ userId: playerAnswers.userId })
    .from(playerAnswers)
    .where(
      and(
        eq(playerAnswers.gameId, gameId),
        eq(playerAnswers.questionId, currentQuestionId)
      )
    );

  const answeredUserIds = new Set(answered.map((a) => a.userId));
  const unanswered = participants.filter((p) => !answeredUserIds.has(p.userId));

  await db.transaction(async (tx) => {
    // Insert timeout answers for non-responders
    if (unanswered.length > 0) {
      await tx.insert(playerAnswers).values(
        unanswered.map((p) => ({
          gameId,
          userId: p.userId,
          questionId: currentQuestionId,
          answerIndex: null,
          isCorrect: false,
        }))
      );
    }

    // Transition to summary
    await tx
      .update(gameStates)
      .set({
        phase: 'summary',
        questionStartTime: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(gameStates.gameId, gameId));
  });
}

async function handleSummaryExpiry(gameId: number): Promise<void> {
  const gameState = await db.query.gameStates.findFirst({
    where: eq(gameStates.gameId, gameId),
  });

  if (!gameState || gameState.phase !== 'summary') return;

  const elapsed =
    (Date.now() - new Date(gameState.questionStartTime!).getTime()) / 1000;
  if (elapsed <= GAME_CONFIG.SUMMARY_DISPLAY_SECONDS) return;

  const questionOrder = gameState.questionOrder as number[];
  const nextIndex = gameState.currentQuestionIndex + 1;

  if (nextIndex >= questionOrder.length) {
    // Game finished
    await finishGame(gameId);
  } else {
    // Next question
    await db
      .update(gameStates)
      .set({
        currentQuestionIndex: nextIndex,
        phase: 'question',
        questionStartTime: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(gameStates.gameId, gameId));
  }
}

// ============================================
// RESOLVE GAME STATE (main polling handler)
// ============================================

export async function resolveGameState(
  gameId: number,
  userId: number
): Promise<GameStateResponse> {
  // Trigger any pending transitions
  await handleTimeExpiry(gameId);
  await handleSummaryExpiry(gameId);

  const gameState = await db.query.gameStates.findFirst({
    where: eq(gameStates.gameId, gameId),
  });

  if (!gameState) {
    throw new Error('Juego no encontrado');
  }

  const questionOrder = gameState.questionOrder as number[];
  const leaderboard = await getLeaderboard(gameId);

  // Check if user is a participant
  const participant = await db.query.gameParticipants.findFirst({
    where: and(
      eq(gameParticipants.gameId, gameId),
      eq(gameParticipants.userId, userId)
    ),
  });
  const isParticipant = !!participant;

  const shared = {
    gameId,
    currentQuestionIndex: gameState.currentQuestionIndex,
    totalQuestions: questionOrder.length,
    leaderboard,
    isParticipant,
  };

  if (gameState.phase === 'question') {
    const currentQuestionId = questionOrder[gameState.currentQuestionIndex];
    const question = await db.query.questions.findFirst({
      where: eq(questions.id, currentQuestionId),
    });

    if (!question) throw new Error('Pregunta no encontrada');

    const permutation = getShufflePermutation(currentQuestionId, gameId);

    const elapsed =
      (Date.now() - new Date(gameState.questionStartTime!).getTime()) / 1000;
    const timeRemainingMs = Math.max(
      0,
      (GAME_CONFIG.QUESTION_TIME_LIMIT_SECONDS - elapsed) * 1000
    );

    const totalPlayers = await getParticipantCount(gameId);
    const answeredCount = await getAnswerCount(gameId, currentQuestionId);

    // For participants, check their own answer state
    let hasAnswered = false;
    let selectedAnswerIndex: number | null = null;

    if (isParticipant) {
      const existingAnswer = await findPlayerAnswer(gameId, userId, currentQuestionId);
      hasAnswered = !!existingAnswer;
      selectedAnswerIndex = existingAnswer?.answerIndex != null
        ? originalToShuffled(existingAnswer.answerIndex, permutation)
        : null;
    } else {
      // Non-participants see read-only (buttons disabled)
      hasAnswered = true;
      selectedAnswerIndex = null;
    }

    return {
      ...shared,
      phase: 'question',
      timeRemainingMs,
      question: {
        id: question.id,
        text: question.questionText,
        answers: shuffleAnswers(question.answers as string[], permutation),
        difficulty: question.difficulty,
        category: question.category,
      },
      hasAnswered,
      selectedAnswerIndex,
      answeredCount,
      totalPlayers,
    } satisfies QuestionState;
  }

  if (gameState.phase === 'summary') {
    const currentQuestionId = questionOrder[gameState.currentQuestionIndex];
    const question = await db.query.questions.findFirst({
      where: eq(questions.id, currentQuestionId),
    });

    if (!question) throw new Error('Pregunta no encontrada');

    const permutation = getShufflePermutation(currentQuestionId, gameId);

    const elapsed =
      (Date.now() - new Date(gameState.questionStartTime!).getTime()) / 1000;
    const timeRemainingMs = Math.max(
      0,
      (GAME_CONFIG.SUMMARY_DISPLAY_SECONDS - elapsed) * 1000
    );

    const answers = await getQuestionAnswersWithUsers(gameId, currentQuestionId);

    const playerResults: PlayerQuestionResult[] = answers.map((a) => ({
      userId: a.userId,
      username: a.username,
      answerIndex: a.answerIndex != null
        ? originalToShuffled(a.answerIndex, permutation)
        : null,
      isCorrect: a.isCorrect,
      pointsAwarded: 0,
    }));

    return {
      ...shared,
      phase: 'summary',
      timeRemainingMs,
      summary: {
        questionText: question.questionText,
        answers: shuffleAnswers(question.answers as string[], permutation),
        correctIndex: originalToShuffled(question.correctIndex, permutation),
        playerResults,
      },
    } satisfies SummaryState;
  }

  if (gameState.phase === 'finished') {
    return { ...shared, phase: 'finished' };
  }

  // Fallback (should not reach here)
  return { ...shared, phase: 'finished' };
}

// ============================================
// LEADERBOARD
// ============================================

export async function getLeaderboard(
  gameId: number
): Promise<LeaderboardEntry[]> {
  const results = await db
    .select({
      userId: scores.userId,
      username: users.username,
      score: scores.score,
    })
    .from(scores)
    .innerJoin(users, eq(scores.userId, users.id))
    .where(eq(scores.gameId, gameId))
    .orderBy(sql`${scores.score} DESC`);

  return results.map((r, i) => ({
    userId: r.userId,
    username: r.username,
    score: r.score,
    rank: i + 1,
  }));
}

// ============================================
// GLOBAL LEADERBOARD
// ============================================

export async function getGlobalLeaderboard(): Promise<GlobalLeaderboardEntry[]> {
  const results = await db
    .select({
      userId: scores.userId,
      username: users.username,
      totalScore: sql<number>`sum(${scores.score})`.as('total_score'),
      gamesPlayed: sql<number>`count(distinct ${scores.gameId})`.as('games_played'),
    })
    .from(scores)
    .innerJoin(users, eq(scores.userId, users.id))
    .innerJoin(games, eq(scores.gameId, games.id))
    .where(eq(games.status, 'finished'))
    .groupBy(scores.userId, users.username)
    .orderBy(sql`sum(${scores.score}) DESC`);

  return results.map((r, i) => ({
    userId: r.userId,
    username: r.username,
    totalScore: r.totalScore,
    gamesPlayed: r.gamesPlayed,
    rank: i + 1,
  }));
}

// ============================================
// GAME RESULTS
// ============================================

export async function getGameResults(gameId: number) {
  const gameState = await db.query.gameStates.findFirst({
    where: eq(gameStates.gameId, gameId),
  });

  if (!gameState) throw new Error('Juego no encontrado');

  const questionOrder = gameState.questionOrder as number[];
  const leaderboard = await getLeaderboard(gameId);

  // Get all questions for this game
  const gameQuestions = questionOrder.length > 0
    ? await db
        .select()
        .from(questions)
        .where(inArray(questions.id, questionOrder))
    : [];

  // Get all answers for this game
  const allAnswers = await db
    .select({
      userId: playerAnswers.userId,
      username: users.username,
      questionId: playerAnswers.questionId,
      answerIndex: playerAnswers.answerIndex,
      isCorrect: playerAnswers.isCorrect,
    })
    .from(playerAnswers)
    .innerJoin(users, eq(playerAnswers.userId, users.id))
    .where(eq(playerAnswers.gameId, gameId));

  const questionsWithAnswers = questionOrder.map((qId, index) => {
    const q = gameQuestions.find((gq) => gq.id === qId);
    const qAnswers = allAnswers.filter((a) => a.questionId === qId);

    const permutation = getShufflePermutation(qId, gameId);

    return {
      index,
      questionId: qId,
      questionText: q?.questionText ?? '',
      answers: q ? shuffleAnswers(q.answers as string[], permutation) : [],
      correctIndex: q ? originalToShuffled(q.correctIndex, permutation) : 0,
      difficulty: q?.difficulty ?? '',
      category: q?.category ?? '',
      playerResults: qAnswers.map((a) => ({
        userId: a.userId,
        username: a.username,
        answerIndex: a.answerIndex != null
          ? originalToShuffled(a.answerIndex, permutation)
          : null,
        isCorrect: a.isCorrect,
      })),
    };
  });

  return {
    leaderboard,
    questions: questionsWithAnswers,
    phase: gameState.phase,
  };
}

// ============================================
// GAME HISTORY (for admin dashboard)
// ============================================

export async function getGameHistory(limit: number = 20) {
  return db.query.games.findMany({
    where: eq(games.status, 'finished'),
    orderBy: (games, { desc }) => [desc(games.id)],
    limit,
    with: {
      participants: {
        with: { user: { columns: { id: true, username: true } } },
      },
    },
  });
}
