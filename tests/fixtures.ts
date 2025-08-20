/**
 * Utility fixtures for small sine wave sequences used in tests.
 */

/** Generate a clean sine sequence of given length. */
export function generateSineSequence(length: number): number[] {
  return Array.from({ length }, (_, i) => Math.sin((2 * Math.PI * i) / length));
}

/**
 * Deterministic pseudo random number generator (LCG) for reproducible noise.
 */
function prng(seed: number): () => number {
  let value = seed % 2147483647;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

/**
 * Add tiny deterministic noise to a sequence.
 */
export function addTinyNoise(
  seq: number[],
  seed = 1,
  amplitude = 0.01,
): number[] {
  const rand = prng(seed);
  return seq.map((v) => v + (rand() * 2 - 1) * amplitude);
}

// Pre-generated fixtures
export const cleanSine = generateSineSequence(16);
export const noisySine = addTinyNoise(cleanSine, 42);
