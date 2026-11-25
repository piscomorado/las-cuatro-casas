import { describe, it, expect } from 'vitest';
import { initGame } from '../../src/engine.js';
import { getHechiceroMoves } from '../../src/rules/pieces/hechicero.js';
import { CellKey } from '../../src/types.js';

describe('Manual v0.4 §6: Hechicero (HE) copia pieza superior, NUNCA al Nigromante', () => {
  it('copies movement of adjacent top piece, but strictly excludes Nigromante', () => {
    let state = initGame();

    // Hechicero at (0,0)
    // Adjacent Nigromante at (1,0)
    // Adjacent Cazador at (0,1)
    const newBoard: Record<CellKey, string[]> = {
      '0,0': ['red-HE-10'],
      '1,0': ['blue-NI-12'], // Nigromante!
      '0,1': ['green-CZ-4'], // Cazador
    };

    state = {
      ...state,
      board: newBoard,
    };

    const hm = getHechiceroMoves({ q: 0, r: 0 }, false, state, new Set(['0,0', '1,0', '0,1']));

    // Checks that none of the copied abilities are from Nigromante (NI)
    const copiedTypes = hm.copies.map((c) => c.copiedPieceType);
    expect(copiedTypes).not.toContain('NI');
    expect(copiedTypes).toContain('CZ');
  });
});
