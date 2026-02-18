# LLM Quiz - Neural Network Nerd Edition

## Project Overview
A multiplayer, hot-seat, client-side quiz game about Large Language Models (LLMs) with a cyberpunk/neon visual theme. No backend or build tools — pure HTML, CSS, and vanilla JavaScript served as static files. Players take turns answering each question, with a shared point pool that rewards being one of the few to answer correctly.

## File Structure

```
ai-question game/
├── index.html        # Main HTML with 4 screens: start, setup, question, results
├── styles.css        # Cyberpunk neon theme (CSS custom properties, animations)
├── game.js           # Game logic — LLMQuizGame class + hardcoded QUESTIONS array
├── questions.json    # 20 LLM quiz questions (NOTE: NOT loaded at runtime)
└── .claude/
    └── settings.local.json
```

## Architecture

### HTML (index.html)
Four screen sections toggled via the `.hidden` class:
1. **Start Screen** (`#start-screen`) — Title, subtitle, tagline, and "Initialize Quiz Protocol" button.
2. **Setup Screen** (`#setup-screen`) — "REGISTER OPERATIVES" title, player name inputs (2-6), add/remove operative buttons, and "Launch Protocol" button.
3. **Question Screen** (`#question-screen`) — HUD (progress + current operative + turn counter), question container (category badge, difficulty badge, question text), 4 answer buttons, pass button, question summary panel, and next button.
4. **Results Screen** (`#results-screen`) — "ANALYSIS COMPLETE" title, dynamic leaderboard with animated bars, themed winner message, and "Reinitialize System" button.

### CSS (styles.css)
- **Theme**: Cyberpunk neon with CSS custom properties (`--neon-cyan`, `--neon-purple`, `--neon-orange`, etc.)
- **Fonts**: `Orbitron` (headings/buttons), `Share Tech Mono` (body text) — loaded from Google Fonts.
- **Effects**: Scanline overlay, grid overlay, glitch animation on title, neon glow on buttons, correct/wrong answer animations (pulse/shake), player glow animation on current operative name.
- **Components**: Setup screen inputs, turn indicator, pass button (orange variant), question summary panel, leaderboard rows with rank styling (gold/silver/bronze).
- **Button variants**: `.neon-btn-small`, `.neon-btn-red`, `.neon-btn-orange` extend the base `.neon-btn`.
- **Responsive**: Media query at 600px for mobile.

### JavaScript (game.js)
- **`QUESTIONS` constant** (line 5): Array of 20 question objects hardcoded at the top. Each has: `question`, `answers` (4 options), `correct` (always index 0), `difficulty`, `category`.
- **`PLAYER_COLORS` constant** (line 108): Array of 6 CSS color vars assigned to players by index.
- **`LLMQuizGame` class** (line 117):

  **State:**
  - `players[]` — `{ name, score }` objects, scores are floats displayed to 1 decimal
  - `playerCount` / `maxPlayers` / `minPlayers` — controls setup screen input management (2-6)
  - `turnOrder[]` — shuffled player indices, re-randomized per question
  - `currentTurnIndex` — index into `turnOrder` for whose turn it is
  - `questionTurnResults[]` — `{ playerIndex, action, selectedIndex, isCorrect }` per turn
  - `phase` — `'idle'` | `'setup'` | `'playing'` | `'summary'` | `'results'`

  **Methods:**
  - `constructor()` / `init()` / `bindEvents()` — Setup DOM refs, wire events.
  - `shuffleArray(array)` — Fisher-Yates shuffle (reused for questions, answers, and turn order).
  - `showSetupScreen()` — Transitions to player registration screen.
  - `addPlayerInput()` / `removePlayerInput()` — Dynamic input row management (2-6 players).
  - `startGame()` — Reads player names, initializes scores to 0, shuffles questions, begins first round.
  - `startQuestionRound()` — Shuffles turn order, resets per-question state, calls `displayQuestion()` then `startPlayerTurn()`.
  - `displayQuestion()` — Renders question text/category/difficulty, shuffles answers once per question.
  - `startPlayerTurn()` — Updates HUD with current player name/color, resets answer button states, enables interaction.
  - `selectAnswer(e)` — Records result, shows correct/wrong feedback, shows next button.
  - `passTurn()` — Records pass, shows next button.
  - `updateNextButtonText()` — Shows next player's name or "View Round Analysis".
  - `handleNextClick()` — Central router: advances to next player turn, question summary, next question, or results.
  - `showQuestionSummary()` — Calculates scoring (pool / correct count), awards points, renders summary panel.
  - `showResults()` — Sorts players by score, generates leaderboard with animated bars, displays winner message.
  - `getResultsMessage(winnerName, percentage)` — Returns themed message referencing the winner.

### Data (questions.json)
Contains the same 20 questions as `game.js` in JSON format. **Currently unused** — the game reads from the `QUESTIONS` constant in `game.js` directly.

## Game Flow
1. Player clicks "Initialize Quiz Protocol" → goes to setup screen.
2. Players enter names (2-6 players). Click "Launch Protocol".
3. All 20 questions are shuffled; answers within each question are also shuffled once.
4. For each question, players take turns in a **random order** (re-randomized each question):
   - Current player's name shown prominently in HUD with their assigned color.
   - Player either selects an answer or clicks "PASS // Skip Turn".
   - **No correct/wrong feedback** is shown during individual turns — answers are only revealed in the round summary.
   - After each turn, the Next button shows the next player's name.
5. After all players have taken their turn, a **"TURN ANALYSIS"** summary appears showing:
   - The correct answer.
   - Each player's result (CORRECT with points, WRONG, or PASSED).
   - Pool distribution math.
6. After all 20 questions, a **leaderboard** shows players ranked by score with animated bars and a themed winner message.

## Scoring Mechanic
- Each question has a **point pool = number of players**.
- The pool is split equally among all players who answered correctly.
- If nobody answers correctly, the pool is forfeited (0 points awarded).
- Scores are **floats with 1 decimal place** (`parseFloat(value.toFixed(1))`).
- Examples with 4 players: 2 correct → 2.0 pts each; 1 correct → 4.0 pts; 0 correct → 0 pts.
- Maximum possible score for one player = `questions × players` (if sole correct answerer every time).

## Key Technical Details
- **Answer correctness**: `correct` is always `0` in the data. During display, answers are shuffled and each button stores `data-original-index` to map back.
- **Turn order**: `shuffleArray()` applied to player indices at the start of each question round.
- **Player colors**: 6 neon colors from `PLAYER_COLORS`, assigned by player index.
- **Phase state machine**: `phase` property controls `handleNextClick()` routing — `'playing'` advances turns, `'summary'` advances questions.
- **No external dependencies** beyond Google Fonts.
- **No build step** — open `index.html` in a browser to run.
- **Categories**: LLM Basics, Training, Architecture, Prompting, AI History.
- **Difficulties**: easy, medium, hard (styled differently via CSS classes).
