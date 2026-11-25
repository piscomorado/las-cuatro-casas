import { describe, it, expect } from 'vitest';
import { initGame, applyAction } from '../../src/engine.js';
import { evaluateVictory } from '../../src/rules/victory.js';
import { CellKey } from '../../src/types.js';

describe('Manual v0.4 §9: Condiciones de Empate y Casos Especiales', () => {
  it('detects simultaneous defeat of all remaining houses as draw', () => {
    const state = initGame();
    // Simulate both Red and Blue remaining, both having besieged Sovereigns
    const besiegedBoard: Record<CellKey, string[]> = {
      // Red at 0,0 surrounded
      '0,0': ['red-SO-0'],
      '1,0': ['green-EX-1'],
      '1,-1': ['green-EX-2'],
      '0,-1': ['green-EX-3'],
      '-1,0': ['green-CZ-4'],
      '-1,1': ['green-CZ-5'],
      '0,1': ['green-CZ-6'],

      // Blue at 3,3 surrounded
      '3,3': ['blue-SO-0'],
      '4,3': ['amber-EX-1'],
      '4,2': ['amber-EX-2'],
      '3,2': ['amber-EX-3'],
      '2,3': ['amber-CZ-4'],
      '2,4': ['amber-CZ-5'],
      '3,4': ['amber-CZ-6'],
    };

    const newPieces = { ...state.pieces };
    Object.entries(besiegedBoard).forEach(([k, stack]) => {
      newPieces[stack[0]!] = {
        ...newPieces[stack[0]!]!,
        location: 'board',
        cellKey: k as CellKey,
      };
    });

    const twoHouseState = {
      ...state,
      aliveHouses: ['red', 'blue'] as any,
      board: besiegedBoard,
      pieces: newPieces,
    };

    const evalRes = evaluateVictory(twoHouseState);
    expect(evalRes.isFinished).toBe(true);
    expect(evalRes.winner).toBeNull();
    expect(evalRes.drawReason).toBe('simultaneous');
  });

  it('triggers 3-fold repetition draw when identical board occurs 3 times', () => {
    let state = initGame();

    // Place initial pieces
    state = applyAction(state, {
      type: 'PlacePiece',
      house: 'red',
      pieceId: 'red-EX-1',
      to: { q: 0, r: 0 },
    }).state;

    // Simulate artificially incrementing repetition counter on the current board
    const hash = Object.keys(state.positionHistory)[0]!;
    state = {
      ...state,
      phase: 'play',
      currentHouseIndex: 1, // Blue's turn
      positionHistory: { [hash]: 2 },
    };

    // Next pass triggers the 3rd repetition
    const res = applyAction(state, { type: 'Pass', house: 'blue' });
    expect(res.state.status).toBe('finished');
    expect(res.state.drawReason).toBe('repetition');
  });
});
