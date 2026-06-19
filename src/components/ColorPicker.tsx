import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { COLOR_PALETTE } from '../utils/colors';

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

export function ColorPicker({ selectedColor, onSelectColor }: ColorPickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
    >
      {COLOR_PALETTE.map((swatch) => {
        const isSelected = swatch.color === selectedColor;
        return (
          <Pressable
            key={swatch.id}
            onPress={() => onSelectColor(swatch.color)}
            style={({ pressed }) => [
              styles.swatch,
              { backgroundColor: swatch.color },
              isSelected && styles.selected,
              pressed && styles.pressed,
              swatch.color === '#FFFFFF' && styles.whiteBorder,
            ]}
            accessibilityLabel={swatch.label}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
          >
            {isSelected && (
              <View style={[
                styles.checkmark,
                { borderColor: swatch.color === '#FFFFFF' || swatch.color === '#FFCC00' ? '#333' : '#fff' }
              ]} />
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const SWATCH_SIZE = 44;

const styles = StyleSheet.create({
  scroll: {
    maxHeight: SWATCH_SIZE + 16,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
    alignItems: 'center',
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  selected: {
    transform: [{ scale: 1.2 }],
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  whiteBorder: {
    borderWidth: 1,
    borderColor: '#DDD',
  },
  checkmark: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
});
