import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BrushConfig } from '../types';
import { BRUSHES } from '../utils/brushes';

interface BrushPickerProps {
  selectedBrush: BrushConfig;
  onSelectBrush: (brush: BrushConfig) => void;
}

export function BrushPicker({ selectedBrush, onSelectBrush }: BrushPickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
    >
      {BRUSHES.map((brush) => {
        const isSelected = brush.id === selectedBrush.id;
        return (
          <Pressable
            key={brush.id}
            onPress={() => onSelectBrush(brush)}
            style={({ pressed }) => [
              styles.brushButton,
              isSelected && styles.brushSelected,
              pressed && styles.pressed,
            ]}
            accessibilityLabel={brush.name}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={styles.brushEmoji}>{brush.emoji}</Text>
            <Text style={[styles.brushLabel, isSelected && styles.brushLabelSelected]}>
              {brush.name}
            </Text>
            <View style={[styles.previewLine, {
              height: brush.isEraser ? 4 : Math.min(brush.strokeWidth, 12),
              opacity: brush.opacity,
              backgroundColor: brush.isEraser ? '#ccc' : '#333',
            }]} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 90,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  brushButton: {
    width: 70,
    height: 74,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 2,
  },
  brushSelected: {
    backgroundColor: '#007AFF',
  },
  pressed: {
    transform: [{ scale: 0.93 }],
  },
  brushEmoji: {
    fontSize: 24,
  },
  brushLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
  },
  brushLabelSelected: {
    color: '#fff',
  },
  previewLine: {
    width: 36,
    borderRadius: 4,
    marginTop: 2,
  },
});
