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

export const ComicClashOverlay: React.FC<ComicClashOverlayProps> = ({ clash, onAnimationEnd }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (clash) {
      setVisible(true);
      // Increased duration to 2400ms for a solid visible hold and smooth fade-out
      const timer = setTimeout(() => {
        setVisible(false);
        if (onAnimationEnd) onAnimationEnd();
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [clash?.id]);

  if (!clash || !visible) return null;

  const { attackerType, attackerHouse, toPixel, sovereignPixel, siegeCount } = clash;
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

        {/* Comic Drop Shadow for Badges */}
        <filter id="comic-badge-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* ============================================================== */}
      {/* 1. CAZADOR (CZ) — GIANT CROSSED X-SWORD SLASH */}
      {/* ============================================================== */}
      {attackerType === 'CZ' && (
        <g transform={`translate(${midX}, ${midY}) scale(1.85)`} className="animate-comic-clash">
          {/* Contrast Dark Backdrop Halo to avoid confusion with hex tiles below */}
          <circle cx="0" cy="0" r="55" fill="#020617" opacity="0.75" />
          <circle cx="0" cy="0" r="48" fill="none" stroke={colors.glow} strokeWidth="2.5" opacity="0.5" />

          {/* Comic Speed Lines radiating outward */}
          <g opacity="0.9">
            <line x1="-55" y1="0" x2="-85" y2="0" stroke={colors.secondary} strokeWidth="3.5" strokeLinecap="round" />
            <line x1="55" y1="0" x2="85" y2="0" stroke={colors.secondary} strokeWidth="3.5" strokeLinecap="round" />
            <line x1="0" y1="-55" x2="0" y2="-85" stroke={colors.secondary} strokeWidth="3.5" strokeLinecap="round" />
            <line x1="0" y1="55" x2="0" y2="85" stroke={colors.secondary} strokeWidth="3.5" strokeLinecap="round" />
            <line x1="-40" y1="-40" x2="-65" y2="-65" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="40" y1="40" x2="65" y2="65" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* First Giant Slash (Top-Left to Bottom-Right) */}
          <path
            d="M -65 -55 L 65 55"
            stroke="#ffffff"
            strokeWidth="10"
            strokeLinecap="round"
            filter="url(#comic-glow-lg)"
          />
          <path d="M -65 -55 L 65 55" stroke={colors.primary} strokeWidth="4.5" strokeLinecap="round" />

          {/* Second Giant Slash (Top-Right to Bottom-Left) */}
          <path
            d="M 65 -55 L -65 55"
            stroke="#ffffff"
            strokeWidth="10"
            strokeLinecap="round"
            filter="url(#comic-glow-lg)"
          />
          <path d="M 65 -55 L -65 55" stroke={colors.primary} strokeWidth="4.5" strokeLinecap="round" />

          {/* Central Mega Comic Impact Star */}
          <polygon
            points="0,-28 8,-8 28,0 8,8 0,28 -8,8 -28,0 -8,-8"
            fill="#ffffff"
            stroke="#f59e0b"
            strokeWidth="3"
            filter="url(#comic-glow-lg)"
          />
          <circle cx="0" cy="0" r="5" fill="#f59e0b" />

          {/* Giant Comic Action Badge */}
          <g transform="translate(0, -48)" className="animate-comic-badge" filter="url(#comic-badge-shadow)">
            <rect x="-44" y="-14" width="88" height="28" rx="10" fill="#020617" stroke="#f59e0b" strokeWidth="2.5" />
            <text
              x="0"
              y="6"
              textAnchor="middle"
              fill="#ffffff"
              fontFamily="Impact, sans-serif"
              fontSize="16"
              fontWeight="900"
              letterSpacing="2.5"
            >
              SLASH!
            </text>
          </g>
        </g>
      )}

      {/* ============================================================== */}
      {/* 2. BESTIA (BS) — MASSIVE 3-CLAW RIP */}
      {/* ============================================================== */}
      {attackerType === 'BS' && (
        <g transform={`translate(${midX}, ${midY}) scale(1.85)`} className="animate-comic-clash">
          {/* Contrast Dark Backdrop Halo */}
          <circle cx="0" cy="0" r="55" fill="#020617" opacity="0.75" />

          <g transform={`rotate(${angleDeg + 30})`}>
            {/* 3 Parallel Heavy Curved Claws */}
            {[-24, 0, 24].map((offset, i) => (
              <path
                key={i}
                d={`M ${offset - 42} -55 Q ${offset} 0 ${offset + 32} 55`}
                stroke="#ffffff"
                strokeWidth="9"
                strokeLinecap="round"
                fill="none"
                filter="url(#comic-glow-lg)"
              />
            ))}
            {[-24, 0, 24].map((offset, i) => (
              <path
                key={`inner-${i}`}
                d={`M ${offset - 42} -55 Q ${offset} 0 ${offset + 32} 55`}
                stroke={colors.primary}
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
            ))}

            {/* Beast Claw Sparks */}
            <circle cx="34" cy="52" r="4.5" fill="#fbbf24" />
            <circle cx="-38" cy="-50" r="4.5" fill="#ffffff" />
            <circle cx="8" cy="8" r="5" fill={colors.secondary} />
          </g>

          {/* Giant Comic Action Badge */}
          <g transform="translate(0, -48)" className="animate-comic-badge" filter="url(#comic-badge-shadow)">
            <rect x="-42" y="-14" width="84" height="28" rx="10" fill="#020617" stroke="#ef4444" strokeWidth="2.5" />
            <text
              x="0"
              y="6"
              textAnchor="middle"
              fill="#ffffff"
              fontFamily="Impact, sans-serif"
              fontSize="16"
              fontWeight="900"
              letterSpacing="2.5"
            >
              CLAW!
            </text>
          </g>
        </g>
      )}

      {/* ============================================================== */}
      {/* 3. GIGANTE (GI) — COLOSSAL TITAN STOMP & CRATER */}
      {/* ============================================================== */}
      {attackerType === 'GI' && (
        <g transform={`translate(${sovereignPixel.x}, ${sovereignPixel.y}) scale(1.85)`} className="animate-comic-clash">
          {/* Contrast Dark Backdrop Halo */}
          <circle cx="0" cy="0" r="55" fill="#020617" opacity="0.75" />

          {/* Concentric Ground Crater Rings */}
          <circle cx="0" cy="0" r="58" fill="none" stroke={colors.primary} strokeWidth="4.5" strokeDasharray="10 6" opacity="0.9" />
          <circle cx="0" cy="0" r="40" fill={colors.glow} opacity="0.4" />

          {/* Bold Comic Ground Cracks */}
          <path d="M 0 0 L -36 -32 L -52 -28" stroke="#ffffff" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M 0 0 L 38 -26 L 55 -20" stroke="#ffffff" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M 0 0 L -32 38 L -45 54" stroke="#ffffff" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M 0 0 L 35 34 L 50 48" stroke="#ffffff" strokeWidth="3.5" fill="none" strokeLinecap="round" />

          {/* Giant Titan Footprint Silhouette */}
          <ellipse cx="0" cy="-2" rx="20" ry="28" fill="#020617" stroke="#fbbf24" strokeWidth="3.5" />
          <circle cx="-10" cy="-33" r="5" fill="#fbbf24" />
          <circle cx="-3" cy="-36" r="5.5" fill="#fbbf24" />
          <circle cx="5" cy="-35" r="5" fill="#fbbf24" />
          <circle cx="12" cy="-31" r="4.5" fill="#fbbf24" />

          {/* Giant Comic Action Badge */}
          <g transform="translate(0, -56)" className="animate-comic-badge" filter="url(#comic-badge-shadow)">
            <rect x="-46" y="-14" width="92" height="28" rx="10" fill="#020617" stroke="#fbbf24" strokeWidth="2.5" />
            <text
              x="0"
              y="6"
              textAnchor="middle"
              fill="#fbbf24"
              fontFamily="Impact, sans-serif"
              fontSize="16"
              fontWeight="900"
              letterSpacing="2.5"
            >
              CRASH!
            </text>
          </g>
        </g>
      )}

      {/* ============================================================== */}
      {/* 4. EXPLORADOR (EX) — WIDE SPEED CYCLONE */}
      {/* ============================================================== */}
      {attackerType === 'EX' && (
        <g transform={`translate(${sovereignPixel.x}, ${sovereignPixel.y}) scale(1.85)`} className="animate-comic-clash">
          {/* Contrast Dark Backdrop Halo */}
          <circle cx="0" cy="0" r="55" fill="#020617" opacity="0.75" />

          {/* Massive Cyclone Speed Arcs */}
          <path
            d="M -48 -20 A 52 52 0 0 1 48 -20"
            stroke="#ffffff"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
            filter="url(#comic-glow-lg)"
          />
          <path
            d="M 48 20 A 52 52 0 0 1 -48 20"
            stroke={colors.primary}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Wind Arrows / Darts */}
          <polygon points="48,-20 62,-24 54,-10" fill="#ffffff" />
          <polygon points="-48,20 -62,24 -54,10" fill={colors.secondary} />

          {/* Giant Comic Action Badge */}
          <g transform="translate(0, -50)" className="animate-comic-badge" filter="url(#comic-badge-shadow)">
            <rect x="-44" y="-14" width="88" height="28" rx="10" fill="#020617" stroke="#38bdf8" strokeWidth="2.5" />
            <text
              x="0"
              y="6"
              textAnchor="middle"
              fill="#38bdf8"
              fontFamily="Impact, sans-serif"
              fontSize="16"
              fontWeight="900"
              letterSpacing="2.5"
            >
              SWIFT!
            </text>
          </g>
        </g>
      )}

      {/* ============================================================== */}
      {/* 5. HECHICERO (HE) / NIGROMANTE (NI) / GENERIC ATTACK */}
      {/* ============================================================== */}
      {(attackerType === 'HE' || attackerType === 'NI' || attackerType === 'SO') && (
        <g transform={`translate(${midX}, ${midY}) scale(1.85)`} className="animate-comic-clash">
          {/* Contrast Dark Backdrop Halo */}
          <circle cx="0" cy="0" r="55" fill="#020617" opacity="0.75" />

          <circle cx="0" cy="0" r="46" fill="none" stroke={colors.primary} strokeWidth="4" strokeDasharray="8 6" />
          <polygon
            points="0,-36 10,-10 36,0 10,10 0,36 -10,10 -36,0 -10,-10"
            fill="#ffffff"
            stroke={colors.primary}
            strokeWidth="3.5"
            filter="url(#comic-glow-lg)"
          />

          {/* Giant Comic Action Badge */}
          <g transform="translate(0, -48)" className="animate-comic-badge" filter="url(#comic-badge-shadow)">
            <rect x="-44" y="-14" width="88" height="28" rx="10" fill="#020617" stroke={colors.primary} strokeWidth="2.5" />
            <text
              x="0"
              y="6"
              textAnchor="middle"
              fill="#ffffff"
              fontFamily="Impact, sans-serif"
              fontSize="15"
              fontWeight="900"
              letterSpacing="2.5"
            >
              {attackerType === 'HE' ? 'SPELL!' : attackerType === 'NI' ? 'DOOM!' : 'STRIKE!'}
            </text>
          </g>
        </g>
      )}

      {/* ============================================================== */}
      {/* PROMINENT HIGH-CONTRAST SIEGE ESCALATION BADGES (4/6, 5/6, 6/6) */}
      {/* ============================================================== */}
      {siegeCount >= 4 && (
        <g transform={`translate(${sovereignPixel.x}, ${sovereignPixel.y + 60}) scale(1.4)`} className="animate-comic-badge">
          {/* Prominent High-Contrast Pill with Shadow */}
          <rect
            x="-68"
            y="-16"
            width="136"
            height="32"
            rx="16"
            fill="#020617"
            stroke={siegeCount === 6 ? '#22c55e' : siegeCount === 5 ? '#ef4444' : '#f59e0b'}
            strokeWidth="3.5"
            filter="url(#comic-badge-shadow)"
          />
          <text
            x="0"
            y="6"
            textAnchor="middle"
            fill={siegeCount === 6 ? '#4ade80' : siegeCount === 5 ? '#f87171' : '#fbbf24'}
            fontFamily="Impact, sans-serif"
            fontSize="15"
            fontWeight="900"
            letterSpacing="1.5"
          >
            {siegeCount === 6
              ? '👑 ¡CONQUISTA!'
              : siegeCount === 5
              ? '⚠️ ¡CERCO 5/6!'
              : '⚡ ASEDIO 4/6'}
          </text>
        </g>
      )}
    </g>
  );
};
