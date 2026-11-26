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
  red: { primary: '#ef4444', secondary: '#fca5a5', glow: 'rgba(239, 68, 68, 0.7)' },
  blue: { primary: '#3b82f6', secondary: '#93c5fd', glow: 'rgba(59, 130, 246, 0.7)' },
  green: { primary: '#22c55e', secondary: '#86efac', glow: 'rgba(34, 197, 94, 0.7)' },
  amber: { primary: '#f59e0b', secondary: '#fde68a', glow: 'rgba(245, 158, 11, 0.7)' },
};

export const ComicClashOverlay: React.FC<ComicClashOverlayProps> = ({ clash, onAnimationEnd }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (clash) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onAnimationEnd) onAnimationEnd();
      }, 750);
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
        {/* Glow filters */}
        <filter id="comic-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ============================================================== */}
      {/* 1. CAZADOR (CZ) — CROSSED X-SWORD SLASH */}
      {/* ============================================================== */}
      {attackerType === 'CZ' && (
        <g transform={`translate(${midX}, ${midY})`}>
          {/* Comic Speed Lines */}
          <g opacity="0.8" className="animate-ping">
            <line x1="-50" y1="0" x2="-80" y2="0" stroke={colors.secondary} strokeWidth="3" strokeLinecap="round" />
            <line x1="50" y1="0" x2="80" y2="0" stroke={colors.secondary} strokeWidth="3" strokeLinecap="round" />
            <line x1="0" y1="-50" x2="0" y2="-80" stroke={colors.secondary} strokeWidth="3" strokeLinecap="round" />
            <line x1="0" y1="50" x2="0" y2="80" stroke={colors.secondary} strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* First Slash (Top-Left to Bottom-Right) */}
          <path
            d="M -55 -45 L 55 45"
            stroke="#ffffff"
            strokeWidth="7"
            strokeLinecap="round"
            filter="url(#comic-glow)"
            className="animate-pulse"
          />
          <path d="M -55 -45 L 55 45" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" />

          {/* Second Slash (Top-Right to Bottom-Left) */}
          <path
            d="M 55 -45 L -55 45"
            stroke="#ffffff"
            strokeWidth="7"
            strokeLinecap="round"
            filter="url(#comic-glow)"
            className="animate-pulse"
          />
          <path d="M 55 -45 L -55 45" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" />

          {/* Central Comic Impact Star */}
          <polygon
            points="0,-22 6,-6 22,0 6,6 0,22 -6,6 -22,0 -6,-6"
            fill="#ffffff"
            stroke="#f59e0b"
            strokeWidth="2"
            filter="url(#comic-glow)"
          />

          {/* Comic Sound Badge */}
          <g transform="translate(0, -38)">
            <rect x="-36" y="-12" width="72" height="24" rx="8" fill="#020617" stroke="#f59e0b" strokeWidth="2" />
            <text
              x="0"
              y="5"
              textAnchor="middle"
              fill="#ffffff"
              fontFamily="Impact, sans-serif"
              fontSize="14"
              fontWeight="900"
              letterSpacing="2"
            >
              SLASH!
            </text>
          </g>
        </g>
      )}

      {/* ============================================================== */}
      {/* 2. BESTIA (BS) — 3 SAVAGE CLAW TEARS */}
      {/* ============================================================== */}
      {attackerType === 'BS' && (
        <g transform={`translate(${midX}, ${midY}) rotate(${angleDeg + 30})`}>
          {/* 3 Parallel Curved Claws */}
          {[-20, 0, 20].map((offset, i) => (
            <path
              key={i}
              d={`M ${offset - 35} -45 Q ${offset} 0 ${offset + 25} 45`}
              stroke="#ffffff"
              strokeWidth="6.5"
              strokeLinecap="round"
              fill="none"
              filter="url(#comic-glow)"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
          {[-20, 0, 20].map((offset, i) => (
            <path
              key={`inner-${i}`}
              d={`M ${offset - 35} -45 Q ${offset} 0 ${offset + 25} 45`}
              stroke={colors.primary}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          ))}

          {/* Scratch Splatter Particles */}
          <circle cx="28" cy="42" r="3" fill="#fbbf24" />
          <circle cx="-32" cy="-40" r="3.5" fill="#ffffff" />
          <circle cx="5" cy="5" r="4" fill={colors.secondary} />

          {/* Comic Sound Badge */}
          <g transform="translate(0, -42)">
            <rect x="-34" y="-12" width="68" height="24" rx="8" fill="#020617" stroke="#ef4444" strokeWidth="2" />
            <text
              x="0"
              y="5"
              textAnchor="middle"
              fill="#ffffff"
              fontFamily="Impact, sans-serif"
              fontSize="14"
              fontWeight="900"
              letterSpacing="2"
            >
              CLAW!
            </text>
          </g>
        </g>
      )}

      {/* ============================================================== */}
      {/* 3. GIGANTE (GI) — TITAN STOMP & SHOCKWAVE */}
      {/* ============================================================== */}
      {attackerType === 'GI' && (
        <g transform={`translate(${sovereignPixel.x}, ${sovereignPixel.y})`}>
          {/* Expanding Shockwave Rings */}
          <circle cx="0" cy="0" r="48" fill="none" stroke={colors.primary} strokeWidth="4" strokeDasharray="8 6" opacity="0.8" />
          <circle cx="0" cy="0" r="32" fill={colors.glow} opacity="0.35" />

          {/* Comic Ground Cracks (Polygonal) */}
          <path d="M 0 0 L -30 -25 L -45 -22" stroke="#ffffff" strokeWidth="2.5" fill="none" />
          <path d="M 0 0 L 32 -20 L 46 -15" stroke="#ffffff" strokeWidth="2.5" fill="none" />
          <path d="M 0 0 L -25 30 L -35 45" stroke="#ffffff" strokeWidth="2.5" fill="none" />
          <path d="M 0 0 L 28 26 L 40 40" stroke="#ffffff" strokeWidth="2.5" fill="none" />

          {/* Giant Footprint Silhouette */}
          <ellipse cx="0" cy="-2" rx="16" ry="24" fill="#020617" stroke="#fbbf24" strokeWidth="3" />
          <circle cx="-8" cy="-28" r="4" fill="#fbbf24" />
          <circle cx="-2" cy="-30" r="4.5" fill="#fbbf24" />
          <circle cx="4" cy="-29" r="4" fill="#fbbf24" />
          <circle cx="10" cy="-26" r="3.5" fill="#fbbf24" />

          {/* Comic Sound Badge */}
          <g transform="translate(0, -48)">
            <rect x="-38" y="-12" width="76" height="24" rx="8" fill="#020617" stroke="#fbbf24" strokeWidth="2" />
            <text
              x="0"
              y="5"
              textAnchor="middle"
              fill="#fbbf24"
              fontFamily="Impact, sans-serif"
              fontSize="14"
              fontWeight="900"
              letterSpacing="2"
            >
              CRASH!
            </text>
          </g>
        </g>
      )}

      {/* ============================================================== */}
      {/* 4. EXPLORADOR (EX) — SPEED CYCLONE */}
      {/* ============================================================== */}
      {attackerType === 'EX' && (
        <g transform={`translate(${sovereignPixel.x}, ${sovereignPixel.y})`}>
          {/* Cyclone Speed Arcs */}
          <path
            d="M -38 -15 A 40 40 0 0 1 38 -15"
            stroke="#ffffff"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            filter="url(#comic-glow)"
          />
          <path
            d="M 38 15 A 40 40 0 0 1 -38 15"
            stroke={colors.primary}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />

          {/* Wind Darts */}
          <polygon points="38,-15 48,-18 42,-8" fill="#ffffff" />
          <polygon points="-38,15 -48,18 -42,8" fill={colors.secondary} />

          {/* Comic Sound Badge */}
          <g transform="translate(0, -44)">
            <rect x="-35" y="-12" width="70" height="24" rx="8" fill="#020617" stroke="#38bdf8" strokeWidth="2" />
            <text
              x="0"
              y="5"
              textAnchor="middle"
              fill="#38bdf8"
              fontFamily="Impact, sans-serif"
              fontSize="14"
              fontWeight="900"
              letterSpacing="2"
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
        <g transform={`translate(${midX}, ${midY})`}>
          <circle cx="0" cy="0" r="38" fill="none" stroke={colors.primary} strokeWidth="3" strokeDasharray="6 4" />
          <polygon
            points="0,-28 8,-8 28,0 8,8 0,28 -8,8 -28,0 -8,-8"
            fill="#ffffff"
            stroke={colors.primary}
            strokeWidth="2.5"
            filter="url(#comic-glow)"
          />
          <g transform="translate(0, -40)">
            <rect x="-34" y="-12" width="68" height="24" rx="8" fill="#020617" stroke={colors.primary} strokeWidth="2" />
            <text
              x="0"
              y="5"
              textAnchor="middle"
              fill="#ffffff"
              fontFamily="Impact, sans-serif"
              fontSize="13"
              fontWeight="900"
              letterSpacing="2"
            >
              {attackerType === 'HE' ? 'SPELL!' : attackerType === 'NI' ? 'DOOM!' : 'STRIKE!'}
            </text>
          </g>
        </g>
      )}

      {/* ============================================================== */}
      {/* DRAMATIC SIEGE ESCALATION BADGES (4/6, 5/6, 6/6) */}
      {/* ============================================================== */}
      {siegeCount >= 4 && (
        <g transform={`translate(${sovereignPixel.x}, ${sovereignPixel.y + 45})`}>
          {/* Dramatic Background Pill */}
          <rect
            x="-55"
            y="-14"
            width="110"
            height="28"
            rx="14"
            fill="#020617"
            stroke={siegeCount === 6 ? '#22c55e' : siegeCount === 5 ? '#ef4444' : '#f59e0b'}
            strokeWidth="2.5"
            filter="url(#comic-glow)"
          />
          <text
            x="0"
            y="5"
            textAnchor="middle"
            fill={siegeCount === 6 ? '#4ade80' : siegeCount === 5 ? '#f87171' : '#fbbf24'}
            fontFamily="Impact, sans-serif"
            fontSize="13"
            fontWeight="900"
            letterSpacing="1"
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
