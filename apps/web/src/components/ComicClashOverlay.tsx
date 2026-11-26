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

    // Dynamic frame timings with SLOW-MOTION HITSTOP on the central climax frames:
    // Frame 0: 50ms (instant spark charge)
    // Frame 1: 55ms (golden velocity crescent)
    // Frame 2: 65ms (dual crossing arcs)
    // Frame 3: 300ms (SLOWMOTION CLIMAX 1: 4-pointed Golden Cross-Star with kinetic jitter)
    // Frame 4: 240ms (SLOWMOTION CLIMAX 2: Shattered Diamond Burst with shockwave ring)
    // Frame 5: 70ms (dispersing directional shards)
    // Frame 6: 60ms (trailing diamond specks)
    // Frame 7: 55ms (dissolving final sparks)
    const frameDurations = [50, 55, 65, 300, 240, 70, 60, 55];
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
        }, 80);
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

  // Climax hit visual slow-motion freeze state
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
      {/* 1. CAZADOR (CZ) — CLEAN STYLIZED VECTOR SPRITE WITH HITSTOP    */}
      {/* ============================================================== */}
      {attackerType === 'CZ' && (
        <g transform={`translate(${midX}, ${midY})`}>
          {/* Crisp expanding shockwave ring during slow-motion impact */}
          {isClimaxHit && (
            <g pointerEvents="none">
              <circle
                cx="0"
                cy="0"
                r="85"
                fill="none"
                stroke={colors.primary}
                strokeWidth="4"
                className="animate-shockwave"
              />
              <circle
                cx="0"
                cy="0"
                r="45"
                fill="#ffffff"
                opacity="0.3"
                filter="url(#cazador-hit-glow)"
              />
            </g>
          )}

          {/* Current animated frame with micro-jitter during slow-motion */}
          <g className={isClimaxHit ? 'animate-hitstop-jitter' : ''}>
            <image
              href={CAZADOR_FRAMES[frameIndex]}
              xlinkHref={CAZADOR_FRAMES[frameIndex]}
              x="-150"
              y="-150"
              width="300"
              height="300"
              preserveAspectRatio="xMidYMid meet"
              style={{
                filter: isClimaxHit
                  ? `drop-shadow(0 0 18px ${colors.glow}) drop-shadow(0 0 8px #ffffff)`
                  : `drop-shadow(0 0 10px ${colors.glow})`,
                transform: `scale(${isClimaxHit ? 1.08 : 1.0})`,
                transition: 'transform 0.04s ease-out',
              }}
            />
          </g>
        </g>
      )}
    </g>
  );
};
