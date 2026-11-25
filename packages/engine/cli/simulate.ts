import { initGame, applyAction } from '../src/engine.js';
import { getLegalMoves } from '../src/getLegalMoves.js';
import { PRNG } from '../src/rng.js';
import { House, Action, GameState, AxialCoord, CellKey } from '../src/types.js';
import { areNeighbors, getNeighbors, coordToKey, keyToCoord } from '../src/coords.js';

export interface SimulationResult {
  games: number;
  decided: number;
  draws: number;
  winsByHouse: Record<House, number>;
  meanActions: number;
  destierrosExecuted: number;
  reingresosTotal: number;
  swapsTotal: number;
}

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
 * Exact port of score() from reference Python simulation motor (lines 340-401).
 */
function scoreAction(
  state: GameState,
  action: Action,
  house: House,
  sovereigns: { house: House; coord: AxialCoord }[],
  freeNeighbors: Record<House, number>
): number {
  if (action.type === 'Pass') return 0.0;

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
    if (piece.type === 'SO' && state.ownTurns[house] >= 3) s += 1.5;
    return s;
  }

  if (action.type === 'ExilePiece') {
    const targetPiece = state.pieces[action.targetPieceId]!;
    const c = keyToCoord(targetPiece.cellKey!);
    let s = 2.5 + siegeDelta(state, house, c, false, sovereigns, freeNeighbors);
    if (['EX', 'CZ', 'BS'].includes(targetPiece.type)) s += 0.3;
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
      s += top.house !== house ? 2.0 : -3.0;
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

export function runSimulation(numGames: number = 50, startSeed: number = 1001): SimulationResult {
  const wins: Record<House, number> = { red: 0, blue: 0, green: 0, amber: 0 };
  let decided = 0;
  let draws = 0;
  let totalActions = 0;
  let destierrosCount = 0;
  let reingresosCount = 0;
  let swapsCount = 0;

  for (let g = 0; g < numGames; g++) {
    const seed = startSeed + g;
    const rng = new PRNG(seed);
    let state = initGame({ seed });

    while (state.status === 'playing') {
      const currentHouse = state.aliveHouses[state.currentHouseIndex]!;
      const legal = getLegalMoves(state, currentHouse);

      if (legal.actions.length === 0) {
        state = applyAction(state, { type: 'Pass', house: currentHouse }).state;
        continue;
      }

      // Sample subset of actions if too many, matching SAMPLE=50
      const sample = rng.sample(legal.actions, state.config.SAMPLE);

      // Collect alive sovereigns on board
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

      // Score and pick best action
      let bestAct = sample[0]!;
      let bestScore = -Infinity;

      for (const act of sample) {
        const sc = scoreAction(state, act, currentHouse, sovereigns, freeNeighbors) + rng.uniform(0, state.config.NOISE);
        if (sc > bestScore) {
          bestScore = sc;
          bestAct = act;
        }
      }

      const res = applyAction(state, bestAct);
      state = res.state;
    }

    totalActions += state.turn;
    destierrosCount += state.metrics.destierros;
    reingresosCount += state.metrics.reingresos;
    swapsCount += state.metrics.swaps;

    if (state.winner) {
      decided++;
      wins[state.winner]++;
    } else {
      draws++;
    }
  }

  return {
    games: numGames,
    decided,
    draws,
    winsByHouse: wins,
    meanActions: Math.round(totalActions / numGames),
    destierrosExecuted: destierrosCount,
    reingresosTotal: reingresosCount,
    swapsTotal: swapsCount,
  };
}

// CLI runner
const args = process.argv.slice(2);
const gamesArg = args.find((a) => a.startsWith('--games=') || a === '-g');
const gamesVal = gamesArg ? Number(args[args.indexOf(gamesArg) + 1] || gamesArg.split('=')[1]) : 50;

console.log(`\n=== INICIANDO SIMULACIÓN DE ${gamesVal} PARTIDAS (Las Cuatro Casas) ===\n`);
const result = runSimulation(gamesVal, 1001);

console.log('Resultados de la Simulación:');
console.log(`Total partidas: ${result.games}`);
console.log(`Decididas: ${result.decided} (${((result.decided / result.games) * 100).toFixed(1)}%)`);
console.log(`Empates: ${result.draws}`);
console.log(`Acciones promedio por partida: ${result.meanActions}`);
console.log('Victorias por Casa:');
console.log(`  - Roja:  ${result.winsByHouse.red}`);
console.log(`  - Azul:  ${result.winsByHouse.blue}`);
console.log(`  - Verde: ${result.winsByHouse.green}`);
console.log(`  - Ámbar: ${result.winsByHouse.amber}`);
console.log(`Destierros totales: ${result.destierrosExecuted}`);
console.log(`Reingresos totales: ${result.reingresosTotal}`);
console.log(`Swaps totales: ${result.swapsTotal}`);
console.log('\n=== SIMULACIÓN COMPLETADA ===\n');
