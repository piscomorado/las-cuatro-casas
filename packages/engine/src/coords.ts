import { AxialCoord, CellKey } from './types.js';

// The six axial directions from the reference Python engine:
// ((1,0), (1,-1), (0,-1), (-1,0), (-1,1), (0,1))
export const DIRS: readonly AxialCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
] as const;

export function coordToKey(coord: AxialCoord): CellKey {
  return `${coord.q},${coord.r}`;
}

export function keyToCoord(key: CellKey): AxialCoord {
  const parts = key.split(',');
  return { q: Number(parts[0]), r: Number(parts[1]) };
}

export function addCoords(a: AxialCoord, b: AxialCoord): AxialCoord {
  return { q: a.q + b.q, r: a.r + b.r };
}

export function coordsEqual(a: AxialCoord, b: AxialCoord): boolean {
  return a.q === b.q && a.r === b.r;
}

export function areNeighbors(a: AxialCoord, b: AxialCoord): boolean {
  const dq = b.q - a.q;
  const dr = b.r - a.r;
  return DIRS.some((d) => d.q === dq && d.r === dr);
}

export function getNeighbors(coord: AxialCoord): AxialCoord[] {
  return DIRS.map((d) => addCoords(coord, d));
}

export function getNeighborKeys(coord: AxialCoord): CellKey[] {
  return DIRS.map((d) => coordToKey(addCoords(coord, d)));
}

/**
 * Common neighbors between two adjacent hexagonal cells a and b.
 * For any two adjacent cells in a regular hex grid, they share exactly two common neighbors.
 */
export function commonNeighbors(a: AxialCoord, b: AxialCoord): [AxialCoord, AxialCoord] {
  const nA = getNeighbors(a);
  const nB = getNeighbors(b);
  const common = nA.filter((ca) => nB.some((cb) => coordsEqual(ca, cb)));
  if (common.length !== 2 || !common[0] || !common[1]) {
    throw new Error(`Cells ${coordToKey(a)} and ${coordToKey(b)} are not adjacent.`);
  }
  return [common[0], common[1]];
}

/**
 * Sliding gate check (freedom to slide / passage clearance).
 * Equivalent to gate_ok() in the reference Python engine:
 * When moving from 'from' to 'to' on the hex grid, sliding is blocked if both common neighbors
 * are occupied by stacks of pieces that pinch the passage.
 */
export function gateOk(
  from: AxialCoord,
  to: AxialCoord,
  occupiedCells: ReadonlySet<CellKey>,
  ignoreCell?: CellKey
): boolean {
  const [c1, c2] = commonNeighbors(from, to);
  const k1 = coordToKey(c1);
  const k2 = coordToKey(c2);

  const occ1 = occupiedCells.has(k1) && k1 !== ignoreCell;
  const occ2 = occupiedCells.has(k2) && k2 !== ignoreCell;

  // If both flanks are occupied, the piece cannot physically slide through the pinch point.
  return !(occ1 && occ2);
}
