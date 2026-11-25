import { describe, it, expect } from 'vitest';
import { isOneHive, getArticulationPoints } from '../../src/rules/connectivity.js';
import { CellKey } from '../../src/types.js';

describe('Manual v0.4 §4.3: Conectividad y Regla one_hive', () => {
  it('trivially holds for empty set and single cell', () => {
    expect(isOneHive(new Set())).toBe(true);
    expect(isOneHive(new Set(['0,0']))).toBe(true);
  });

  it('detects connected cells', () => {
    const cells = new Set<CellKey>(['0,0', '1,0', '1,-1']);
    expect(isOneHive(cells)).toBe(true);
  });

  it('detects disconnected cells', () => {
    const cells = new Set<CellKey>(['0,0', '2,0']);
    expect(isOneHive(cells)).toBe(false);
  });

  it('correctly identifies articulation points (bridge cells)', () => {
    // 0,0 connects -1,0 and 1,0. If 0,0 is removed, -1,0 and 1,0 are disconnected.
    const cells = new Set<CellKey>(['-1,0', '0,0', '1,0']);
    const bridges = getArticulationPoints(cells);
    expect(bridges.has('0,0')).toBe(true);
    expect(bridges.has('-1,0')).toBe(false);
    expect(bridges.has('1,0')).toBe(false);
  });
});
