import { db } from '@/lib/db';
import {
  rooms,
  roomParticipants,
  gameStates,
  questions,
  playerAnswers,
  scores,
  users,
} from '@/lib/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
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
// GAME INITIALIZATION
// ============================================

export async function initializeGame(roomId: string): Promise<void> {
  const questionOrder = await selectQuestionsForGame();

  const participants = await db
    .select({ userId: roomParticipants.userId })
    .from(roomParticipants)
    .where(eq(roomParticipants.roomId, roomId));

  if (participants.length < 2) {
    throw new Error('Se necesitan al menos 2 participantes para iniciar');
  }

  await db.transaction(async (tx) => {
    await tx
      .update(rooms)
      .set({ status: 'playing' })
      .where(eq(rooms.id, roomId));

    await tx.insert(gameStates).values({
      roomId,
      currentQuestionIndex: 0,
      questionOrder,
      questionStartTime: new Date(),
      phase: 'question',
    });

    await tx.insert(scores).values(
      participants.map((p) => ({
        roomId,
        userId: p.userId,
        score: 0,
      }))
    );
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
  roomId: string,
  userId: number,
  answerIndex: number
): Promise<{ isCorrect: boolean; pointsAwarded: number }> {
  const gameState = await db.query.gameStates.findFirst({
    where: eq(gameStates.roomId, roomId),
  });

  if (!gameState || gameState.phase !== 'question') {
    throw new Error('No está en fase de pregunta');
  }

  const questionOrder = gameState.questionOrder as number[];
  const currentQuestionId = questionOrder[gameState.currentQuestionIndex];

  // Check if already answered
  const existing = await findPlayerAnswer(roomId, userId, currentQuestionId);

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
  const permutation = getShufflePermutation(currentQuestionId, roomId);
  const originalAnswerIndex = shuffledToOriginal(answerIndex, permutation);

  const isCorrect = originalAnswerIndex === question.correctIndex;
  const pointsAwarded = calculatePoints(isCorrect, elapsed);

  await db.transaction(async (tx) => {
    await tx.insert(playerAnswers).values({
      roomId,
      userId,
      questionId: currentQuestionId,
      answerIndex: originalAnswerIndex,
      isCorrect,
    });

    if (pointsAwarded > 0) {
      await tx
        .update(scores)
        .set({ score: sql`${scores.score} + ${pointsAwarded}`, updatedAt: new Date() })
        .where(and(eq(scores.roomId, roomId), eq(scores.userId, userId)));
    }
  });

  // Check if all players answered — if so, transition to summary
  await checkAndTransitionToSummary(roomId);

  return { isCorrect, pointsAwarded };
}

// ============================================
// STATE RESOLUTION (LAZY EVALUATION)
// ============================================

async function checkAndTransitionToSummary(roomId: string): Promise<void> {
  const gameState = await db.query.gameStates.findFirst({
    where: eq(gameStates.roomId, roomId),
  });

  if (!gameState || gameState.phase !== 'question') return;

  const questionOrder = gameState.questionOrder as number[];
  const currentQuestionId = questionOrder[gameState.currentQuestionIndex];

  const participantTotal = await getParticipantCount(roomId);
  const answerTotal = await getAnswerCount(roomId, currentQuestionId);

  if (answerTotal >= participantTotal) {
    await db
      .update(gameStates)
      .set({
        phase: 'summary',
        questionStartTime: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(gameStates.roomId, roomId));
  }
}

async function handleTimeExpiry(roomId: string): Promise<void> {
  const gameState = await db.query.gameStates.findFirst({
    where: eq(gameStates.roomId, roomId),
  });

  if (!gameState || gameState.phase !== 'question') return;

  const elapsed =
    (Date.now() - new Date(gameState.questionStartTime!).getTime()) / 1000;
  if (elapsed <= GAME_CONFIG.QUESTION_TIME_LIMIT_SECONDS) return;

  const questionOrder = gameState.questionOrder as number[];
  const currentQuestionId = questionOrder[gameState.currentQuestionIndex];

  if (currentQuestionId === undefined) {
    // Index out of bounds — transition to finished
    await db.transaction(async (tx) => {
      await tx
        .update(gameStates)
        .set({ phase: 'finished', updatedAt: new Date() })
        .where(eq(gameStates.roomId, roomId));
      await tx
        .update(rooms)
        .set({ status: 'finished' })
        .where(eq(rooms.id, roomId));
    });
    return;
  }

  // Get participants who haven't answered
  const participants = await db
    .select({ userId: roomParticipants.userId })
    .from(roomParticipants)
    .where(eq(roomParticipants.roomId, roomId));

  const answered = await db
    .select({ userId: playerAnswers.userId })
    .from(playerAnswers)
    .where(
      and(
        eq(playerAnswers.roomId, roomId),
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
          roomId,
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
      .where(eq(gameStates.roomId, roomId));
  });
}

async function handleSummaryExpiry(roomId: string): Promise<void> {
  const gameState = await db.query.gameStates.findFirst({
    where: eq(gameStates.roomId, roomId),
  });

  if (!gameState || gameState.phase !== 'summary') return;

  const elapsed =
    (Date.now() - new Date(gameState.questionStartTime!).getTime()) / 1000;
  if (elapsed <= GAME_CONFIG.SUMMARY_DISPLAY_SECONDS) return;

  const questionOrder = gameState.questionOrder as number[];
  const nextIndex = gameState.currentQuestionIndex + 1;

  if (nextIndex >= questionOrder.length) {
    // Game finished
    await db.transaction(async (tx) => {
      await tx
        .update(gameStates)
        .set({ phase: 'finished', updatedAt: new Date() })
        .where(eq(gameStates.roomId, roomId));

      await tx
        .update(rooms)
        .set({ status: 'finished' })
        .where(eq(rooms.id, roomId));
    });
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
      .where(eq(gameStates.roomId, roomId));
  }
}

// ============================================
// RESOLVE GAME STATE (main polling handler)
// ============================================

export async function resolveGameState(
  roomId: string,
  userId: number
): Promise<GameStateResponse> {
  // Trigger any pending transitions
  await handleTimeExpiry(roomId);
  await handleSummaryExpiry(roomId);

  const gameState = await db.query.gameStates.findFirst({
    where: eq(gameStates.roomId, roomId),
  });

  if (!gameState) {
    throw new Error('Juego no encontrado');
  }

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
  });

  if (!room) {
    throw new Error('Sala no encontrada');
  }

  const questionOrder = gameState.questionOrder as number[];
  const leaderboard = await getLeaderboard(roomId);

  const shared = {
    roomId,
    roomName: room.name,
    currentQuestionIndex: gameState.currentQuestionIndex,
    totalQuestions: questionOrder.length,
    leaderboard,
  };

  if (gameState.phase === 'question') {
    const currentQuestionId = questionOrder[gameState.currentQuestionIndex];
    const question = await db.query.questions.findFirst({
      where: eq(questions.id, currentQuestionId),
    });

    if (!question) throw new Error('Pregunta no encontrada');

    const permutation = getShufflePermutation(currentQuestionId, roomId);

    const elapsed =
      (Date.now() - new Date(gameState.questionStartTime!).getTime()) / 1000;
    const timeRemainingMs = Math.max(
      0,
      (GAME_CONFIG.QUESTION_TIME_LIMIT_SECONDS - elapsed) * 1000
    );

    const existingAnswer = await findPlayerAnswer(roomId, userId, currentQuestionId);
    const totalPlayers = await getParticipantCount(roomId);
    const answeredCount = await getAnswerCount(roomId, currentQuestionId);

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
      hasAnswered: !!existingAnswer,
      selectedAnswerIndex: existingAnswer?.answerIndex != null
        ? originalToShuffled(existingAnswer.answerIndex, permutation)
        : null,
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

    const permutation = getShufflePermutation(currentQuestionId, roomId);

    const elapsed =
      (Date.now() - new Date(gameState.questionStartTime!).getTime()) / 1000;
    const timeRemainingMs = Math.max(
      0,
      (GAME_CONFIG.SUMMARY_DISPLAY_SECONDS - elapsed) * 1000
    );

    const answers = await getQuestionAnswersWithUsers(roomId, currentQuestionId);

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

  return { ...shared, phase: 'waiting' };
}

// ============================================
// ADMIN SUPERVISION (read-only game state)
// ============================================

export async function resolveGameStateForAdmin(
  roomId: string
): Promise<GameStateResponse> {
  await handleTimeExpiry(roomId);
  await handleSummaryExpiry(roomId);

  const gameState = await db.query.gameStates.findFirst({
    where: eq(gameStates.roomId, roomId),
  });

  if (!gameState) throw new Error('Juego no encontrado');

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
  });

  if (!room) throw new Error('Sala no encontrada');

  const questionOrder = gameState.questionOrder as number[];
  const leaderboard = await getLeaderboard(roomId);

  const shared = {
    roomId,
    roomName: room.name,
    currentQuestionIndex: gameState.currentQuestionIndex,
    totalQuestions: questionOrder.length,
    leaderboard,
  };

  if (gameState.phase === 'question') {
    const currentQuestionId = questionOrder[gameState.currentQuestionIndex];
    const question = await db.query.questions.findFirst({
      where: eq(questions.id, currentQuestionId),
    });

    if (!question) throw new Error('Pregunta no encontrada');

    const permutation = getShufflePermutation(currentQuestionId, roomId);

    const elapsed =
      (Date.now() - new Date(gameState.questionStartTime!).getTime()) / 1000;
    const timeRemainingMs = Math.max(
      0,
      (GAME_CONFIG.QUESTION_TIME_LIMIT_SECONDS - elapsed) * 1000
    );

    const totalPlayers = await getParticipantCount(roomId);
    const answeredCount = await getAnswerCount(roomId, currentQuestionId);

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
      hasAnswered: false,
      selectedAnswerIndex: null,
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

    const permutation = getShufflePermutation(currentQuestionId, roomId);

    const elapsed =
      (Date.now() - new Date(gameState.questionStartTime!).getTime()) / 1000;
    const timeRemainingMs = Math.max(
      0,
      (GAME_CONFIG.SUMMARY_DISPLAY_SECONDS - elapsed) * 1000
    );

    const answers = await getQuestionAnswersWithUsers(roomId, currentQuestionId);

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

  return { ...shared, phase: 'waiting' };
}

// ============================================
// LEADERBOARD
// ============================================

export async function getLeaderboard(
  roomId: string
): Promise<LeaderboardEntry[]> {
  const results = await db
    .select({
      userId: scores.userId,
      username: users.username,
      score: scores.score,
    })
    .from(scores)
    .innerJoin(users, eq(scores.userId, users.id))
    .where(eq(scores.roomId, roomId))
    .orderBy(sql`${scores.score} DESC`);

  return results.map((r, i) => ({
    userId: r.userId,
    username: r.username,
    score: r.score,
    rank: i + 1,
  }));
}

// ============================================
// GAME RESULTS
// ============================================

export async function getGameResults(roomId: string) {
  const gameState = await db.query.gameStates.findFirst({
    where: eq(gameStates.roomId, roomId),
  });

  if (!gameState) throw new Error('Juego no encontrado');

  const questionOrder = gameState.questionOrder as number[];
  const leaderboard = await getLeaderboard(roomId);

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
    .where(eq(playerAnswers.roomId, roomId));

  const questionsWithAnswers = questionOrder.map((qId, index) => {
    const q = gameQuestions.find((gq) => gq.id === qId);
    const qAnswers = allAnswers.filter((a) => a.questionId === qId);

    const permutation = getShufflePermutation(qId, roomId);

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
