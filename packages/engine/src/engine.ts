import {
  GameState,
  House,
  Action,
  ActionResult,
  GameEvent,
  Piece,
  CellKey,
  AxialCoord,
  HOUSES,
  PieceType,
  PendingReturn,
} from './types.js';
import { coordToKey, keyToCoord } from './coords.js';
import { evaluateVictory } from './rules/victory.js';

export const COMPOSITION: readonly [PieceType, number][] = [
  ['SO', 1],
  ['EX', 3],
  ['CZ', 3],
  ['BS', 2],
  ['GI', 2],
  ['HE', 1],
  ['NI', 1],
] as const;

export function initGame(options?: {
  id?: string;
  seed?: number;
  houses?: readonly House[];
}): GameState {
  const activeHouses = options?.houses ?? HOUSES;
  const seed = options?.seed ?? 1001;
  const id = options?.id ?? `game-${seed}`;

  const pieces: Record<string, Piece> = {};
  for (const house of activeHouses) {
    let pieceIdx = 0;
    for (const [type, count] of COMPOSITION) {
      for (let i = 0; i < count; i++) {
        const pieceId = `${house}-${type}-${pieceIdx++}`;
        pieces[pieceId] = {
          id: pieceId,
          house,
          type,
          cellKey: null,
          stackLevel: 0,
          location: 'hand',
          wasExiled: false,
        };
      }
    }
  }

  const ownTurns: Record<House, number> = {
    red: 0,
    blue: 0,
    green: 0,
    amber: 0,
  };

  return {
    id,
    seed,
    turn: 0,
    activeHouses,
    aliveHouses: [...activeHouses],
    currentHouseIndex: 0,
    ownTurns,
    pieces,
    board: {},
    pending: [],
    positionHistory: {},
    status: 'playing',
    winner: null,
    drawReason: null,
    metrics: {
      destierros: 0,
      reingresos: 0,
      perdidos: 0,
      swaps: 0,
      bs: 0,
      cz: 0,
      ex: 0,
      copias: 0,
      pases: 0,
      max_siege: 0,
    },
    config: {
      CAP: 400,
      SAMPLE: 50,
      NOISE: 6.0,
      sovereignPlacementLimitTurn: 4,
      hunterMaxSteps: 4,
      strictColonyPlacement: true,
      repetitionLimit: 3,
    },
  };
}

/**
 * Pure state transition function.
 */
export function applyAction(state: GameState, action: Action): ActionResult {
  if (state.status === 'finished') {
    return { success: false, state, events: [], error: 'NOT_YOUR_TURN' };
  }

  const currentHouse = state.aliveHouses[state.currentHouseIndex];
  if (!currentHouse || action.house !== currentHouse) {
    return { success: false, state, events: [], error: 'NOT_YOUR_TURN' };
  }

  const events: GameEvent[] = [];
  const nextPieces: Record<string, Piece> = { ...state.pieces };
  const nextBoard: Record<CellKey, string[]> = {};
  for (const [k, stack] of Object.entries(state.board)) {
    nextBoard[k as CellKey] = [...stack];
  }
  const nextMetrics = { ...state.metrics };
  let nextPending: PendingReturn[] = [...state.pending];

  // Helper to place on board
  const pushToBoard = (cellKey: CellKey, pieceId: string) => {
    if (!nextBoard[cellKey]) nextBoard[cellKey] = [];
    nextBoard[cellKey]!.push(pieceId);
    const lvl = nextBoard[cellKey]!.length - 1;
    const existing = nextPieces[pieceId]!;
    nextPieces[pieceId] = {
      ...existing,
      cellKey,
      stackLevel: lvl,
      location: 'board',
    };
  };

  // Helper to remove top from board
  const popFromBoard = (cellKey: CellKey): string => {
    const stack = nextBoard[cellKey];
    if (!stack || stack.length === 0) {
      throw new Error(`Cannot pop from empty cell ${cellKey}`);
    }
    const pieceId = stack.pop()!;
    if (stack.length === 0) {
      delete nextBoard[cellKey];
    }
    return pieceId;
  };

  switch (action.type) {
    case 'PlacePiece': {
      const piece = nextPieces[action.pieceId];
      if (!piece) return { success: false, state, events: [], error: 'PIECE_NOT_IN_HAND' };

      const toKey = coordToKey(action.to);
      pushToBoard(toKey, piece.id);

      if (piece.wasExiled) {
        nextMetrics.reingresos++;
      }

      events.push({
        type: 'PiecePlaced',
        pieceId: piece.id,
        to: action.to,
        wasExiled: piece.wasExiled,
      });
      break;
    }

    case 'MovePiece': {
      const piece = nextPieces[action.pieceId];
      if (!piece || !piece.cellKey) return { success: false, state, events: [], error: 'PIECE_NOT_ON_BOARD' };

      const fromKey = coordToKey(action.from);
      const toKey = coordToKey(action.to);

      popFromBoard(fromKey);
      pushToBoard(toKey, piece.id);

      if (action.moveKind === 'cz') nextMetrics.cz++;
      else if (action.moveKind === 'bs') nextMetrics.bs++;
      else if (action.moveKind === 'ex') nextMetrics.ex++;

      events.push({
        type: 'PieceMoved',
        pieceId: piece.id,
        from: action.from,
        to: action.to,
        moveKind: action.moveKind,
      });
      break;
    }

    case 'ClimbStack': {
      const piece = nextPieces[action.pieceId];
      if (!piece || !piece.cellKey) return { success: false, state, events: [], error: 'PIECE_NOT_ON_BOARD' };

      const fromKey = coordToKey(action.from);
      const toKey = coordToKey(action.to);

      popFromBoard(fromKey);
      pushToBoard(toKey, piece.id);

      const lvl = nextPieces[piece.id]!.stackLevel;
      events.push({
        type: 'PieceClimbed',
        pieceId: piece.id,
        from: action.from,
        to: action.to,
        level: lvl,
      });
      break;
    }

    case 'DescendStack': {
      const piece = nextPieces[action.pieceId];
      if (!piece || !piece.cellKey) return { success: false, state, events: [], error: 'PIECE_NOT_ON_BOARD' };

      const fromKey = coordToKey(action.from);
      const toKey = coordToKey(action.to);

      popFromBoard(fromKey);
      pushToBoard(toKey, piece.id);

      events.push({
        type: 'PieceDescended',
        pieceId: piece.id,
        from: action.from,
        to: action.to,
      });
      break;
    }

    case 'SwapPiece': {
      // Nigromante swaps place with top piece of adjacent stack
      const niPiece = nextPieces[action.pieceId]!;
      const targetPiece = nextPieces[action.targetPieceId]!;
      const fromKey = coordToKey(action.from);
      const toKey = coordToKey(action.to);

      popFromBoard(fromKey);
      popFromBoard(toKey);

      // NI goes to toKey, targetPiece goes to fromKey
      pushToBoard(toKey, niPiece.id);
      pushToBoard(fromKey, targetPiece.id);

      nextMetrics.swaps++;
      events.push({
        type: 'PieceSwapped',
        pieceId: niPiece.id,
        from: action.from,
        to: action.to,
        targetPieceId: targetPiece.id,
      });
      break;
    }

    case 'ExilePiece': {
      // Nigromante destierra ficha enemiga
      const niPiece = nextPieces[action.pieceId]!;
      const targetPiece = nextPieces[action.targetPieceId]!;
      const targetKey = targetPiece.cellKey!;

      popFromBoard(targetKey);

      // Return at end of owner's NEXT turn: returnAtOwnTurn = ownTurns[target.house] + 1
      const ownerNextTurn = state.ownTurns[targetPiece.house] + 1;

      nextPieces[targetPiece.id] = {
        ...targetPiece,
        cellKey: null,
        location: 'exiled',
        stackLevel: 0,
        wasExiled: true,
      };

      nextPending.push({
        pieceId: targetPiece.id,
        house: targetPiece.house,
        returnAtOwnTurn: ownerNextTurn,
      });

      nextMetrics.destierros++;
      events.push({
        type: 'PieceExiled',
        pieceId: niPiece.id,
        targetPieceId: targetPiece.id,
        returnAtOwnTurn: ownerNextTurn,
      });
      break;
    }

    case 'Pass': {
      nextMetrics.pases++;
      events.push({
        type: 'TurnPassed',
        house: action.house,
      });
      break;
    }
  }

  // Update own turn count for the acting house
  const nextOwnTurns: Record<House, number> = {
    ...state.ownTurns,
    [currentHouse]: state.ownTurns[currentHouse] + 1,
  };

  // Check pending exiled returns for current house at the end of their turn
  const remainingPending: PendingReturn[] = [];
  for (const item of nextPending) {
    if (item.house === currentHouse && nextOwnTurns[currentHouse] >= item.returnAtOwnTurn) {
      // Returns to hand
      const p = nextPieces[item.pieceId]!;
      nextPieces[item.pieceId] = {
        ...p,
        location: 'hand',
        cellKey: null,
        stackLevel: 0,
        wasExiled: true,
      };
      events.push({
        type: 'PieceReturnedToHand',
        pieceId: item.pieceId,
        house: item.house,
      });
    } else {
      remainingPending.push(item);
    }
  }
  nextPending = remainingPending;

  // Evaluate victory / defeat (cerco)
  const intermediateState: GameState = {
    ...state,
    board: nextBoard,
    pieces: nextPieces,
    ownTurns: nextOwnTurns,
    pending: nextPending,
  };

  const victoryRes = evaluateVictory(intermediateState);
  events.push(...victoryRes.events);

  // If houses fell, convert their on-board pieces to ruins, and discard their hand/exiled pieces forever
  let nextAliveHouses = [...state.aliveHouses];
  if (victoryRes.fallenHouses.length > 0) {
    for (const fallen of victoryRes.fallenHouses) {
      nextAliveHouses = nextAliveHouses.filter((h) => h !== fallen);

      for (const piece of Object.values(nextPieces)) {
        if (piece.house === fallen) {
          if (piece.location === 'board') {
            nextPieces[piece.id] = { ...piece, location: 'ruin' };
          } else if (piece.location === 'exiled' || piece.location === 'hand') {
            nextPieces[piece.id] = { ...piece, location: 'ruin' };
            nextMetrics.perdidos++;
            events.push({
              type: 'PieceLost',
              pieceId: piece.id,
              house: fallen,
              reason: 'house_fell_before_return',
            });
          }
        }
      }
    }
  }

  // Check board repetition hash
  // Create deterministic hash of board pieces
  const boardHash = Object.entries(nextBoard)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, stack]) => `${k}:${stack.join('/')}`)
    .join(';');

  const nextPosHist: Record<string, number> = { ...state.positionHistory };
  nextPosHist[boardHash] = (nextPosHist[boardHash] ?? 0) + 1;

  let isFinished = victoryRes.isFinished;
  let winner = victoryRes.winner;
  let drawReason = victoryRes.drawReason;

  // Repetition limit check (3-fold repetition -> draw)
  if (!isFinished && (nextPosHist[boardHash] ?? 0) >= state.config.repetitionLimit) {
    isFinished = true;
    winner = null;
    drawReason = 'repetition';
    events.push({
      type: 'GameFinished',
      winner: null,
      drawReason: 'repetition',
    });
  }

  // CAP actions limit check
  const nextGlobalTurn = state.turn + 1;
  if (!isFinished && nextGlobalTurn >= state.config.CAP) {
    isFinished = true;
    winner = null;
    drawReason = 'cap';
    events.push({
      type: 'GameFinished',
      winner: null,
      drawReason: 'cap',
    });
  }

  // Next house rotation
  let nextHouseIndex = state.currentHouseIndex;
  if (nextAliveHouses.length > 0) {
    nextHouseIndex = (state.currentHouseIndex + 1) % nextAliveHouses.length;
  }

  const nextState: GameState = {
    ...state,
    turn: nextGlobalTurn,
    aliveHouses: nextAliveHouses,
    currentHouseIndex: nextHouseIndex,
    ownTurns: nextOwnTurns,
    pieces: nextPieces,
    board: nextBoard,
    pending: nextPending,
    positionHistory: nextPosHist,
    status: isFinished ? 'finished' : 'playing',
    winner,
    drawReason,
    metrics: nextMetrics,
  };

  return {
    success: true,
    state: nextState,
    events,
  };
}
