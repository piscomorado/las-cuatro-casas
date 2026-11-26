import React from 'react';

export interface SavageGodsIconProps {
  size?: number;
  className?: string;
  color?: string;
}

/**
 * Savage Gods Official Emblem.
 * Symmetrical heraldic vector combining a primal horned deity crown,
 * fierce war helm visor, and twin crossed warrior broadswords.
 * Designed with high-contrast negative space to match the game's piece emblems.
 */
export const SavageGodsIcon: React.FC<SavageGodsIconProps> = ({
  size = 32,
  className = '',
  color = '#ffffff',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none inline-block shrink-0 ${className}`}
      aria-label="Savage Gods Emblem"
    >
      {/* === 1. PRIMAL HORNS (Left & Right) === */}
      {/* Left Horn */}
      <path
        d="M 32 38 C 24 30 14 24 8 16 C 6 25 10 38 18 45 C 22 48 27 50 31 50 C 30 46 31 41 32 38 Z"
        fill={color}
      />
      {/* Right Horn */}
      <path
        d="M 68 38 C 76 30 86 24 92 16 C 94 25 90 38 82 45 C 78 48 73 50 69 50 C 70 46 69 41 68 38 Z"
        fill={color}
      />

      {/* === 2. DIVINE RADIANT CROWN === */}
      {/* Central High Spire & Crown Peaks */}
      <path
        d="M 50 8 L 54 24 L 62 15 L 63 28 L 68 22 L 67 36 L 33 36 L 32 22 L 37 28 L 38 15 L 46 24 Z"
        fill={color}
      />
      {/* Crown Diadem Base Bar */}
      <rect x="34" y="39" width="32" height="4" rx="2" fill={color} />

      {/* === 3. DEITY WAR HELM / VISOR === */}
      {/* Main Mask Silhouette */}
      <path
        d="M 33 46 L 50 48 L 67 46 L 65 62 L 50 75 L 35 62 Z"
        fill={color}
      />

      {/* Visor Negative Space (Fierce Angled Eye Slits) using dark cutout masks */}
      <polygon points="40,54 47,56 44,59 39,57" fill="#020617" />
      <polygon points="60,54 53,56 56,59 61,57" fill="#020617" />
      <polygon points="50,56 52,60 50,64 48,60" fill="#020617" />

      {/* === 4. CROSSED SAVAGE BLADES (Behind / Under Helm) === */}
      {/* Left-to-Right Sword */}
      <path
        d="M 22 84 L 25 87 L 34 78 L 68 56 L 66 53 L 31 75 L 22 84 Z"
        fill={color}
      />
      <circle cx="20" cy="86" r="3" fill={color} />

      {/* Right-to-Left Sword */}
      <path
        d="M 78 84 L 75 87 L 66 78 L 32 56 L 34 53 L 69 75 L 78 84 Z"
        fill={color}
      />
      <circle cx="80" cy="86" r="3" fill={color} />

      {/* Chin Pendant / Fang */}
      <polygon points="50,77 54,83 50,92 46,83" fill={color} />
    </svg>
  );
};
