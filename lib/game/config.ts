export const GAME_CONFIG = {
  QUESTIONS_PER_GAME: 10,
  QUESTION_TIME_LIMIT_SECONDS: 20,
  SUMMARY_DISPLAY_SECONDS: 8,
  POLL_INTERVAL_MS: 2000,
  SSE_POLL_INTERVAL_MS: 2000,
  HEARTBEAT_INTERVAL_MS: 10000,       // client sends heartbeat every 10s
  HEARTBEAT_TIMEOUT_SECONDS: 30,      // user is "online" if lastActiveAt within 30s
  PRESENCE_POLL_INTERVAL_MS: 5000,    // admin refreshes online player list every 5s
  POINTS_CORRECT: 10, // stored x10 = 100
  POINTS_SPEED_BONUS_MAX: 5, // stored x10 = 50
} as const;
