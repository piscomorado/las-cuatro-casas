import React, { useEffect, useState } from 'react';
import { PieceType, House } from '@lcch/engine';
import { CAZADOR_SPRITESHEET_B64 } from '../assets/vfx/cazador_b64';
import { EXPLORADOR_SPRITESHEET_B64 } from '../assets/vfx/explorador_b64';

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
const FRAME_RENDER_SIZE = 195; // Calibrated to reach halfway into surrounding adjacent hexes
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

  const { attackerType, fromPixel, toPixel, sovereignPixel } = clash;

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
        <clipPath id="explorador-frame-clip">
          <rect
            x={-HALF_SIZE}
            y={-HALF_SIZE}
            width={FRAME_RENDER_SIZE}
            height={FRAME_RENDER_SIZE}
          />
        </clipPath>
      </defs>

      {/* 1. Kinetic Streaks between Origin and Destination (Frames 0-3) */}
      {attackerType === 'CZ' && fromPixel && frameIndex < 4 && (
        <line
          x1={fromPixel.x}
          y1={fromPixel.y}
          x2={midX}
          y2={midY}
          stroke="#f59e0b"
          strokeWidth="3"
          strokeDasharray="16 8"
          strokeLinecap="round"
          opacity={frameIndex === 0 ? 0.85 : 0.45}
        />
      )}
      {attackerType === 'EX' && fromPixel && frameIndex < 4 && (
        <g>
          <line
            x1={fromPixel.x}
            y1={fromPixel.y}
            x2={midX}
            y2={midY}
            stroke="#fbbf24"
            strokeWidth="3.5"
            strokeDasharray="12 6"
            strokeLinecap="round"
            opacity={frameIndex === 0 ? 0.9 : 0.5}
          />
          <line
            x1={fromPixel.x}
            y1={fromPixel.y}
            x2={midX}
            y2={midY}
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            strokeLinecap="round"
            opacity={0.65}
          />
        </g>
      )}

      {/* 2. Expanding Geometric Impact Ring during Climax (Frames 6-7) */}
      {(attackerType === 'CZ' || attackerType === 'EX') && (frameIndex === 6 || frameIndex === 7) && (
        <g transform={`translate(${midX}, ${midY})`}>
          <circle
            cx="0"
            cy="0"
            r={frameIndex === 6 ? 72 : 96}
            fill="none"
            stroke={attackerType === 'EX' ? '#fde047' : '#fbbf24'}
            strokeWidth="2.5"
            opacity={frameIndex === 6 ? 0.75 : 0.35}
          />
        </g>
      )}

      {/* 3. Harmonized Bronze & Gold 12-Frame Animation for Cazador */}
      {attackerType === 'CZ' && (
        <g transform={`translate(${midX}, ${midY})`}>
          <g clipPath="url(#cazador-frame-clip)">
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

      {/* 4. Harmonized Gold & Feather 12-Frame Zephyr Cyclone for Explorador */}
      {attackerType === 'EX' && (
        <g transform={`translate(${midX}, ${midY})`}>
          <g clipPath="url(#explorador-frame-clip)">
            <image
              href={EXPLORADOR_SPRITESHEET_B64}
              xlinkHref={EXPLORADOR_SPRITESHEET_B64}
              x={-HALF_SIZE - frameIndex * FRAME_RENDER_SIZE}
              y={-HALF_SIZE}
              width={FRAME_RENDER_SIZE * TOTAL_FRAMES}
              height={FRAME_RENDER_SIZE}
              style={{
                opacity: 1,
                imageRendering: 'auto',
                filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.4))',
              }}
            />
          </g>
        </g>
      )}

      {/* 5. Kinetic Shockwave for other piece types awaiting their custom 12-frame strips */}
      {attackerType !== 'CZ' && attackerType !== 'EX' && (
        <g transform={`translate(${midX}, ${midY})`}>
          <circle cx="0" cy="0" r="48" fill="#020617" opacity="0.65" />
          <circle
            cx="0"
            cy="0"
            r={frameIndex < 6 ? 32 + frameIndex * 6 : 72}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            opacity={frameIndex < 8 ? 0.85 : 0.3}
          />
        </g>
      )}
    </g>
  );
};
