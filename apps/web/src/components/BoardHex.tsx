import React from 'react';
import { House, Piece } from '@lcch/engine';
import { getHexCornerPoints, HEX_SIZE } from '../utils/hexMath';
import { SvgPieceIcon } from './PieceIcon';
import { getSovereignPortrait, SOVEREIGN_THEMES } from '../assets/vfx/sovereign_portraits_b64';

export interface BoardHexProps {
  q: number;
  r: number;
  x: number;
  y: number;
  pieces?: Piece[]; // Stack of pieces (0 = bottom, last = top)
  isCandidate?: boolean;
  isSelected?: boolean;
  isLastMoveOrigin?: boolean;
  isLastMoveTarget?: boolean;
  siegeDangerCount?: number; // 4 or 5 occupied neighbors around this living Sovereign
  isSovereignReactionActive?: boolean;
  sovereignReactionLevel?: number;
  candidateType?: 'place' | 'move' | 'swap' | 'exile' | 'climb';
  candidatePieceType?: Piece['type']; // For previewing piece icon on empty candidate hex
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
  q,
  r,
  x,
  y,
  pieces = [],
  isCandidate = false,
  isSelected = false,
  isLastMoveOrigin = false,
  isLastMoveTarget = false,
  siegeDangerCount,
  isSovereignReactionActive = false,
  sovereignReactionLevel,
  candidateType = 'place',
  candidatePieceType,
  onClick,
}) => {
  const stackHeight = pieces.length;
  const topPiece = stackHeight > 0 ? pieces[stackHeight - 1] : null;

  const hexPoints = getHexCornerPoints(0, 0, HEX_SIZE - 2);

  const getCandidateStyles = () => {
    switch (candidateType) {
      case 'place':
        return { fill: 'rgba(34, 197, 94, 0.28)', stroke: '#22c55e', strokeWidth: 2.5, dash: 'none' };
      case 'move':
        return { fill: 'rgba(59, 130, 246, 0.32)', stroke: '#60a5fa', strokeWidth: 2.5, dash: 'none' };
      case 'climb':
        return { fill: 'rgba(168, 85, 247, 0.38)', stroke: '#c084fc', strokeWidth: 2.5, dash: '4 2' };
      case 'swap':
        return { fill: 'rgba(234, 179, 8, 0.38)', stroke: '#facc15', strokeWidth: 2.5, dash: '4 2' };
      case 'exile':
        return { fill: 'rgba(239, 68, 68, 0.42)', stroke: '#f87171', strokeWidth: 2.5, dash: '3 2' };
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
        <>
          <polygon
            points={hexPoints}
            fill={candStyle ? candStyle.fill : 'rgba(30, 41, 59, 0.3)'}
            stroke={candStyle ? candStyle.stroke : '#334155'}
            strokeWidth={candStyle ? candStyle.strokeWidth : 1}
            strokeDasharray={candStyle?.dash}
            className={isCandidate ? 'candidate-glow' : undefined}
            style={isCandidate ? { color: candStyle?.stroke } : undefined}
          />
          {/* Last move ghost origin marker on empty hex */}
          {isLastMoveOrigin && (
            <polygon
              points={hexPoints}
              fill="rgba(245, 158, 11, 0.12)"
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              className="opacity-75"
            />
          )}
          {/* Ghost preview of candidate placement */}
          {isCandidate && candidatePieceType && (
            <SvgPieceIcon
              type={candidatePieceType}
              x={-18}
              y={-18}
              size={36}
              white={true}
              className="opacity-70"
            />
          )}
        </>
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

          {/* Hex Body or Besieged Sovereign Screen */}
          {(() => {
            const themeKey = topPiece.location === 'ruin' ? 'ruin' : topPiece.house;
            const theme = HOUSE_THEMES[themeKey];
            const isSovereign = topPiece.type === 'SO';
            const showSovereignScreen = isSovereign && isSovereignReactionActive;
            const level = sovereignReactionLevel ?? siegeDangerCount ?? 1;

            const houseKey = topPiece.house as House;
            const sovTheme = SOVEREIGN_THEMES[houseKey] ?? SOVEREIGN_THEMES.red;
            const portraitHref = getSovereignPortrait(houseKey, level);
            const moodColor = level >= 5 ? sovTheme.primary : level >= 3 ? sovTheme.accent : sovTheme.primary;
            const heartbeatSpeed = level >= 5 ? '0.68s' : level >= 4 ? '0.82s' : level >= 3 ? '0.96s' : '1.1s';
            const clipId = `sovereign-hex-clip-${q}-${r}`;

            return (
              <>
                {/* 1. Base Piece: Always rendered underneath so when the sovereign screen dissolves, the standard piece is immediately and seamlessly revealed */}
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

                {/* Last move target border highlight */}
                {isLastMoveTarget && !isSelected && (
                  <polygon
                    points={hexPoints}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2.5"
                    strokeDasharray="5 3"
                    className="opacity-90 animate-pulse"
                  />
                )}

                {/* Sovereign Siege Threat Ring (clean, no numbers) */}
                {siegeDangerCount && siegeDangerCount >= 4 && !showSovereignScreen && (
                  <g pointerEvents="none">
                    <polygon
                      points={hexPoints}
                      fill="none"
                      stroke={siegeDangerCount === 5 ? '#ef4444' : '#f59e0b'}
                      strokeWidth={siegeDangerCount === 5 ? 4 : 2.5}
                      className={siegeDangerCount === 5 ? 'animate-pulse' : undefined}
                      strokeDasharray={siegeDangerCount === 5 ? '6 3' : '4 2'}
                    />
                  </g>
                )}

                {/* Official Emblem Image from manual v0.4 (Embedded Base64) */}
                <SvgPieceIcon
                  type={topPiece.type}
                  x={-20}
                  y={-20}
                  size={40}
                  white={true}
                />

                {/* 2. Besieged Sovereign Hexagonal Screen Overlay (Emerges on siege clash, stays for 10s, then dissolves smoothly back to the base piece) */}
                {showSovereignScreen && (
                  <g className="sovereign-reaction-container">
                    <defs>
                      <clipPath id={clipId}>
                        <polygon points={hexPoints} />
                      </clipPath>
                    </defs>

                    {/* Inner Heartbeat Group: lub-dub pulse accelerating with siege level */}
                    <g
                      className="sovereign-heartbeat"
                      style={{
                        transformOrigin: '0px 0px',
                        ['--sov-glow-color' as any]: sovTheme.glow,
                        ['--sov-accent-color' as any]: sovTheme.accent,
                        ['--sov-heartbeat-speed' as any]: heartbeatSpeed,
                      }}
                    >
                      {/* Dark base viewport backdrop */}
                      <polygon points={hexPoints} fill="#050505" />

                      {/* Sovereign Face cropped inside the hexagonal screen */}
                      <image
                        href={portraitHref}
                        x={-46}
                        y={-46}
                        width={92}
                        height={92}
                        preserveAspectRatio="xMidYMid slice"
                        clipPath={`url(#${clipId})`}
                        className={level >= 3 ? 'sovereign-screen-glow' : undefined}
                        style={{
                          filter:
                            level >= 5
                              ? `contrast(1.38) brightness(1.24) drop-shadow(0 0 14px ${sovTheme.glow})`
                              : level >= 3
                              ? `contrast(1.22) brightness(1.15) drop-shadow(0 0 8px ${sovTheme.glow})`
                              : 'contrast(1.12) brightness(1.06)',
                        }}
                      />

                      {/* Hexagonal HUD energy border (clean, no numbers, no notices) */}
                      <polygon
                        points={hexPoints}
                        fill="none"
                        stroke={isSelected ? '#ffffff' : moodColor}
                        strokeWidth={isSelected ? 4 : level >= 4 ? 3.5 : 2.5}
                        strokeDasharray={level >= 4 ? '6 3' : undefined}
                        className={level >= 3 ? 'animate-pulse' : undefined}
                        style={{
                          filter: `drop-shadow(0 0 ${level >= 5 ? 14 : 7}px ${moodColor})`,
                        }}
                      />

                      {/* Dynamic Corner Sparks when under heavy stress */}
                      {level >= 3 && (
                        <g pointerEvents="none" className="animate-pulse">
                          <circle cx="-32" cy="-20" r="2.5" fill={moodColor} filter={`drop-shadow(0 0 6px ${moodColor})`} />
                          <circle cx="32" cy="-20" r="2.5" fill={moodColor} filter={`drop-shadow(0 0 6px ${moodColor})`} />
                          <circle cx="0" cy="38" r="2.5" fill={moodColor} filter={`drop-shadow(0 0 6px ${moodColor})`} />
                        </g>
                      )}
                    </g>

                    {/* Dramatic Strobe Flash at emergence */}
                    <polygon
                      points={hexPoints}
                      fill={level >= 4 ? '#ffffff' : sovTheme.strobe}
                      className="sovereign-strobe-overlay"
                      pointerEvents="none"
                    />
                  </g>
                )}
              </>
            );
          })()}

          {/* Stack count badge if height > 1 */}
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
          className="candidate-glow"
          style={{ color: candStyle!.stroke }}
          pointerEvents="none"
        />
      )}

      {/* Candidate Center Dot */}
      {isCandidate && (
        <circle
          cx="0"
          cy={stackHeight > 1 ? -6 : 0}
          r={stackHeight === 0 && !candidatePieceType ? 6 : 4}
          fill={candStyle!.stroke}
          className="candidate-glow"
          style={{ color: candStyle!.stroke }}
          pointerEvents="none"
        />
      )}
    </g>
  );
};
