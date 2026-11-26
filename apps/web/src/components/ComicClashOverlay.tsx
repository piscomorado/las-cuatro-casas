import React from 'react';
import { PieceType, House } from '@lcch/engine';

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

/**
 * Comic Clash Overlay — Limpio / Desactivado.
 * No renderiza nada para evitar bugs o artefactos mientras se preparan los assets de 12 cuadros.
 */
export const ComicClashOverlay: React.FC<ComicClashOverlayProps> = () => {
  return null;
};
