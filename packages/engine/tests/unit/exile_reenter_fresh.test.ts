import { describe, it, expect } from 'vitest';
import { initGame, applyAction } from '../../src/engine.js';
import { CellKey } from '../../src/types.js';

describe('Manual v0.4 §6: Destierro y Reingreso como Ficha Nueva', () => {
  it('exiles enemy piece, returns to owner hand after next turn, reenters as fresh placement', () => {
    let state = initGame();

    // Red NI at 0,0, Red SO at -1,0
    // Blue EX at 0,1
    const newBoard: Record<CellKey, string[]> = {
      '0,0': ['red-NI-12'],
      '-1,0': ['red-SO-0'],
      '0,1': ['blue-EX-1'],
    };

    const newPieces = { ...state.pieces };
    newPieces['red-NI-12'] = { ...newPieces['red-NI-12']!, location: 'board', cellKey: '0,0' };
    newPieces['red-SO-0'] = { ...newPieces['red-SO-0']!, location: 'board', cellKey: '-1,0' };
    newPieces['blue-EX-1'] = { ...newPieces['blue-EX-1']!, location: 'board', cellKey: '0,1' };

    state = {
      ...state,
      phase: 'play',
      board: newBoard,
      pieces: newPieces,
    };

    // Red executes ExilePiece on blue-EX-1
    const resExile = applyAction(state, {
      type: 'ExilePiece',
      house: 'red',
      pieceId: 'red-NI-12',
      targetPieceId: 'blue-EX-1',
    });

    expect(resExile.success).toBe(true);
    state = resExile.state;

    // Piece is removed from board and in 'exiled' location
    expect(state.board['0,1']).toBeUndefined();
    expect(state.pieces['blue-EX-1']!.location).toBe('exiled');
    expect(state.pending.length).toBe(1);

    // Blue plays a turn (Pass)
    state = applyAction(state, { type: 'Pass', house: 'blue' }).state;

    // At the end of Blue's turn, the exiled piece returns to Blue's hand!
    expect(state.pieces['blue-EX-1']!.location).toBe('hand');
    expect(state.pending.length).toBe(0);
    expect(state.pieces['blue-EX-1']!.wasExiled).toBe(true);
  });
});
