import { GameState, House, AxialCoord, CellKey, IllegalReason } from '../types.js';
import { coordToKey, getNeighbors } from '../coords.js';

export function validatePlacement(
  state: GameState,
  house: House,
  coord: AxialCoord
): { valid: boolean; reason?: IllegalReason } {
  const targetKey = coordToKey(coord);

  // Target cell must be empty on the board
  const existingStack = state.board[targetKey];
  if (existingStack && existingStack.length > 0) {
    return { valid: false, reason: 'CELL_OCCUPIED' };
  }

  const occupiedKeys = new Set(Object.keys(state.board).filter((k) => (state.board[k as CellKey]?.length ?? 0) > 0));

  // If the board is completely empty, first piece of the game can be placed anywhere (usually (0,0))
  if (occupiedKeys.size === 0) {
    return { valid: true };
  }

  const neighbors = getNeighbors(coord);
  const neighborKeys = neighbors.map(coordToKey);
  const occupiedNeighborKeys = neighborKeys.filter((k) => occupiedKeys.has(k as CellKey));

  // Must touch at least one piece on the board
  if (occupiedNeighborKeys.length === 0) {
    return { valid: false, reason: 'STRICT_COLONY_VIOLATION' };
  }

  // Sixth space exception: cannot complete the 6th neighboring cell of any living Sovereign
  // Checked first to enforce the strict rule against completing a siege via placement!
  if (wouldCompleteSixthSpace(state, coord)) {
    return { valid: false, reason: 'CANNOT_COMPLETE_SIXTH_SPACE' };
  }

  // Count pieces of this house currently on board
  let piecesOfHouseOnBoard = 0;
  for (const p of Object.values(state.pieces)) {
    if (p.house === house && p.location === 'board') {
      piecesOfHouseOnBoard++;
    }
  }

  // First piece of this house: can touch existing formation (even enemy pieces)
  if (piecesOfHouseOnBoard === 0) {
    return { valid: true };
  }

  // Subsequent placements: STRICT COLONY RULE:
  // Must touch at least one friendly piece (top piece of friendly house)
  // AND MUST NOT touch any enemy piece (top piece of different house, alive or ruin)
  let touchesFriendly = false;
  let touchesEnemy = false;

  for (const nbKey of occupiedNeighborKeys) {
    const stack = state.board[nbKey as CellKey];
    if (stack && stack.length > 0) {
      const topPieceId = stack[stack.length - 1]!;
      const topPiece = state.pieces[topPieceId];
      if (topPiece) {
        if (topPiece.house === house && topPiece.location !== 'ruin') {
          touchesFriendly = true;
        } else {
          touchesEnemy = true;
        }
      }
    }
  }

  if (!touchesFriendly || touchesEnemy) {
    return { valid: false, reason: 'STRICT_COLONY_VIOLATION' };
  }

  return { valid: true };
}

/**
 * Checks whether placing a piece at 'coord' would complete the sixth neighboring occupied space
 * around any living Sovereign on the board.
 */
export function wouldCompleteSixthSpace(state: GameState, coord: AxialCoord): boolean {
  for (const piece of Object.values(state.pieces)) {
    if (piece.type === 'SO' && piece.location === 'board' && piece.cellKey) {
      if (!state.aliveHouses.includes(piece.house)) continue;

      const parts = piece.cellKey.split(',');
      const soCoord = {
        q: Number(parts[0]),
        r: Number(parts[1]),
      };
      const soNeighbors = getNeighbors(soCoord);

      // Is target coord one of the neighbors of this Sovereign?
      const isNeighborOfSO = soNeighbors.some((n) => n.q === coord.q && n.r === coord.r);
      if (isNeighborOfSO) {
        // Count how many neighbors of this Sovereign are currently occupied
        let occupiedNeighbors = 0;
        for (const sn of soNeighbors) {
          const snKey = coordToKey(sn);
          if ((state.board[snKey]?.length ?? 0) > 0) {
            occupiedNeighbors++;
          }
        }
        // If 5 are already occupied, placing here would be the 6th!
        if (occupiedNeighbors === 5) {
          return true;
        }
      }
    }
  }
  return false;
}
