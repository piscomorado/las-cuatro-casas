import { GameState, House, Action, AxialCoord } from '../types.js';
import { getLegalMoves } from '../getLegalMoves.js';
import { areNeighbors, getNeighbors, coordToKey, keyToCoord } from '../coords.js';
import { PRNG } from '../rng.js';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

function freeNb(state: GameState, cell: AxialCoord): number {
  let free = 0;
  for (const nb of getNeighbors(cell)) {
    const key = coordToKey(nb);
    if ((state.board[key]?.length ?? 0) === 0) {
      free++;
    }
  }
  return free;
}

function siegeDelta(
  state: GameState,
  actingHouse: House,
  cell: AxialCoord,
  fill: boolean,
  sovereigns: { house: House; coord: AxialCoord }[],
  freeNeighbors: Record<House, number>,
  skipSelf: boolean = false
): number {
  let delta = 0.0;
  for (const { house, coord } of sovereigns) {
    if (skipSelf && house === actingHouse) continue;
    if (!areNeighbors(cell, coord)) continue;

    const d = fill ? -1.0 : 1.0;
    if (house === actingHouse) {
      delta += 3.0 * d;
      if (fill && (freeNeighbors[house] ?? 6) <= 1) delta -= 8.0;
    } else {
      delta -= 2.5 * d;
      if (fill && (freeNeighbors[house] ?? 6) <= 1) delta += 4.0;
    }
  }
  return delta;
}

/**
 * Calibrated heuristic scoring based on the reference simulation motor.
 */
export function scoreAction(
  state: GameState,
  action: Action,
  house: House,
  sovereigns: { house: House; coord: AxialCoord }[],
  freeNeighbors: Record<House, number>
): number {
  if (action.type === 'Pass') return -10.0;

  if (action.type === 'PlacePiece') {
    const c = action.to;
    let own = 0;
    let pot = 0;

    for (const nb of getNeighbors(c)) {
      const nbKey = coordToKey(nb);
      const stack = state.board[nbKey];
      if (stack && stack.length > 0) {
        const top = state.pieces[stack[stack.length - 1]!]!;
        if (top.house === house) own++;
        continue;
      }
      let touchOwn = false;
      let touchEnemy = false;
      for (const n2 of getNeighbors(nb)) {
        const n2Key = coordToKey(n2);
        const st2 = state.board[n2Key];
        if (st2 && st2.length > 0) {
          const th = state.pieces[st2[st2.length - 1]!]!.house;
          if (th === house) touchOwn = true;
          else if (state.aliveHouses.includes(th)) touchEnemy = true;
        }
      }
      if (touchOwn && !touchEnemy) pot++;
    }

    let s = 0.15 * own + 0.25 * pot + 0.12 * freeNb(state, c) + siegeDelta(state, house, c, true, sovereigns, freeNeighbors);
    if (state.ownTurns[house] <= 3) s += 0.8;
    const piece = state.pieces[action.pieceId]!;
    if (piece.type === 'SO' && state.ownTurns[house] >= 3) s += 2.0;
    return s;
  }

  if (action.type === 'ExilePiece') {
    const targetPiece = state.pieces[action.targetPieceId]!;
    const c = keyToCoord(targetPiece.cellKey!);
    let s = 2.5 + siegeDelta(state, house, c, false, sovereigns, freeNeighbors);
    if (['EX', 'CZ', 'BS'].includes(targetPiece.type)) s += 0.5;
    return s;
  }

  if (action.type === 'SwapPiece') {
    const b = action.to;
    const orig = action.from;
    const targetPiece = state.pieces[action.targetPieceId]!;

    let s = 1.2;
    if (targetPiece.type === 'SO' && state.aliveHouses.includes(targetPiece.house)) {
      const sh = targetPiece.house;
      const fa = freeNb(state, orig);
      const fb = freeNb(state, b);
      const d = fa - fb;
      if (sh === house) {
        s = 3.0 * d;
        if (fa === 0) s -= 8.0;
      } else {
        s = 0.8 - 2.5 * d;
        if (fa === 0) s += 4.0;
      }
    }
    const stackAtB = state.board[coordToKey(b)]?.length ?? 0;
    if (stackAtB >= 2) s -= 0.2;
    return s;
  }

  // MovePiece, ClimbStack, DescendStack
  const d = action.to;
  const orig = action.from;
  const piece = state.pieces[action.pieceId]!;

  if (piece.type === 'SO') {
    let s = 3.0 * (freeNb(state, d) + 1 - freeNb(state, orig));
    if (freeNb(state, d) === 0) s -= 8.0;
    s += siegeDelta(state, house, d, true, sovereigns, freeNeighbors, true);
    s += siegeDelta(state, house, orig, false, sovereigns, freeNeighbors, true);
    return s;
  }

  let s = 0.0;
  const dKey = coordToKey(d);
  const destStack = state.board[dKey];
  if (destStack && destStack.length > 0) {
    const top = state.pieces[destStack[destStack.length - 1]!]!;
    if (top.type === 'SO' && state.aliveHouses.includes(top.house)) {
      s += top.house !== house ? 2.5 : -3.0;
    }
  } else {
    s = 0.12 * freeNb(state, d) + siegeDelta(state, house, d, true, sovereigns, freeNeighbors);
  }

  const origKey = coordToKey(orig);
  const origStack = state.board[origKey];
  if (action.type !== 'DescendStack' && (origStack?.length ?? 0) === 1) {
    s += siegeDelta(state, house, orig, false, sovereigns, freeNeighbors);
  }

  return s;
}

/**
 * Selects an action for the bot according to the chosen difficulty level.
 */
export function getBotAction(
  state: GameState,
  house: House,
  difficulty: BotDifficulty = 'medium',
  seed: number = Date.now()
): Action | null {
  const legal = getLegalMoves(state, house);
  if (legal.actions.length === 0) return null;
  if (legal.actions.length === 1 && legal.canPass) return legal.actions[0]!;

  const rng = new PRNG(seed);

  // Easy: picks a random legal action, avoiding pass if possible
  if (difficulty === 'easy') {
    const nonPassActions = legal.actions.filter((a) => a.type !== 'Pass');
    const pool = nonPassActions.length > 0 ? nonPassActions : legal.actions;
    const idx = rng.nextInt(0, pool.length - 1);
    return pool[idx]!;
  }

  // Medium: evaluates actions with significant noise (casual tactical play)
  // Hard: calibrated simulation engine with tight heuristic evaluation
  const noiseMagnitude = difficulty === 'medium' ? 12.0 : 4.0;
  const sampleSize = difficulty === 'medium' ? 25 : 50;

  const sample = legal.actions.length > sampleSize ? rng.sample(legal.actions, sampleSize) : legal.actions;

  const sovereigns: { house: House; coord: AxialCoord }[] = [];
  const freeNeighbors: Record<House, number> = { red: 6, blue: 6, green: 6, amber: 6 };

  for (const h of state.aliveHouses) {
    const so = Object.values(state.pieces).find(
      (p) => p.house === h && p.type === 'SO' && p.location === 'board' && p.cellKey
    );
    if (so && so.cellKey) {
      const coord = keyToCoord(so.cellKey);
      sovereigns.push({ house: h, coord });
      freeNeighbors[h] = freeNb(state, coord);
    }
  }

  let bestAct = sample[0]!;
  let bestScore = -Infinity;

  for (const act of sample) {
    const noise = rng.uniform(0, noiseMagnitude);
    const sc = scoreAction(state, act, house, sovereigns, freeNeighbors) + noise;
    if (sc > bestScore) {
      bestScore = sc;
      bestAct = act;
    }
  }

  return bestAct;
}
