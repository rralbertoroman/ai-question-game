// ============================================
// LLM QUIZ GAME - NEURAL NETWORK NERD EDITION
// ============================================

const QUESTIONS = [
    {
        "question": "What does the 'T' in GPT stand for?",
        "answers": ["Transformer", "Training", "Turing", "Tensor"],
        "correct": 0, "difficulty": "easy", "category": "LLM Basics"
    },
    {
        "question": "An LLM generates a detailed biography of a person who never existed, complete with dates and citations. This phenomenon is called:",
        "answers": ["Hallucination", "Overfitting", "Catastrophic forgetting", "Mode collapse"],
        "correct": 0, "difficulty": "easy", "category": "LLM Basics"
    },
    {
        "question": "Which of these is NOT a real step in training a modern LLM like ChatGPT?",
        "answers": ["Symbolic logic compilation", "Pre-training on large text corpora", "Supervised fine-tuning", "Reinforcement learning from human feedback"],
        "correct": 0, "difficulty": "medium", "category": "Training"
    },
    {
        "question": "The 2017 paper 'Attention Is All You Need' eliminated the need for which previously dominant architecture?",
        "answers": ["Recurrent neural networks", "Convolutional neural networks", "Generative adversarial networks", "Boltzmann machines"],
        "correct": 0, "difficulty": "medium", "category": "Architecture"
    },
    {
        "question": "You set an LLM's temperature to 0. What behavior should you expect?",
        "answers": ["Nearly deterministic output \u2014 the model picks the most likely token each time", "The model refuses to generate any output", "Maximum creativity with highly varied responses", "Faster inference speed but lower accuracy"],
        "correct": 0, "difficulty": "medium", "category": "Prompting"
    },
    {
        "question": "A model has 70 billion parameters. What are those parameters, fundamentally?",
        "answers": ["Numerical weights learned during training", "The number of texts in its training dataset", "Configuration settings chosen by engineers", "The number of unique tokens it can process"],
        "correct": 0, "difficulty": "medium", "category": "Architecture"
    },
    {
        "question": "You give an LLM two example translations, then ask it to translate a new sentence. This technique is called:",
        "answers": ["Few-shot prompting", "Transfer learning", "Fine-tuning", "Data augmentation"],
        "correct": 0, "difficulty": "medium", "category": "Prompting"
    },
    {
        "question": "What problem does Retrieval-Augmented Generation (RAG) primarily solve?",
        "answers": ["Grounding LLM responses in up-to-date or domain-specific information", "Reducing the number of parameters in the model", "Speeding up token generation during inference", "Preventing the model from generating toxic content"],
        "correct": 0, "difficulty": "hard", "category": "Architecture"
    },
    {
        "question": "If a model's context window is 128K tokens, which of these is a real limitation?",
        "answers": ["It cannot reference information from beyond that window in a single session", "It can only be trained on datasets up to 128K tokens", "It can only generate responses of 128K tokens or fewer", "It needs 128K GPUs to run inference"],
        "correct": 0, "difficulty": "easy", "category": "LLM Basics"
    },
    {
        "question": "Quantizing a model from 16-bit to 4-bit floating point primarily trades off:",
        "answers": ["Precision for reduced memory usage and faster inference", "Speed for higher accuracy", "Training time for larger context windows", "Safety alignment for better reasoning"],
        "correct": 0, "difficulty": "hard", "category": "Architecture"
    },
    {
        "question": "In the RLHF pipeline, what is the role of the reward model?",
        "answers": ["It scores model outputs to reflect human preferences", "It generates the initial pre-training data", "It decides which parameters to update during backpropagation", "It filters out copyrighted content from responses"],
        "correct": 0, "difficulty": "hard", "category": "Training"
    },
    {
        "question": "Why does multi-head attention use multiple attention 'heads' rather than a single one?",
        "answers": ["Each head can learn to attend to different types of relationships in the data", "It allows the model to process multiple languages simultaneously", "It enables parallel training across multiple GPUs", "It provides redundancy in case one head produces errors"],
        "correct": 0, "difficulty": "hard", "category": "Architecture"
    },
    {
        "question": "Which organization published the original Transformer paper?",
        "answers": ["Google", "OpenAI", "Meta", "DeepMind"],
        "correct": 0, "difficulty": "medium", "category": "AI History"
    },
    {
        "question": "A sentence embedding converts text into a vector. Two sentences with similar meaning would have vectors that are:",
        "answers": ["Close together in the vector space", "Exactly identical", "Perpendicular to each other", "Of equal magnitude but opposite direction"],
        "correct": 0, "difficulty": "medium", "category": "Architecture"
    },
    {
        "question": "What distinguishes fine-tuning from prompt engineering?",
        "answers": ["Fine-tuning updates the model's weights; prompt engineering only changes the input", "Prompt engineering is permanent; fine-tuning is temporary", "Fine-tuning works on any model; prompt engineering requires API access", "There is no meaningful difference \u2014 they achieve the same result"],
        "correct": 0, "difficulty": "medium", "category": "Training"
    },
    {
        "question": "ChatGPT was released to the public in late 2022. Which underlying model powered its initial launch?",
        "answers": ["GPT-3.5", "GPT-4", "GPT-3", "GPT-2"],
        "correct": 0, "difficulty": "easy", "category": "AI History"
    },
    {
        "question": "A tokenizer splits 'unhappiness' into ['un', 'happiness']. Why do LLMs use subword tokenization rather than whole words?",
        "answers": ["It balances vocabulary size with the ability to handle rare and novel words", "It makes the model run faster by reducing input length", "Whole-word tokenization was patented by Google", "Subwords are easier for the attention mechanism to process"],
        "correct": 0, "difficulty": "medium", "category": "Training"
    },
    {
        "question": "Which of these tasks would be HARDEST for a standard autoregressive LLM without tool use?",
        "answers": ["Reliably performing multi-step arithmetic on large numbers", "Summarizing a long article", "Translating English to French", "Writing a poem in iambic pentameter"],
        "correct": 0, "difficulty": "medium", "category": "LLM Basics"
    },
    {
        "question": "In the phrase 'The bank was steep,' an LLM determines 'bank' means a riverbank, not a financial institution. Which mechanism is most responsible?",
        "answers": ["Self-attention over surrounding context tokens", "A built-in dictionary lookup table", "The tokenizer assigning a different token ID", "A separate disambiguation module"],
        "correct": 0, "difficulty": "hard", "category": "Architecture"
    },
    {
        "question": "What is the key difference between an LLM and a traditional search engine?",
        "answers": ["An LLM generates novel text; a search engine retrieves existing documents", "A search engine uses neural networks; an LLM uses keyword matching", "An LLM can only work offline; a search engine requires the internet", "There is no fundamental difference \u2014 LLMs are just faster search engines"],
        "correct": 0, "difficulty": "easy", "category": "LLM Basics"
    }
];

const PLAYER_COLORS = [
    'var(--neon-cyan)',
    'var(--neon-purple)',
    'var(--neon-orange)',
    'var(--neon-red)',
    'var(--correct-green)',
    'var(--neon-blue)'
];

class LLMQuizGame {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.selectedAnswers = [];
        this.currentAnswerMapping = [];

        // Multiplayer state
        this.players = [];
        this.playerCount = 2;
        this.maxPlayers = 6;
        this.minPlayers = 2;

        // Turn management
        this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.questionTurnResults = [];
        this.phase = 'idle'; // 'idle' | 'setup' | 'playing' | 'summary' | 'results'

        // DOM Elements — Screens
        this.startScreen = document.getElementById('start-screen');
        this.setupScreen = document.getElementById('setup-screen');
        this.questionScreen = document.getElementById('question-screen');
        this.resultsScreen = document.getElementById('results-screen');

        // DOM Elements — Setup
        this.playerInputsContainer = document.getElementById('player-inputs');
        this.addPlayerBtn = document.getElementById('add-player-btn');
        this.removePlayerBtn = document.getElementById('remove-player-btn');
        this.beginGameBtn = document.getElementById('begin-game-btn');

        // DOM Elements — Question screen
        this.startBtn = document.getElementById('start-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.questionText = document.getElementById('question-text');
        this.answersContainer = document.getElementById('answers-container');
        this.progressDisplay = document.getElementById('progress');
        this.categoryBadge = document.getElementById('category');
        this.difficultyBadge = document.getElementById('difficulty');
        this.currentPlayerDisplay = document.getElementById('current-player');
        this.turnProgressDisplay = document.getElementById('turn-progress');
        this.passBtn = document.getElementById('pass-btn');

        // DOM Elements — Question summary
        this.questionSummary = document.getElementById('question-summary');
        this.summaryCorrectAnswer = document.getElementById('summary-correct-answer');
        this.summaryResults = document.getElementById('summary-results');
        this.summaryPoints = document.getElementById('summary-points');

        // DOM Elements — Results
        this.leaderboard = document.getElementById('leaderboard');
        this.resultsMessage = document.getElementById('results-message');

        this.answerButtons = document.querySelectorAll('.answer-btn');

        this.init();
    }

    init() {
        this.questions = [...QUESTIONS];
        this.bindEvents();
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.showSetupScreen());
        this.addPlayerBtn.addEventListener('click', () => this.addPlayerInput());
        this.removePlayerBtn.addEventListener('click', () => this.removePlayerInput());
        this.beginGameBtn.addEventListener('click', () => this.startGame());
        this.nextBtn.addEventListener('click', () => this.handleNextClick());
        this.restartBtn.addEventListener('click', () => this.showSetupScreen());
        this.passBtn.addEventListener('click', () => this.passTurn());

        this.answerButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.selectAnswer(e));
        });
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // ========================================
    // SETUP SCREEN
    // ========================================

    showSetupScreen() {
        this.startScreen.classList.add('hidden');
        this.questionScreen.classList.add('hidden');
        this.resultsScreen.classList.add('hidden');
        this.setupScreen.classList.remove('hidden');
        this.phase = 'setup';
    }

    addPlayerInput() {
        if (this.playerCount >= this.maxPlayers) return;
        this.playerCount++;

        const row = document.createElement('div');
        row.className = 'player-input-row';
        row.innerHTML = `
            <label class="player-label">P${this.playerCount}</label>
            <input type="text" class="player-name-input"
                   placeholder="Player ${this.playerCount} handle..." maxlength="16" />
        `;
        this.playerInputsContainer.appendChild(row);

        if (this.playerCount > this.minPlayers) {
            this.removePlayerBtn.classList.remove('hidden');
        }
        if (this.playerCount >= this.maxPlayers) {
            this.addPlayerBtn.classList.add('hidden');
        }
    }

    removePlayerInput() {
        if (this.playerCount <= this.minPlayers) return;
        const rows = this.playerInputsContainer.querySelectorAll('.player-input-row');
        rows[rows.length - 1].remove();
        this.playerCount--;

        if (this.playerCount <= this.minPlayers) {
            this.removePlayerBtn.classList.add('hidden');
        }
        this.addPlayerBtn.classList.remove('hidden');
    }

    // ========================================
    // GAME START
    // ========================================

    startGame() {
        // Read player names from inputs
        this.players = [];
        const inputs = this.playerInputsContainer.querySelectorAll('.player-name-input');
        inputs.forEach((input, i) => {
            const name = input.value.trim() || `Player ${i + 1}`;
            this.players.push({ name, score: 0 });
        });

        if (this.players.length < this.minPlayers) return;

        // Reset game state
        this.currentQuestionIndex = 0;
        this.selectedAnswers = [];
        this.questions = this.shuffleArray([...QUESTIONS]);

        // Show question screen
        this.setupScreen.classList.add('hidden');
        this.resultsScreen.classList.add('hidden');
        this.questionScreen.classList.remove('hidden');
        this.phase = 'playing';

        this.startQuestionRound();
    }

    // ========================================
    // QUESTION ROUND (outer loop)
    // ========================================

    startQuestionRound() {
        // Randomize turn order for this question
        this.turnOrder = this.shuffleArray(
            this.players.map((_, index) => index)
        );
        this.currentTurnIndex = 0;
        this.questionTurnResults = [];

        this.displayQuestion();
        this.startPlayerTurn();
    }

    displayQuestion() {
        const question = this.questions[this.currentQuestionIndex];

        // Update progress
        this.progressDisplay.textContent = `${this.currentQuestionIndex + 1}/${this.questions.length}`;

        // Update category and difficulty
        this.categoryBadge.textContent = question.category;
        this.difficultyBadge.textContent = question.difficulty.toUpperCase();
        this.difficultyBadge.className = `difficulty-badge ${question.difficulty}`;

        // Display question
        this.questionText.textContent = question.question;

        // Create shuffled answers (shuffled once per question, same for all players)
        const answersWithIndices = question.answers.map((answer, index) => ({
            text: answer,
            originalIndex: index
        }));
        this.currentAnswerMapping = this.shuffleArray(answersWithIndices);

        // Set answer button text
        this.answerButtons.forEach((btn, index) => {
            btn.textContent = this.currentAnswerMapping[index].text;
            btn.dataset.originalIndex = this.currentAnswerMapping[index].originalIndex;
            btn.classList.remove('correct', 'wrong');
            btn.disabled = true;
        });

        // Hide UI elements
        this.questionSummary.classList.add('hidden');
        this.nextBtn.classList.add('hidden');
        this.passBtn.classList.add('hidden');
    }

    // ========================================
    // PLAYER TURNS (inner loop)
    // ========================================

    startPlayerTurn() {
        const currentPlayerIndex = this.turnOrder[this.currentTurnIndex];
        const currentPlayer = this.players[currentPlayerIndex];

        // Update HUD
        this.currentPlayerDisplay.textContent = currentPlayer.name;
        this.currentPlayerDisplay.style.color = PLAYER_COLORS[currentPlayerIndex % PLAYER_COLORS.length];
        this.turnProgressDisplay.textContent = `${this.currentTurnIndex + 1}/${this.players.length}`;

        // Reset answer buttons (clear previous player's feedback)
        this.answerButtons.forEach(btn => {
            btn.classList.remove('correct', 'wrong');
            btn.disabled = false;
        });

        // Show pass button, hide next button and summary
        this.passBtn.classList.remove('hidden');
        this.nextBtn.classList.add('hidden');
        this.questionSummary.classList.add('hidden');
    }

    selectAnswer(e) {
        const selectedBtn = e.target;
        const selectedOriginalIndex = parseInt(selectedBtn.dataset.originalIndex);
        const question = this.questions[this.currentQuestionIndex];
        const isCorrect = selectedOriginalIndex === question.correct;
        const currentPlayerIndex = this.turnOrder[this.currentTurnIndex];

        // Disable answer buttons and hide pass
        this.answerButtons.forEach(btn => btn.disabled = true);
        this.passBtn.classList.add('hidden');

        // No feedback shown — correct/wrong revealed only in round summary

        // Record turn result
        this.questionTurnResults.push({
            playerIndex: currentPlayerIndex,
            action: 'answer',
            selectedIndex: selectedOriginalIndex,
            isCorrect
        });

        // Show next button
        this.nextBtn.classList.remove('hidden');
        this.updateNextButtonText();
    }

    passTurn() {
        const currentPlayerIndex = this.turnOrder[this.currentTurnIndex];

        // Record pass
        this.questionTurnResults.push({
            playerIndex: currentPlayerIndex,
            action: 'pass',
            selectedIndex: null,
            isCorrect: false
        });

        // Disable buttons
        this.answerButtons.forEach(btn => btn.disabled = true);
        this.passBtn.classList.add('hidden');

        // Show next button
        this.nextBtn.classList.remove('hidden');
        this.updateNextButtonText();
    }

    updateNextButtonText() {
        const isLastTurn = (this.currentTurnIndex + 1) >= this.turnOrder.length;

        if (isLastTurn) {
            this.nextBtn.querySelector('span').textContent = 'View Round Analysis >>';
        } else {
            const nextPlayerIndex = this.turnOrder[this.currentTurnIndex + 1];
            this.nextBtn.querySelector('span').textContent =
                `Next: ${this.players[nextPlayerIndex].name} >>`;
        }
    }

    // ========================================
    // NAVIGATION
    // ========================================

    handleNextClick() {
        if (this.phase === 'summary') {
            // Advance to next question or results
            this.currentQuestionIndex++;
            if (this.currentQuestionIndex < this.questions.length) {
                this.phase = 'playing';
                this.startQuestionRound();
            } else {
                this.showResults();
            }
        } else {
            // Advance to next player turn or show summary
            this.currentTurnIndex++;
            if (this.currentTurnIndex < this.turnOrder.length) {
                this.startPlayerTurn();
            } else {
                this.showQuestionSummary();
            }
        }
    }

    // ========================================
    // QUESTION SUMMARY + SCORING
    // ========================================

    showQuestionSummary() {
        this.phase = 'summary';
        const question = this.questions[this.currentQuestionIndex];
        const pool = this.players.length;

        // Calculate scoring
        const correctPlayers = this.questionTurnResults.filter(r => r.isCorrect);
        const pointsPerCorrect = correctPlayers.length > 0
            ? parseFloat((pool / correctPlayers.length).toFixed(1))
            : 0;

        // Award points
        correctPlayers.forEach(result => {
            this.players[result.playerIndex].score =
                parseFloat((this.players[result.playerIndex].score + pointsPerCorrect).toFixed(1));
        });

        // Show correct answer
        this.summaryCorrectAnswer.innerHTML =
            `<span class="summary-label">CORRECT ANSWER:</span> ${question.answers[question.correct]}`;

        // Build per-player results
        let resultsHTML = '';
        this.questionTurnResults.forEach(result => {
            const player = this.players[result.playerIndex];
            const colorIndex = result.playerIndex % PLAYER_COLORS.length;
            let statusClass, statusText;

            if (result.action === 'pass') {
                statusClass = 'summary-pass';
                statusText = 'PASSED';
            } else if (result.isCorrect) {
                statusClass = 'summary-correct';
                statusText = `CORRECT (+${pointsPerCorrect.toFixed(1)})`;
            } else {
                statusClass = 'summary-wrong';
                statusText = 'WRONG';
            }

            resultsHTML += `
                <div class="summary-player-result ${statusClass}">
                    <span class="summary-player-name" style="color: ${PLAYER_COLORS[colorIndex]}">${player.name}</span>
                    <span class="summary-player-status">${statusText}</span>
                    <span class="summary-player-total">${player.score.toFixed(1)} pts</span>
                </div>
            `;
        });
        this.summaryResults.innerHTML = resultsHTML;

        // Pool info
        if (correctPlayers.length === 0) {
            this.summaryPoints.textContent = 'No correct answers. Pool forfeited.';
        } else {
            this.summaryPoints.textContent =
                `Pool: ${pool} pts / ${correctPlayers.length} correct = ${pointsPerCorrect.toFixed(1)} pts each`;
        }

        // Show summary panel, highlight correct answer on buttons
        this.questionSummary.classList.remove('hidden');
        this.passBtn.classList.add('hidden');
        this.answerButtons.forEach(btn => {
            btn.classList.remove('correct', 'wrong');
            btn.disabled = true;
            if (parseInt(btn.dataset.originalIndex) === question.correct) {
                btn.classList.add('correct');
            }
        });

        // Update next button
        this.nextBtn.classList.remove('hidden');
        const isLastQuestion = (this.currentQuestionIndex === this.questions.length - 1);
        this.nextBtn.querySelector('span').textContent =
            isLastQuestion ? 'View Final Results >>' : 'Next Query >>';
    }

    // ========================================
    // RESULTS / LEADERBOARD
    // ========================================

    showResults() {
        this.phase = 'results';
        this.questionScreen.classList.add('hidden');
        this.resultsScreen.classList.remove('hidden');

        // Sort players by score descending
        const sorted = [...this.players]
            .map((p, i) => ({ ...p, originalIndex: i }))
            .sort((a, b) => b.score - a.score);

        // Max possible for a single player = questions * players (solo correct every time)
        const maxPossible = this.questions.length * this.players.length;
        const topScore = sorted[0].score;

        // Build leaderboard
        let leaderboardHTML = '';
        sorted.forEach((player, rank) => {
            // Bar is relative to the top scorer for better visual spread
            const barWidth = topScore > 0 ? Math.round((player.score / topScore) * 100) : 0;
            const rankClass = rank === 0 ? 'rank-gold' : (rank === 1 ? 'rank-silver' : (rank === 2 ? 'rank-bronze' : ''));
            const colorIndex = player.originalIndex % PLAYER_COLORS.length;

            leaderboardHTML += `
                <div class="leaderboard-row ${rankClass}">
                    <span class="leaderboard-rank">#${rank + 1}</span>
                    <span class="leaderboard-name" style="color: ${PLAYER_COLORS[colorIndex]}">${player.name}</span>
                    <div class="leaderboard-bar-container">
                        <div class="leaderboard-bar" data-width="${barWidth}"></div>
                    </div>
                    <span class="leaderboard-score">${player.score.toFixed(1)}</span>
                </div>
            `;
        });
        this.leaderboard.innerHTML = leaderboardHTML;

        // Animate bars
        setTimeout(() => {
            this.leaderboard.querySelectorAll('.leaderboard-bar').forEach(bar => {
                bar.style.width = bar.dataset.width + '%';
            });
        }, 100);

        // Winner message
        const winner = sorted[0];
        const winnerPct = maxPossible > 0 ? Math.round((winner.score / maxPossible) * 100) : 0;
        this.resultsMessage.innerHTML = this.getResultsMessage(winner.name, winnerPct);

        // Reset next button text
        this.nextBtn.querySelector('span').textContent = 'Next Query >>';
    }

    getResultsMessage(winnerName, percentage) {
        if (percentage >= 80) {
            return `<strong>${winnerName} DOMINATES!</strong><br><br>
            An unquestionable neural supremacy. The other operatives should study your weights.`;
        } else if (percentage >= 60) {
            return `<strong>${winnerName} LEADS THE PACK</strong><br><br>
            Solid performance at the top, but the competition was close. A few more correct tokens and it'd be total dominance.`;
        } else if (percentage >= 40) {
            return `<strong>${winnerName} EDGES AHEAD</strong><br><br>
            A narrow victory. Every operative needs more training data.`;
        } else if (percentage >= 20) {
            return `<strong>${winnerName} SURVIVES</strong><br><br>
            Winning by slim margins in a field of high loss. Back to the training loop.`;
        } else {
            return `<strong>COLLECTIVE CATASTROPHIC LOSS</strong><br><br>
            ${winnerName} technically won, but nobody should celebrate this gradient descent into confusion.`;
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LLMQuizGame();
});
