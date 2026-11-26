import React, { useEffect, useState } from 'react';
import { PieceType, House } from '@lcch/engine';

import frame0 from '../assets/vfx/cazador_frames/frame_0.png';
import frame1 from '../assets/vfx/cazador_frames/frame_1.png';
import frame2 from '../assets/vfx/cazador_frames/frame_2.png';
import frame3 from '../assets/vfx/cazador_frames/frame_3.png';
import frame4 from '../assets/vfx/cazador_frames/frame_4.png';
import frame5 from '../assets/vfx/cazador_frames/frame_5.png';
import frame6 from '../assets/vfx/cazador_frames/frame_6.png';
import frame7 from '../assets/vfx/cazador_frames/frame_7.png';

const CAZADOR_FRAMES = [frame0, frame1, frame2, frame3, frame4, frame5, frame6, frame7];

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
 * Animated Spritesheet VFX Overlay for Savage Gods.
 * Plays sequential high-speed anime-style keyframes (Anticipation -> Climax Hitstop -> Dissipation).
 * Completely decoupled from game engine rules.
 */
export const ComicClashOverlay: React.FC<ComicClashOverlayProps> = ({ clash, onAnimationEnd }) => {
  const [visible, setVisible] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);

  // Preload all frames on mount for immediate playback
  useEffect(() => {
    CAZADOR_FRAMES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    if (!clash) {
      setVisible(false);
      return;
    }

    setVisible(true);
    setFrameIndex(0);

    // Dynamic frame timings for punchy anime hitstop rhythm (ms per frame)
    // Frame 0-1: Instant swift windup (40ms, 45ms)
    // Frame 2: Slash cross (55ms)
    // Frame 3: CLIMAX HITSTOP - explosive X starburst holds momentarily (90ms)
    // Frame 4: Shockwave ring expansion (75ms)
    // Frame 5-7: Dissipation and fading embers (60ms, 55ms, 50ms)
    const frameDurations = [40, 45, 55, 90, 75, 60, 55, 50];
    let cur = 0;
    let timerId: any;

    const advanceFrame = () => {
      if (cur < CAZADOR_FRAMES.length - 1) {
        cur++;
        setFrameIndex(cur);
        timerId = setTimeout(advanceFrame, frameDurations[cur]);
      } else {
        timerId = setTimeout(() => {
          setVisible(false);
          if (onAnimationEnd) onAnimationEnd();
        }, 100);
      }
    };

    timerId = setTimeout(advanceFrame, frameDurations[0]);

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [clash?.id]);

  if (!clash || !visible) return null;

  const { attackerType, attackerHouse, toPixel, sovereignPixel } = clash;
  const colors = HOUSE_COLORS[attackerHouse] || HOUSE_COLORS.red;

  // Safe position calculations
  const targetX = sovereignPixel ? sovereignPixel.x : toPixel.x;
  const targetY = sovereignPixel ? sovereignPixel.y : toPixel.y;
  const midX = (toPixel.x + targetX) / 2;
  const midY = (toPixel.y + targetY) / 2;

  // Climax hit visual flash
  const isClimaxHit = frameIndex === 3 || frameIndex === 4;

  return (
    <g key={clash.id} pointerEvents="none" className="select-none z-50">
      <defs>
        <filter id="cazador-hit-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ============================================================== */}
      {/* 1. CAZADOR (CZ) — SEQUENTIAL ANIME SPRITE ANIMATION            */}
      {/* ============================================================== */}
      {attackerType === 'CZ' && (
        <g transform={`translate(${midX}, ${midY})`}>
          {/* Radiant energy aura pulse behind the slash during climax */}
          {isClimaxHit && (
            <circle
              cx="0"
              cy="0"
              r="130"
              fill={colors.glow}
              opacity="0.35"
              filter="url(#cazador-hit-glow)"
              className="animate-ping"
            />
          )}

          {/* Current animated frame from spritesheet */}
          <image
            href={CAZADOR_FRAMES[frameIndex]}
            xlinkHref={CAZADOR_FRAMES[frameIndex]}
            x="-170"
            y="-170"
            width="340"
            height="340"
            preserveAspectRatio="xMidYMid meet"
            style={{
              filter: `drop-shadow(0 0 ${isClimaxHit ? '30px' : '15px'} ${colors.glow})`,
              transform: `scale(${isClimaxHit ? 1.08 : 1.0})`,
              transition: 'transform 0.05s ease-out',
            }}
          />
        </g>
      )}
    </g>
  );
};
