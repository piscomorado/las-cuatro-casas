import { describe, it, expect } from 'vitest';
import { initGame, applyAction } from '../../src/engine.js';
import { validatePlacement } from '../../src/rules/placement.js';
import { CellKey } from '../../src/types.js';

describe('Manual v0.4 §4.2: Excepción de Colocación (Prohibido Cerco por Colocación)', () => {
  it('forbids placing a piece if it completes the 6th neighbor around an alive Sovereign', () => {
    let state = initGame();

    // Red Sovereign placed at 0,0
    state = applyAction(state, {
      type: 'PlacePiece',
      house: 'red',
      pieceId: 'red-SO-0',
      to: { q: 0, r: 0 },
    }).state;

    // Let's manually populate 5 of the 6 neighbors around (0,0)
    // Neighbors of (0,0) are: (1,0), (1,-1), (0,-1), (-1,0), (-1,1), (0,1)
    const fiveNeighbors: [number, number][] = [
      [1, 0],
      [1, -1],
      [0, -1],
      [-1, 0],
      [-1, 1],
    ];

    const newBoard = { ...state.board };
    const newPieces = { ...state.pieces };

    fiveNeighbors.forEach(([q, r], idx) => {
      const key = `${q},${r}` as CellKey;
      const pid = `blue-EX-${idx + 1}`;
      newBoard[key] = [pid];
      newPieces[pid] = {
        ...newPieces[pid]!,
        location: 'board',
        cellKey: key,
        stackLevel: 0,
      };
    });

    state = {
      ...state,
      board: newBoard,
      pieces: newPieces,
    };

    // The 6th neighbor is (0,1). Placing any piece at (0,1) would complete the 6th space of Red SO!
    const val = validatePlacement(state, 'blue', { q: 0, r: 1 });
    expect(val.valid).toBe(false);
    expect(val.reason).toBe('CANNOT_COMPLETE_SIXTH_SPACE');
  });
});
