import { CellKey, AxialCoord } from '../types.js';
import { getNeighbors, coordToKey, keyToCoord } from '../coords.js';

/**
 * Checks if the given set of occupied cell keys forms a single connected component (one_hive rule).
 * An empty set or set of 1 cell is trivially connected.
 */
export function isOneHive(cells: ReadonlySet<CellKey>): boolean {
  if (cells.size <= 1) return true;

  const iterator = cells.values();
  const first = iterator.next().value;
  if (!first) return true;

  const visited = new Set<CellKey>();
  const queue: AxialCoord[] = [keyToCoord(first)];
  visited.add(first);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const nb of getNeighbors(current)) {
      const nbKey = coordToKey(nb);
      if (cells.has(nbKey) && !visited.has(nbKey)) {
        visited.add(nbKey);
        queue.push(nb);
      }
    }
  }

  return visited.size === cells.size;
}

/**
 * Calculates articulation points (bridge cells) in the occupied cells set.
 * A cell is an articulation point if removing it breaks the one_hive connectivity.
 */
export function getArticulationPoints(cells: ReadonlySet<CellKey>): Set<CellKey> {
  const articulation = new Set<CellKey>();
  if (cells.size <= 2) {
    return articulation;
  }

  for (const cellKey of cells) {
    const subset = new Set(cells);
    subset.delete(cellKey);
    if (!isOneHive(subset)) {
      articulation.add(cellKey);
    }
  }

  return articulation;
}
