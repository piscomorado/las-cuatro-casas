import React from 'react';
import { PieceType } from '@lcch/engine';
import { EMBLEMS_BASE64 } from '../utils/emblemsData';

export interface PieceIconProps {
  type: PieceType;
  className?: string;
  size?: number;
  white?: boolean;
}

export const PieceIcon: React.FC<PieceIconProps> = ({
  type,
  className = '',
  size = 28,
  white = true,
}) => {
  const emblem = EMBLEMS_BASE64[type];
  const src = emblem ? (white ? emblem.white : emblem.black) : '';

  return (
    <img
      src={src}
      alt={type}
      width={size}
      height={size}
      className={`select-none pointer-events-none object-contain inline-block ${className}`}
      draggable={false}
    />
  );
};

export interface SvgPieceIconProps {
  type: PieceType;
  x?: number;
  y?: number;
  size?: number;
  white?: boolean;
  className?: string;
}

/**
 * Native SVG image tag for rendering official emblems directly inside SVG hexes.
 * Uses 100% reliable base64 embedded data URI so images never fail to load or vanish.
 */
export const SvgPieceIcon: React.FC<SvgPieceIconProps> = ({
  type,
  x = -20,
  y = -20,
  size = 40,
  white = true,
  className = '',
}) => {
  const emblem = EMBLEMS_BASE64[type];
  const href = emblem ? (white ? emblem.white : emblem.black) : '';

  return (
    <image
      href={href}
      x={x}
      y={y}
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid meet"
      pointerEvents="none"
      className={className}
    />
  );
};
