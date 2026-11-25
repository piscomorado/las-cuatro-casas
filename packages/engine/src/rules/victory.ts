import { GameState, House, AxialCoord, CellKey, GameEvent, Piece } from '../types.js';
import { coordToKey, getNeighbors } from '../coords.js';

export interface DefeatEvaluationResult {
  fallenHouses: House[];
  winner: House | null;
  drawReason: 'simultaneous' | 'cap' | 'repetition' | null;
  isFinished: boolean;
  events: GameEvent[];
}

/**
 * Checks if a Sovereign is besieged (all 6 adjacent cells occupied by any piece or ruin).
 */
export function isSovereignBesieged(
  board: Readonly<Record<CellKey, readonly string[]>>,
  sovereignCoord: AxialCoord
): boolean {
  const neighbors = getNeighbors(sovereignCoord);
  for (const nb of neighbors) {
    const key = coordToKey(nb);
    const stack = board[key];
    if (!stack || stack.length === 0) {
      return false; // Found an empty neighbor, so Sovereign is NOT besieged
    }
  }
  return true;
}

/**
 * Evaluates victory and defeat conditions across all active houses.
 * If a house's Sovereign is besieged, that house falls.
 * All its pieces on board become ruins.
 */
export function evaluateVictory(state: GameState): DefeatEvaluationResult {
  const fallenHouses: House[] = [];
  const events: GameEvent[] = [];

  for (const house of state.aliveHouses) {
    const sovereign = Object.values(state.pieces).find(
      (p) => p.house === house && p.type === 'SO' && p.location === 'board'
    );

    if (sovereign && sovereign.cellKey) {
      const parts = sovereign.cellKey.split(',');
      const soCoord: AxialCoord = { q: Number(parts[0]), r: Number(parts[1]) };
      if (isSovereignBesieged(state.board, soCoord)) {
        fallenHouses.push(house);
        events.push({
          type: 'HouseDefeated',
          house,
          sovereignCell: soCoord,
        });
      }
    }
  }

  const remainingHouses = state.aliveHouses.filter((h) => !fallenHouses.includes(h));

  if (remainingHouses.length === 1 && fallenHouses.length > 0) {
    const winner = remainingHouses[0]!;
    events.push({
      type: 'GameFinished',
      winner,
      drawReason: null,
    });
    return {
      fallenHouses,
      winner,
      drawReason: null,
      isFinished: true,
      events,
    };
  } else if (remainingHouses.length === 0) {
    // All remaining houses fell simultaneously -> draw
    events.push({
      type: 'GameFinished',
      winner: null,
      drawReason: 'simultaneous',
    });
    return {
      fallenHouses,
      winner: null,
      drawReason: 'simultaneous',
      isFinished: true,
      events,
    };
  }

  return {
    fallenHouses,
    winner: null,
    drawReason: null,
    isFinished: false,
    events,
  };
}
