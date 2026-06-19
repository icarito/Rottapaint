import React, { useCallback, useRef } from 'react';
import { GestureResponderEvent, PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { BrushConfig, DrawingPath, Point } from '../types';
import { pointsToSvgPath } from '../utils/svgPath';

interface CanvasProps {
  paths: DrawingPath[];
  activePath: DrawingPath | null;
  backgroundColor: string;
  currentColor: string;
  currentBrush: BrushConfig;
  onStartPath: (point: Point, color: string, brush: BrushConfig) => void;
  onAddPoint: (point: Point) => void;
  onCommitPath: () => void;
}

function pathToD(path: DrawingPath): string {
  return pointsToSvgPath(path.points);
}

function DrawingPathElement({ path, backgroundColor }: { path: DrawingPath; backgroundColor: string }) {
  const d = pathToD(path);
  if (!d) return null;
  return (
    <Path
      d={d}
      stroke={path.isEraser ? backgroundColor : path.color}
      strokeWidth={path.strokeWidth}
      strokeLinecap={path.lineCap}
      strokeLinejoin={path.lineJoin}
      fill="none"
      opacity={path.opacity}
    />
  );
}

export const Canvas = React.memo(function Canvas({
  paths,
  activePath,
  backgroundColor,
  currentColor,
  currentBrush,
  onStartPath,
  onAddPoint,
  onCommitPath,
}: CanvasProps) {
  const isDrawing = useRef(false);

  const getPoint = useCallback((event: GestureResponderEvent): Point => {
    return {
      x: event.nativeEvent.locationX,
      y: event.nativeEvent.locationY,
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        isDrawing.current = true;
        const point = {
          x: event.nativeEvent.locationX,
          y: event.nativeEvent.locationY,
        };
        onStartPath(point, currentColor, currentBrush);
      },
      onPanResponderMove: (event) => {
        if (!isDrawing.current) return;
        const point = {
          x: event.nativeEvent.locationX,
          y: event.nativeEvent.locationY,
        };
        onAddPoint(point);
      },
      onPanResponderRelease: () => {
        isDrawing.current = false;
        onCommitPath();
      },
      onPanResponderTerminate: () => {
        isDrawing.current = false;
        onCommitPath();
      },
    }),
  ).current;

  // PanResponder handlers need fresh closure values for color/brush
  // We update via a ref trick so the responder always reads current values
  const colorRef = useRef(currentColor);
  const brushRef = useRef(currentBrush);
  colorRef.current = currentColor;
  brushRef.current = currentBrush;

  const updatedResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (event) => {
        isDrawing.current = true;
        const point = {
          x: event.nativeEvent.locationX,
          y: event.nativeEvent.locationY,
        };
        onStartPath(point, colorRef.current, brushRef.current);
      },
      onPanResponderMove: (event) => {
        if (!isDrawing.current) return;
        onAddPoint({
          x: event.nativeEvent.locationX,
          y: event.nativeEvent.locationY,
        });
      },
      onPanResponderRelease: () => {
        isDrawing.current = false;
        onCommitPath();
      },
      onPanResponderTerminate: () => {
        isDrawing.current = false;
        onCommitPath();
      },
    }),
  ).current;

  void panResponder; // unused, replaced by updatedResponder

  return (
    <View style={[styles.container, { backgroundColor }]} {...updatedResponder.panHandlers}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Rect width="100%" height="100%" fill={backgroundColor} />
        {paths.map((path) => (
          <DrawingPathElement key={path.id} path={path} backgroundColor={backgroundColor} />
        ))}
        {activePath && (
          <DrawingPathElement path={activePath} backgroundColor={backgroundColor} />
        )}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
