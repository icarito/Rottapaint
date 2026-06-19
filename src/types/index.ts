export interface Point {
  x: number;
  y: number;
}

export type LineCap = 'round' | 'square' | 'butt';
export type LineJoin = 'round' | 'miter' | 'bevel';

export interface DrawingPath {
  id: string;
  points: Point[];
  color: string;
  strokeWidth: number;
  opacity: number;
  lineCap: LineCap;
  lineJoin: LineJoin;
  isEraser: boolean;
}

export interface Drawing {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  paths: DrawingPath[];
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  thumbnailSvg?: string;
}

export interface BrushConfig {
  id: string;
  name: string;
  emoji: string;
  strokeWidth: number;
  opacity: number;
  lineCap: LineCap;
  lineJoin: LineJoin;
  isEraser: boolean;
}

export interface ColorSwatch {
  id: string;
  color: string;
  label: string;
}

export type ToolMode = 'draw' | 'erase';

export interface CanvasState {
  paths: DrawingPath[];
  activePath: DrawingPath | null;
  currentColor: string;
  currentBrush: BrushConfig;
  toolMode: ToolMode;
  canUndo: boolean;
  canRedo: boolean;
}
