import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ToolbarProps {
  title: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
  onBack: () => void;
}

interface ToolButtonProps {
  emoji: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'danger';
}

function ToolButton({ emoji, label, onPress, disabled, variant = 'default' }: ToolButtonProps) {
  const bgColor = {
    default: '#F2F2F7',
    primary: '#34C759',
    danger: '#FF3B30',
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.toolButton,
        { backgroundColor: bgColor },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Text style={[styles.toolEmoji, disabled && styles.disabledText]}>{emoji}</Text>
      <Text style={[styles.toolLabel, disabled && styles.disabledText]}>{label}</Text>
    </Pressable>
  );
}

export function Toolbar({
  title,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onSave,
  onBack,
}: ToolbarProps) {
  return (
    <View style={styles.container}>
      <ToolButton emoji="⬅️" label="Volver" onPress={onBack} />

      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>

      <View style={styles.actions}>
        <ToolButton emoji="↩️" label="Deshacer" onPress={onUndo} disabled={!canUndo} />
        <ToolButton emoji="↪️" label="Rehacer" onPress={onRedo} disabled={!canRedo} />
        <ToolButton emoji="🗑️" label="Borrar" onPress={onClear} variant="danger" />
        <ToolButton emoji="💾" label="Guardar" onPress={onSave} variant="primary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF9F0',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    gap: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  toolButton: {
    minWidth: 56,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  toolEmoji: {
    fontSize: 20,
  },
  toolLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
  },
  disabled: {
    opacity: 0.4,
  },
  disabledText: {
    color: '#999',
  },
  pressed: {
    transform: [{ scale: 0.93 }],
    opacity: 0.85,
  },
});
