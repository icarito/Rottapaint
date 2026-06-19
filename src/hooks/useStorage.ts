import { useCallback, useEffect, useState } from 'react';
import { Drawing } from '../types';
import {
  deleteDrawing,
  loadAllDrawings,
  saveDrawing,
  updateDrawing,
} from '../utils/storage';

export function useStorage() {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await loadAllDrawings();
    setDrawings(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (drawing: Drawing) => {
      await saveDrawing(drawing);
      await refresh();
    },
    [refresh],
  );

  const update = useCallback(
    async (drawing: Drawing) => {
      await updateDrawing(drawing);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteDrawing(id);
      setDrawings((prev) => prev.filter((d) => d.id !== id));
    },
    [],
  );

  return { drawings, loading, save, update, remove, refresh };
}
