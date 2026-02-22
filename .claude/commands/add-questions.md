Add quiz questions to the game.

## Instructions

1. Read `data/questions.json` to understand the current format and existing questions
2. Ask the user what topic/category/difficulty they want, or accept their question descriptions
3. Generate question objects matching this exact schema:

```json
{
  "question": "The question text?",
  "answers": ["Wrong answer", "Correct answer", "Wrong answer", "Wrong answer"],
  "correctIndex": 1,
  "difficulty": "easy",
  "category": "Architecture"
}
```

### Rules
- `answers` must be exactly 4 strings
- `correctIndex` must be 0–3, pointing to the correct answer in the array
- `difficulty` must be one of: `easy`, `medium`, `hard`
- `category` should match existing categories when possible: Architecture, AI History, Training, Prompting, LLM Basics — or a new relevant category
- Distribute `correctIndex` values across 0–3 (don't always put the correct answer in the same position)
- Make wrong answers plausible (not obviously wrong)

4. Append the new questions to the existing array in `data/questions.json`
5. Run `pnpm db:import-questions` to load them into the database
6. Report how many questions were added and their categories
