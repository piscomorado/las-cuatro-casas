/**
 * Deterministic pseudo-random number generator (Mulberry32).
 * Fast, seedable, 32-bit state, perfect for reproducible game simulations and bot actions.
 */
export class PRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /**
   * Returns a float in [0, 1).
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns integer in [min, max] inclusive.
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Sample k items randomly from array without replacement.
   */
  sample<T>(items: readonly T[], k: number): T[] {
    if (k >= items.length) return [...items];
    const copy = [...items];
    const result: T[] = [];
    for (let i = 0; i < k; i++) {
      const idx = this.nextInt(0, copy.length - 1);
      const chosen = copy.splice(idx, 1)[0];
      if (chosen !== undefined) {
        result.push(chosen);
      }
    }
    return result;
  }

  /**
   * Uniform float in [min, max).
   */
  uniform(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}
