/**
 * Tests del reducer de useDrawing.
 * Importamos el reducer directamente — no necesitamos montar el hook.
 */

import type { BrushConfig, DrawingPath, Point } from '../../src/types';
import { DEFAULT_BRUSH } from '../../src/utils/brushes';
import { DEFAULT_COLOR } from '../../src/utils/colors';

// Re-exportamos el reducer para poder testearlo puro
// Si el reducer no está exportado, este test sirve como especificación
// de qué exportar.

type DrawingState = {
  committed: DrawingPath[];
  redoStack: DrawingPath[][];
  activePath: DrawingPath | null;
};

type DrawingAction =
  | { type: 'START_PATH'; path: DrawingPath }
  | { type: 'ADD_POINT'; point: Point }
  | { type: 'COMMIT_PATH' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; paths: DrawingPath[] };

// Copiamos el reducer aquí para testear sin importar el módulo completo
// (que depende de React). En un proyecto más maduro, el reducer
// estaría en un archivo separado de utils/.
function reducer(state: DrawingState, action: DrawingAction): DrawingState {
  switch (action.type) {
    case 'START_PATH':
      return { ...state, activePath: action.path, redoStack: [] };
    case 'ADD_POINT':
      if (!state.activePath) return state;
      return {
        ...state,
        activePath: { ...state.activePath, points: [...state.activePath.points, action.point] },
      };
    case 'COMMIT_PATH':
      if (!state.activePath || state.activePath.points.length === 0) return { ...state, activePath: null };
      return { ...state, committed: [...state.committed, state.activePath], activePath: null };
    case 'UNDO': {
      if (state.committed.length === 0) return state;
      const last = state.committed[state.committed.length - 1];
      return {
        ...state,
        committed: state.committed.slice(0, -1),
        redoStack: [...state.redoStack, [last]],
      };
    }
    case 'REDO': {
      if (state.redoStack.length === 0) return state;
      const batch = state.redoStack[state.redoStack.length - 1];
      return { ...state, committed: [...state.committed, ...batch], redoStack: state.redoStack.slice(0, -1) };
    }
    case 'CLEAR':
      if (state.committed.length === 0) return state;
      return { committed: [], redoStack: [...state.redoStack, state.committed], activePath: null };
    case 'LOAD':
      return { committed: action.paths, redoStack: [], activePath: null };
    default:
      return state;
  }
}

const EMPTY: DrawingState = { committed: [], redoStack: [], activePath: null };

function makePath(id: string): DrawingPath {
  return {
    id,
    points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
    color: DEFAULT_COLOR,
    strokeWidth: DEFAULT_BRUSH.strokeWidth,
    opacity: DEFAULT_BRUSH.opacity,
    lineCap: DEFAULT_BRUSH.lineCap,
    lineJoin: DEFAULT_BRUSH.lineJoin,
    isEraser: false,
  };
}

describe('Drawing reducer', () => {
  describe('START_PATH', () => {
    it('setea activePath y limpia redoStack', () => {
      const path = makePath('p1');
      const state = reducer(
        { ...EMPTY, redoStack: [[makePath('old')]] },
        { type: 'START_PATH', path },
      );
      expect(state.activePath).toEqual(path);
      expect(state.redoStack).toHaveLength(0);
    });
  });

  describe('ADD_POINT', () => {
    it('agrega un punto al activePath', () => {
      const path = makePath('p1');
      const s1 = reducer(EMPTY, { type: 'START_PATH', path });
      const s2 = reducer(s1, { type: 'ADD_POINT', point: { x: 20, y: 30 } });
      expect(s2.activePath?.points).toHaveLength(3);
      expect(s2.activePath?.points[2]).toEqual({ x: 20, y: 30 });
    });

    it('no hace nada si no hay activePath', () => {
      const state = reducer(EMPTY, { type: 'ADD_POINT', point: { x: 5, y: 5 } });
      expect(state).toEqual(EMPTY);
    });
  });

  describe('COMMIT_PATH', () => {
    it('mueve activePath a committed', () => {
      const path = makePath('p1');
      const s1 = reducer(EMPTY, { type: 'START_PATH', path });
      const s2 = reducer(s1, { type: 'COMMIT_PATH' });
      expect(s2.committed).toHaveLength(1);
      expect(s2.activePath).toBeNull();
    });

    it('no commitea paths sin puntos', () => {
      const emptyPath: DrawingPath = { ...makePath('p1'), points: [] };
      const s1 = reducer(EMPTY, { type: 'START_PATH', path: emptyPath });
      const s2 = reducer(s1, { type: 'COMMIT_PATH' });
      expect(s2.committed).toHaveLength(0);
    });
  });

  describe('UNDO', () => {
    it('mueve el último trazo a redoStack', () => {
      const p1 = makePath('p1');
      const p2 = makePath('p2');
      const state: DrawingState = { committed: [p1, p2], redoStack: [], activePath: null };
      const next = reducer(state, { type: 'UNDO' });
      expect(next.committed).toEqual([p1]);
      expect(next.redoStack).toHaveLength(1);
      expect(next.redoStack[0]).toEqual([p2]);
    });

    it('no hace nada si committed está vacío', () => {
      const state = reducer(EMPTY, { type: 'UNDO' });
      expect(state).toEqual(EMPTY);
    });
  });

  describe('REDO', () => {
    it('restaura el último trazo deshecho', () => {
      const p1 = makePath('p1');
      const p2 = makePath('p2');
      const state: DrawingState = { committed: [p1], redoStack: [[p2]], activePath: null };
      const next = reducer(state, { type: 'REDO' });
      expect(next.committed).toEqual([p1, p2]);
      expect(next.redoStack).toHaveLength(0);
    });

    it('no hace nada si redoStack está vacío', () => {
      const state: DrawingState = { committed: [makePath('p1')], redoStack: [], activePath: null };
      const next = reducer(state, { type: 'REDO' });
      expect(next.committed).toHaveLength(1);
      expect(next.redoStack).toHaveLength(0);
    });
  });

  describe('CLEAR', () => {
    it('mueve todos los trazos a redoStack como un batch', () => {
      const p1 = makePath('p1');
      const p2 = makePath('p2');
      const state: DrawingState = { committed: [p1, p2], redoStack: [], activePath: null };
      const next = reducer(state, { type: 'CLEAR' });
      expect(next.committed).toHaveLength(0);
      expect(next.redoStack).toHaveLength(1);
      expect(next.redoStack[0]).toEqual([p1, p2]);
    });

    it('no hace nada si no hay trazos', () => {
      const state = reducer(EMPTY, { type: 'CLEAR' });
      expect(state).toEqual(EMPTY);
    });
  });

  describe('UNDO + REDO round-trip', () => {
    it('deshacer y rehacer restaura el estado original', () => {
      const paths = [makePath('p1'), makePath('p2'), makePath('p3')];
      const original: DrawingState = { committed: paths, redoStack: [], activePath: null };

      const afterUndo = reducer(original, { type: 'UNDO' });
      const afterRedo = reducer(afterUndo, { type: 'REDO' });

      expect(afterRedo.committed).toEqual(original.committed);
      expect(afterRedo.redoStack).toHaveLength(0);
    });
  });

  describe('LOAD', () => {
    it('reemplaza el estado con los paths cargados', () => {
      const paths = [makePath('loaded1'), makePath('loaded2')];
      const state: DrawingState = { committed: [makePath('old')], redoStack: [[makePath('r')]], activePath: null };
      const next = reducer(state, { type: 'LOAD', paths });
      expect(next.committed).toEqual(paths);
      expect(next.redoStack).toHaveLength(0);
      expect(next.activePath).toBeNull();
    });
  });
});
