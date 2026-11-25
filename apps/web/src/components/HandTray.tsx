import React from 'react';
import { House, Piece, PieceType } from '@lcch/engine';
import { PieceIcon } from './PieceIcon';

export interface HandTrayProps {
  house: House;
  pieces: Piece[];
  isActive: boolean;
  selectedPiece: Piece | null;
  onSelectPiece: (piece: Piece) => void;
  ownTurn: number;
  hasSovereignOnBoard: boolean;
  phase?: 'setup' | 'play';
  setupCount?: number;
}

const HOUSE_CONFIGS: Record<House, { name: string; border: string; bg: string; activeGlow: string }> = {
  red: { name: 'Casa Roja', border: 'border-red-600', bg: 'bg-red-950/40', activeGlow: 'ring-2 ring-red-500 shadow-red-900/50' },
  blue: { name: 'Casa Azul', border: 'border-blue-600', bg: 'bg-blue-950/40', activeGlow: 'ring-2 ring-blue-500 shadow-blue-900/50' },
  green: { name: 'Casa Verde', border: 'border-green-600', bg: 'bg-green-950/40', activeGlow: 'ring-2 ring-green-500 shadow-green-900/50' },
  amber: { name: 'Casa Ámbar', border: 'border-amber-600', bg: 'bg-amber-950/40', activeGlow: 'ring-2 ring-amber-500 shadow-amber-900/50' },
};

const PIECE_NAMES: Record<PieceType, string> = {
  SO: 'Soberano',
  EX: 'Explorador',
  CZ: 'Cazador / Espadachín',
  BS: 'Bestia Saltadora',
  GI: 'Gigante',
  HE: 'Hechicero',
  NI: 'Nigromante',
};

export const HandTray: React.FC<HandTrayProps> = ({
  house,
  pieces,
  isActive,
  selectedPiece,
  onSelectPiece,
  ownTurn,
  hasSovereignOnBoard,
  phase = 'play',
  setupCount = 0,
}) => {
  const config = HOUSE_CONFIGS[house];

  const handPieces = pieces.filter((p) => p.house === house && p.location === 'hand');
  const grouped: Record<string, Piece[]> = {};
  for (const p of handPieces) {
    if (!grouped[p.type]) grouped[p.type] = [];
    grouped[p.type]!.push(p);
  }

  const sovereignInHand = grouped['SO'] && grouped['SO'].length > 0;
  // Option A Rule: In setup phase, Sovereign MUST be placed if 2 pieces placed and sovereign still in hand
  const isSetup = phase === 'setup';
  const sovereignMustBePlaced = sovereignInHand && (
    (isSetup && setupCount >= 2) ||
    (!isSetup && ownTurn >= 3)
  );

  return (
    <div
      className={`rounded-2xl border p-3 backdrop-blur-xl transition-all duration-300 shadow-2xl ${config.bg} ${config.border} ${
        isActive ? `${config.activeGlow} ring-2` : 'opacity-80'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-title font-bold text-sm tracking-wide text-white">{config.name}</span>
          {isActive && (
            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-white/20 text-white animate-pulse">
              Turno Activo
            </span>
          )}
        </div>
        <span className="text-xs text-slate-300 font-medium">
          {isSetup ? `Apertura (${setupCount + 1}/3)` : `${handPieces.length} fichas en reserva`}
        </span>
      </div>

      {/* Clear contextual badge according to turn / phase */}
      {isActive && isSetup && (
        <div className="mb-2 text-xs font-semibold text-emerald-200 bg-emerald-950/80 border border-emerald-500/40 rounded-xl px-3 py-1.5 flex items-center gap-2">
          <span>🚀</span>
          <span>
            {setupCount === 0 && 'Coloca tu 1.ª ficha (Soberano u otra).'}
            {setupCount === 1 && 'Coloca tu 2.ª ficha contigua a tus fichas.'}
            {setupCount === 2 && !hasSovereignOnBoard && '¡Última ficha de apertura! Es obligatorio colocar al Soberano 👑'}
            {setupCount === 2 && hasSovereignOnBoard && 'Coloca tu 3.ª y última ficha inicial.'}
          </span>
        </div>
      )}

      {isActive && !isSetup && sovereignMustBePlaced && (
        <div className="mb-2 text-xs font-semibold text-amber-200 bg-amber-950/80 border border-amber-500/50 rounded-xl px-3 py-1.5 flex items-center gap-2 animate-bounce">
          <span>👑</span>
          <span>4.º turno: ¡Es obligatorio colocar al Soberano!</span>
        </div>
      )}

      {/* Hand piece slots */}
      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
        {Object.entries(grouped).map(([type, pieceList]) => {
          const piece = pieceList[0]!;
          const isSelected = selectedPiece?.location === 'hand' && selectedPiece?.type === piece.type && selectedPiece?.house === house;
          // Only disabled if it's not the active player's turn, OR if 4th turn was reached without Sovereign and trying to pick non-SO
          const isDisabled = !isActive || (sovereignMustBePlaced && type !== 'SO');

          return (
            <button
              key={type}
              disabled={isDisabled}
              onClick={() => onSelectPiece(piece)}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-white text-slate-900 border-white font-bold shadow-lg scale-105'
                  : isDisabled
                  ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed opacity-40'
                  : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:border-slate-400 hover:bg-slate-800 active:scale-95'
              }`}
              title={`${PIECE_NAMES[type as PieceType]} (${pieceList.length} disponibles)`}
            >
              <PieceIcon type={type as PieceType} size={22} white={!isSelected} />
              <span className="text-xs font-medium">{type}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-slate-900 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {pieceList.length}
              </span>
            </button>
          );
        })}

        {handPieces.length === 0 && (
          <div className="text-xs text-slate-500 italic py-1">Sin fichas en reserva</div>
        )}
      </div>
    </div>
  );
};
