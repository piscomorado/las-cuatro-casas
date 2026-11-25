import { describe, it, expect } from 'vitest';
import { initGame } from '../../src/engine.js';
import { getNigromanteActions } from '../../src/rules/pieces/nigromante.js';
import { CellKey } from '../../src/types.js';

describe('Manual v0.4 §6: Nigromante (NI) — Tres Acciones (A: deslizar, B: swap, C: destierro)', () => {
  it('supports A. Slide, B. Swap (with top piece), and C. Exile (Destierro)', () => {
    let state = initGame();

    const newBoard: Record<CellKey, string[]> = {
      '0,0': ['red-NI-12'],
      '-1,0': ['red-SO-0'],
      '-1,1': ['red-EX-1'],
      '1,0': ['blue-EX-1', 'blue-GI-8'],
      '0,1': ['green-EX-1'],
    };

    const newPieces = { ...state.pieces };
    Object.entries(newBoard).forEach(([k, stack]) => {
      stack.forEach((pid, lvl) => {
        if (newPieces[pid]) {
          newPieces[pid] = {
            ...newPieces[pid]!,
            location: 'board',
            cellKey: k as CellKey,
            stackLevel: lvl,
          };
        }
      });
    });

    state = {
      ...state,
      board: newBoard,
      pieces: newPieces,
    };

    const occupied = new Set<CellKey>(['0,0', '-1,0', '-1,1', '1,0', '0,1']);
    const actions = getNigromanteActions({ q: 0, r: 0 }, false, state, occupied, 'red');

    // A: Slide moves available
    expect(actions.slideMoves.length).toBeGreaterThan(0);

    // B: Swap available with top piece of (1,0), which is blue-GI-8
    const swapTarget = actions.swaps.find((s) => s.targetPieceId === 'blue-GI-8');
    expect(swapTarget).toBeDefined();

    // C: Exile available against green-EX-1 at (0,1)
    const exileTarget = actions.exiles.find((e) => e.targetPieceId === 'green-EX-1');
    expect(exileTarget).toBeDefined();
  });
});
