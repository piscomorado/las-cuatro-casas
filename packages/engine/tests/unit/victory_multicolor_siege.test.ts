import { describe, it, expect } from 'vitest';
import { initGame, applyAction } from '../../src/engine.js';
import { CellKey } from '../../src/types.js';

describe('Manual v0.4 §8 & §9: Victoria por Cerco Multicolor', () => {
  it('defeats a house when its Sovereign has all 6 neighbors occupied by any color', () => {
    let state = initGame();

    // Red Sovereign at 0,0
    // Surrounded by pieces of Blue, Green, Amber
    const newBoard: Record<CellKey, string[]> = {
      '0,0': ['red-SO-0'],
      '1,0': ['blue-EX-1'],
      '1,-1': ['blue-EX-2'],
      '0,-1': ['green-EX-1'],
      '-1,0': ['green-EX-2'],
      '-1,1': ['amber-EX-1'],
      // 6th neighbor is 0,1. Green BS will move to 0,1 to complete the siege!
      '0,2': ['green-BS-5'],
    };

    const newPieces = { ...state.pieces };
    newPieces['red-SO-0'] = { ...newPieces['red-SO-0']!, location: 'board', cellKey: '0,0' };
    newPieces['blue-EX-1'] = { ...newPieces['blue-EX-1']!, location: 'board', cellKey: '1,0' };
    newPieces['blue-EX-2'] = { ...newPieces['blue-EX-2']!, location: 'board', cellKey: '1,-1' };
    newPieces['green-EX-1'] = { ...newPieces['green-EX-1']!, location: 'board', cellKey: '0,-1' };
    newPieces['green-EX-2'] = { ...newPieces['green-EX-2']!, location: 'board', cellKey: '-1,0' };
    newPieces['amber-EX-1'] = { ...newPieces['amber-EX-1']!, location: 'board', cellKey: '-1,1' };
    newPieces['green-BS-5'] = { ...newPieces['green-BS-5']!, location: 'board', cellKey: '0,2' };

    state = {
      ...state,
      aliveHouses: ['red', 'blue', 'green', 'amber'],
      currentHouseIndex: 2, // Green's turn
      board: newBoard,
      pieces: newPieces,
    };

    // Green moves green-BS-5 to 0,1
    const res = applyAction(state, {
      type: 'MovePiece',
      house: 'green',
      pieceId: 'green-BS-5',
      from: { q: 0, r: 2 },
      to: { q: 0, r: 1 },
      moveKind: 'slide',
    });

    expect(res.success).toBe(true);
    state = res.state;

    // Red Sovereign at 0,0 is now fully surrounded!
    // Red house falls and is defeated.
    expect(state.aliveHouses).not.toContain('red');
    expect(state.pieces['red-SO-0']!.location).toBe('ruin');
  });
});
