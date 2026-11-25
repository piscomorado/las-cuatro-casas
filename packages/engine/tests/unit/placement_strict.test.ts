import { describe, it, expect } from 'vitest';
import { initGame, applyAction } from '../../src/engine.js';
import { validatePlacement } from '../../src/rules/placement.js';

describe('Manual v0.4 §4.2: Colocación Estricta de Colonia', () => {
  it('allows the very first piece anywhere (0,0)', () => {
    const state = initGame();
    const val = validatePlacement(state, 'red', { q: 0, r: 0 });
    expect(val.valid).toBe(true);
  });

  it('allows first piece of second house to touch existing formation (contact exception)', () => {
    let state = initGame();
    // Red places first piece at 0,0
    const res1 = applyAction(state, {
      type: 'PlacePiece',
      house: 'red',
      pieceId: 'red-EX-1',
      to: { q: 0, r: 0 },
    });
    expect(res1.success).toBe(true);
    state = res1.state;

    // Blue's first piece can touch Red's piece at 1,0
    const val = validatePlacement(state, 'blue', { q: 1, r: 0 });
    expect(val.valid).toBe(true);
  });

  it('strictly forbids subsequent placement touching an enemy piece', () => {
    let state = initGame();
    // Simulate state where Red has a piece at 0,0 and Blue has a piece at 1,0
    state = {
      ...state,
      phase: 'play',
      board: {
        '0,0': ['red-EX-1'],
        '1,0': ['blue-EX-1'],
      },
      pieces: {
        ...state.pieces,
        'red-EX-1': { ...state.pieces['red-EX-1']!, location: 'board', cellKey: '0,0' },
        'blue-EX-1': { ...state.pieces['blue-EX-1']!, location: 'board', cellKey: '1,0' },
      },
    };

    // Now it is Red's turn.
    // Red has already placed at 0,0.
    // Trying to place at (1,-1) touches both (0,0)[Red] and (1,0)[Blue].
    // Strict colony forbids touching enemy pieces!
    const val = validatePlacement(state, 'red', { q: 1, r: -1 });
    expect(val.valid).toBe(false);
    expect(val.reason).toBe('STRICT_COLONY_VIOLATION');

    // Placing at (-1,0) touches only (0,0)[Red] and no enemies -> LEGAL!
    const valLegal = validatePlacement(state, 'red', { q: -1, r: 0 });
    expect(valLegal.valid).toBe(true);
  });
});
