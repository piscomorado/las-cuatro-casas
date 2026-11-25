import { describe, it, expect } from 'vitest';
import { PRNG } from '../../src/rng.js';

describe('PRNG (Mulberry32)', () => {
  it('generates deterministic float numbers with seed', () => {
    const rng1 = new PRNG(12345);
    const rng2 = new PRNG(12345);

    expect(rng1.next()).toBe(rng2.next());
    expect(rng1.next()).toBe(rng2.next());
  });

  it('generates integers within bounds', () => {
    const rng = new PRNG(99);
    for (let i = 0; i < 50; i++) {
      const v = rng.nextInt(5, 15);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(15);
    }
  });

  it('samples items correctly', () => {
    const rng = new PRNG(42);
    const items = ['a', 'b', 'c', 'd', 'e'];
    const sample = rng.sample(items, 3);
    expect(sample.length).toBe(3);
    for (const item of sample) {
      expect(items).toContain(item);
    }
  });

  it('handles sample >= items.length', () => {
    const rng = new PRNG(42);
    const items = [1, 2];
    const sample = rng.sample(items, 5);
    expect(sample).toEqual([1, 2]);
  });

  it('generates uniform floats within range', () => {
    const rng = new PRNG(77);
    const u = rng.uniform(2.5, 6.0);
    expect(u).toBeGreaterThanOrEqual(2.5);
    expect(u).toBeLessThan(6.0);
  });
});
