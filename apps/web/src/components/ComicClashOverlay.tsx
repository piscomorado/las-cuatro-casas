import React, { useEffect, useState } from 'react';
import { PieceType, House } from '@lcch/engine';

export interface ComicClashEvent {
  id: string;
  attackerType: PieceType;
  attackerHouse: House;
  targetHouse: House;
  fromPixel?: { x: number; y: number };
  toPixel: { x: number; y: number };
  sovereignPixel: { x: number; y: number };
  siegeCount: number; // 1 to 6
}

export interface ComicClashOverlayProps {
  clash?: ComicClashEvent | null;
  onAnimationEnd?: () => void;
}

const HOUSE_COLORS: Record<House, { primary: string; secondary: string; glow: string }> = {
  red: { primary: '#ef4444', secondary: '#fca5a5', glow: 'rgba(239, 68, 68, 0.85)' },
  blue: { primary: '#3b82f6', secondary: '#93c5fd', glow: 'rgba(59, 130, 246, 0.85)' },
  green: { primary: '#22c55e', secondary: '#86efac', glow: 'rgba(34, 197, 94, 0.85)' },
  amber: { primary: '#f59e0b', secondary: '#fde68a', glow: 'rgba(245, 158, 11, 0.85)' },
};

/**
 * Pure Action Comic Illustration Overlay (Zero Text, Zero Numbers).
 * High-impact vector graphics with bold line weight, speed sparks, and smooth fade-out.
 */
export const ComicClashOverlay: React.FC<ComicClashOverlayProps> = ({ clash, onAnimationEnd }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (clash) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onAnimationEnd) onAnimationEnd();
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [clash?.id]);

  if (!clash || !visible) return null;

  const { attackerType, attackerHouse, toPixel, sovereignPixel } = clash;
  const colors = HOUSE_COLORS[attackerHouse] || HOUSE_COLORS.red;

  // Midpoint between attacking piece and target sovereign
  const midX = (toPixel.x + sovereignPixel.x) / 2;
  const midY = (toPixel.y + sovereignPixel.y) / 2;

  // Angle from attacker to sovereign
  const angleDeg = (Math.atan2(sovereignPixel.y - toPixel.y, sovereignPixel.x - toPixel.x) * 180) / Math.PI;

  return (
    <g pointerEvents="none" className="select-none z-50">
      <defs>
        {/* Comic High-Intensity Glow Filter */}
        <filter id="comic-glow-lg" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ============================================================== */}
      {/* 1. CAZADOR (CZ) — PURE CROSSED BLADE SLASH ILLUSTRATION        */}
      {/* ============================================================== */}
      {attackerType === 'CZ' && (
        <g transform={`translate(${midX}, ${midY}) scale(2.0)`} className="animate-comic-clash">
          {/* Contrast Dark Backdrop Halo */}
          <circle cx="0" cy="0" r="56" fill="#020617" opacity="0.75" />
          <circle cx="0" cy="0" r="48" fill="none" stroke={colors.glow} strokeWidth="2.5" opacity="0.5" />

          {/* Comic Speed Lines */}
          <g opacity="0.9">
            <line x1="-58" y1="0" x2="-88" y2="0" stroke={colors.secondary} strokeWidth="3.5" strokeLinecap="round" />
            <line x1="58" y1="0" x2="88" y2="0" stroke={colors.secondary} strokeWidth="3.5" strokeLinecap="round" />
            <line x1="0" y1="-58" x2="0" y2="-88" stroke={colors.secondary} strokeWidth="3.5" strokeLinecap="round" />
            <line x1="0" y1="58" x2="0" y2="88" stroke={colors.secondary} strokeWidth="3.5" strokeLinecap="round" />
            <line x1="-42" y1="-42" x2="-70" y2="-70" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <line x1="42" y1="42" x2="70" y2="70" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <line x1="-42" y1="42" x2="-70" y2="70" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <line x1="42" y1="-42" x2="70" y2="-70" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* Blade 1 (Top-Left to Bottom-Right) */}
          <path
            d="M -70 -58 L 70 58"
            stroke="#ffffff"
            strokeWidth="11"
            strokeLinecap="round"
            filter="url(#comic-glow-lg)"
          />
          <path d="M -70 -58 L 70 58" stroke={colors.primary} strokeWidth="5" strokeLinecap="round" />

          {/* Blade 2 (Top-Right to Bottom-Left) */}
          <path
            d="M 70 -58 L -70 58"
            stroke="#ffffff"
            strokeWidth="11"
            strokeLinecap="round"
            filter="url(#comic-glow-lg)"
          />
          <path d="M 70 -58 L -70 58" stroke={colors.primary} strokeWidth="5" strokeLinecap="round" />

          {/* Center Impact Star Burst */}
          <polygon
            points="0,-32 9,-9 32,0 9,9 0,32 -9,9 -32,0 -9,-9"
            fill="#ffffff"
            stroke="#f59e0b"
            strokeWidth="3.5"
            filter="url(#comic-glow-lg)"
          />
          <circle cx="0" cy="0" r="6" fill="#f59e0b" />
        </g>
      )}

      {/* ============================================================== */}
      {/* 2. BESTIA (BS) — PURE 3-CLAW TEAR ILLUSTRATION                */}
      {/* ============================================================== */}
      {attackerType === 'BS' && (
        <g transform={`translate(${midX}, ${midY}) scale(2.0)`} className="animate-comic-clash">
          {/* Contrast Dark Backdrop Halo */}
          <circle cx="0" cy="0" r="56" fill="#020617" opacity="0.75" />

          <g transform={`rotate(${angleDeg + 30})`}>
            {/* 3 Heavy Curved Claws */}
            {[-25, 0, 25].map((offset, i) => (
              <path
                key={i}
                d={`M ${offset - 46} -60 Q ${offset} 0 ${offset + 36} 60`}
                stroke="#ffffff"
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
                filter="url(#comic-glow-lg)"
              />
            ))}
            {[-25, 0, 25].map((offset, i) => (
              <path
                key={`inner-${i}`}
                d={`M ${offset - 46} -60 Q ${offset} 0 ${offset + 36} 60`}
                stroke={colors.primary}
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />
            ))}

            {/* Beast Claw Sparks */}
            <circle cx="38" cy="56" r="5" fill="#fbbf24" />
            <circle cx="-42" cy="-54" r="5" fill="#ffffff" />
            <circle cx="10" cy="10" r="6" fill={colors.secondary} />
            <circle cx="-15" cy="30" r="4" fill="#fbbf24" />
            <circle cx="20" cy="-25" r="4.5" fill="#ffffff" />
          </g>
        </g>
      )}

      {/* ============================================================== */}
      {/* 3. GIGANTE (GI) — PURE TITAN STOMP & SHOCKWAVE CRATER         */}
      {/* ============================================================== */}
      {attackerType === 'GI' && (
        <g transform={`translate(${sovereignPixel.x}, ${sovereignPixel.y}) scale(2.0)`} className="animate-comic-clash">
          {/* Contrast Dark Backdrop Halo */}
          <circle cx="0" cy="0" r="58" fill="#020617" opacity="0.75" />

          {/* Concentric Seismic Shockwave Rings */}
          <circle cx="0" cy="0" r="62" fill="none" stroke={colors.primary} strokeWidth="5" strokeDasharray="12 6" opacity="0.9" />
          <circle cx="0" cy="0" r="44" fill={colors.glow} opacity="0.45" />

          {/* Bold Comic Ground Fractures */}
          <path d="M 0 0 L -40 -35 L -58 -30" stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 0 0 L 42 -28 L 60 -22" stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 0 0 L -35 42 L -50 60" stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 0 0 L 38 38 L 55 54" stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 0 0 L 0 -55" stroke={colors.secondary} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 0 0 L 0 55" stroke={colors.secondary} strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* Giant Titan Footprint Silhouette */}
          <ellipse cx="0" cy="-2" rx="22" ry="30" fill="#020617" stroke="#fbbf24" strokeWidth="4" />
          <circle cx="-11" cy="-36" r="5.5" fill="#fbbf24" />
          <circle cx="-3" cy="-39" r="6" fill="#fbbf24" />
          <circle cx="5" cy="-38" r="5.5" fill="#fbbf24" />
          <circle cx="13" cy="-34" r="5" fill="#fbbf24" />
        </g>
      )}

      {/* ============================================================== */}
      {/* 4. EXPLORADOR (EX) — PURE SPEED CYCLONE ILLUSTRATION          */}
      {/* ============================================================== */}
      {attackerType === 'EX' && (
        <g transform={`translate(${sovereignPixel.x}, ${sovereignPixel.y}) scale(2.0)`} className="animate-comic-clash">
          {/* Contrast Dark Backdrop Halo */}
          <circle cx="0" cy="0" r="56" fill="#020617" opacity="0.75" />

          {/* Cyclone Speed Arcs */}
          <path
            d="M -52 -22 A 56 56 0 0 1 52 -22"
            stroke="#ffffff"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            filter="url(#comic-glow-lg)"
          />
          <path
            d="M 52 22 A 56 56 0 0 1 -52 22"
            stroke={colors.primary}
            strokeWidth="5.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Wind Crescent Arrows */}
          <polygon points="52,-22 68,-26 58,-10" fill="#ffffff" />
          <polygon points="-52,22 -68,26 -58,10" fill={colors.secondary} />
          <circle cx="-30" cy="-40" r="3.5" fill="#ffffff" />
          <circle cx="30" cy="40" r="3.5" fill={colors.secondary} />
        </g>
      )}

      {/* ============================================================== */}
      {/* 5. HECHICERO (HE) / NIGROMANTE (NI) / GENERIC ATTACK          */}
      {/* ============================================================== */}
      {(attackerType === 'HE' || attackerType === 'NI' || attackerType === 'SO') && (
        <g transform={`translate(${midX}, ${midY}) scale(2.0)`} className="animate-comic-clash">
          {/* Contrast Dark Backdrop Halo */}
          <circle cx="0" cy="0" r="56" fill="#020617" opacity="0.75" />

          <circle cx="0" cy="0" r="50" fill="none" stroke={colors.primary} strokeWidth="4.5" strokeDasharray="9 6" />
          <polygon
            points="0,-40 12,-12 40,0 12,12 0,40 -12,12 -40,0 -12,-12"
            fill="#ffffff"
            stroke={colors.primary}
            strokeWidth="4"
            filter="url(#comic-glow-lg)"
          />
          <circle cx="0" cy="0" r="8" fill={colors.primary} />
        </g>
      )}
    </g>
  );
};
