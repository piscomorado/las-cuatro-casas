import React, { useEffect, useState } from 'react';
import { PieceType, House } from '@lcch/engine';
import {
  CAZADOR_VAR1_B64,
  CAZADOR_VAR2_B64,
  CAZADOR_VAR3_B64,
} from '../assets/vfx/cazador_b64';
import {
  EXPLORADOR_VAR1_B64,
  EXPLORADOR_VAR2_B64,
  EXPLORADOR_VAR3_B64,
} from '../assets/vfx/explorador_b64';
import {
  BESTIA_VAR1_B64,
  BESTIA_VAR2_B64,
  BESTIA_VAR3_B64,
} from '../assets/vfx/bestia_b64';
import {
  GIGANTE_VAR1_B64,
  GIGANTE_VAR2_B64,
  GIGANTE_VAR3_B64,
} from '../assets/vfx/gigante_b64';
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
  moveDistance?: number;
  variation?: 1 | 2 | 3;
}

export interface ComicClashOverlayProps {
  clash?: ComicClashEvent | null;
  onAnimationEnd?: () => void;
}

const TOTAL_FRAMES = 12;
const CAZADOR_FRAMES = 30;
const BESTIA_FRAMES = 30;
const EXPLORADOR_FRAMES = 30;
const CAZADOR_RENDER_WIDTH = 298; // Calibrated 16:9 ratio covering piece and reaching into adjacent hexes
const CAZADOR_RENDER_HEIGHT = 168; // Calibrated height to cover piece and reach halfway into surrounding adjacent hexes
const CAZADOR_HALF_WIDTH = CAZADOR_RENDER_WIDTH / 2;
const CAZADOR_HALF_HEIGHT = CAZADOR_RENDER_HEIGHT / 2;
const BESTIA_RENDER_WIDTH = 298; // Calibrated 16:9 ratio covering piece and reaching into adjacent hexes
const BESTIA_RENDER_HEIGHT = 168; // Calibrated height to cover piece and reach halfway into surrounding adjacent hexes
const BESTIA_HALF_WIDTH = BESTIA_RENDER_WIDTH / 2;
const BESTIA_HALF_HEIGHT = BESTIA_RENDER_HEIGHT / 2;
const EXPLORADOR_RENDER_WIDTH = 298; // Calibrated 16:9 ratio covering piece and reaching into adjacent hexes
const EXPLORADOR_RENDER_HEIGHT = 168; // Calibrated height to cover piece and reach halfway into surrounding adjacent hexes
const EXPLORADOR_HALF_WIDTH = EXPLORADOR_RENDER_WIDTH / 2;
const EXPLORADOR_HALF_HEIGHT = EXPLORADOR_RENDER_HEIGHT / 2;
const GIGANTE_FRAMES = 30;
const GIGANTE_RENDER_WIDTH = 374; // Colossal Cyclops Titan presence (25% larger than normal pieces)
const GIGANTE_RENDER_HEIGHT = 210;
const GIGANTE_HALF_WIDTH = GIGANTE_RENDER_WIDTH / 2;
const GIGANTE_HALF_HEIGHT = GIGANTE_RENDER_HEIGHT / 2;
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
    const isExplorador = clash.attackerType === 'EX';
    const isGigante = clash.attackerType === 'GI';
    const isHechicero = clash.attackerType === 'HE';
    const isNigromante = clash.attackerType === 'NI';
    const frameDurations = isCazador
      ? Array(30).fill(38) // Silky-smooth 26fps continuous video timing (38ms per frame, 100% fluid with zero mid-motion stutter)
      : isBestia
      ? Array(30).fill(38) // Silky-smooth 26fps continuous video timing for Bestia (38ms per frame, 100% fluid)
      : isExplorador
      ? Array(30).fill(38) // Silky-smooth 26fps continuous video timing for Angelic Explorador (38ms per frame, 100% fluid)
      : isGigante
      ? Array(30).fill(38) // Silky-smooth 26fps continuous video timing for Colossal Gigante (38ms per frame, 100% fluid)
      : isHechicero
      ? [70, 80, 85, 95, 100, 120, 480, 140, 120, 90, 75, 65] // Frame 7 (idx 6) peak halo & crystal cage hold
      : isNigromante
      ? [70, 80, 85, 95, 100, 120, 500, 140, 120, 90, 75, 65] // Frame 7 (idx 6) peak vortex & spiked star seal hold
      : [40, 45, 50, 50, 55, 60, 180, 260, 140, 65, 60, 55];
    let cur = 0;
    let timerId: any;

    const advance = () => {
      const maxFrames = isCazador ? CAZADOR_FRAMES : isBestia ? BESTIA_FRAMES : isExplorador ? EXPLORADOR_FRAMES : isGigante ? GIGANTE_FRAMES : TOTAL_FRAMES;
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

  // Dynamic 3-Move rotation per turn for Cazador (CZ): 1 -> 2 -> 3 -> 1 -> 2 -> 3
  const cazadorVariation: 1 | 2 | 3 =
    clash.variation ??
    ((((Math.abs(Math.round(clash.toPixel.x * 7 + clash.toPixel.y * 13))) % 3) + 1) as 1 | 2 | 3);

  const cazadorSheet =
    cazadorVariation === 1 ? CAZADOR_VAR1_B64 :
    cazadorVariation === 2 ? CAZADOR_VAR2_B64 :
    CAZADOR_VAR3_B64;

  const cazadorShouldFlip =
    (sovereignPixel && sovereignPixel.x < toPixel.x) ||
    (fromPixel && fromPixel.x > toPixel.x);

  // Dynamic 3-Move rotation per turn for Bestia (BS): 1 -> 2 -> 3 -> 1 -> 2 -> 3
  const bestiaVariation: 1 | 2 | 3 =
    clash.variation ??
    ((((Math.abs(Math.round(clash.toPixel.x * 7 + clash.toPixel.y * 13))) % 3) + 1) as 1 | 2 | 3);

  const bestiaSheet =
    bestiaVariation === 1 ? BESTIA_VAR1_B64 :
    bestiaVariation === 2 ? BESTIA_VAR2_B64 :
    BESTIA_VAR3_B64;

  const bestiaShouldFlip =
    (sovereignPixel && sovereignPixel.x < toPixel.x) ||
    (fromPixel && fromPixel.x > toPixel.x);

  // Dynamic 3-Move rotation per turn for Explorador (EX): 1 -> 2 -> 3 -> 1 -> 2 -> 3
  const exploradorVariation: 1 | 2 | 3 =
    clash.variation ??
    ((((Math.abs(Math.round(clash.toPixel.x * 7 + clash.toPixel.y * 13))) % 3) + 1) as 1 | 2 | 3);

  const exploradorSheet =
    exploradorVariation === 1 ? EXPLORADOR_VAR1_B64 :
    exploradorVariation === 2 ? EXPLORADOR_VAR2_B64 :
    EXPLORADOR_VAR3_B64;

  const exploradorShouldFlip =
    (sovereignPixel && sovereignPixel.x < toPixel.x) ||
    (fromPixel && fromPixel.x > toPixel.x);

  // Dynamic 3-Move rotation per turn for Gigante (GI): 1 -> 2 -> 3 -> 1 -> 2 -> 3
  const giganteVariation: 1 | 2 | 3 =
    clash.variation ??
    ((((Math.abs(Math.round(clash.toPixel.x * 7 + clash.toPixel.y * 13))) % 3) + 1) as 1 | 2 | 3);

  const giganteSheet =
    giganteVariation === 1 ? GIGANTE_VAR1_B64 :
    giganteVariation === 2 ? GIGANTE_VAR2_B64 :
    GIGANTE_VAR3_B64;

  const giganteShouldFlip =
    (sovereignPixel && sovereignPixel.x < toPixel.x) ||
    (fromPixel && fromPixel.x > toPixel.x);

  return (
    <g key={clash.id} pointerEvents="none" className="select-none z-50">
      <defs>
        <clipPath id="cazador-frame-clip">
          <rect
            x={-CAZADOR_HALF_WIDTH}
            y={-CAZADOR_HALF_HEIGHT - 20}
            width={CAZADOR_RENDER_WIDTH}
            height={CAZADOR_RENDER_HEIGHT + 40}
          />
        </clipPath>
        <clipPath id="explorador-frame-clip">
          <rect
            x={-EXPLORADOR_HALF_WIDTH}
            y={-EXPLORADOR_HALF_HEIGHT - 20}
            width={EXPLORADOR_RENDER_WIDTH}
            height={EXPLORADOR_RENDER_HEIGHT + 40}
          />
        </clipPath>
        <clipPath id="bestia-frame-clip">
          <rect
            x={-BESTIA_HALF_WIDTH}
            y={-BESTIA_HALF_HEIGHT - 20}
            width={BESTIA_RENDER_WIDTH}
            height={BESTIA_RENDER_HEIGHT + 40}
          />
        </clipPath>
        <clipPath id="gigante-frame-clip">
          <rect
            x={-GIGANTE_HALF_WIDTH}
            y={-GIGANTE_HALF_HEIGHT - 25}
            width={GIGANTE_RENDER_WIDTH}
            height={GIGANTE_RENDER_HEIGHT + 50}
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

      {/* 1. Kinetic Streaks between Origin and Destination (Frames 0-7) */}
      {attackerType === 'CZ' && fromPixel && frameIndex < 8 && (
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
      {attackerType === 'BS' && fromPixel && frameIndex < 8 && (
        <g>
          <line
            x1={fromPixel.x}
            y1={fromPixel.y}
            x2={midX}
            y2={midY}
            stroke="#ef4444"
            strokeWidth="3.5"
            strokeDasharray="16 8"
            strokeLinecap="round"
            opacity={frameIndex < 3 ? 0.9 : 0.45}
          />
          <line
            x1={fromPixel.x}
            y1={fromPixel.y}
            x2={midX}
            y2={midY}
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            strokeLinecap="round"
            opacity={0.7}
          />
        </g>
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

      {/* 2. Expanding Geometric Impact Ring during Climax (Frames 12-16) for Explorador */}
      {attackerType === 'EX' && (frameIndex >= 12 && frameIndex <= 16) && (
        <g transform={`translate(${midX}, ${midY})`}>
          <circle
            cx="0"
            cy="0"
            r={frameIndex === 14 ? 88 : 64}
            fill="none"
            stroke="#fde047"
            strokeWidth="2.5"
            opacity={frameIndex === 14 ? 0.85 : 0.45}
          />
        </g>
      )}

      {/* 3. 2D Action Assassin Strike for Cazador (CZ) - 3 Dynamic Combat Moves */}
      {attackerType === 'CZ' && (
        <g transform={`translate(${midX}, ${midY})`}>
          {/* Luminous Sapphire & Gold Ground Shockwave on Climax Impact (Frames 15-19) */}
          {(frameIndex >= 15 && frameIndex <= 19) && (
            <g>
              <ellipse
                cx="0"
                cy="54"
                rx={frameIndex === 16 ? 64 : 46}
                ry={frameIndex === 16 ? 24 : 18}
                fill="none"
                stroke="#38bdf8"
                strokeWidth={frameIndex === 16 ? '3.5' : '2'}
                opacity={frameIndex === 16 ? 0.95 : 0.6}
              />
              <circle
                cx="0"
                cy="54"
                r={frameIndex === 16 ? 38 : 26}
                fill="none"
                stroke="#fbbf24"
                strokeWidth={frameIndex === 16 ? '2.5' : '1.5'}
                opacity={frameIndex === 16 ? 0.9 : 0.5}
              />
            </g>
          )}
          <g transform={cazadorShouldFlip ? 'scale(-1, 1)' : undefined}>
            <g clipPath="url(#cazador-frame-clip)">
              <image
                href={cazadorSheet}
                xlinkHref={cazadorSheet}
                x={-CAZADOR_HALF_WIDTH - frameIndex * CAZADOR_RENDER_WIDTH}
                y={-CAZADOR_HALF_HEIGHT}
                width={CAZADOR_RENDER_WIDTH * CAZADOR_FRAMES}
                height={CAZADOR_RENDER_HEIGHT}
                style={{
                  opacity: 1,
                  imageRendering: 'auto',
                }}
              />
            </g>
          </g>
        </g>
      )}

      {/* 4. Angelic Armored Winged Scout for Explorador (EX) - 3 Dynamic Combat Moves */}
      {attackerType === 'EX' && (
        <g transform={`translate(${midX}, ${midY})`}>
          {/* Luminous Gold & Amber Ground Shockwave on Climax Impact (Frames 12-16) */}
          {(frameIndex >= 12 && frameIndex <= 16) && (
            <g>
              <ellipse
                cx="0"
                cy="54"
                rx={frameIndex === 14 ? 64 : 46}
                ry={frameIndex === 14 ? 24 : 18}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={frameIndex === 14 ? '3.5' : '2'}
                opacity={frameIndex === 14 ? 0.95 : 0.6}
              />
              <circle
                cx="0"
                cy="54"
                r={frameIndex === 14 ? 38 : 26}
                fill="none"
                stroke="#fde047"
                strokeWidth={frameIndex === 14 ? '2.5' : '1.5'}
                opacity={frameIndex === 14 ? 0.9 : 0.5}
              />
            </g>
          )}
          <g transform={exploradorShouldFlip ? 'scale(-1, 1)' : undefined}>
            <g clipPath="url(#explorador-frame-clip)">
              <image
                href={exploradorSheet}
                xlinkHref={exploradorSheet}
                x={-EXPLORADOR_HALF_WIDTH - frameIndex * EXPLORADOR_RENDER_WIDTH}
                y={-EXPLORADOR_HALF_HEIGHT}
                width={EXPLORADOR_RENDER_WIDTH * EXPLORADOR_FRAMES}
                height={EXPLORADOR_RENDER_HEIGHT}
                style={{
                  opacity: 1,
                  imageRendering: 'auto',
                  filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.4))',
                }}
              />
            </g>
          </g>
        </g>
      )}

      {/* 5. 2D Action Predatory Beast Strike for Bestia Saltadora (BS) - 3 Dynamic Combat Moves */}
      {attackerType === 'BS' && (
        <g transform={`translate(${midX}, ${midY})`}>
          {/* Luminous Crimson & Gold Ground Shockwave on Climax Impact (Frames 15-19) */}
          {(frameIndex >= 15 && frameIndex <= 19) && (
            <g>
              <ellipse
                cx="0"
                cy="52"
                rx={frameIndex === 16 ? 64 : 46}
                ry={frameIndex === 16 ? 24 : 18}
                fill="none"
                stroke="#ef4444"
                strokeWidth={frameIndex === 16 ? '3.5' : '2'}
                opacity={frameIndex === 16 ? 0.95 : 0.6}
              />
              <circle
                cx="0"
                cy="52"
                r={frameIndex === 16 ? 38 : 26}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={frameIndex === 16 ? '2.5' : '1.5'}
                opacity={frameIndex === 16 ? 0.85 : 0.5}
              />
            </g>
          )}
          <g transform={bestiaShouldFlip ? 'scale(-1, 1)' : undefined}>
            <g clipPath="url(#bestia-frame-clip)">
              <image
                href={bestiaSheet}
                xlinkHref={bestiaSheet}
                x={-BESTIA_HALF_WIDTH - frameIndex * BESTIA_RENDER_WIDTH}
                y={-BESTIA_HALF_HEIGHT}
                width={BESTIA_RENDER_WIDTH * BESTIA_FRAMES}
                height={BESTIA_RENDER_HEIGHT}
                style={{
                  opacity: 1,
                  imageRendering: 'auto',
                }}
              />
            </g>
          </g>
        </g>
      )}

      {/* 6. Colossal Cyclops Titan for Gigante (GI) - 3 Dynamic Combat Moves */}
      {attackerType === 'GI' && (
        <g transform={`translate(${midX}, ${midY})`}>
          {/* Luminous Golden Volcanic Ground Shockwave on Climax Impact (Frames 14-18) */}
          {(frameIndex >= 14 && frameIndex <= 18) && (
            <g>
              <ellipse
                cx="0"
                cy="68"
                rx={frameIndex === 15 ? 96 : 72}
                ry={frameIndex === 15 ? 38 : 28}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={frameIndex === 15 ? '4' : '2.5'}
                opacity={frameIndex === 15 ? 0.95 : 0.6}
                filter="drop-shadow(0 0 16px rgba(245, 158, 11, 0.95))"
              />
              <circle
                cx="0"
                cy="68"
                r={frameIndex === 15 ? 56 : 38}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.5"
                opacity={frameIndex === 15 ? 0.85 : 0.45}
              />
            </g>
          )}
          <g transform={giganteShouldFlip ? 'scale(-1, 1)' : undefined}>
            <g clipPath="url(#gigante-frame-clip)">
              <image
                href={giganteSheet}
                xlinkHref={giganteSheet}
                x={-GIGANTE_HALF_WIDTH - frameIndex * GIGANTE_RENDER_WIDTH}
                y={-GIGANTE_HALF_HEIGHT}
                width={GIGANTE_RENDER_WIDTH * GIGANTE_FRAMES}
                height={GIGANTE_RENDER_HEIGHT}
                style={{
                  opacity: 1,
                  imageRendering: 'auto',
                }}
              />
            </g>
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
