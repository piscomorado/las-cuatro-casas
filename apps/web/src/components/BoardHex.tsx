import React from 'react';
import { House, Piece } from '@lcch/engine';
import { getHexCornerPoints, HEX_SIZE } from '../utils/hexMath';
import { PieceIcon } from './PieceIcon';

export interface BoardHexProps {
  q: number;
  r: number;
  x: number;
  y: number;
  pieces?: Piece[]; // Stack of pieces (0 = bottom, last = top)
  isCandidate?: boolean;
  isSelected?: boolean;
  candidateType?: 'place' | 'move' | 'swap' | 'exile' | 'climb';
  onClick?: (e: React.MouseEvent) => void;
}

const HOUSE_THEMES: Record<House | 'ruin', { fill: string; stroke: string; glow: string }> = {
  red: { fill: '#b91c1c', stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.6)' },
  blue: { fill: '#1d4ed8', stroke: '#3b82f6', glow: 'rgba(59, 130, 246, 0.6)' },
  green: { fill: '#15803d', stroke: '#22c55e', glow: 'rgba(34, 197, 94, 0.6)' },
  amber: { fill: '#b45309', stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)' },
  ruin: { fill: '#3f3f46', stroke: '#71717a', glow: 'rgba(113, 113, 122, 0.6)' },
};

export const BoardHex: React.FC<BoardHexProps> = ({
  x,
  y,
  pieces = [],
  isCandidate = false,
  isSelected = false,
  candidateType = 'place',
  onClick,
}) => {
  const stackHeight = pieces.length;
  const topPiece = stackHeight > 0 ? pieces[stackHeight - 1] : null;

  const hexPoints = getHexCornerPoints(0, 0, HEX_SIZE - 2);

  const getCandidateStyles = () => {
    switch (candidateType) {
      case 'place':
        return { fill: 'rgba(34, 197, 94, 0.35)', stroke: '#22c55e', strokeWidth: 3, dash: 'none' };
      case 'move':
        return { fill: 'rgba(59, 130, 246, 0.4)', stroke: '#60a5fa', strokeWidth: 3, dash: 'none' };
      case 'climb':
        return { fill: 'rgba(168, 85, 247, 0.45)', stroke: '#c084fc', strokeWidth: 3, dash: '4 2' };
      case 'swap':
        return { fill: 'rgba(234, 179, 8, 0.45)', stroke: '#facc15', strokeWidth: 3, dash: '4 2' };
      case 'exile':
        return { fill: 'rgba(239, 68, 68, 0.5)', stroke: '#f87171', strokeWidth: 3, dash: '3 2' };
    }
  };

  const candStyle = isCandidate ? getCandidateStyles() : null;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      className="cursor-pointer"
    >
      {/* 1. Base Empty Slot */}
      {stackHeight === 0 && (
        <polygon
          points={hexPoints}
          fill={candStyle ? candStyle.fill : 'rgba(30, 41, 59, 0.3)'}
          stroke={candStyle ? candStyle.stroke : '#334155'}
          strokeWidth={candStyle ? candStyle.strokeWidth : 1}
          strokeDasharray={candStyle?.dash}
        />
      )}

      {/* 2. Visual Stacking Elevation */}
      {stackHeight > 1 && (
        <>
          <polygon
            points={hexPoints}
            transform="translate(0, 6)"
            fill="#090d16"
            opacity="0.8"
          />
          <polygon
            points={hexPoints}
            transform="translate(0, -3)"
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1.5"
          />
        </>
      )}

      {/* 3. Top Piece */}
      {topPiece && (
        <g transform={stackHeight > 1 ? 'translate(0, -6)' : undefined}>
          {/* Drop shadow */}
          <polygon
            points={hexPoints}
            transform="translate(0, 4)"
            fill="#020617"
            opacity="0.6"
          />

          {/* Hex Body */}
          {(() => {
            const themeKey = topPiece.location === 'ruin' ? 'ruin' : topPiece.house;
            const theme = HOUSE_THEMES[themeKey];
            return (
              <>
                <polygon
                  points={hexPoints}
                  fill={theme.fill}
                  stroke={isSelected ? '#ffffff' : theme.stroke}
                  strokeWidth={isSelected ? 3.5 : 2}
                />
                {isSelected && (
                  <polygon
                    points={hexPoints}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="5"
                    strokeOpacity="0.4"
                  />
                )}
              </>
            );
          })()}

          {/* Official Emblem Image */}
          <g transform="translate(-16, -16)" pointerEvents="none">
            <PieceIcon
              type={topPiece.type}
              size={32}
              white={true}
              className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            />
          </g>

          {/* Stack count badge */}
          {stackHeight > 1 && (
            <g transform="translate(14, -14)" pointerEvents="none">
              <circle cx="0" cy="0" r="9" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
              <text
                x="0"
                y="3.5"
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#f8fafc"
              >
                {stackHeight}
              </text>
            </g>
          )}
        </g>
      )}

      {/* 4. Candidate Overlay on Occupied Hex (Moves, Climbs, Swaps, Exiles) */}
      {isCandidate && topPiece && (
        <polygon
          points={hexPoints}
          transform={stackHeight > 1 ? 'translate(0, -6)' : undefined}
          fill={candStyle!.fill}
          stroke={candStyle!.stroke}
          strokeWidth={candStyle!.strokeWidth}
          strokeDasharray={candStyle!.dash}
          pointerEvents="none"
        />
      )}

      {/* Pulsing Dot in Center of Valid Candidate Cell */}
      {isCandidate && (
        <circle
          cx="0"
          cy={stackHeight > 1 ? -6 : 0}
          r={stackHeight === 0 ? 6 : 4}
          fill={candStyle!.stroke}
          pointerEvents="none"
        />
      )}
    </g>
  );
};
