export type GamePhase = 'waiting' | 'question' | 'summary' | 'finished';

export interface GameStateResponse {
  roomId: string;
  roomName: string;
  phase: GamePhase;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeRemainingMs: number;

  // 'question' phase only
  question?: {
    id: number;
    text: string;
    answers: string[];
    difficulty: string;
    category: string;
  };
  hasAnswered?: boolean;
  selectedAnswerIndex?: number | null;
  answeredCount?: number;
  totalPlayers?: number;

  // 'summary' phase only
  summary?: {
    questionText: string;
    answers: string[];
    correctIndex: number;
    playerResults: PlayerQuestionResult[];
  };

  leaderboard: LeaderboardEntry[];
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

export interface SubmitAnswerResponse {
  success: boolean;
  isCorrect: boolean;
  pointsAwarded: number;
}
