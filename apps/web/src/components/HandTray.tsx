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
  CZ: 'Cazador',
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
}) => {
  const config = HOUSE_CONFIGS[house];

  const handPieces = pieces.filter((p) => p.house === house && p.location === 'hand');
  const grouped: Record<string, Piece[]> = {};
  for (const p of handPieces) {
    if (!grouped[p.type]) grouped[p.type] = [];
    grouped[p.type]!.push(p);
  }

  const sovereignInHand = grouped['SO'] && grouped['SO'].length > 0;
  const sovereignMustBePlaced = sovereignInHand && ownTurn >= 3;

  return (
    <div
      className={`rounded-xl border p-3 transition-all duration-300 ${config.bg} ${config.border} ${
        isActive ? `${config.activeGlow} shadow-lg scale-[1.01]` : 'opacity-70'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-wide">{config.name}</span>
          {isActive && (
            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-white/20 text-white animate-pulse">
              Turno Activo
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400">
          Turno {ownTurn + 1} • {handPieces.length} fichas
        </span>
      </div>

      {sovereignMustBePlaced && isActive && (
        <div className="mb-2 text-xs font-semibold text-amber-300 bg-amber-950/60 border border-amber-600/50 rounded px-2 py-1 flex items-center gap-1.5">
          ⚠️ ¡Debes colocar tu Soberano en este turno!
        </div>
      )}

      {!hasSovereignOnBoard && isActive && !sovereignMustBePlaced && (
        <div className="mb-2 text-[11px] text-slate-400 bg-slate-900/60 rounded px-2 py-0.5">
          ℹ️ Coloca tu Soberano para habilitar el movimiento de fichas.
        </div>
      )}

      {/* Hand piece slots */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(grouped).map(([type, pieceList]) => {
          const piece = pieceList[0]!;
          const isSelected = selectedPiece?.location === 'hand' && selectedPiece?.type === piece.type && selectedPiece?.house === house;
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
