import { AxialCoord, CellKey, GameState } from '../../types.js';
import { getNeighbors, coordToKey, gateOk } from '../../coords.js';
import { isOneHive } from '../connectivity.js';

/**
 * Soberano (SO):
 * Se desliza 1 espacio a una posición vecina libre.
 * Debe mantener conectividad one_hive y respetar gate_ok (paso físico).
 */
export function getSoberanoMoves(
  coord: AxialCoord,
  state: GameState,
  occupiedKeys: ReadonlySet<CellKey>
): AxialCoord[] {
  const currentKey = coordToKey(coord);
  const moves: AxialCoord[] = [];

  // Hive without this piece
  const hiveWithoutMe = new Set(occupiedKeys);
  hiveWithoutMe.delete(currentKey);

  for (const nb of getNeighbors(coord)) {
    const nbKey = coordToKey(nb);

    // Target must be empty
    if ((state.board[nbKey]?.length ?? 0) > 0) continue;

    // Freedom to slide
    if (!gateOk(coord, nb, occupiedKeys)) continue;

    // Target must touch the remaining formation
    const nextHive = new Set(hiveWithoutMe);
    nextHive.add(nbKey);

    if (isOneHive(nextHive)) {
      moves.push(nb);
    }
  }

  return moves;
}
