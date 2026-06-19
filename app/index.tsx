import React, { useCallback, useState } from 'react';
import { DrawingScreen } from '../src/screens/DrawingScreen';
import { HomeScreen } from '../src/screens/HomeScreen';
import { useStorage } from '../src/hooks/useStorage';
import { Drawing } from '../src/types';

type Screen = { name: 'home' } | { name: 'drawing'; drawing: Drawing };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const { save } = useStorage();

  const handleOpenDrawing = useCallback((drawing: Drawing) => {
    setScreen({ name: 'drawing', drawing });
  }, []);

  const handleNewDrawing = useCallback((drawing: Drawing) => {
    setScreen({ name: 'drawing', drawing });
  }, []);

  const handleBack = useCallback(() => {
    setScreen({ name: 'home' });
  }, []);

  const handleSave = useCallback(
    async (drawing: Drawing) => {
      if (screen.name !== 'drawing') return;
      // saveDrawing es idempotente: persiste el dibujo y lo añade al índice
      // solo si aún no está. Llamarlo siempre evita perder dibujos nuevos
      // cuya marca de tiempo ya difería de createdAt al guardar.
      await save(drawing);
      setScreen({ name: 'drawing', drawing });
    },
    [screen, save],
  );

  if (screen.name === 'drawing') {
    return (
      <DrawingScreen
        drawing={screen.drawing}
        onBack={handleBack}
        onSave={handleSave}
      />
    );
  }

  return (
    <HomeScreen
      onOpenDrawing={handleOpenDrawing}
      onNewDrawing={handleNewDrawing}
    />
  );
}
