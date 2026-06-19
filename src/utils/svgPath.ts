import { Point } from '../types';

/**
 * Converts an array of points to a smooth SVG path string using
 * quadratic Bézier curves for a natural drawing feel.
 */
export function pointsToSvgPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
  }
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    path += ` Q ${points[i].x} ${points[i].y} ${midX} ${midY}`;
  }

  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;

  return path;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function buildThumbnailSvg(
  paths: Array<{ d: string; color: string; strokeWidth: number; opacity: number; isEraser: boolean }>,
  width: number,
  height: number,
  background: string,
): string {
  const pathElements = paths
    .map(
      (p) =>
        `<path d="${p.d}" stroke="${p.isEraser ? background : p.color}" stroke-width="${p.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="${p.opacity}"/>`,
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${background}"/>${pathElements}</svg>`;
}
