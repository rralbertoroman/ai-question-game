import { db, questions } from '../lib/db';
import { games } from '../lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

interface QuestionData {
  question: string;
  answers: string[];
  correctIndex: number;
  difficulty: string;
  category: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function refreshQuestions() {
  const filePath = process.argv[2]
    ? resolve(process.argv[2])
    : resolve(__dirname, '../data/questions.json');

  console.log(`Reading questions from: ${filePath}`);

  // ── Step 1: Read and validate JSON ──────────────────────────────
  let questionsData: QuestionData[];
  try {
    const raw = readFileSync(filePath, 'utf-8');
    questionsData = JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to read ${filePath}:`, err);
    process.exit(1);
  }

  if (!Array.isArray(questionsData)) {
    console.error('JSON file must contain an array of questions');
    process.exit(1);
  }

  for (const [i, q] of questionsData.entries()) {
    if (!q.question || !Array.isArray(q.answers) || q.answers.length !== 4) {
      console.error(`Invalid question at index ${i}: missing fields or wrong answer count`);
      process.exit(1);
    }
    if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) {
      console.error(`Invalid correctIndex at index ${i}: ${q.correctIndex}`);
      process.exit(1);
    }
    if (!q.difficulty || !q.category) {
      console.error(`Missing difficulty or category at index ${i}`);
      process.exit(1);
    }
  }

  console.log(`Validated ${questionsData.length} questions from file`);

  // ── Step 2: Warn about active games ─────────────────────────────
  const activeGames = await db.select().from(games).where(eq(games.status, 'playing'));

  if (activeGames.length > 0) {
    console.warn(`\nWARNING: ${activeGames.length} game(s) currently active:`);
    for (const game of activeGames) {
      console.warn(`  - Game #${game.id}`);
    }
    console.warn('Deleting questions will affect these in-progress games!\n');
  }

  // ── Step 3: Delete all existing questions ───────────────────────
  const existingCount = await db.select({ count: sql<number>`count(*)` }).from(questions);
  const deletedCount = Number(existingCount[0].count);

  await db.delete(questions);
  console.log(`Deleted ${deletedCount} existing questions`);

  // ── Step 4: Insert all questions from JSON ──────────────────────
  const inserted = await db.insert(questions).values(
    questionsData.map((q) => ({
      questionText: q.question,
      answers: q.answers,
      correctIndex: q.correctIndex,
      difficulty: q.difficulty,
      category: q.category,
    }))
  ).returning();

  console.log(`Inserted ${inserted.length} new questions`);

  // ── Step 5: Print summary ───────────────────────────────────────
  console.log('\n--- Summary ---');
  console.log(`  Deleted:  ${deletedCount}`);
  console.log(`  Inserted: ${inserted.length}`);

  const categoryCounts = questionsData.reduce((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n  By category:');
  for (const [cat, count] of Object.entries(categoryCounts).sort()) {
    console.log(`    ${cat}: ${count}`);
  }

  const difficultyCounts = questionsData.reduce((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n  By difficulty:');
  for (const [diff, count] of Object.entries(difficultyCounts).sort()) {
    const pct = ((count / questionsData.length) * 100).toFixed(1);
    console.log(`    ${diff}: ${count} (${pct}%)`);
  }

  console.log(`\n  Total questions in database: ${inserted.length}`);
  process.exit(0);
}

refreshQuestions();
