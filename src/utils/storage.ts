import AsyncStorage from '@react-native-async-storage/async-storage';
import { Drawing } from '../types';

const DRAWINGS_KEY = '@rottapaint:drawings';
const DRAWING_PREFIX = '@rottapaint:drawing:';

export async function saveDrawing(drawing: Drawing): Promise<void> {
  const index = await loadDrawingIndex();
  const exists = index.find((id) => id === drawing.id);
  if (!exists) {
    index.unshift(drawing.id);
    await AsyncStorage.setItem(DRAWINGS_KEY, JSON.stringify(index));
  }
  await AsyncStorage.setItem(DRAWING_PREFIX + drawing.id, JSON.stringify(drawing));
}

export async function loadDrawingIndex(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(DRAWINGS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function loadAllDrawings(): Promise<Drawing[]> {
  const index = await loadDrawingIndex();
  const drawings: Drawing[] = [];

  await Promise.all(
    index.map(async (id) => {
      const raw = await AsyncStorage.getItem(DRAWING_PREFIX + id);
      if (raw) drawings.push(JSON.parse(raw) as Drawing);
    }),
  );

  return drawings.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadDrawing(id: string): Promise<Drawing | null> {
  const raw = await AsyncStorage.getItem(DRAWING_PREFIX + id);
  return raw ? (JSON.parse(raw) as Drawing) : null;
}

export async function deleteDrawing(id: string): Promise<void> {
  const index = await loadDrawingIndex();
  const updated = index.filter((i) => i !== id);
  await AsyncStorage.setItem(DRAWINGS_KEY, JSON.stringify(updated));
  await AsyncStorage.removeItem(DRAWING_PREFIX + id);
}

export async function updateDrawing(drawing: Drawing): Promise<void> {
  await AsyncStorage.setItem(DRAWING_PREFIX + drawing.id, JSON.stringify(drawing));
}
