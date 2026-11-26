import React, { useEffect, useState } from 'react';
import { PieceType, House } from '@lcch/engine';

const cazadorSlashImg = '/assets/vfx/cazador_slash.png';

export interface ComicClashEvent {
  id: string;
  attackerType: PieceType;
  attackerHouse: House;
  targetHouse?: House;
  fromPixel?: { x: number; y: number };
  toPixel: { x: number; y: number };
  sovereignPixel?: { x: number; y: number };
  siegeCount?: number; // 1 to 6
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
 * Renders high-impact illustrations (starting with the Cazador energy X-slash)
 * with native alpha transparency, dynamic drop shadows, and cinematic scale transitions.
 * Previous simple vector animations have been cleaned up as requested.
 */
export const ComicClashOverlay: React.FC<ComicClashOverlayProps> = ({ clash, onAnimationEnd }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (clash) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onAnimationEnd) onAnimationEnd();
      }, 2200);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [clash?.id]);

  if (!clash || !visible) return null;

  const { attackerType, attackerHouse, toPixel, sovereignPixel } = clash;
  const colors = HOUSE_COLORS[attackerHouse] || HOUSE_COLORS.red;

  // Safe position calculations (never NaN)
  const targetX = sovereignPixel ? sovereignPixel.x : toPixel.x;
  const targetY = sovereignPixel ? sovereignPixel.y : toPixel.y;
  const midX = (toPixel.x + targetX) / 2;
  const midY = (toPixel.y + targetY) / 2;

  return (
    <g key={clash.id} pointerEvents="none" className="select-none z-50">
      <defs>
        {/* Glow filter for energy burst */}
        <filter id="cazador-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ============================================================== */}
      {/* 1. CAZADOR (CZ) — ULTRA-HD CINEMATIC ENERGY X-SLASH VFX        */}
      {/* Clean PNG with native alpha transparency                       */}
      {/* ============================================================== */}
      {attackerType === 'CZ' && (
        <g transform={`translate(${midX}, ${midY})`} className="animate-comic-clash">
          {/* Subtle house color radiant aura behind the slash */}
          <circle cx="0" cy="0" r="140" fill={colors.glow} opacity="0.25" filter="url(#cazador-glow)" />

          <image
            href={cazadorSlashImg}
            xlinkHref={cazadorSlashImg}
            x="-200"
            y="-200"
            width="400"
            height="400"
            preserveAspectRatio="xMidYMid meet"
            style={{
              filter: `drop-shadow(0 0 25px ${colors.glow})`,
            }}
          />
        </g>
      )}
    </g>
  );
};
