import {
  GameState,
  House,
  Action,
  AxialCoord,
  CellKey,
  Piece,
} from './types.js';
import { coordToKey, keyToCoord, getNeighbors } from './coords.js';
import { validatePlacement } from './rules/placement.js';
import { getSoberanoMoves } from './rules/pieces/soberano.js';
import { getExploradorMoves } from './rules/pieces/explorador.js';
import { getCazadorMoves } from './rules/pieces/cazador.js';
import { getBestiaMoves } from './rules/pieces/bestia.js';
import { getGiganteMoves } from './rules/pieces/gigante.js';
import { getHechiceroMoves } from './rules/pieces/hechicero.js';
import { getNigromanteActions } from './rules/pieces/nigromante.js';

export interface LegalMovesResult {
  actions: Action[];
  canPass: boolean;
}

/**
 * Returns all legal actions for the specified house in the current state.
 */
export function getLegalMoves(state: GameState, house: House): LegalMovesResult {
  const actions: Action[] = [];

  // Check if house is active and alive
  if (!state.aliveHouses.includes(house)) {
    return { actions: [], canPass: false };
  }

  const occupiedKeys = new Set<CellKey>(
    (Object.keys(state.board) as CellKey[]).filter((k) => (state.board[k]?.length ?? 0) > 0)
  );

  const ownTurn = state.ownTurns[house];
  const sovereign = Object.values(state.pieces).find(
    (p) => p.house === house && p.type === 'SO'
  );
  const isSovereignOnBoard = sovereign?.location === 'board';

  // Rule (Manual v0.4 §3): Sovereign must be placed at the latest on own 4th turn.
  // ownTurn is 0-indexed count of completed turns.
  // Turn 1: ownTurn == 0
  // Turn 2: ownTurn == 1
  // Turn 3: ownTurn == 2
  // Turn 4: ownTurn == 3 -> Sovereign is mandatory ONLY if not on board by the 4th turn!
  const mustPlaceSovereignNow = !isSovereignOnBoard && ownTurn >= 3;

  // 1. PLACEMENTS from hand
  const handPieces = Object.values(state.pieces).filter(
    (p) => p.house === house && p.location === 'hand'
  );

  if (handPieces.length > 0) {
    // Generate placement candidate cells: all neighbors of occupied cells + (0,0) if empty board
    const candidateCells = new Set<CellKey>();
    if (occupiedKeys.size === 0) {
      candidateCells.add('0,0');
    } else {
      for (const occKey of occupiedKeys) {
        for (const nb of getNeighbors(keyToCoord(occKey))) {
          const nbKey = coordToKey(nb);
          if (!occupiedKeys.has(nbKey)) {
            candidateCells.add(nbKey);
          }
        }
      }
    }

    // Pieces eligible to be placed
    const piecesToConsider = mustPlaceSovereignNow
      ? handPieces.filter((p) => p.type === 'SO')
      : handPieces;

    // To prevent duplicate equivalent placements with identical piece types, pick one pieceId per type
    const seenTypes = new Set<string>();
    const uniqueTypePieces: Piece[] = [];
    for (const p of piecesToConsider) {
      if (!seenTypes.has(p.type)) {
        seenTypes.add(p.type);
        uniqueTypePieces.push(p);
      }
    }

    for (const cellKey of candidateCells) {
      const coord = keyToCoord(cellKey);
      const val = validatePlacement(state, house, coord);
      if (val.valid) {
        for (const p of uniqueTypePieces) {
          actions.push({
            type: 'PlacePiece',
            house,
            pieceId: p.id,
            to: coord,
          });
        }
      }
    }
  }

  // 2. MOVEMENTS of pieces already on board
  // Rule (Manual v0.4 §3): "No puedes mover ninguna ficha hasta haber colocado tu Soberano."
  if (isSovereignOnBoard) {
    const boardPieces = Object.values(state.pieces).filter(
      (p) => p.house === house && p.location === 'board'
    );

    for (const piece of boardPieces) {
      if (!piece.cellKey) continue;
      const stack = state.board[piece.cellKey];
      if (!stack || stack.length === 0) continue;

      // Only the top piece of a stack can move!
      const topPieceId = stack[stack.length - 1]!;
      if (topPieceId !== piece.id) continue;

      const coord = keyToCoord(piece.cellKey);
      const isOnStack = stack.length > 1;

      switch (piece.type) {
        case 'SO': {
          const moves = getSoberanoMoves(coord, state, occupiedKeys);
          for (const m of moves) {
            actions.push({
              type: 'MovePiece',
              house,
              pieceId: piece.id,
              from: coord,
              to: m,
              moveKind: 'slide',
            });
          }
          break;
        }

        case 'EX': {
          const moves = getExploradorMoves(coord, state, occupiedKeys);
          for (const m of moves) {
            actions.push({
              type: 'MovePiece',
              house,
              pieceId: piece.id,
              from: coord,
              to: m,
              moveKind: 'ex',
            });
          }
          break;
        }

        case 'CZ': {
          const moves = getCazadorMoves(coord, state, occupiedKeys);
          for (const m of moves) {
            actions.push({
              type: 'MovePiece',
              house,
              pieceId: piece.id,
              from: coord,
              to: m,
              moveKind: 'cz',
            });
          }
          break;
        }

        case 'BS': {
          const moves = getBestiaMoves(coord, state, occupiedKeys);
          for (const m of moves) {
            actions.push({
              type: 'MovePiece',
              house,
              pieceId: piece.id,
              from: coord,
              to: m,
              moveKind: 'bs',
            });
          }
          break;
        }

        case 'GI': {
          const gm = getGiganteMoves(coord, isOnStack, state, occupiedKeys);
          for (const m of gm.slideFloor) {
            actions.push({
              type: 'MovePiece',
              house,
              pieceId: piece.id,
              from: coord,
              to: m,
              moveKind: 'slide',
            });
          }
          for (const m of gm.climb) {
            actions.push({
              type: 'ClimbStack',
              house,
              pieceId: piece.id,
              from: coord,
              to: m,
            });
          }
          for (const m of gm.moveOnTop) {
            actions.push({
              type: 'MovePiece',
              house,
              pieceId: piece.id,
              from: coord,
              to: m,
              moveKind: 'slide',
            });
          }
          for (const m of gm.descend) {
            actions.push({
              type: 'DescendStack',
              house,
              pieceId: piece.id,
              from: coord,
              to: m,
            });
          }
          break;
        }

        case 'HE': {
          const hm = getHechiceroMoves(coord, isOnStack, state, occupiedKeys);
          for (const m of hm.movesOnStack) {
            actions.push({
              type: 'MovePiece',
              house,
              pieceId: piece.id,
              from: coord,
              to: m,
              moveKind: 'slide',
            });
          }
          for (const m of hm.descendMoves) {
            actions.push({
              type: 'DescendStack',
              house,
              pieceId: piece.id,
              from: coord,
              to: m,
            });
          }
          for (const c of hm.copies) {
            for (const d of c.destinations) {
              const destStackHeight = state.board[coordToKey(d)]?.length ?? 0;
              if (destStackHeight > 0) {
                actions.push({
                  type: 'ClimbStack',
                  house,
                  pieceId: piece.id,
                  from: coord,
                  to: d,
                });
              } else {
                actions.push({
                  type: 'MovePiece',
                  house,
                  pieceId: piece.id,
                  from: coord,
                  to: d,
                  moveKind: 'slide',
                });
              }
            }
          }
          break;
        }

        case 'NI': {
          const nm = getNigromanteActions(coord, isOnStack, state, occupiedKeys, house);
          for (const m of nm.slideMoves) {
            actions.push({
              type: 'MovePiece',
              house,
              pieceId: piece.id,
              from: coord,
              to: m,
              moveKind: 'slide',
            });
          }
          for (const s of nm.swaps) {
            actions.push({
              type: 'SwapPiece',
              house,
              pieceId: piece.id,
              from: coord,
              to: s.targetCoord,
              targetPieceId: s.targetPieceId,
            });
          }
          for (const e of nm.exiles) {
            actions.push({
              type: 'ExilePiece',
              house,
              pieceId: piece.id,
              targetPieceId: e.targetPieceId,
            });
          }
          break;
        }
      }
    }
  }

  // If no legal moves or placements exist, house must Pass
  const canPass = actions.length === 0;
  if (canPass) {
    actions.push({ type: 'Pass', house });
  }

  return { actions, canPass };
}
