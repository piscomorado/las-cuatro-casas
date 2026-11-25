export type House = 'red' | 'blue' | 'green' | 'amber';

export const HOUSES: readonly House[] = ['red', 'blue', 'green', 'amber'] as const;

export type PieceType = 'SO' | 'EX' | 'CZ' | 'BS' | 'GI' | 'HE' | 'NI';

export const PIECE_TYPES: readonly PieceType[] = ['SO', 'EX', 'CZ', 'BS', 'GI', 'HE', 'NI'] as const;

export interface AxialCoord {
  readonly q: number;
  readonly r: number;
}

export type CellKey = `${number},${number}`;

export interface Piece {
  readonly id: string; // e.g. "red-SO-0"
  readonly house: House;
  readonly type: PieceType;
  readonly cellKey: CellKey | null;
  readonly stackLevel: number; // 0 = floor
  readonly location: 'hand' | 'board' | 'exiled' | 'ruin';
  readonly wasExiled: boolean;
}

export interface PendingReturn {
  readonly pieceId: string;
  readonly house: House;
  readonly returnAtOwnTurn: number;
}

export interface GameMetrics {
  destierros: number;
  reingresos: number;
  perdidos: number;
  swaps: number;
  bs: number;
  cz: number;
  ex: number;
  copias: number;
  pases: number;
  max_siege: number;
}

export interface GameConfig {
  CAP: number;
  SAMPLE: number;
  NOISE: number;
  sovereignPlacementLimitTurn: number;
  hunterMaxSteps: number;
  strictColonyPlacement: boolean;
  repetitionLimit: number;
  initialSetupPiecesCount: number; // 3 pieces per house in opening phase
}

export interface GameState {
  readonly id: string;
  readonly seed: number;
  readonly phase: 'setup' | 'play'; // 'setup': initial 3-piece deployment, 'play': normal turns
  readonly setupCount: Readonly<Record<House, number>>; // Placements done in setup (0, 1, 2)
  readonly turn: number; // Global action count
  readonly activeHouses: readonly House[];
  readonly aliveHouses: readonly House[];
  readonly currentHouseIndex: number;
  readonly ownTurns: Readonly<Record<House, number>>;
  readonly pieces: Readonly<Record<string, Piece>>;
  readonly board: Readonly<Record<CellKey, readonly string[]>>; // CellKey -> pieceId[] (0=bottom, last=top)
  readonly pending: readonly PendingReturn[];
  readonly positionHistory: Readonly<Record<string, number>>;
  readonly status: 'playing' | 'finished';
  readonly winner: House | null;
  readonly drawReason: 'repetition' | 'simultaneous' | 'cap' | null;
  readonly metrics: GameMetrics;
  readonly config: GameConfig;
}

export type Action =
  | { type: 'PlacePiece'; house: House; pieceId: string; to: AxialCoord }
  | { type: 'MovePiece'; house: House; pieceId: string; from: AxialCoord; to: AxialCoord; moveKind?: 'slide' | 'cz' | 'bs' | 'ex' | undefined }
  | { type: 'ClimbStack'; house: House; pieceId: string; from: AxialCoord; to: AxialCoord }
  | { type: 'DescendStack'; house: House; pieceId: string; from: AxialCoord; to: AxialCoord }
  | { type: 'SwapPiece'; house: House; pieceId: string; from: AxialCoord; to: AxialCoord; targetPieceId: string }
  | { type: 'ExilePiece'; house: House; pieceId: string; targetPieceId: string }
  | { type: 'Pass'; house: House };

export type GameEvent =
  | { type: 'PiecePlaced'; pieceId: string; to: AxialCoord; wasExiled: boolean }
  | { type: 'PieceMoved'; pieceId: string; from: AxialCoord; to: AxialCoord; moveKind?: string | undefined }
  | { type: 'PieceClimbed'; pieceId: string; from: AxialCoord; to: AxialCoord; level: number }
  | { type: 'PieceDescended'; pieceId: string; from: AxialCoord; to: AxialCoord }
  | { type: 'PieceSwapped'; pieceId: string; from: AxialCoord; to: AxialCoord; targetPieceId: string }
  | { type: 'PieceExiled'; pieceId: string; targetPieceId: string; returnAtOwnTurn: number }
  | { type: 'PieceReturnedToHand'; pieceId: string; house: House }
  | { type: 'PieceLost'; pieceId: string; house: House; reason: string }
  | { type: 'TurnPassed'; house: House }
  | { type: 'HouseDefeated'; house: House; sovereignCell: AxialCoord }
  | { type: 'GameFinished'; winner: House | null; drawReason: 'repetition' | 'simultaneous' | 'cap' | null }
  | { type: 'SetupCompleted' };

export type IllegalReason =
  | 'NOT_YOUR_TURN'
  | 'HOUSE_NOT_ALIVE'
  | 'PIECE_NOT_IN_HAND'
  | 'PIECE_NOT_ON_BOARD'
  | 'PIECE_NOT_OWNED'
  | 'MUST_PLACE_SOVEREIGN'
  | 'CANNOT_MOVE_BEFORE_SOVEREIGN'
  | 'CANNOT_MOVE_DURING_SETUP'
  | 'CELL_OCCUPIED'
  | 'STRICT_COLONY_VIOLATION'
  | 'CANNOT_COMPLETE_SIXTH_SPACE'
  | 'PIECE_BURIED_IN_STACK'
  | 'BREAKS_ONE_HIVE'
  | 'ILLEGAL_MOVE_PATH'
  | 'BLOCKED_BY_STACK'
  | 'TARGET_NOT_ADJACENT'
  | 'CANNOT_EXILE_SOVEREIGN'
  | 'CANNOT_EXILE_RUIN'
  | 'CANNOT_EXILE_STACKED'
  | 'EXILE_BREAKS_HIVE'
  | 'NI_ON_STACK_CANNOT_EXILE';

export interface ActionResult {
  success: boolean;
  state: GameState;
  events: readonly GameEvent[];
  error?: IllegalReason;
}
