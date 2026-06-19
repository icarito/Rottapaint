import { buildThumbnailSvg, generateId, pointsToSvgPath } from '../../src/utils/svgPath';
import type { Point } from '../../src/types';

describe('pointsToSvgPath', () => {
  it('retorna string vacío para array vacío', () => {
    expect(pointsToSvgPath([])).toBe('');
  });

  it('genera un punto solo (dot) para un único punto', () => {
    const points: Point[] = [{ x: 10, y: 20 }];
    const d = pointsToSvgPath(points);
    expect(d).toMatch(/^M 10 20/);
    expect(d.length).toBeGreaterThan(0);
  });

  it('genera una línea recta para dos puntos', () => {
    const points: Point[] = [{ x: 0, y: 0 }, { x: 100, y: 100 }];
    const d = pointsToSvgPath(points);
    expect(d).toBe('M 0 0 L 100 100');
  });

  it('genera curvas Bézier para tres o más puntos', () => {
    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 50, y: 50 },
      { x: 100, y: 0 },
    ];
    const d = pointsToSvgPath(points);
    expect(d).toMatch(/^M 0 0/);
    expect(d).toContain('Q'); // curva quadrática
    expect(d).toContain('L'); // segmento final
  });

  it('el path empieza siempre con M (moveto)', () => {
    const points: Point[] = [{ x: 5, y: 10 }, { x: 15, y: 25 }, { x: 30, y: 10 }];
    expect(pointsToSvgPath(points)).toMatch(/^M /);
  });

  it('no genera NaN en los valores', () => {
    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 5 },
      { x: 30, y: 15 },
    ];
    const d = pointsToSvgPath(points);
    expect(d).not.toContain('NaN');
  });
});

describe('generateId', () => {
  it('genera IDs únicos', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it('el ID contiene un timestamp', () => {
    const before = Date.now();
    const id = generateId();
    const after = Date.now();
    const ts = parseInt(id.split('-')[0], 10);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

describe('buildThumbnailSvg', () => {
  const samplePaths = [
    { d: 'M 0 0 L 100 100', color: '#FF0000', strokeWidth: 4, opacity: 1, isEraser: false },
    { d: 'M 50 50 L 80 80', color: '#0000FF', strokeWidth: 8, opacity: 0.5, isEraser: false },
  ];

  it('genera un SVG válido', () => {
    const svg = buildThumbnailSvg(samplePaths, 400, 300, '#FFFFFF');
    expect(svg).toMatch(/^<svg /);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it('incluye el color de fondo como rect', () => {
    const svg = buildThumbnailSvg(samplePaths, 400, 300, '#FFF9F0');
    expect(svg).toContain('fill="#FFF9F0"');
  });

  it('usa el color de fondo para trazos de borrador', () => {
    const paths = [{ d: 'M 0 0 L 10 10', color: '#000', strokeWidth: 20, opacity: 1, isEraser: true }];
    const svg = buildThumbnailSvg(paths, 200, 200, '#ABCDEF');
    expect(svg).toContain('stroke="#ABCDEF"');
  });

  it('incluye todos los paths', () => {
    const svg = buildThumbnailSvg(samplePaths, 400, 300, '#FFF');
    expect(svg).toContain('M 0 0 L 100 100');
    expect(svg).toContain('M 50 50 L 80 80');
  });

  it('genera SVG vacío (solo fondo) cuando no hay paths', () => {
    const svg = buildThumbnailSvg([], 100, 100, '#FFF');
    expect(svg).toContain('<rect');
    expect(svg).not.toContain('<path');
  });
});
