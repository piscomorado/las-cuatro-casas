import { describe, it, expect } from 'vitest';
import { initGame, applyAction } from '../../src/engine.js';
import { CellKey } from '../../src/types.js';

describe('Manual v0.4 §8: Ruinas Permanentes al Caer una Casa', () => {
  it('converts fallen house pieces on board into ruins that lose turn but remain as obstacles and connection', () => {
    let state = initGame();

    // Red SO surrounded at 0,0
    const newBoard: Record<CellKey, string[]> = {
      '0,0': ['red-SO-0'],
      '1,0': ['blue-EX-1'],
      '1,-1': ['blue-EX-2'],
      '0,-1': ['blue-EX-3'],
      '-1,0': ['green-EX-1'],
      '-1,1': ['green-EX-2'],
      '0,1': ['green-EX-3'],
      '-2,0': ['red-EX-2'], // valid Red piece
    };

    const newPieces = { ...state.pieces };
    Object.keys(newBoard).forEach((k) => {
      const pid = newBoard[k as CellKey]![0]!;
      newPieces[pid] = { ...newPieces[pid]!, location: 'board', cellKey: k as CellKey };
    });

    state = {
      ...state,
      aliveHouses: ['red', 'blue', 'green', 'amber'],
      currentHouseIndex: 1, // Blue's turn
      board: newBoard,
      pieces: newPieces,
    };

    // Blue passes
    const res = applyAction(state, { type: 'Pass', house: 'blue' });
    state = res.state;

    // Red is defeated
    expect(state.aliveHouses).not.toContain('red');

    // Both Red pieces on the board are now ruins!
    expect(state.pieces['red-SO-0']!.location).toBe('ruin');
    expect(state.pieces['red-EX-2']!.location).toBe('ruin');
  });
});
