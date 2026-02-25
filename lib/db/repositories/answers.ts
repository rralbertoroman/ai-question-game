import { db } from '@/lib/db';
import { playerAnswers, users } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';

export async function findPlayerAnswer(gameId: number, userId: number, questionId: number) {
  return db.query.playerAnswers.findFirst({
    where: and(
      eq(playerAnswers.gameId, gameId),
      eq(playerAnswers.userId, userId),
      eq(playerAnswers.questionId, questionId)
    ),
  });
}

export async function getAnswerCount(gameId: number, questionId: number): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(playerAnswers)
    .where(and(
      eq(playerAnswers.gameId, gameId),
      eq(playerAnswers.questionId, questionId)
    ));
  return result.count;
}

export async function getQuestionAnswersWithUsers(gameId: number, questionId: number) {
  return db
    .select({
      userId: playerAnswers.userId,
      username: users.username,
      answerIndex: playerAnswers.answerIndex,
      isCorrect: playerAnswers.isCorrect,
    })
    .from(playerAnswers)
    .innerJoin(users, eq(playerAnswers.userId, users.id))
    .where(and(
      eq(playerAnswers.gameId, gameId),
      eq(playerAnswers.questionId, questionId)
    ));
}
