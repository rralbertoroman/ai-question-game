import { db, questions } from '../lib/db';
import { asc } from 'drizzle-orm';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function exportQuestions() {
  const outPath = process.argv[2]
    ? resolve(process.argv[2])
    : resolve(__dirname, '../data/questions.json');

  // ── Query all questions ───────────────────────────────────────
  const rows = await db
    .select({
      questionText: questions.questionText,
      answers: questions.answers,
      correctIndex: questions.correctIndex,
      difficulty: questions.difficulty,
      category: questions.category,
    })
    .from(questions)
    .orderBy(asc(questions.id));

  if (rows.length === 0) {
    console.error('No questions found in the database');
    process.exit(1);
  }

  // ── Map to JSON format ────────────────────────────────────────
  const data = rows.map((r) => ({
    question: r.questionText,
    answers: r.answers,
    correctIndex: r.correctIndex,
    difficulty: r.difficulty,
    category: r.category,
  }));

  // ── Write file ────────────────────────────────────────────────
  writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`Wrote ${data.length} questions to ${outPath}`);

  // ── Summary ───────────────────────────────────────────────────
  const categoryCounts = data.reduce((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const difficultyCounts = data.reduce((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n  By category:');
  for (const [cat, count] of Object.entries(categoryCounts).sort()) {
    console.log(`    ${cat}: ${count}`);
  }

  console.log('\n  By difficulty:');
  for (const [diff, count] of Object.entries(difficultyCounts).sort()) {
    const pct = ((count / data.length) * 100).toFixed(1);
    console.log(`    ${diff}: ${count} (${pct}%)`);
  }

  process.exit(0);
}

exportQuestions();
