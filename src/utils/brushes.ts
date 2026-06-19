import { BrushConfig } from '../types';

export const BRUSHES: BrushConfig[] = [
  {
    id: 'pencil',
    name: 'Lápiz',
    emoji: '✏️',
    strokeWidth: 3,
    opacity: 0.9,
    lineCap: 'round',
    lineJoin: 'round',
    isEraser: false,
  },
  {
    id: 'marker',
    name: 'Marcador',
    emoji: '🖊️',
    strokeWidth: 8,
    opacity: 1.0,
    lineCap: 'square',
    lineJoin: 'round',
    isEraser: false,
  },
  {
    id: 'paintbrush',
    name: 'Pincel',
    emoji: '🖌️',
    strokeWidth: 18,
    opacity: 0.75,
    lineCap: 'round',
    lineJoin: 'round',
    isEraser: false,
  },
  {
    id: 'crayon',
    name: 'Crayón',
    emoji: '🖍️',
    strokeWidth: 14,
    opacity: 0.6,
    lineCap: 'round',
    lineJoin: 'bevel',
    isEraser: false,
  },
  {
    id: 'eraser',
    name: 'Borrador',
    emoji: '🧹',
    strokeWidth: 30,
    opacity: 1.0,
    lineCap: 'round',
    lineJoin: 'round',
    isEraser: true,
  },
];

export const DEFAULT_BRUSH = BRUSHES[0];
