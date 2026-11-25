import React, { useRef, useState, useEffect } from 'react';
import { GameState, Action, CellKey, Piece, getNeighbors, coordToKey, keyToCoord } from '@lcch/engine';
import { BoardHex } from './BoardHex';
import { hexToPixel, HEX_SIZE } from '../utils/hexMath';

export interface HexBoardProps {
  state: GameState;
  legalActions: Action[];
  selectedPiece: Piece | null;
  onSelectPiece: (piece: Piece | null) => void;
  onExecuteAction: (action: Action) => void;
}

export const HexBoard: React.FC<HexBoardProps> = ({
  state,
  legalActions,
  selectedPiece,
  onSelectPiece,
  onExecuteAction,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Center the view on initial load or reset
  const centerBoard = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({ x: rect.width / 2, y: rect.height / 2 });
      setZoom(1);
    }
  };

  useEffect(() => {
    centerBoard();
    window.addEventListener('resize', centerBoard);
    return () => window.removeEventListener('resize', centerBoard);
  }, []);

  const occupiedCellKeys = new Set<CellKey>(
    (Object.keys(state.board) as CellKey[]).filter((k) => (state.board[k]?.length ?? 0) > 0)
  );

  const displayCells = new Set<CellKey>(occupiedCellKeys);

  // Always show (0,0) if empty board
  if (displayCells.size === 0) {
    displayCells.add('0,0');
  } else {
    // Add neighbor perimeter
    for (const occ of occupiedCellKeys) {
      for (const nb of getNeighbors(keyToCoord(occ))) {
        displayCells.add(coordToKey(nb));
      }
    }
  }

  // Filter legal actions relevant to the current selection or placements
  const actionableCandidates = new Map<CellKey, { action: Action; type: 'place' | 'move' | 'climb' | 'swap' | 'exile' }>();

  for (const act of legalActions) {
    if (act.type === 'PlacePiece') {
      if (selectedPiece && selectedPiece.location === 'hand' && selectedPiece.type === state.pieces[act.pieceId]?.type) {
        actionableCandidates.set(coordToKey(act.to), { action: act, type: 'place' });
      }
    } else if (act.type === 'MovePiece') {
      if (selectedPiece && selectedPiece.id === act.pieceId) {
        actionableCandidates.set(coordToKey(act.to), { action: act, type: 'move' });
      }
    } else if (act.type === 'ClimbStack') {
      if (selectedPiece && selectedPiece.id === act.pieceId) {
        actionableCandidates.set(coordToKey(act.to), { action: act, type: 'climb' });
      }
    } else if (act.type === 'SwapPiece') {
      if (selectedPiece && selectedPiece.id === act.pieceId) {
        actionableCandidates.set(coordToKey(act.to), { action: act, type: 'swap' });
      }
    } else if (act.type === 'ExilePiece') {
      if (selectedPiece && selectedPiece.id === act.pieceId) {
        const target = state.pieces[act.targetPieceId];
        if (target?.cellKey) {
          actionableCandidates.set(target.cellKey, { action: act, type: 'exile' });
        }
      }
    }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handlePointerUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(Math.max(prev * factor, 0.4), 2.5));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing bg-slate-950"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    >
      <svg className="w-full h-full">
        <defs>
          <radialGradient id="bg-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.9" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg-glow)" />

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {Array.from(displayCells).map((cellKey) => {
            const coord = keyToCoord(cellKey);
            const pos = hexToPixel(coord, HEX_SIZE);
            const stack = state.board[cellKey] ?? [];
            const pieceStack = stack.map((id) => state.pieces[id]!).filter(Boolean);
            const topPiece = pieceStack.length > 0 ? pieceStack[pieceStack.length - 1] : null;

            const cand = actionableCandidates.get(cellKey);
            const isSelected = selectedPiece?.cellKey === cellKey;

            const handleCellClick = () => {
              if (cand) {
                onExecuteAction(cand.action);
                return;
              }

              const currentHouse = state.aliveHouses[state.currentHouseIndex];
              if (topPiece && topPiece.house === currentHouse && topPiece.location !== 'ruin') {
                onSelectPiece(isSelected ? null : topPiece);
              } else {
                onSelectPiece(null);
              }
            };

            return (
              <BoardHex
                key={cellKey}
                q={coord.q}
                r={coord.r}
                x={pos.x}
                y={pos.y}
                pieces={pieceStack}
                isCandidate={Boolean(cand)}
                candidateType={cand?.type}
                isSelected={isSelected}
                onClick={handleCellClick}
              />
            );
          })}
        </g>
      </svg>

      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
        <button
          onClick={() => setZoom((z) => Math.min(z * 1.2, 2.5))}
          className="w-10 h-10 rounded-full bg-slate-800/80 backdrop-blur border border-slate-700 text-white font-bold hover:bg-slate-700 flex items-center justify-center shadow-lg"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z * 0.8, 0.4))}
          className="w-10 h-10 rounded-full bg-slate-800/80 backdrop-blur border border-slate-700 text-white font-bold hover:bg-slate-700 flex items-center justify-center shadow-lg"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={centerBoard}
          className="w-10 h-10 rounded-full bg-slate-800/80 backdrop-blur border border-slate-700 text-white text-xs hover:bg-slate-700 flex items-center justify-center shadow-lg"
          title="Centrar Tablero"
        >
          ⌖
        </button>
      </div>
    </div>
  );
};
