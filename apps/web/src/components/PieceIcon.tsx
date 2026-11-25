import React from 'react';
import { PieceType } from '@lcch/engine';

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
  const src = `/icons/${type}${white ? '_white' : ''}.png`;

  return (
    <img
      src={src}
      alt={type}
      width={size}
      height={size}
      className={`select-none pointer-events-none object-contain ${className}`}
      draggable={false}
    />
  );
};
