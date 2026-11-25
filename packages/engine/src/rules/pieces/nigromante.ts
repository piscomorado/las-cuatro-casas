import { AxialCoord, CellKey, GameState, House } from '../../types.js';
import { getNeighbors, coordToKey } from '../../coords.js';
import { isOneHive } from '../connectivity.js';
import { getSoberanoMoves } from './soberano.js';

export interface NigromanteActions {
  slideMoves: AxialCoord[];
  swaps: { targetCoord: AxialCoord; targetPieceId: string }[];
  exiles: { targetCoord: AxialCoord; targetPieceId: string }[];
}

/**
 * Nigromante (NI):
 * A. Se desliza 1 espacio.
 * B. Intercambia su lugar con la pieza superior de una pila adyacente, viva o ruina,
 *    Soberanos incluidos. Es instantáneo (no necesita espacio libre para deslizarse).
 * C. Destierra una ficha enemiga viva, sola y contigua, que no sea Soberano y cuya
 *    salida no divida la formación. Vuelve a la reserva al final del siguiente turno de su dueño
 *    y reingresa como ficha nueva. Desde una pila no se puede desterrar.
 */
export function getNigromanteActions(
  coord: AxialCoord,
  isOnStack: boolean,
  state: GameState,
  occupiedKeys: ReadonlySet<CellKey>,
  house: House
): NigromanteActions {
  const currentKey = coordToKey(coord);
  const result: NigromanteActions = {
    slideMoves: [],
    swaps: [],
    exiles: [],
  };

  // If on stack, NI behaves like Gigante on stack (moves 1 step, no swaps or exiles until on floor)
  if (isOnStack) {
    for (const nb of getNeighbors(coord)) {
      const nbKey = coordToKey(nb);
      const nbHeight = state.board[nbKey]?.length ?? 0;
      if (nbHeight > 0) {
        result.slideMoves.push(nb);
      } else {
        // Descend to empty space if hive remains connected
        const nextHive = new Set(occupiedKeys).add(nbKey);
        if (isOneHive(nextHive)) {
          result.slideMoves.push(nb);
        }
      }
    }
    return result;
  }

  // A. Slide 1 step
  result.slideMoves = getSoberanoMoves(coord, state, occupiedKeys);

  // B. Swap with top piece of adjacent stack
  for (const nb of getNeighbors(coord)) {
    const nbKey = coordToKey(nb);
    const stack = state.board[nbKey];
    if (stack && stack.length > 0) {
      const topPieceId = stack[stack.length - 1]!;
      // Swapping positions between NI and topPiece preserves occupied cells set (or if topPiece is alone, both stay occupied)
      result.swaps.push({
        targetCoord: nb,
        targetPieceId: topPieceId,
      });
    }
  }

  // C. Exile (Destierro)
  // Only from floor
  for (const nb of getNeighbors(coord)) {
    const nbKey = coordToKey(nb);
    const stack = state.board[nbKey];
    // Must be alone (stack height == 1)
    if (!stack || stack.length !== 1) continue;

    const targetPieceId = stack[0]!;
    const targetPiece = state.pieces[targetPieceId];
    if (!targetPiece) continue;

    // Must be enemy, alive, and not Sovereign
    if (targetPiece.house === house) continue;
    if (targetPiece.location !== 'board') continue;
    if (targetPiece.type === 'SO') continue;
    if (!state.aliveHouses.includes(targetPiece.house)) continue; // cannot exile ruins

    // Removal must not divide the formation
    const hiveWithoutTarget = new Set(occupiedKeys);
    hiveWithoutTarget.delete(nbKey);

    if (isOneHive(hiveWithoutTarget)) {
      result.exiles.push({
        targetCoord: nb,
        targetPieceId,
      });
    }
  }

  return result;
}
