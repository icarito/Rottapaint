import React, { useCallback, useState } from 'react';
import { DrawingScreen } from '../src/screens/DrawingScreen';
import { HomeScreen } from '../src/screens/HomeScreen';
import { useStorage } from '../src/hooks/useStorage';
import { Drawing } from '../src/types';

type Screen = { name: 'home' } | { name: 'drawing'; drawing: Drawing };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const { save, update } = useStorage();

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
      const isNew = !drawing.createdAt || drawing.createdAt === drawing.updatedAt;
      if (isNew) {
        await save(drawing);
      } else {
        await update(drawing);
      }
      setScreen({ name: 'drawing', drawing });
    },
    [screen, save, update],
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
