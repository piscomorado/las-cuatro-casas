import { describe, it, expect } from 'vitest';
import { initGame } from '../../src/engine.js';
import { getLegalMoves } from '../../src/getLegalMoves.js';
import { CellKey } from '../../src/types.js';

describe('Manual v0.4 §6: Hechicero de Cadenas sobre una pila', () => {
  it('allows the Hechicero to descend to an empty space from the top of a stack', () => {
    let state = initGame();

    // Red Sovereign placed at -1,0
    // Stack at 0,0: Blue EX at bottom, Red HE on top!
    // Empty neighbor at 0,1 touching the formation
    const newBoard: Record<CellKey, string[]> = {
      '-1,0': ['red-SO-0'],
      '0,0': ['blue-EX-1', 'red-HE-11'],
      '1,0': ['blue-SO-0'],
    };

    const newPieces = { ...state.pieces };
    newPieces['red-SO-0'] = { ...newPieces['red-SO-0']!, location: 'board', cellKey: '-1,0' };
    newPieces['blue-SO-0'] = { ...newPieces['blue-SO-0']!, location: 'board', cellKey: '1,0' };
    newPieces['blue-EX-1'] = { ...newPieces['blue-EX-1']!, location: 'board', cellKey: '0,0', stackLevel: 0 };
    newPieces['red-HE-11'] = { ...newPieces['red-HE-11']!, location: 'board', cellKey: '0,0', stackLevel: 1 };

    state = {
      ...state,
      phase: 'play',
      board: newBoard,
      pieces: newPieces,
    };

    const legal = getLegalMoves(state, 'red');

    // Filter actions for Red HE
    const heActions = legal.actions.filter(
      (a) => 'pieceId' in a && a.pieceId === 'red-HE-11'
    );

    // Must have DescendStack action!
    const descendActions = heActions.filter((a) => a.type === 'DescendStack');
    expect(descendActions.length).toBeGreaterThan(0);

    // Can descend to (0,1) or other valid empty spaces touching formation
    const descendsTo01 = descendActions.some((a) => a.type === 'DescendStack' && a.to.q === 0 && a.to.r === 1);
    expect(descendsTo01).toBe(true);
  });
});
