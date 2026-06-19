/**
 * Tests de la capa de storage.
 * AsyncStorage está mockeado automáticamente por jest-expo.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  deleteDrawing,
  loadAllDrawings,
  loadDrawing,
  loadDrawingIndex,
  saveDrawing,
  updateDrawing,
} from '../../src/utils/storage';
import type { Drawing } from '../../src/types';

function makeDrawing(id: string, name = 'Dibujo test'): Drawing {
  const now = Date.now();
  return {
    id,
    name,
    createdAt: now,
    updatedAt: now,
    paths: [],
    canvasWidth: 400,
    canvasHeight: 600,
    backgroundColor: '#FFFFFF',
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('saveDrawing', () => {
  it('guarda el dibujo y lo agrega al índice', async () => {
    const drawing = makeDrawing('d1');
    await saveDrawing(drawing);

    const index = await loadDrawingIndex();
    expect(index).toContain('d1');
  });

  it('no duplica el ID en el índice si se guarda dos veces', async () => {
    const drawing = makeDrawing('d1');
    await saveDrawing(drawing);
    await saveDrawing(drawing);

    const index = await loadDrawingIndex();
    expect(index.filter((id) => id === 'd1')).toHaveLength(1);
  });

  it('agrega el nuevo ID al principio del índice', async () => {
    await saveDrawing(makeDrawing('d1'));
    await saveDrawing(makeDrawing('d2'));

    const index = await loadDrawingIndex();
    expect(index[0]).toBe('d2');
  });
});

describe('loadDrawing', () => {
  it('carga el dibujo guardado', async () => {
    const drawing = makeDrawing('d1', 'Mi dibujo');
    await saveDrawing(drawing);

    const loaded = await loadDrawing('d1');
    expect(loaded).not.toBeNull();
    expect(loaded?.name).toBe('Mi dibujo');
  });

  it('retorna null para un ID inexistente', async () => {
    const result = await loadDrawing('inexistente');
    expect(result).toBeNull();
  });
});

describe('loadAllDrawings', () => {
  it('carga todos los dibujos guardados', async () => {
    await saveDrawing(makeDrawing('d1'));
    await saveDrawing(makeDrawing('d2'));
    await saveDrawing(makeDrawing('d3'));

    const drawings = await loadAllDrawings();
    expect(drawings).toHaveLength(3);
  });

  it('retorna array vacío cuando no hay dibujos', async () => {
    const drawings = await loadAllDrawings();
    expect(drawings).toEqual([]);
  });

  it('ordena por updatedAt descendente', async () => {
    const d1 = { ...makeDrawing('d1'), updatedAt: 1000 };
    const d2 = { ...makeDrawing('d2'), updatedAt: 3000 };
    const d3 = { ...makeDrawing('d3'), updatedAt: 2000 };

    await saveDrawing(d1);
    await saveDrawing(d2);
    await saveDrawing(d3);

    const drawings = await loadAllDrawings();
    expect(drawings[0].id).toBe('d2');
    expect(drawings[1].id).toBe('d3');
    expect(drawings[2].id).toBe('d1');
  });
});

describe('deleteDrawing', () => {
  it('elimina el dibujo del índice y del storage', async () => {
    await saveDrawing(makeDrawing('d1'));
    await saveDrawing(makeDrawing('d2'));

    await deleteDrawing('d1');

    const index = await loadDrawingIndex();
    expect(index).not.toContain('d1');
    expect(index).toContain('d2');

    const loaded = await loadDrawing('d1');
    expect(loaded).toBeNull();
  });
});

describe('updateDrawing', () => {
  it('actualiza los datos del dibujo sin cambiar el índice', async () => {
    const drawing = makeDrawing('d1', 'Original');
    await saveDrawing(drawing);

    await updateDrawing({ ...drawing, name: 'Actualizado' });

    const loaded = await loadDrawing('d1');
    expect(loaded?.name).toBe('Actualizado');

    const index = await loadDrawingIndex();
    expect(index).toHaveLength(1);
  });
});
