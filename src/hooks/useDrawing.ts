import { useCallback, useReducer } from 'react';
import { BrushConfig, DrawingPath, Point } from '../types';
import { generateId } from '../utils/svgPath';

interface DrawingState {
  committed: DrawingPath[];
  redoStack: DrawingPath[][];
  activePath: DrawingPath | null;
}

type DrawingAction =
  | { type: 'START_PATH'; path: DrawingPath }
  | { type: 'ADD_POINT'; point: Point }
  | { type: 'COMMIT_PATH' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; paths: DrawingPath[] };

function reducer(state: DrawingState, action: DrawingAction): DrawingState {
  switch (action.type) {
    case 'START_PATH':
      return { ...state, activePath: action.path, redoStack: [] };

    case 'ADD_POINT':
      if (!state.activePath) return state;
      return {
        ...state,
        activePath: {
          ...state.activePath,
          points: [...state.activePath.points, action.point],
        },
      };

    case 'COMMIT_PATH':
      if (!state.activePath || state.activePath.points.length === 0) {
        return { ...state, activePath: null };
      }
      return {
        ...state,
        committed: [...state.committed, state.activePath],
        activePath: null,
      };

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
      return {
        ...state,
        committed: [...state.committed, ...batch],
        redoStack: state.redoStack.slice(0, -1),
      };
    }

    case 'CLEAR':
      if (state.committed.length === 0) return state;
      return {
        committed: [],
        redoStack: [...state.redoStack, state.committed],
        activePath: null,
      };

    case 'LOAD':
      return { committed: action.paths, redoStack: [], activePath: null };

    default:
      return state;
  }
}

const INITIAL_STATE: DrawingState = {
  committed: [],
  redoStack: [],
  activePath: null,
};

export function useDrawing() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const startPath = useCallback(
    (point: Point, color: string, brush: BrushConfig) => {
      const path: DrawingPath = {
        id: generateId(),
        points: [point],
        color,
        strokeWidth: brush.strokeWidth,
        opacity: brush.opacity,
        lineCap: brush.lineCap,
        lineJoin: brush.lineJoin,
        isEraser: brush.isEraser,
      };
      dispatch({ type: 'START_PATH', path });
    },
    [],
  );

  const addPoint = useCallback((point: Point) => {
    dispatch({ type: 'ADD_POINT', point });
  }, []);

  const commitPath = useCallback(() => {
    dispatch({ type: 'COMMIT_PATH' });
  }, []);

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), []);
  const load = useCallback(
    (paths: DrawingPath[]) => dispatch({ type: 'LOAD', paths }),
    [],
  );

  return {
    paths: state.committed,
    activePath: state.activePath,
    canUndo: state.committed.length > 0,
    canRedo: state.redoStack.length > 0,
    startPath,
    addPoint,
    commitPath,
    undo,
    redo,
    clear,
    load,
  };
}
