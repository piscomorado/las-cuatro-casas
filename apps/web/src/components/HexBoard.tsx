import React, { useRef, useState, useEffect } from 'react';
import { GameState, Action, CellKey, Piece, getNeighbors, coordToKey, keyToCoord } from '@lcch/engine';
import { BoardHex } from './BoardHex';
import { hexToPixel, HEX_SIZE } from '../utils/hexMath';

export interface LastMoveInfo {
  action: Action;
  from?: { q: number; r: number } | null;
  to: { q: number; r: number };
  house: string;
}

export interface HexBoardProps {
  state: GameState;
  legalActions: Action[];
  selectedPiece: Piece | null;
  lastMove?: LastMoveInfo | null;
  onSelectPiece: (piece: Piece | null) => void;
  onExecuteAction: (action: Action) => void;
}

export const HexBoard: React.FC<HexBoardProps> = ({
  state,
  legalActions,
  selectedPiece,
  lastMove,
  onSelectPiece,
  onExecuteAction,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

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

  // Compute siege count around living Sovereigns
  const sovereignSiegeCounts = new Map<CellKey, number>();
  for (const p of Object.values(state.pieces)) {
    if (p.type === 'SO' && p.location === 'board' && p.cellKey && state.aliveHouses.includes(p.house)) {
      const soCoord = keyToCoord(p.cellKey);
      let count = 0;
      for (const nb of getNeighbors(soCoord)) {
        if (occupiedCellKeys.has(coordToKey(nb))) {
          count++;
        }
      }
      if (count >= 4) {
        sovereignSiegeCounts.set(p.cellKey, count);
      }
    }
  }

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

  // Ensure last move cells are in displayCells
  if (lastMove?.from) {
    displayCells.add(coordToKey(lastMove.from));
  }
  if (lastMove?.to) {
    displayCells.add(coordToKey(lastMove.to));
  }

  // Map of candidate target cells based on selection or current turn
  const actionableCandidates = new Map<CellKey, { action: Action; type: 'place' | 'move' | 'climb' | 'swap' | 'exile' }>();

  for (const act of legalActions) {
    if (act.type === 'PlacePiece') {
      // If a hand piece is selected (or matching type), show its placement cells
      if (selectedPiece && selectedPiece.location === 'hand') {
        const actingPiece = state.pieces[act.pieceId];
        if (actingPiece && actingPiece.type === selectedPiece.type) {
          const destKey = coordToKey(act.to);
          actionableCandidates.set(destKey, { action: act, type: 'place' });
          displayCells.add(destKey);
        }
      }
    } else if (act.type === 'MovePiece') {
      if (selectedPiece && selectedPiece.location === 'board' && selectedPiece.id === act.pieceId) {
        const destKey = coordToKey(act.to);
        actionableCandidates.set(destKey, { action: act, type: 'move' });
        displayCells.add(destKey);
      }
    } else if (act.type === 'ClimbStack') {
      if (selectedPiece && selectedPiece.location === 'board' && selectedPiece.id === act.pieceId) {
        const destKey = coordToKey(act.to);
        actionableCandidates.set(destKey, { action: act, type: 'climb' });
        displayCells.add(destKey);
      }
    } else if (act.type === 'DescendStack') {
      if (selectedPiece && selectedPiece.location === 'board' && selectedPiece.id === act.pieceId) {
        const destKey = coordToKey(act.to);
        actionableCandidates.set(destKey, { action: act, type: 'move' });
        displayCells.add(destKey);
      }
    } else if (act.type === 'SwapPiece') {
      if (selectedPiece && selectedPiece.location === 'board' && selectedPiece.id === act.pieceId) {
        const destKey = coordToKey(act.to);
        actionableCandidates.set(destKey, { action: act, type: 'swap' });
        displayCells.add(destKey);
      }
    } else if (act.type === 'ExilePiece') {
      if (selectedPiece && selectedPiece.location === 'board' && selectedPiece.id === act.pieceId) {
        const target = state.pieces[act.targetPieceId];
        if (target?.cellKey) {
          actionableCandidates.set(target.cellKey, { action: act, type: 'exile' });
          displayCells.add(target.cellKey);
        }
      }
    }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    setIsDragging(true);
    hasDragged.current = false;
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - (dragStart.current.x + pan.x);
    const dy = e.clientY - (dragStart.current.y + pan.y);
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDragged.current = true;
    }
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(Math.max(prev * factor, 0.4), 2.5));
  };

  const currentHouse = state.aliveHouses[state.currentHouseIndex] ?? 'red';
  const HOUSE_AMBIENT_COLORS: Record<string, { inner: string; outer: string }> = {
    red: { inner: 'rgba(185, 28, 28, 0.15)', outer: '#020617' },
    blue: { inner: 'rgba(29, 78, 216, 0.15)', outer: '#020617' },
    green: { inner: 'rgba(21, 128, 61, 0.15)', outer: '#020617' },
    amber: { inner: 'rgba(180, 83, 9, 0.15)', outer: '#020617' },
  };
  const ambient = HOUSE_AMBIENT_COLORS[currentHouse] ?? { inner: 'rgba(30, 41, 59, 0.4)', outer: '#020617' };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none bg-slate-950"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
    >
      <svg className="w-full h-full pointer-events-auto">
        <defs>
          <radialGradient id="bg-glow" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor={ambient.inner} className="transition-colors duration-700" />
            <stop offset="65%" stopColor="#0a0f1d" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.98" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg-glow)" pointerEvents="none" />

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {Array.from(displayCells).map((cellKey) => {
            const coord = keyToCoord(cellKey);
            const pos = hexToPixel(coord, HEX_SIZE);
            const stack = state.board[cellKey] ?? [];
            const pieceStack = stack.map((id) => state.pieces[id]!).filter(Boolean);
            const topPiece = pieceStack.length > 0 ? pieceStack[pieceStack.length - 1] : null;

            const cand = actionableCandidates.get(cellKey);
            const isSelected = selectedPiece?.cellKey === cellKey;

            const handleCellClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (hasDragged.current) return;

              // 1. If clicking a legal candidate target, EXECUTE ACTION!
              if (cand) {
                onExecuteAction(cand.action);
                return;
              }

              // 2. If clicking an occupied friendly piece, SELECT IT!
              const currentHouse = state.aliveHouses[state.currentHouseIndex];
              if (topPiece && topPiece.house === currentHouse && topPiece.location !== 'ruin') {
                onSelectPiece(isSelected ? null : topPiece);
                return;
              }

              // 3. Otherwise deselect
              onSelectPiece(null);
            };

            const isLastOrigin = lastMove?.from ? (lastMove.from.q === coord.q && lastMove.from.r === coord.r) : false;
            const isLastTarget = lastMove?.to ? (lastMove.to.q === coord.q && lastMove.to.r === coord.r) : false;
            const siegeCount = sovereignSiegeCounts.get(cellKey);

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
                isLastMoveOrigin={isLastOrigin}
                isLastMoveTarget={isLastTarget}
                siegeDangerCount={siegeCount}
                onClick={handleCellClick}
              />
            );
          })}

          {/* Last Move Trajectory Curved Arc */}
          {lastMove?.from && lastMove?.to && (() => {
            const fromPos = hexToPixel(lastMove.from, HEX_SIZE);
            const toPos = hexToPixel(lastMove.to, HEX_SIZE);
            const midX = (fromPos.x + toPos.x) / 2;
            const midY = (fromPos.y + toPos.y) / 2 - 28; // Arc curvature elevation
            const pathD = `M ${fromPos.x} ${fromPos.y} Q ${midX} ${midY} ${toPos.x} ${toPos.y}`;

            return (
              <g pointerEvents="none" className="transition-opacity duration-500">
                <path
                  d={pathD}
                  fill="none"
                  stroke="rgba(245, 158, 11, 0.4)"
                  strokeWidth="3.5"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
                <circle cx={fromPos.x} cy={fromPos.y} r="3" fill="#f59e0b" opacity="0.8" />
                <circle cx={toPos.x} cy={toPos.y} r="4" fill="#fbbf24" />
              </g>
            );
          })()}
        </g>
      </svg>

      {/* Floating Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10 pointer-events-auto">
        <button
          onClick={() => setZoom((z) => Math.min(z * 1.2, 2.5))}
          className="w-10 h-10 rounded-full bg-slate-800/90 backdrop-blur border border-slate-700 text-white font-bold hover:bg-slate-700 flex items-center justify-center shadow-lg transition-transform active:scale-90"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z * 0.8, 0.4))}
          className="w-10 h-10 rounded-full bg-slate-800/90 backdrop-blur border border-slate-700 text-white font-bold hover:bg-slate-700 flex items-center justify-center shadow-lg transition-transform active:scale-90"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={centerBoard}
          className="w-10 h-10 rounded-full bg-slate-800/90 backdrop-blur border border-slate-700 text-white text-base hover:bg-slate-700 flex items-center justify-center shadow-lg transition-transform active:scale-90"
          title="Centrar Tablero"
        >
          ⌖
        </button>
      </div>
    </div>
  );
};
