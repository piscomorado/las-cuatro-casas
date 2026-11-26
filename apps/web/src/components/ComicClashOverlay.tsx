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
import frame8 from '../assets/vfx/cazador_frames/frame_8.png';
import frame9 from '../assets/vfx/cazador_frames/frame_9.png';
import frame10 from '../assets/vfx/cazador_frames/frame_10.png';
import frame11 from '../assets/vfx/cazador_frames/frame_11.png';

const CAZADOR_FRAMES = [
  frame0, frame1, frame2, frame3, frame4, frame5,
  frame6, frame7, frame8, frame9, frame10, frame11,
];

export interface ComicClashEvent {
  id: string;
  attackerType: PieceType;
  attackerHouse: House;
  targetHouse?: House;
  fromPixel?: { x: number; y: number };
  toPixel: { x: number; y: number };
  sovereignPixel?: { x: number; y: number };
  siegeCount?: number;
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
 * Clean 12-Frame Dark Geometric VFX Overlay for Savage Gods.
 * Plays 12 cleanly separated, zero-leakage progressive keyframes.
 * Climax slow-motion flows through frames 6 -> 7 -> 8 naturally.
 */
export const ComicClashOverlay: React.FC<ComicClashOverlayProps> = ({ clash, onAnimationEnd }) => {
  const [visible, setVisible] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);

  // Preload all 12 frames
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

    // Natural 12-Frame Rhythm:
    // Frames 0-5 (Windup & Crossing): 40ms, 45ms, 50ms, 50ms, 55ms, 60ms
    // Frames 6-8 (Climax Impact Slow-Motion):
    //   - Frame 6 (Star Ignition): 180ms
    //   - Frame 7 (Peak Obsidian Starburst): 260ms
    //   - Frame 8 (Shattered Diamond Spread): 140ms
    // Frames 9-11 (Dissipation): 65ms, 60ms, 55ms
    const frameDurations = [40, 45, 50, 50, 55, 60, 180, 260, 140, 65, 60, 55];
    let cur = 0;
    let timerId: any;

    const advance = () => {
      if (cur < CAZADOR_FRAMES.length - 1) {
        cur++;
        setFrameIndex(cur);
        timerId = setTimeout(advance, frameDurations[cur]);
      } else {
        timerId = setTimeout(() => {
          setVisible(false);
          if (onAnimationEnd) onAnimationEnd();
        }, 60);
      }
    };

    timerId = setTimeout(advance, frameDurations[0]);

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [clash?.id]);

  if (!clash || !visible) return null;

  const { attackerType, attackerHouse, toPixel, sovereignPixel } = clash;
  const colors = HOUSE_COLORS[attackerHouse] || HOUSE_COLORS.amber;

  // Position calculation
  const targetX = sovereignPixel ? sovereignPixel.x : toPixel.x;
  const targetY = sovereignPixel ? sovereignPixel.y : toPixel.y;
  const midX = (toPixel.x + targetX) / 2;
  const midY = (toPixel.y + targetY) / 2;

  // Climax state (Frames 6, 7, 8)
  const isClimax = frameIndex >= 6 && frameIndex <= 8;

  return (
    <g key={clash.id} pointerEvents="none" className="select-none z-50">
      {attackerType === 'CZ' && (
        <g transform={`translate(${midX}, ${midY})`}>
          <image
            href={CAZADOR_FRAMES[frameIndex]}
            xlinkHref={CAZADOR_FRAMES[frameIndex]}
            x="-150"
            y="-150"
            width="300"
            height="300"
            preserveAspectRatio="xMidYMid meet"
            style={{
              filter: isClimax
                ? `drop-shadow(0 0 16px ${colors.glow}) drop-shadow(0 0 6px #ffffff)`
                : `drop-shadow(0 0 8px rgba(245, 158, 11, 0.45))`,
              transform: `scale(${isClimax ? 1.06 : 1.0})`,
              transition: 'transform 0.05s ease-out',
            }}
          />
        </g>
      )}
    </g>
  );
};
