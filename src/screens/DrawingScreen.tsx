import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrushPicker } from '../components/BrushPicker';
import { Canvas } from '../components/Canvas';
import { ColorPicker } from '../components/ColorPicker';
import { SaveModal } from '../components/SaveModal';
import { Toolbar } from '../components/Toolbar';
import { useDrawing } from '../hooks/useDrawing';
import { BrushConfig, Drawing } from '../types';
import { BRUSHES, DEFAULT_BRUSH } from '../utils/brushes';
import { DEFAULT_COLOR } from '../utils/colors';
import { confirmDialog } from '../utils/confirm';
import { impactLight, notifySuccess, notifyWarning } from '../utils/haptics';
import { buildThumbnailSvg, pointsToSvgPath } from '../utils/svgPath';

interface DrawingScreenProps {
  drawing: Drawing;
  onBack: () => void;
  onSave: (drawing: Drawing) => Promise<void>;
}

export function DrawingScreen({ drawing, onBack, onSave }: DrawingScreenProps) {
  const { paths, activePath, canUndo, canRedo, startPath, addPoint, commitPath, undo, redo, clear, load } =
    useDrawing();

  const [currentColor, setCurrentColor] = useState(DEFAULT_COLOR);
  const [currentBrush, setCurrentBrush] = useState<BrushConfig>(DEFAULT_BRUSH);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (drawing.paths.length > 0) {
      load(drawing.paths);
    }
  }, [drawing.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectBrush = useCallback((brush: BrushConfig) => {
    setCurrentBrush(brush);
    if (brush.isEraser) {
      // Keep current color intact, eraser uses background
    }
  }, []);

  const handleUndo = useCallback(() => {
    impactLight();
    undo();
  }, [undo]);

  const handleRedo = useCallback(() => {
    impactLight();
    redo();
  }, [redo]);

  const handleClear = useCallback(() => {
    confirmDialog({
      title: '¿Borrar todo?',
      message: '¿Querés limpiar el canvas? Esta acción se puede deshacer.',
      confirmLabel: 'Borrar todo',
      destructive: true,
      onConfirm: () => {
        notifyWarning();
        clear();
      },
    });
  }, [clear]);

  const handleSavePress = useCallback(() => {
    setSaveModalVisible(true);
  }, []);

  const handleSaveConfirm = useCallback(
    async (name: string) => {
      setSaveModalVisible(false);
      setIsSaving(true);

      const thumbnailPaths = paths.map((p) => ({
        d: pointsToSvgPath(p.points),
        color: p.color,
        strokeWidth: p.strokeWidth,
        opacity: p.opacity,
        isEraser: p.isEraser,
      }));

      const thumbnailSvg = buildThumbnailSvg(
        thumbnailPaths,
        drawing.canvasWidth || 400,
        drawing.canvasHeight || 600,
        drawing.backgroundColor,
      );

      const updated: Drawing = {
        ...drawing,
        name,
        paths,
        updatedAt: Date.now(),
        thumbnailSvg,
      };

      await onSave(updated);
      notifySuccess();
      setIsSaving(false);
    },
    [drawing, paths, onSave],
  );

  const handleBack = useCallback(() => {
    if (paths.length > 0 && paths !== drawing.paths) {
      confirmDialog({
        title: '¿Salir sin guardar?',
        message: 'Tenés cambios sin guardar. ¿Querés salir de todas formas?',
        confirmLabel: 'Salir',
        cancelLabel: 'Quedarme',
        destructive: true,
        onConfirm: onBack,
      });
    } else {
      onBack();
    }
  }, [paths, drawing.paths, onBack]);

  const eraserBrush = BRUSHES.find((b) => b.isEraser)!;
  const activeEraserBrush: BrushConfig = { ...eraserBrush, strokeWidth: currentBrush.isEraser ? currentBrush.strokeWidth : eraserBrush.strokeWidth };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Toolbar
        title={drawing.name}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onSave={handleSavePress}
        onBack={handleBack}
      />

      <Canvas
        paths={paths}
        activePath={activePath}
        backgroundColor={drawing.backgroundColor}
        currentColor={currentBrush.isEraser ? drawing.backgroundColor : currentColor}
        currentBrush={currentBrush}
        onStartPath={startPath}
        onAddPoint={addPoint}
        onCommitPath={commitPath}
      />

      <View style={styles.bottomPanel}>
        <BrushPicker selectedBrush={currentBrush} onSelectBrush={handleSelectBrush} />
        {!currentBrush.isEraser && (
          <ColorPicker selectedColor={currentColor} onSelectColor={setCurrentColor} />
        )}
      </View>

      <SaveModal
        visible={saveModalVisible}
        defaultName={drawing.name}
        onSave={handleSaveConfirm}
        onCancel={() => setSaveModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  bottomPanel: {
    backgroundColor: '#FFF9F0',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    paddingBottom: 8,
    gap: 4,
  },
});
