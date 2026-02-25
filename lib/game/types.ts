export type GamePhase = 'question' | 'summary' | 'finished';

// ============================================
// Shared sub-types
// ============================================

export interface QuestionData {
  id: number;
  text: string;
  answers: string[];
  difficulty: string;
  category: string;
}

export interface SummaryData {
  questionText: string;
  answers: string[];
  correctIndex: number;
  playerResults: PlayerQuestionResult[];
}

export interface PlayerQuestionResult {
  userId: number;
  username: string;
  answerIndex: number | null;
  isCorrect: boolean;
  pointsAwarded: number;
}

export interface LeaderboardEntry {
  userId: number;
  username: string;
  score: number;
  rank: number;
}

export interface GlobalLeaderboardEntry {
  userId: number;
  username: string;
  totalScore: number;
  gamesPlayed: number;
  rank: number;
}

// ============================================
// Game state — discriminated union by phase
// ============================================

interface GameStateBase {
  gameId: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  leaderboard: LeaderboardEntry[];
  isParticipant: boolean;
}

export interface IdleState {
  phase: 'idle';
}

export interface QuestionState extends GameStateBase {
  phase: 'question';
  timeRemainingMs: number;
  question: QuestionData;
  hasAnswered: boolean;
  selectedAnswerIndex: number | null;
  answeredCount: number;
  totalPlayers: number;
}

export interface SummaryState extends GameStateBase {
  phase: 'summary';
  timeRemainingMs: number;
  summary: SummaryData;
}

export interface FinishedState extends GameStateBase {
  phase: 'finished';
}

export type GameStateResponse =
  | IdleState
  | QuestionState
  | SummaryState
  | FinishedState;

// ============================================
// SSE message envelope
// ============================================

export type SSEMessage =
  | { type: 'state'; data: GameStateResponse }
  | { type: 'error'; error: string };

// ============================================
// API response types
// ============================================

export interface SubmitAnswerResponse {
  success: boolean;
  isCorrect: boolean;
  pointsAwarded: number;
}
