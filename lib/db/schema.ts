import { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// USERS TABLE
// ============================================
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('candidate'), // 'candidate' | 'admin'
  lastActiveAt: timestamp('last_active_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  usernameIdx: index('username_idx').on(table.username),
  emailIdx: index('email_idx').on(table.email),
}));

// ============================================
// SESSIONS TABLE
// ============================================
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (table) => ({
  userIdIdx: index('session_user_id_idx').on(table.userId),
}));

// ============================================
// GAMES TABLE
// ============================================
export const games = pgTable('games', {
  id: serial('id').primaryKey(),
  status: varchar('status', { length: 20 }).notNull().default('playing'), // 'playing' | 'finished'
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  statusIdx: index('game_status_idx').on(table.status),
}));

// ============================================
// GAME PARTICIPANTS TABLE
// ============================================
export const gameParticipants = pgTable('game_participants', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
}, (table) => ({
  gameUserIdx: index('game_participant_idx').on(table.gameId, table.userId),
}));

// ============================================
// QUESTIONS TABLE
// ============================================
export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  questionText: text('question_text').notNull(),
  answers: jsonb('answers').notNull().$type<string[]>(), // Array of 4 answers
  correctIndex: integer('correct_index').notNull(), // 0-3
  difficulty: varchar('difficulty', { length: 20 }).notNull(), // 'easy' | 'medium' | 'hard'
  category: varchar('category', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index('question_category_idx').on(table.category),
  difficultyIdx: index('question_difficulty_idx').on(table.difficulty),
}));

// ============================================
// GAME STATE TABLE
// ============================================
export const gameStates = pgTable('game_states', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').notNull().unique().references(() => games.id, { onDelete: 'cascade' }),
  currentQuestionIndex: integer('current_question_index').notNull().default(0),
  questionOrder: jsonb('question_order').notNull().$type<number[]>(), // Array of question IDs
  questionStartTime: timestamp('question_start_time', { withTimezone: true }), // Nullable - set when question starts
  phase: varchar('phase', { length: 20 }).notNull().default('waiting'), // 'waiting' | 'question' | 'summary' | 'finished'
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  gameIdIdx: index('game_state_game_idx').on(table.gameId),
}));

// ============================================
// PLAYER ANSWERS TABLE
// ============================================
export const playerAnswers = pgTable('player_answers', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  questionId: integer('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  answerIndex: integer('answer_index'), // null if passed/timed out
  isCorrect: boolean('is_correct').notNull().default(false),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
}, (table) => ({
  gameQuestionIdx: index('answer_game_question_idx').on(table.gameId, table.questionId),
  gameUserQuestionIdx: index('answer_game_user_question_idx').on(table.gameId, table.userId, table.questionId),
}));

// ============================================
// SCORES TABLE
// ============================================
export const scores = pgTable('scores', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  score: integer('score').notNull().default(0), // Store as integer (multiply by 10, e.g., 3.5 pts = 35)
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  gameUserScoreIdx: index('score_game_user_idx').on(table.gameId, table.userId),
}));

// ============================================
// RELATIONS
// ============================================
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  gameParticipations: many(gameParticipants),
  answers: many(playerAnswers),
  scores: many(scores),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  participants: many(gameParticipants),
  gameState: one(gameStates),
  answers: many(playerAnswers),
  scores: many(scores),
}));

export const gameParticipantsRelations = relations(gameParticipants, ({ one }) => ({
  game: one(games, {
    fields: [gameParticipants.gameId],
    references: [games.id],
  }),
  user: one(users, {
    fields: [gameParticipants.userId],
    references: [users.id],
  }),
}));

export const questionsRelations = relations(questions, ({ many }) => ({
  answers: many(playerAnswers),
}));

export const gameStatesRelations = relations(gameStates, ({ one }) => ({
  game: one(games, {
    fields: [gameStates.gameId],
    references: [games.id],
  }),
}));

export const playerAnswersRelations = relations(playerAnswers, ({ one }) => ({
  game: one(games, {
    fields: [playerAnswers.gameId],
    references: [games.id],
  }),
  user: one(users, {
    fields: [playerAnswers.userId],
    references: [users.id],
  }),
  question: one(questions, {
    fields: [playerAnswers.questionId],
    references: [questions.id],
  }),
}));

export const scoresRelations = relations(scores, ({ one }) => ({
  game: one(games, {
    fields: [scores.gameId],
    references: [games.id],
  }),
  user: one(users, {
    fields: [scores.userId],
    references: [users.id],
  }),
}));
