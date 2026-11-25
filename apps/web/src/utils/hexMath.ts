import { AxialCoord } from '@lcch/engine';

/**
 * Red Blob Games Hexagonal Projection:
 * Pointy-topped hexagon projection from axial coordinates (q, r) to pixel (x, y):
 * x = size * sqrt(3) * (q + r / 2)
 * y = size * (3/2) * r
 */
export const HEX_SIZE = 48; // Radius from center to corner
export const SQRT_3 = Math.sqrt(3);

export interface Point {
  x: number;
  y: number;
}

export function hexToPixel(coord: AxialCoord, size: number = HEX_SIZE): Point {
  const x = size * SQRT_3 * (coord.q + coord.r / 2);
  const y = size * 1.5 * coord.r;
  return { x, y };
}

export function pixelToHex(point: Point, size: number = HEX_SIZE): AxialCoord {
  const q = ((point.x * SQRT_3) / 3 - point.y / 3) / size;
  const r = ((point.y * 2) / 3) / size;
  return axialRound(q, r);
}

function axialRound(q: number, r: number): AxialCoord {
  const x = q;
  const z = r;
  const y = -x - z;

  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);

  const x_diff = Math.abs(rx - x);
  const y_diff = Math.abs(ry - y);
  const z_diff = Math.abs(rz - z);

  if (x_diff > y_diff && x_diff > z_diff) {
    rx = -ry - rz;
  } else if (y_diff > z_diff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  return { q: rx, r: rz };
}

/**
 * Returns SVG path points for a pointy-topped hexagon centered at (centerX, centerY).
 */
export function getHexCornerPoints(centerX: number, centerY: number, size: number = HEX_SIZE): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle_deg = 60 * i - 30; // Pointy topped: -30, 30, 90, 150, 210, 270
    const angle_rad = (Math.PI / 180) * angle_deg;
    const px = centerX + size * Math.cos(angle_rad);
    const py = centerY + size * Math.sin(angle_rad);
    points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return points.join(' ');
}
