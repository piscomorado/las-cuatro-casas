import { describe, it, expect } from 'vitest';
import { initGame } from '../../src/engine.js';
import { getLegalMoves } from '../../src/getLegalMoves.js';
import { CellKey } from '../../src/types.js';

describe('Manual v0.4 §7: Hechicero inmovilizado bajo un Gigante', () => {
  it('immobilizes the Hechicero when a Gigante is on top of it in a stack', () => {
    let state = initGame();

    // Red Sovereign placed at -1,0
    // Red Hechicero at 0,0, covered by Blue Gigante (Blue Gigante is top piece)
    const newBoard: Record<CellKey, string[]> = {
      '-1,0': ['red-SO-0'],
      '0,0': ['red-HE-10', 'blue-GI-8'], // HE is buried!
      '1,0': ['blue-SO-0'],
    };

    state = {
      ...state,
      board: newBoard,
    };

    const legal = getLegalMoves(state, 'red');

    // Red Hechicero cannot move because only the top piece of a stack can move!
    const heMoves = legal.actions.filter(
      (a) => a.type !== 'PlacePiece' && 'pieceId' in a && a.pieceId === 'red-HE-10'
    );
    expect(heMoves.length).toBe(0);
  });
});
