/**
 * Deterministic answer shuffling using a seeded PRNG.
 * Given the same (questionId, roomId), always produces the same permutation.
 * This ensures all players in a room see the same answer order.
 */

// djb2 string hash → unsigned 32-bit integer
function hashSeed(questionId: number, roomId: string): number {
  const str = `${questionId}:${roomId}`;
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

// Mulberry32: fast 32-bit seeded PRNG, returns values in [0, 1)
function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns a permutation array for shuffling 4 answers.
 * permutation[newIndex] = originalIndex
 *
 * Example: [2, 0, 3, 1] means new position 0 shows original answer 2, etc.
 */
export function getShufflePermutation(questionId: number, roomId: string): number[] {
  const rng = mulberry32(hashSeed(questionId, roomId));

  const indices = [0, 1, 2, 3];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

/** Reorder answers according to a permutation. */
export function shuffleAnswers(answers: string[], permutation: number[]): string[] {
  return permutation.map((origIdx) => answers[origIdx]);
}

/** Map an original (DB) index to its shuffled (display) position. */
export function originalToShuffled(originalIndex: number, permutation: number[]): number {
  return permutation.indexOf(originalIndex);
}

/** Map a shuffled (display) index back to the original (DB) position. */
export function shuffledToOriginal(shuffledIndex: number, permutation: number[]): number {
  return permutation[shuffledIndex];
}
