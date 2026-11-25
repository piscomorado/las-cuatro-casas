import { AxialCoord, CellKey, GameState } from '../../types.js';
import { getNeighbors, coordToKey, gateOk } from '../../coords.js';
import { isOneHive } from '../connectivity.js';

/**
 * Explorador (EX):
 * Se desliza cualquier número de espacios por el perímetro, por un camino libre y sin separar la formación.
 * No trepa.
 * Port exacto del algoritmo BFS de gate_ok del motor Python (TODO(RULE-PENDING-03)).
 */
export function getExploradorMoves(
  coord: AxialCoord,
  state: GameState,
  occupiedKeys: ReadonlySet<CellKey>
): AxialCoord[] {
  const currentKey = coordToKey(coord);
  const hiveWithoutMe = new Set(occupiedKeys);
  hiveWithoutMe.delete(currentKey);

  // If removing this piece disconnects the rest, it cannot move at all
  if (!isOneHive(hiveWithoutMe)) {
    return [];
  }

  const visited = new Set<CellKey>([currentKey]);
  const queue: AxialCoord[] = [coord];
  const validDestinations: AxialCoord[] = [];

  while (queue.length > 0) {
    const curr = queue.shift()!;

    for (const nb of getNeighbors(curr)) {
      const nbKey = coordToKey(nb);

      if (visited.has(nbKey)) continue;

      // Target must be empty on the board
      if ((state.board[nbKey]?.length ?? 0) > 0 && nbKey !== currentKey) continue;

      // Must have freedom to slide from curr to nb
      if (!gateOk(curr, nb, occupiedKeys, currentKey)) continue;

      // Must touch the remaining hive to slide along the perimeter
      const touchesHive = getNeighbors(nb).some((n) => {
        const nKey = coordToKey(n);
        return hiveWithoutMe.has(nKey);
      });

      if (!touchesHive) continue;

      visited.add(nbKey);
      queue.push(nb);

      if (nbKey !== currentKey) {
        validDestinations.push(nb);
      }
    }
  }

  return validDestinations;
}
