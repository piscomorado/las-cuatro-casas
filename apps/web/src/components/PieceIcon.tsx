import React from 'react';
import { PieceType } from '@lcch/engine';

export interface PieceIconProps {
  type: PieceType;
  className?: string;
  size?: number;
}

export const PieceIcon: React.FC<PieceIconProps> = ({ type, className = '', size = 28 }) => {
  switch (type) {
    case 'SO': // Soberano: Corona majestuosa
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M3 18h18l-2-11-4.5 5L12 4l-2.5 8L5 7z" fill="currentColor" fillOpacity="0.15" />
          <circle cx="12" cy="4" r="1.5" fill="currentColor" />
          <circle cx="5" cy="7" r="1.5" fill="currentColor" />
          <circle cx="19" cy="7" r="1.5" fill="currentColor" />
          <line x1="3" y1="20" x2="21" y2="20" strokeWidth="2.5" />
        </svg>
      );
    case 'EX': // Explorador: Brújula / Rosa de los vientos de navegación
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="9" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
        </svg>
      );
    case 'CZ': // Cazador: Arco y Flecha de precisión
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M4 20L20 4" />
          <path d="M14 4h6v6" />
          <path d="M4 9a11 11 0 0 1 11 11" fill="currentColor" fillOpacity="0.15" />
          <line x1="7" y1="17" x2="4" y2="20" strokeWidth="2.5" />
        </svg>
      );
    case 'BS': // Bestia Saltadora: Garras / Fauces de bestia feroz
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M5 4c0 4 2 8 6 10-4 1-7 4-8 8" />
          <path d="M19 4c0 4-2 8-6 10 4 1 7 4 8 8" />
          <path d="M12 2v10" strokeWidth="2.5" />
          <circle cx="9" cy="9" r="1" fill="currentColor" />
          <circle cx="15" cy="9" r="1" fill="currentColor" />
        </svg>
      );
    case 'GI': // Gigante: Escudo y Columna colosal
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 2L4 6v6c0 5.5 3.5 10 8 11 4.5-1 8-5.5 8-11V6l-8-4z" fill="currentColor" fillOpacity="0.15" />
          <path d="M9 10h6" />
          <path d="M12 7v10" strokeWidth="2.5" />
        </svg>
      );
    case 'HE': // Hechicero de Cadenas: Anillos mágicos entrelazados
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="9" cy="12" r="5" strokeDasharray="3 2" />
          <circle cx="15" cy="12" r="5" />
          <path d="M12 7v10" strokeWidth="1.5" />
        </svg>
      );
    case 'NI': // Nigromante: Calavera del inframundo
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M9 17v3h6v-3" />
          <path d="M19 11a7 7 0 1 0-14 0c0 3 2 5.5 4 6.5h6c2-1 4-3.5 4-6.5z" fill="currentColor" fillOpacity="0.15" />
          <circle cx="9" cy="11" r="1.5" fill="currentColor" />
          <circle cx="15" cy="11" r="1.5" fill="currentColor" />
        </svg>
      );
  }
};
