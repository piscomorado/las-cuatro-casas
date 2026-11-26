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
    // Frame 0: 45ms (instant spark charge)
    // Frame 1: 50ms (cyan curve velocity)
    // Frame 2: 60ms (crossing dual arcs)
    // Frame 3: 320ms (SLOWMOTION FREEZE 1: Explosive Starburst X with intense jitter & radiant aura)
    // Frame 4: 260ms (SLOWMOTION FREEZE 2: Circular Shockwave X with seismic ring & vibration)
    // Frame 5: 75ms (residual vortex dispersing)
    // Frame 6: 65ms (expanding shards)
    // Frame 7: 60ms (dissolving embers)
    const frameDurations = [45, 50, 60, 320, 260, 75, 65, 60];
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

  // Climax hit visual slow-motion freeze state
  const isClimaxHit = frameIndex === 3 || frameIndex === 4;

  return (
    <g key={clash.id} pointerEvents="none" className="select-none z-50">
      <defs>
        <filter id="cazador-hit-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ============================================================== */}
      {/* 1. CAZADOR (CZ) — SEQUENTIAL ANIME SPRITE WITH SLOW-MO HITSTOP */}
      {/* ============================================================== */}
      {attackerType === 'CZ' && (
        <g transform={`translate(${midX}, ${midY})`}>
          {/* Intense Slow-Motion Lighting Effects during Climax */}
          {isClimaxHit && (
            <g pointerEvents="none">
              {/* Expanding Shockwave Ring */}
              <circle
                cx="0"
                cy="0"
                r="95"
                fill="none"
                stroke={colors.primary}
                strokeWidth="5"
                className="animate-shockwave"
              />

              {/* Radiant White Hot Core */}
              <circle
                cx="0"
                cy="0"
                r="70"
                fill="#ffffff"
                opacity="0.55"
                filter="url(#cazador-hit-glow)"
              />

              {/* House Luminous Radiant Flare */}
              <circle
                cx="0"
                cy="0"
                r="150"
                fill={colors.glow}
                opacity="0.4"
                filter="url(#cazador-hit-glow)"
              />
            </g>
          )}

          {/* Current animated frame with high-energy jitter vibration during slow-motion */}
          <g className={isClimaxHit ? 'animate-hitstop-jitter' : ''}>
            <image
              href={CAZADOR_FRAMES[frameIndex]}
              xlinkHref={CAZADOR_FRAMES[frameIndex]}
              x="-175"
              y="-175"
              width="350"
              height="350"
              preserveAspectRatio="xMidYMid meet"
              style={{
                filter: isClimaxHit
                  ? `drop-shadow(0 0 25px #ffffff) drop-shadow(0 0 45px ${colors.glow})`
                  : `drop-shadow(0 0 15px ${colors.glow})`,
                transform: `scale(${isClimaxHit ? 1.1 : 1.0})`,
                transition: 'transform 0.04s ease-out',
              }}
            />
          </g>
        </g>
      )}
    </g>
  );
};
