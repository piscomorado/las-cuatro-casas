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
  onClick?: () => void;
}

const HOUSE_THEMES: Record<House | 'ruin', { fill: string; stroke: string; text: string; bg: string }> = {
  red: { fill: '#b91c1c', stroke: '#ef4444', text: '#ffffff', bg: '#7f1d1d' },
  blue: { fill: '#1d4ed8', stroke: '#3b82f6', text: '#ffffff', bg: '#1e3a8a' },
  green: { fill: '#15803d', stroke: '#22c55e', text: '#ffffff', bg: '#14532d' },
  amber: { fill: '#b45309', stroke: '#f59e0b', text: '#ffffff', bg: '#78350f' },
  ruin: { fill: '#3f3f46', stroke: '#71717a', text: '#d4d4d8', bg: '#27272a' },
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
        return { fill: 'rgba(34, 197, 94, 0.25)', stroke: '#22c55e', dash: '4 3' };
      case 'move':
        return { fill: 'rgba(59, 130, 246, 0.3)', stroke: '#3b82f6', dash: 'none' };
      case 'climb':
        return { fill: 'rgba(168, 85, 247, 0.35)', stroke: '#a855f7', dash: '3 2' };
      case 'swap':
        return { fill: 'rgba(234, 179, 8, 0.35)', stroke: '#eab308', dash: '4 2' };
      case 'exile':
        return { fill: 'rgba(239, 68, 68, 0.4)', stroke: '#ef4444', dash: '2 2' };
    }
  };

  const candStyle = isCandidate ? getCandidateStyles() : null;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      className={`cursor-pointer transition-transform duration-150 ${isSelected ? 'scale-105' : 'hover:scale-[1.02]'}`}
    >
      {/* Base Grid Slot (empty cell highlight) */}
      {stackHeight === 0 && (
        <polygon
          points={hexPoints}
          fill={candStyle ? candStyle.fill : 'rgba(30, 41, 59, 0.35)'}
          stroke={candStyle ? candStyle.stroke : '#334155'}
          strokeWidth={isCandidate ? 2.5 : 1}
          strokeDasharray={candStyle?.dash}
          className="transition-colors duration-200"
        />
      )}

      {/* Render Stack Depth if > 1 */}
      {stackHeight > 1 && (
        <>
          <polygon
            points={hexPoints}
            transform="translate(0, 5)"
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

      {/* Top Piece */}
      {topPiece && (
        <g transform={stackHeight > 1 ? 'translate(0, -6)' : ''}>
          {/* Shadow */}
          <polygon
            points={hexPoints}
            transform="translate(0, 4)"
            fill="#020617"
            opacity="0.5"
          />

          {/* Hex Body */}
          {(() => {
            const themeKey = topPiece.location === 'ruin' ? 'ruin' : topPiece.house;
            const theme = HOUSE_THEMES[themeKey];
            return (
              <polygon
                points={hexPoints}
                fill={theme.fill}
                stroke={isSelected ? '#ffffff' : theme.stroke}
                strokeWidth={isSelected ? 3.5 : 2}
                className="transition-all duration-200"
              />
            );
          })()}

          {/* Icon */}
          <g transform="translate(-14, -14)" pointerEvents="none">
            <PieceIcon
              type={topPiece.type}
              size={28}
              className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
            />
          </g>

          {/* Stack Badge if > 1 */}
          {stackHeight > 1 && (
            <g transform="translate(14, -14)">
              <circle cx="0" cy="0" r="8" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                fill="#f8fafc"
              >
                {stackHeight}
              </text>
            </g>
          )}
        </g>
      )}

      {/* Candidate Overlay on top of piece */}
      {isCandidate && topPiece && (
        <polygon
          points={hexPoints}
          fill={candStyle!.fill}
          stroke={candStyle!.stroke}
          strokeWidth="3"
          strokeDasharray={candStyle!.dash}
          className="animate-pulse"
        />
      )}
    </g>
  );
};
