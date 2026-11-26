import { AxialCoord, CellKey, GameState } from '../../types.js';
import { getNeighbors, coordToKey, gateOk } from '../../coords.js';
import { isOneHive } from '../connectivity.js';

export interface GiganteMoves {
  slideFloor: AxialCoord[];
  climb: AxialCoord[];
  moveOnTop: AxialCoord[];
  descend: AxialCoord[];
}

/**
 * Gigante (GI):
 * Avanza 1 espacio o trepa a cualquier pila, quedando encima.
 * Desde la cima se mueve 1 paso por encima de la formación o baja a un espacio libre.
 * La ficha de abajo queda inmóvil mientras él esté encima.
 */
export function getGiganteMoves(
  coord: AxialCoord,
  isOnStack: boolean,
  state: GameState,
  occupiedKeys: ReadonlySet<CellKey>
): GiganteMoves {
  const currentKey = coordToKey(coord);
  const result: GiganteMoves = {
    slideFloor: [],
    climb: [],
    moveOnTop: [],
    descend: [],
  };

  const stackAtCurrent = state.board[currentKey]?.length ?? 0;
  // If we are on floor (stack height 1) and leaving leaves the cell empty, check if we are a bridge
  const leavingLeavesEmpty = !isOnStack || stackAtCurrent <= 1;
  const hiveWithoutMe = new Set(occupiedKeys);
  if (leavingLeavesEmpty) {
    hiveWithoutMe.delete(currentKey);
  }
  const isBridge = leavingLeavesEmpty && !isOneHive(hiveWithoutMe);

  for (const nb of getNeighbors(coord)) {
    const nbKey = coordToKey(nb);
    const nbStackHeight = state.board[nbKey]?.length ?? 0;

    if (!isOnStack) {
      // GI is on the floor
      if (nbStackHeight === 0) {
        // Slide to empty space (must respect physical passage and touch remaining hive)
        if (!gateOk(coord, nb, occupiedKeys)) continue;
        const nextHive = new Set(hiveWithoutMe).add(nbKey);
        if ((!isBridge || isOneHive(nextHive)) && isOneHive(nextHive)) {
          result.slideFloor.push(nb);
        }
      } else {
        // Climb onto existing stack (any height)
        if (!isBridge || isOneHive(hiveWithoutMe)) {
          result.climb.push(nb);
        }
      }
    } else {
      // GI is on top of a stack
      if (nbStackHeight > 0) {
        // Move from top of this stack to top of adjacent stack
        if (!isBridge || isOneHive(hiveWithoutMe)) {
          result.moveOnTop.push(nb);
        }
      } else {
        // Descend to empty space
        const nextHive = new Set(hiveWithoutMe).add(nbKey);
        if ((!isBridge || isOneHive(nextHive)) && isOneHive(nextHive)) {
          result.descend.push(nb);
        }
      }
    }
  }

  return result;
}
