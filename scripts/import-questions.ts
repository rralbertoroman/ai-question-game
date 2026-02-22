import { db, questions } from '../lib/db';
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

async function importQuestions() {
  const filePath = process.argv[2]
    ? resolve(process.argv[2])
    : resolve(__dirname, '../data/questions.json');

  console.log(`📂 Reading questions from: ${filePath}`);

  let questionsData: QuestionData[];
  try {
    const raw = readFileSync(filePath, 'utf-8');
    questionsData = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ Failed to read ${filePath}:`, err);
    process.exit(1);
  }

  if (!Array.isArray(questionsData)) {
    console.error('❌ JSON file must contain an array of questions');
    process.exit(1);
  }

  // Validate structure
  for (const [i, q] of questionsData.entries()) {
    if (!q.question || !Array.isArray(q.answers) || q.answers.length !== 4) {
      console.error(`❌ Invalid question at index ${i}: missing fields or wrong answer count`);
      process.exit(1);
    }
    if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) {
      console.error(`❌ Invalid correctIndex at index ${i}: ${q.correctIndex}`);
      process.exit(1);
    }
    if (!q.difficulty || !q.category) {
      console.error(`❌ Missing difficulty or category at index ${i}`);
      process.exit(1);
    }
  }

  console.log(`✅ Validated ${questionsData.length} questions from file`);

  // Fetch existing questions for duplicate detection
  const existing = await db.select({ questionText: questions.questionText }).from(questions);
  const existingTexts = new Set(existing.map((e) => e.questionText));

  const toInsert: QuestionData[] = [];
  const skipped: string[] = [];

  for (const q of questionsData) {
    if (existingTexts.has(q.question)) {
      skipped.push(q.question);
    } else {
      toInsert.push(q);
    }
  }

  if (toInsert.length > 0) {
    const inserted = await db.insert(questions).values(
      toInsert.map((q) => ({
        questionText: q.question,
        answers: q.answers,
        correctIndex: q.correctIndex,
        difficulty: q.difficulty,
        category: q.category,
      }))
    ).returning();

    console.log(`\n✅ Inserted ${inserted.length} new questions`);
  } else {
    console.log('\nℹ️  No new questions to insert');
  }

  if (skipped.length > 0) {
    console.log(`⏭️  Skipped ${skipped.length} duplicate(s):`);
    skipped.forEach((t) => console.log(`   - ${t.substring(0, 80)}${t.length > 80 ? '...' : ''}`));
  }

  // Summary by category and difficulty
  if (toInsert.length > 0) {
    const categoryCounts = toInsert.reduce((acc, q) => {
      acc[q.category] = (acc[q.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Inserted by category:');
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });
  }

  const totalCount = await db.select({ questionText: questions.questionText }).from(questions);
  console.log(`\n📈 Total questions in database: ${totalCount.length}`);

  process.exit(0);
}

importQuestions();
