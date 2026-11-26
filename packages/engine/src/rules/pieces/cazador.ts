import { AxialCoord, CellKey, GameState } from '../../types.js';
import { DIRS, coordToKey, addCoords, getNeighbors } from '../../coords.js';
import { isOneHive } from '../connectivity.js';

/**
 * Cazador (CZ):
 * Recorre en línea recta hasta 4 pasos, sin girar.
 * Salta exactamente una pila de altura 1; una pila de 2 o más lo bloquea.
 * Aterriza en casilla vacía que toque la formación.
 */
export function getCazadorMoves(
  coord: AxialCoord,
  state: GameState,
  occupiedKeys: ReadonlySet<CellKey>
): AxialCoord[] {
  const currentKey = coordToKey(coord);
  const hiveWithoutMe = new Set(occupiedKeys);
  hiveWithoutMe.delete(currentKey);

  // If removing this piece disconnects the rest, it cannot move unless it lands reconnecting it
  const isBridge = !isOneHive(hiveWithoutMe);

  const moves: AxialCoord[] = [];
  const maxSteps = state.config.hunterMaxSteps ?? 4;

  for (const dir of DIRS) {
    let curr = coord;
    let over = 0; // Number of height-1 stacks jumped over in this line

    for (let step = 1; step <= maxSteps; step++) {
      curr = addCoords(curr, dir);
      const currKey = coordToKey(curr);
      const stack = state.board[currKey];
      const stackHeight = stack?.length ?? 0;

      // If cell has stack >= 2, line is blocked
      if (stackHeight >= 2) {
        break;
      }

      // If cell has stack === 1, can jump over up to 3 pieces of height 1
      if (stackHeight === 1) {
        over++;
        if (over > 3) {
          // Cannot jump over more than 3 pieces
          break;
        }
        continue;
      }

      // Cell is empty (stackHeight === 0)
      // Landing rule: must touch the remaining formation
      const touchesHive = getNeighbors(curr).some((n) => {
        const nKey = coordToKey(n);
        return hiveWithoutMe.has(nKey);
      });

      if (touchesHive) {
        if (!isBridge || isOneHive(new Set(hiveWithoutMe).add(currKey))) {
          moves.push(curr);
        }
      }

      // Lands on the first empty space (1-step step or jump over 1-3 pieces).
      // Stops immediately so it cannot jump through empty air to further cells.
      break;
    }
  }

  return moves;
}
