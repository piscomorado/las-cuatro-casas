import { AxialCoord, CellKey, GameState } from '../../types.js';
import { getNeighbors, coordToKey } from '../../coords.js';
import { getSoberanoMoves } from './soberano.js';
import { getExploradorMoves } from './explorador.js';
import { getCazadorMoves } from './cazador.js';
import { getBestiaMoves } from './bestia.js';
import { getGiganteMoves, GiganteMoves } from './gigante.js';

export interface HechiceroCopyOptions {
  copiedPieceType: string;
  sourceCoord: AxialCoord;
  destinations: AxialCoord[];
  isClimb?: boolean;
}

/**
 * Hechicero de Cadenas (HE):
 * Suelo: copia el movimiento de la pieza superior de una pila que toque, viva o ruina,
 * salvo el Nigromante. La copia vale solo ese turno. Solo copiando al Gigante puede trepar.
 * Pila: se mueve 1 paso como el Gigante y no copia.
 * Si un Gigante lo intercepta (está encima de él), queda sin movimiento.
 */
export function getHechiceroMoves(
  coord: AxialCoord,
  isOnStack: boolean,
  state: GameState,
  occupiedKeys: ReadonlySet<CellKey>
): {
  movesOnStack: AxialCoord[];
  descendMoves: AxialCoord[];
  copies: HechiceroCopyOptions[];
} {
  if (isOnStack) {
    // On stack: moves 1 step like Gigante, does not copy
    const gMoves = getGiganteMoves(coord, true, state, occupiedKeys);
    return {
      movesOnStack: gMoves.moveOnTop,
      descendMoves: gMoves.descend,
      copies: [],
    };
  }

  const copies: HechiceroCopyOptions[] = [];
  const currentKey = coordToKey(coord);

  // Look at all neighboring stacks
  for (const nb of getNeighbors(coord)) {
    const nbKey = coordToKey(nb);
    const stack = state.board[nbKey];
    if (!stack || stack.length === 0) continue;

    const topPieceId = stack[stack.length - 1]!;
    const topPiece = state.pieces[topPieceId];
    if (!topPiece) continue;

    // Never copies Nigromante
    if (topPiece.type === 'NI') continue;

    let dests: AxialCoord[] = [];
    let isClimb = false;

    switch (topPiece.type) {
      case 'SO':
        dests = getSoberanoMoves(coord, state, occupiedKeys);
        break;
      case 'EX':
        dests = getExploradorMoves(coord, state, occupiedKeys);
        break;
      case 'CZ':
        dests = getCazadorMoves(coord, state, occupiedKeys);
        break;
      case 'BS':
        dests = getBestiaMoves(coord, state, occupiedKeys);
        break;
      case 'GI': {
        const gm = getGiganteMoves(coord, false, state, occupiedKeys);
        dests = [...gm.slideFloor, ...gm.climb];
        isClimb = gm.climb.length > 0;
        break;
      }
      case 'HE':
        // Hechicero copies another Hechicero: slides 1 space (manual v0.4 case table)
        dests = getSoberanoMoves(coord, state, occupiedKeys);
        break;
    }

    if (dests.length > 0) {
      copies.push({
        copiedPieceType: topPiece.type,
        sourceCoord: nb,
        destinations: dests,
        isClimb,
      });
    }
  }

  return {
    movesOnStack: [],
    descendMoves: [],
    copies,
  };
}
