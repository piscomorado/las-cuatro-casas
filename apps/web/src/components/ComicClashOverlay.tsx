import React, { useEffect, useState } from 'react';
import { PieceType, House } from '@lcch/engine';
import { CAZADOR_SPRITESHEET_B64 } from '../assets/vfx/cazador_b64';
import { EXPLORADOR_SPRITESHEET_B64 } from '../assets/vfx/explorador_b64';
import { BESTIA_SPRITESHEET_B64 } from '../assets/vfx/bestia_b64';
import { GIGANTE_SPRITESHEET_B64 } from '../assets/vfx/gigante_b64';
import { HECHICERO_SPRITESHEET_B64 } from '../assets/vfx/hechicero_b64';
import { NIGROMANTE_SPRITESHEET_B64 } from '../assets/vfx/nigromante_b64';

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
const CAZADOR_FRAMES = 10;
const BESTIA_FRAMES = 9;
const FRAME_RENDER_SIZE = 195; // Calibrated to reach halfway into surrounding adjacent hexes
const HALF_SIZE = FRAME_RENDER_SIZE / 2;
const CAZADOR_RENDER_SIZE = 168; // Calibrated to cover piece and halfway into surrounding adjacent hexes
const CAZADOR_HALF_SIZE = CAZADOR_RENDER_SIZE / 2;
const BESTIA_RENDER_SIZE = 168; // Calibrated to cover piece and halfway into surrounding adjacent hexes
const BESTIA_HALF_SIZE = BESTIA_RENDER_SIZE / 2;
const GIGANTE_RENDER_SIZE = 285; // Colossal Runic Obsidian War Hammer presence
const GIGANTE_HALF_SIZE = GIGANTE_RENDER_SIZE / 2;
const HECHICERO_RENDER_SIZE = 275; // Astral Mirror & Runic Prism Cage presence
const HECHICERO_HALF_SIZE = HECHICERO_RENDER_SIZE / 2;
const NIGROMANTE_RENDER_SIZE = 280; // Ceremonial Jade Skull & Soulfire Vortex presence
const NIGROMANTE_HALF_SIZE = NIGROMANTE_RENDER_SIZE / 2;

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

    // Natural rhythm with dedicated slow-motion holds for each piece type:
    const isCazador = clash.attackerType === 'CZ';
    const isBestia = clash.attackerType === 'BS';
    const isGigante = clash.attackerType === 'GI';
    const isHechicero = clash.attackerType === 'HE';
    const isNigromante = clash.attackerType === 'NI';
    const frameDurations = isCazador
      ? [60, 60, 70, 50, 50, 280, 140, 110, 90, 80] // Frame 6 (idx 5) is the downward X-slash ground impact with slow-mo hold!
      : isBestia
      ? [50, 50, 60, 60, 360, 320, 140, 110, 90] // Frame 5 (idx 4) is the rearing beast aerial hold with huge emphasis, Frame 6 (idx 5) is the impact slam!
      : isGigante
      ? [100, 120, 130, 100, 90, 120, 340, 260, 160, 100, 80, 70]
      : isHechicero
      ? [70, 80, 85, 95, 100, 120, 480, 140, 120, 90, 75, 65] // Frame 7 (idx 6) peak halo & crystal cage hold
      : isNigromante
      ? [70, 80, 85, 95, 100, 120, 500, 140, 120, 90, 75, 65] // Frame 7 (idx 6) peak vortex & spiked star seal hold
      : [40, 45, 50, 50, 55, 60, 180, 260, 140, 65, 60, 55];
    let cur = 0;
    let timerId: any;

    const advance = () => {
      const maxFrames = isCazador ? CAZADOR_FRAMES : isBestia ? BESTIA_FRAMES : TOTAL_FRAMES;
      if (cur < maxFrames - 1) {
        cur++;
        setFrameIndex(cur);
        timerId = setTimeout(advance, frameDurations[cur] ?? 70);
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
            x={-CAZADOR_HALF_SIZE}
            y={-CAZADOR_HALF_SIZE}
            width={CAZADOR_RENDER_SIZE}
            height={CAZADOR_RENDER_SIZE}
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
        <clipPath id="bestia-frame-clip">
          <rect
            x={-BESTIA_HALF_SIZE}
            y={-BESTIA_HALF_SIZE}
            width={BESTIA_RENDER_SIZE}
            height={BESTIA_RENDER_SIZE}
          />
        </clipPath>
        <clipPath id="gigante-frame-clip">
          <rect
            x={-GIGANTE_HALF_SIZE}
            y={-GIGANTE_HALF_SIZE}
            width={GIGANTE_RENDER_SIZE}
            height={GIGANTE_RENDER_SIZE}
          />
        </clipPath>
        <clipPath id="hechicero-frame-clip">
          <rect
            x={-HECHICERO_HALF_SIZE}
            y={-HECHICERO_HALF_SIZE}
            width={HECHICERO_RENDER_SIZE}
            height={HECHICERO_RENDER_SIZE}
          />
        </clipPath>
        <clipPath id="nigromante-frame-clip">
          <rect
            x={-NIGROMANTE_HALF_SIZE}
            y={-NIGROMANTE_HALF_SIZE}
            width={NIGROMANTE_RENDER_SIZE}
            height={NIGROMANTE_RENDER_SIZE}
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

      {/* 2. Expanding Geometric Impact Ring during Climax (Frames 6-7) for Explorador */}
      {attackerType === 'EX' && (frameIndex === 6 || frameIndex === 7) && (
        <g transform={`translate(${midX}, ${midY})`}>
          <circle
            cx="0"
            cy="0"
            r={frameIndex === 6 ? 72 : 96}
            fill="none"
            stroke="#fde047"
            strokeWidth="2.5"
            opacity={frameIndex === 6 ? 0.75 : 0.35}
          />
        </g>
      )}

      {/* 3. 2D Action Assassin Strike for Cazador (CZ) */}
      {attackerType === 'CZ' && (
        <g transform={`translate(${midX}, ${midY})`}>
          {/* Subtle Sapphire Ground Ring on Climax Slam (Frames 5-6) */}
          {(frameIndex === 5 || frameIndex === 6) && (
            <g>
              <ellipse
                cx="0"
                cy="48"
                rx={frameIndex === 5 ? 54 : 38}
                ry={frameIndex === 5 ? 20 : 14}
                fill="none"
                stroke="#38bdf8"
                strokeWidth={frameIndex === 5 ? '3' : '2'}
                opacity={frameIndex === 5 ? 0.95 : 0.6}
              />
              <circle
                cx="0"
                cy="48"
                r={frameIndex === 5 ? 32 : 22}
                fill="none"
                stroke="#fbbf24"
                strokeWidth={frameIndex === 5 ? '2' : '1.5'}
                opacity={frameIndex === 5 ? 0.85 : 0.5}
              />
            </g>
          )}
          <g clipPath="url(#cazador-frame-clip)">
            <image
              href={CAZADOR_SPRITESHEET_B64}
              xlinkHref={CAZADOR_SPRITESHEET_B64}
              x={-CAZADOR_HALF_SIZE - frameIndex * CAZADOR_RENDER_SIZE}
              y={-CAZADOR_HALF_SIZE}
              width={CAZADOR_RENDER_SIZE * CAZADOR_FRAMES}
              height={CAZADOR_RENDER_SIZE}
              style={{
                opacity: 1,
                imageRendering: 'auto',
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

      {/* 5. 2D Action Predatory Beast Strike for Bestia Saltadora (BS) */}
      {attackerType === 'BS' && (
        <g transform={`translate(${midX}, ${midY})`}>
          {/* Luminous Crimson & Gold Ground Shockwave on Climax Slam (Frames 5-6) */}
          {(frameIndex === 4 || frameIndex === 5) && (
            <g>
              <ellipse
                cx="0"
                cy="52"
                rx={frameIndex === 5 ? 56 : 38}
                ry={frameIndex === 5 ? 20 : 14}
                fill="none"
                stroke="#ef4444"
                strokeWidth={frameIndex === 5 ? '3' : '2'}
                opacity={frameIndex === 5 ? 0.95 : 0.6}
              />
              <circle
                cx="0"
                cy="52"
                r={frameIndex === 5 ? 32 : 22}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={frameIndex === 5 ? '2' : '1.5'}
                opacity={frameIndex === 5 ? 0.85 : 0.5}
              />
            </g>
          )}
          <g clipPath="url(#bestia-frame-clip)">
            <image
              href={BESTIA_SPRITESHEET_B64}
              xlinkHref={BESTIA_SPRITESHEET_B64}
              x={-BESTIA_HALF_SIZE - frameIndex * BESTIA_RENDER_SIZE}
              y={-BESTIA_HALF_SIZE}
              width={BESTIA_RENDER_SIZE * BESTIA_FRAMES}
              height={BESTIA_RENDER_SIZE}
              style={{
                opacity: 1,
                imageRendering: 'auto',
              }}
            />
          </g>
        </g>
      )}

      {/* 6. Colossal Runic Obsidian War Hammer Slam for Gigante (GI) */}
      {attackerType === 'GI' && (
        <g transform={`translate(${midX}, ${midY})`}>
          {/* Luminous Golden Ground Shockwave Rings on Climax (Frames 6-7) - Centered at ground impact, zero dark shadows */}
          {(frameIndex === 6 || frameIndex === 7) && (
            <g>
              <ellipse
                cx="0"
                cy="62"
                rx={frameIndex === 6 ? 82 : 112}
                ry={frameIndex === 6 ? 34 : 46}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={frameIndex === 6 ? '3.5' : '2'}
                opacity={frameIndex === 6 ? 0.9 : 0.5}
                filter="drop-shadow(0 0 16px rgba(245, 158, 11, 0.95))"
              />
              <circle
                cx="0"
                cy="62"
                r={frameIndex === 6 ? 48 : 74}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
                opacity={frameIndex === 6 ? 0.8 : 0.4}
              />
            </g>
          )}
          <g clipPath="url(#gigante-frame-clip)">
            <image
              href={GIGANTE_SPRITESHEET_B64}
              xlinkHref={GIGANTE_SPRITESHEET_B64}
              x={-GIGANTE_HALF_SIZE - frameIndex * GIGANTE_RENDER_SIZE}
              y={-GIGANTE_HALF_SIZE}
              width={GIGANTE_RENDER_SIZE * TOTAL_FRAMES}
              height={GIGANTE_RENDER_SIZE}
              style={{
                opacity: 1,
                imageRendering: 'auto',
                filter:
                  'drop-shadow(0 0 20px rgba(245, 158, 11, 0.95)) drop-shadow(0 0 42px rgba(217, 119, 6, 0.65)) contrast(1.18) brightness(1.15)',
              }}
            />
          </g>
        </g>
      )}

      {/* 7. Astral Mirror & Radiant Runic Prism Cage for Hechicero (HE) */}
      {attackerType === 'HE' && (
        <g transform={`translate(${midX}, ${midY})`}>
          {/* Luminous Astral Halo Ring during Frame 7 Climax */}
          {frameIndex === 6 && (
            <g>
              <ellipse
                cx="0"
                cy="60"
                rx="76"
                ry="30"
                fill="none"
                stroke="#c084fc"
                strokeWidth="2.5"
                opacity="0.85"
                filter="drop-shadow(0 0 16px rgba(168, 85, 247, 0.95))"
              />
              <circle
                cx="0"
                cy="-45"
                r="55"
                fill="none"
                stroke="#facc15"
                strokeWidth="1.5"
                strokeDasharray="8 6"
                opacity="0.75"
                filter="drop-shadow(0 0 12px rgba(250, 204, 21, 0.9))"
              />
            </g>
          )}
          <g clipPath="url(#hechicero-frame-clip)">
            <image
              href={HECHICERO_SPRITESHEET_B64}
              xlinkHref={HECHICERO_SPRITESHEET_B64}
              x={-HECHICERO_HALF_SIZE - frameIndex * HECHICERO_RENDER_SIZE}
              y={-HECHICERO_HALF_SIZE}
              width={HECHICERO_RENDER_SIZE * TOTAL_FRAMES}
              height={HECHICERO_RENDER_SIZE}
              style={{
                opacity: 1,
                imageRendering: 'auto',
                filter:
                  'drop-shadow(0 0 18px rgba(168, 85, 247, 0.95)) drop-shadow(0 0 40px rgba(234, 179, 8, 0.65)) contrast(1.15) brightness(1.1)',
              }}
            />
          </g>
        </g>
      )}

      {/* 8. Ceremonial Runic Jade Skull & Soulfire Vortex for Nigromante (NI) */}
      {attackerType === 'NI' && (
        <g transform={`translate(${midX}, ${midY})`}>
          {/* Luminous Soulfire Runic Star Ring during Frame 7 Climax */}
          {frameIndex === 6 && (
            <g>
              <ellipse
                cx="0"
                cy="68"
                rx="84"
                ry="34"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                opacity="0.9"
                filter="drop-shadow(0 0 18px rgba(16, 185, 129, 0.95))"
              />
              <circle
                cx="0"
                cy="68"
                r="50"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.8"
                strokeDasharray="10 6"
                opacity="0.8"
                filter="drop-shadow(0 0 14px rgba(6, 182, 212, 0.9))"
              />
            </g>
          )}
          <g clipPath="url(#nigromante-frame-clip)">
            <image
              href={NIGROMANTE_SPRITESHEET_B64}
              xlinkHref={NIGROMANTE_SPRITESHEET_B64}
              x={-NIGROMANTE_HALF_SIZE - frameIndex * NIGROMANTE_RENDER_SIZE}
              y={-NIGROMANTE_HALF_SIZE}
              width={NIGROMANTE_RENDER_SIZE * TOTAL_FRAMES}
              height={NIGROMANTE_RENDER_SIZE}
              style={{
                opacity: 1,
                imageRendering: 'auto',
                filter:
                  'drop-shadow(0 0 20px rgba(16, 185, 129, 0.95)) drop-shadow(0 0 42px rgba(6, 182, 212, 0.7)) contrast(1.18) brightness(1.12)',
              }}
            />
          </g>
        </g>
      )}

      {/* 9. Kinetic Shockwave for other piece types awaiting their custom 12-frame strips */}
      {attackerType !== 'CZ' && attackerType !== 'EX' && attackerType !== 'BS' && attackerType !== 'GI' && attackerType !== 'HE' && attackerType !== 'NI' && (
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
