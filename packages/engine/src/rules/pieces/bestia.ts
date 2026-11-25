import { AxialCoord, CellKey, GameState } from '../../types.js';
import { DIRS, coordToKey, addCoords } from '../../coords.js';
import { isOneHive } from '../connectivity.js';

/**
 * Bestia Saltadora (BS):
 * Carga en línea recta sobre cualquier número de fichas (mínimo 1) y cae en la primera
 * casilla vacía al otro lado. Puede entrar y salir de huecos rodeados.
 */
export function getBestiaMoves(
  coord: AxialCoord,
  state: GameState,
  occupiedKeys: ReadonlySet<CellKey>
): AxialCoord[] {
  const currentKey = coordToKey(coord);
  const hiveWithoutMe = new Set(occupiedKeys);
  hiveWithoutMe.delete(currentKey);

  const isBridge = !isOneHive(hiveWithoutMe);
  const moves: AxialCoord[] = [];

  for (const dir of DIRS) {
    let curr = addCoords(coord, dir);
    let currKey = coordToKey(curr);

    // Must jump over at least one occupied cell directly adjacent
    if ((state.board[currKey]?.length ?? 0) === 0) {
      continue;
    }

    // Keep advancing through contiguous occupied cells
    while ((state.board[currKey]?.length ?? 0) > 0) {
      curr = addCoords(curr, dir);
      currKey = coordToKey(curr);
    }

    // 'curr' is now the first empty space right after the contiguous group of pieces
    if (!isBridge || isOneHive(new Set(hiveWithoutMe).add(currKey))) {
      moves.push(curr);
    }
  }

  return moves;
}
