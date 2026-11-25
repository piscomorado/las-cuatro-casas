import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { initGame, applyAction } from '../../src/engine.js';
import { getLegalMoves } from '../../src/getLegalMoves.js';
import { isOneHive } from '../../src/rules/connectivity.js';
import { CellKey } from '../../src/types.js';

describe('Property Invariants (fast-check)', () => {
  it('preserves one_hive and never breaks hive connectivity during legal play', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), (seed) => {
        let state = initGame({ seed });

        // Play up to 30 actions using random legal moves
        for (let i = 0; i < 30; i++) {
          if (state.status === 'finished') break;

          const currentHouse = state.aliveHouses[state.currentHouseIndex]!;
          const legal = getLegalMoves(state, currentHouse);
          if (legal.actions.length === 0) break;

          // Pick a deterministic action using the pseudo-index
          const actionIdx = (seed + i * 17) % legal.actions.length;
          const chosenAction = legal.actions[actionIdx]!;

          const res = applyAction(state, chosenAction);
          expect(res.success).toBe(true);
          state = res.state;

          // INVARIANT 1: Occupied cells must ALWAYS form a single connected component
          const occupiedKeys = new Set(
            Object.keys(state.board).filter((k) => (state.board[k as CellKey]?.length ?? 0) > 0)
          );
          expect(isOneHive(occupiedKeys)).toBe(true);
        }
      }),
      { numRuns: 20 }
    );
  });
});
