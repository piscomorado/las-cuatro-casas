import { describe, it, expect } from 'vitest';
import { initGame, applyAction } from '../../src/engine.js';
import { getLegalMoves } from '../../src/getLegalMoves.js';

describe('Option A: Regla de Apertura (3 fichas iniciales con Soberano obligatorio)', () => {
  it('begins game in setup phase with each house deploying 3 pieces consecutively', () => {
    let state = initGame();
    expect(state.phase).toBe('setup');
    expect(state.currentHouseIndex).toBe(0); // Red
    expect(state.setupCount.red).toBe(0);

    // Red's 1st placement (anywhere, e.g. 0,0)
    let legal = getLegalMoves(state, 'red');
    expect(legal.actions.every((a) => a.type === 'PlacePiece')).toBe(true);

    const place1 = applyAction(state, {
      type: 'PlacePiece',
      house: 'red',
      pieceId: 'red-EX-1',
      to: { q: 0, r: 0 },
    });
    expect(place1.success).toBe(true);
    state = place1.state;

    // Still Red's turn! (1 of 3 placed)
    expect(state.phase).toBe('setup');
    expect(state.aliveHouses[state.currentHouseIndex]).toBe('red');
    expect(state.setupCount.red).toBe(1);

    // Red's 2nd placement
    legal = getLegalMoves(state, 'red');
    expect(legal.actions.every((a) => a.type === 'PlacePiece')).toBe(true);
    // Can still choose any available piece in hand (SO or CZ)
    const canChooseCZ = legal.actions.some((a) => a.type === 'PlacePiece' && a.pieceId.includes('CZ'));
    expect(canChooseCZ).toBe(true);

    const place2 = applyAction(state, {
      type: 'PlacePiece',
      house: 'red',
      pieceId: 'red-CZ-4',
      to: { q: 1, r: 0 },
    });
    expect(place2.success).toBe(true);
    state = place2.state;

    // Still Red's turn! (2 of 3 placed)
    expect(state.phase).toBe('setup');
    expect(state.aliveHouses[state.currentHouseIndex]).toBe('red');
    expect(state.setupCount.red).toBe(2);

    // Red's 3rd placement: Sovereign MUST be placed now since it wasn't placed in pieces 1 or 2!
    legal = getLegalMoves(state, 'red');
    expect(legal.actions.length).toBeGreaterThan(0);
    for (const act of legal.actions) {
      if (act.type === 'PlacePiece') {
        expect(act.pieceId).toContain('SO');
      }
    }

    const place3 = applyAction(state, {
      type: 'PlacePiece',
      house: 'red',
      pieceId: 'red-SO-0',
      to: { q: 0, r: 1 },
    });
    expect(place3.success).toBe(true);
    state = place3.state;

    // Red has placed 3 pieces. Now turn transitions to Blue for setup!
    expect(state.phase).toBe('setup');
    expect(state.aliveHouses[state.currentHouseIndex]).toBe('blue');
    expect(state.setupCount.red).toBe(3);
    expect(state.setupCount.blue).toBe(0);
  });

  it('completes setup after all 4 houses place 3 pieces, then enters play phase', () => {
    let state = initGame();
    const houses = state.activeHouses;

    // Simulate setup for each house
    for (const h of houses) {
      expect(state.phase).toBe('setup');
      expect(state.aliveHouses[state.currentHouseIndex]).toBe(h);

      // 3 placements for house h
      for (let i = 0; i < 3; i++) {
        const legal = getLegalMoves(state, h);
        expect(legal.actions.length).toBeGreaterThan(0);
        const action = legal.actions[0]!;
        state = applyAction(state, action).state;
      }
      expect(state.setupCount[h]).toBe(3);
    }

    // Now all houses have deployed their 3 pieces
    expect(state.phase).toBe('play');
    expect(state.aliveHouses[state.currentHouseIndex]).toBe('red'); // Red starts play phase

    // In play phase, all legal actions (including movements) are now available
    const legalPlay = getLegalMoves(state, 'red');
    expect(legalPlay.actions.length).toBeGreaterThan(0);
    // Pieces on board can now move
    const hasMoveActions = legalPlay.actions.some((a) => a.type === 'MovePiece');
    expect(hasMoveActions).toBe(true);
  });

  it('guarantees that every house places 3 pieces even with random starting house index', () => {
    // Start with startingHouseIndex = 3 (Amber in 4-house game)
    let state = initGame({ startingHouseIndex: 3 });
    const startingHouse = state.aliveHouses[0];
    expect(startingHouse).toBe('amber');

    // Simulate 12 setup placements total (3 per house * 4 houses)
    for (let round = 0; round < 4; round++) {
      const activeHouse = state.aliveHouses[state.currentHouseIndex]!;
      expect(state.phase).toBe('setup');
      for (let p = 0; p < 3; p++) {
        expect(state.aliveHouses[state.currentHouseIndex]).toBe(activeHouse);
        const legal = getLegalMoves(state, activeHouse);
        expect(legal.actions.length).toBeGreaterThan(0);
        state = applyAction(state, legal.actions[0]!).state;
      }
      expect(state.setupCount[activeHouse]).toBe(3);
    }

    // After all 4 houses place 3 pieces, phase transitions to 'play'
    expect(state.phase).toBe('play');
    for (const h of state.aliveHouses) {
      expect(state.setupCount[h]).toBe(3);
    }
  });
});
