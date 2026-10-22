import type { CognitiveTaskOption } from '@/data/dailyActivations';

/**
 * Deterministically shuffles a copy of `options` based on `seed` (a task's
 * own `id`, e.g. "logic-d1"). Same seed always produces the same order;
 * different seeds produce independent orders, so the five categories never
 * systematically land their correct answer on the same position on the same
 * day. Never mutates `options` - returns a new array.
 */
export function shuffleOptions(
  options: CognitiveTaskOption[],
  seed: string,
): CognitiveTaskOption[] {
  const shuffled = [...options];
  const random = createSeededRandom(hashSeed(seed));
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** FNV-1a string hash - turns a task id into a stable 32-bit seed. */
function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32 - a small, deterministic PRNG seeded by a 32-bit integer. */
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
