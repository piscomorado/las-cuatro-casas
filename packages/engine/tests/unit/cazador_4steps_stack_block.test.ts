import { describe, it, expect } from 'vitest';
import { initGame } from '../../src/engine.js';
import { getCazadorMoves } from '../../src/rules/pieces/cazador.js';
import { CellKey } from '../../src/types.js';

describe('Manual v0.4 §6 & Hoja única: Cazador (CZ)', () => {
  it('moves up to 4 steps in straight line and is blocked by stack of height >= 2', () => {
    let state = initGame();

    // Setup:
    // Cazador at (0,0)
    // (1,0) has stack of 1 piece
    // (2,0) has stack of 2 pieces (BLOCK!)
    // (3,0) empty
    const newBoard: Record<CellKey, string[]> = {
      '0,0': ['red-CZ-4'],
      '1,0': ['blue-EX-1'],
      '2,0': ['blue-EX-2', 'green-GI-7'], // stack of 2
    };

    state = {
      ...state,
      board: newBoard,
    };

    const moves = getCazadorMoves({ q: 0, r: 0 }, state, new Set(['0,0', '1,0', '2,0']));

    // Moves along direction (1,0) should not reach (3,0) because (2,0) has stack >= 2
    const reached30 = moves.some((m) => m.q === 3 && m.r === 0);
    expect(reached30).toBe(false);
  });

  it('jumps over stack of height 1 and lands on empty space touching formation', () => {
    let state = initGame();
    // Cazador at (0,0)
    // (1,0) stack of 1
    // (2,0) empty
    // formation touches (2,0) via (2,-1)
    const newBoard: Record<CellKey, string[]> = {
      '0,0': ['red-CZ-4'],
      '1,0': ['blue-EX-1'],
      '2,-1': ['red-EX-2'],
    };

    state = {
      ...state,
      board: newBoard,
    };

    const moves = getCazadorMoves({ q: 0, r: 0 }, state, new Set(['0,0', '1,0', '2,-1']));
    const reached20 = moves.some((m) => m.q === 2 && m.r === 0);
    expect(reached20).toBe(true);
  });
});
