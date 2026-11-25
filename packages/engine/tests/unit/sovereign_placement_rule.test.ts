import { describe, it, expect } from 'vitest';
import { initGame, applyAction } from '../../src/engine.js';
import { getLegalMoves } from '../../src/getLegalMoves.js';

describe('Manual v0.4 §6: Regla del Soberano (Colocación <= turno 4 y sin movimiento previo)', () => {
  it('cannot move any pieces until the Sovereign is on the board', () => {
    let state = initGame();

    // Red places EX at 0,0
    state = applyAction(state, {
      type: 'PlacePiece',
      house: 'red',
      pieceId: 'red-EX-1',
      to: { q: 0, r: 0 },
    }).state;

    // Pass other houses
    state = applyAction(state, { type: 'Pass', house: 'blue' }).state;
    state = applyAction(state, { type: 'Pass', house: 'green' }).state;
    state = applyAction(state, { type: 'Pass', house: 'amber' }).state;

    // It is Red's 2nd turn. Sovereign is NOT on board yet.
    // Red cannot move red-EX-1! Only placements are legal.
    const legal = getLegalMoves(state, 'red');
    const moveActions = legal.actions.filter((a) => a.type === 'MovePiece');
    expect(moveActions.length).toBe(0);
  });

  it('forces Sovereign placement if 4th own turn is reached without Sovereign', () => {
    let state = initGame();

    // Set ownTurns for red to 3 (about to play 4th turn)
    state = {
      ...state,
      ownTurns: { ...state.ownTurns, red: 3 },
      board: { '0,0': ['red-EX-1'] },
      pieces: {
        ...state.pieces,
        'red-EX-1': { ...state.pieces['red-EX-1']!, location: 'board', cellKey: '0,0' },
      },
    };

    const legal = getLegalMoves(state, 'red');
    const placements = legal.actions.filter((a) => a.type === 'PlacePiece') as {
      type: 'PlacePiece';
      pieceId: string;
    }[];

    expect(placements.length).toBeGreaterThan(0);
    // Every legal placement MUST be the Sovereign!
    for (const p of placements) {
      expect(p.pieceId).toContain('SO');
    }
  });
});
