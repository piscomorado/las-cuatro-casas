import React, { useEffect, useState } from 'react';
import { PieceType, House } from '@lcch/engine';
import { CAZADOR_SPRITESHEET_B64 } from '../assets/vfx/cazador_b64';

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

const TOTAL_FRAMES = 12;
const FRAME_RENDER_SIZE = 130; // Proportional to hex tile diameter (~84px) for retina crispness
const HALF_SIZE = FRAME_RENDER_SIZE / 2;

/**
 * 100% Reliable Embedded Spritesheet VFX Overlay.
 * Uses inlined Base64 data URI to completely eliminate network latency,
 * aborted requests (ERR_ABORTED), and browser "broken image" fallback icons.
 */
export const ComicClashOverlay: React.FC<ComicClashOverlayProps> = ({ clash, onAnimationEnd }) => {
  const [visible, setVisible] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);

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
      if (cur < TOTAL_FRAMES - 1) {
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

  const { attackerType, toPixel, sovereignPixel } = clash;

  // Position calculation
  const targetX = sovereignPixel ? sovereignPixel.x : toPixel.x;
  const targetY = sovereignPixel ? sovereignPixel.y : toPixel.y;
  const midX = (toPixel.x + targetX) / 2;
  const midY = (toPixel.y + targetY) / 2;

  return (
    <g key={clash.id} pointerEvents="none" className="select-none z-50">
      <defs>
        <clipPath id="cazador-frame-clip">
          <rect
            x={-HALF_SIZE}
            y={-HALF_SIZE}
            width={FRAME_RENDER_SIZE}
            height={FRAME_RENDER_SIZE}
          />
        </clipPath>
      </defs>

      {attackerType === 'CZ' && (
        <g transform={`translate(${midX}, ${midY})`}>
          <g clipPath="url(#cazador-frame-clip)">
            {/* 
              Single Embedded Spritesheet:
              Zero network requests, zero broken image icons, zero neighbor leakage!
            */}
            <image
              href={CAZADOR_SPRITESHEET_B64}
              xlinkHref={CAZADOR_SPRITESHEET_B64}
              x={-HALF_SIZE - frameIndex * FRAME_RENDER_SIZE}
              y={-HALF_SIZE}
              width={FRAME_RENDER_SIZE * TOTAL_FRAMES}
              height={FRAME_RENDER_SIZE}
              preserveAspectRatio="none"
              style={{
                opacity: 1,
              }}
            />
          </g>
        </g>
      )}
    </g>
  );
};
