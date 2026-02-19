import { db, questions } from '../lib/db';

// Questions data from the original questions.json
const questionsData = [
  {
    question: "What does the 'T' in GPT stand for?",
    answers: ["Transformer", "Training", "Turing", "Tensor"],
    correct: 0,
    difficulty: "easy",
    category: "LLM Basics"
  },
  {
    question: "An LLM generates a detailed biography of a person who never existed, complete with dates and citations. This phenomenon is called:",
    answers: ["Hallucination", "Overfitting", "Catastrophic forgetting", "Mode collapse"],
    correct: 0,
    difficulty: "easy",
    category: "LLM Basics"
  },
  {
    question: "Which of these is NOT a real step in training a modern LLM like ChatGPT?",
    answers: ["Symbolic logic compilation", "Pre-training on large text corpora", "Supervised fine-tuning", "Reinforcement learning from human feedback"],
    correct: 0,
    difficulty: "medium",
    category: "Training"
  },
  {
    question: "The 2017 paper 'Attention Is All You Need' eliminated the need for which previously dominant architecture?",
    answers: ["Recurrent neural networks", "Convolutional neural networks", "Generative adversarial networks", "Boltzmann machines"],
    correct: 0,
    difficulty: "medium",
    category: "Architecture"
  },
  {
    question: "The 'context window' in an LLM primarily refers to:",
    answers: ["The maximum number of tokens the model can process at once", "The training data size", "The model's parameter count", "The inference speed"],
    correct: 0,
    difficulty: "easy",
    category: "LLM Basics"
  },
  {
    question: "In the Transformer architecture, what mechanism allows the model to weigh the importance of different input tokens?",
    answers: ["Self-attention", "Dropout", "Batch normalization", "Pooling layers"],
    correct: 0,
    difficulty: "medium",
    category: "Architecture"
  },
  {
    question: "What is 'RLHF' commonly used for in LLM training?",
    answers: ["Aligning model outputs with human preferences", "Reducing model size", "Speeding up inference", "Expanding vocabulary"],
    correct: 0,
    difficulty: "medium",
    category: "Training"
  },
  {
    question: "Which prompting technique involves providing the model with examples before asking it to perform a task?",
    answers: ["Few-shot learning", "Zero-shot learning", "Transfer learning", "Meta-learning"],
    correct: 0,
    difficulty: "easy",
    category: "Prompting"
  },
  {
    question: "What does 'temperature' control in LLM text generation?",
    answers: ["Randomness/creativity of outputs", "Processing speed", "Token limit", "Memory usage"],
    correct: 0,
    difficulty: "medium",
    category: "Prompting"
  },
  {
    question: "The original GPT paper (2018) introduced the concept of:",
    answers: ["Pre-training on unlabeled text followed by task-specific fine-tuning", "The Transformer architecture", "Reinforcement learning from human feedback", "Constitutional AI"],
    correct: 0,
    difficulty: "hard",
    category: "AI History"
  },
  {
    question: "What architectural innovation did BERT introduce compared to the original GPT?",
    answers: ["Bidirectional attention", "Unidirectional attention", "No pre-training", "Smaller model size"],
    correct: 0,
    difficulty: "hard",
    category: "Architecture"
  },
  {
    question: "Which company developed the BERT model?",
    answers: ["Google", "OpenAI", "Meta", "Microsoft"],
    correct: 0,
    difficulty: "easy",
    category: "AI History"
  },
  {
    question: "In tokenization, what is a 'BPE' algorithm primarily used for?",
    answers: ["Breaking text into subword units", "Encrypting model weights", "Compressing outputs", "Validating inputs"],
    correct: 0,
    difficulty: "hard",
    category: "Architecture"
  },
  {
    question: "The term 'prompt injection' refers to:",
    answers: ["Manipulating model behavior through crafted inputs", "Training data contamination", "Model compression technique", "Hardware acceleration"],
    correct: 0,
    difficulty: "medium",
    category: "Prompting"
  },
  {
    question: "What does 'fine-tuning' an LLM typically involve?",
    answers: ["Further training on a specific dataset", "Reducing model size", "Changing the architecture", "Adjusting the temperature"],
    correct: 0,
    difficulty: "easy",
    category: "Training"
  },
  {
    question: "Which of these is a technique to reduce LLM computational requirements?",
    answers: ["Quantization", "Hallucination", "Attention", "Tokenization"],
    correct: 0,
    difficulty: "medium",
    category: "Architecture"
  },
  {
    question: "The 'perplexity' metric in language models measures:",
    answers: ["How well the model predicts the next token", "The model's size", "Training time", "User satisfaction"],
    correct: 0,
    difficulty: "hard",
    category: "Training"
  },
  {
    question: "Which technique helps prevent LLMs from forgetting previously learned information during fine-tuning?",
    answers: ["Regularization methods like L2 or dropout", "Increasing temperature", "Removing attention layers", "Expanding vocabulary"],
    correct: 0,
    difficulty: "hard",
    category: "Training"
  },
  {
    question: "What is 'chain-of-thought' prompting designed to improve?",
    answers: ["Multi-step reasoning in model outputs", "Processing speed", "Memory efficiency", "Token economy"],
    correct: 0,
    difficulty: "medium",
    category: "Prompting"
  },
  {
    question: "Which organization released the LLaMA model series?",
    answers: ["Meta", "Google", "OpenAI", "Anthropic"],
    correct: 0,
    difficulty: "easy",
    category: "AI History"
  }
];

async function seed() {
  console.log('🌱 Seeding questions...');

  try {
    // Check if questions already exist
    const existingQuestions = await db.select().from(questions);

    if (existingQuestions.length > 0) {
      console.log(`⚠️  Database already contains ${existingQuestions.length} questions.`);
      console.log('Skipping seed to avoid duplicates.');
      return;
    }

    // Insert all questions
    const inserted = await db.insert(questions).values(
      questionsData.map(q => ({
        questionText: q.question,
        answers: q.answers,
        correctIndex: q.correct,
        difficulty: q.difficulty,
        category: q.category,
      }))
    ).returning();

    console.log(`✅ Successfully seeded ${inserted.length} questions!`);

    // Display summary
    const categoryCounts = questionsData.reduce((acc, q) => {
      acc[q.category] = (acc[q.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Questions by category:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count}`);
    });

    const difficultyCounts = questionsData.reduce((acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📈 Questions by difficulty:');
    Object.entries(difficultyCounts).forEach(([difficulty, count]) => {
      console.log(`   ${difficulty}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Error seeding questions:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seed();
