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

  for (const dir of DIRS) {
    let curr = coord;
    for (let step = 1; step <= 4; step++) {
      curr = addCoords(curr, dir);
      const currKey = coordToKey(curr);
      const stack = state.board[currKey];
      const stackHeight = stack?.length ?? 0;

      // If blocked by a stack of height >= 2, line is blocked
      if (stackHeight >= 2) {
        break;
      }

      // If cell is occupied by 1 piece, we jump over it and continue
      if (stackHeight === 1) {
        continue;
      }

      // Cell is empty: valid landing candidate if it touches the formation
      const touchesHive = getNeighbors(curr).some((n) => {
        const nKey = coordToKey(n);
        return hiveWithoutMe.has(nKey);
      });

      if (touchesHive) {
        if (!isBridge || isOneHive(new Set(hiveWithoutMe).add(currKey))) {
          moves.push(curr);
        }
      }
      // An empty cell does not block straight line of up to 4 steps as long as path permits,
      // but in game rules each step advances along the line.
    }
  }

  return moves;
}
